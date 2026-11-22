ALTER TABLE public.plans ADD COLUMN discount_tiers jsonb NOT NULL DEFAULT '[]'::jsonb;
UPDATE public.plans SET discount_tiers = '[{"min":4,"type":"pct","value":15},{"min":6,"type":"pct","value":25}]'::jsonb;
ALTER TABLE public.plans ADD COLUMN status text NOT NULL DEFAULT 'active';
ALTER TABLE public.plans ADD CONSTRAINT plans_status_check CHECK (status IN ('active','cancelled'));
ALTER TABLE public.plans ADD COLUMN cancelled_at timestamptz;
ALTER TABLE public.plans ADD COLUMN venue_type text NOT NULL DEFAULT 'public';
UPDATE public.plans SET venue_type = CASE WHEN kind = 'partner_venue' THEN 'partner_venue' ELSE 'public' END;
ALTER TABLE public.plans ADD CONSTRAINT plans_venue_type_check CHECK (venue_type IN ('public','partner_venue','private'));
ALTER TABLE public.plans DROP CONSTRAINT plans_is_public_place_check;
ALTER TABLE public.plans ADD CONSTRAINT plans_public_place_or_private_check CHECK (is_public_place OR venue_type = 'private');

CREATE OR REPLACE FUNCTION public.validate_plan_v7() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE t jsonb; n int;
BEGIN
  IF jsonb_typeof(NEW.discount_tiers) <> 'array' THEN RAISE EXCEPTION 'Discount tiers must be a list'; END IF;
  n := jsonb_array_length(NEW.discount_tiers);
  IF n > 5 THEN RAISE EXCEPTION 'At most 5 discount tiers'; END IF;
  FOR t IN SELECT * FROM jsonb_array_elements(NEW.discount_tiers) LOOP
    IF (t->>'min') IS NULL OR (t->>'min')::int < 2 OR (t->>'min')::int > NEW.capacity THEN RAISE EXCEPTION 'Each discount needs a minimum between 2 and the plan size'; END IF;
    IF t->>'type' NOT IN ('pct','amount') THEN RAISE EXCEPTION 'Discount must be a percentage or an amount'; END IF;
    IF (t->>'value')::numeric <= 0 THEN RAISE EXCEPTION 'Discount must be more than zero'; END IF;
    IF t->>'type' = 'pct' AND (t->>'value')::numeric > 50 THEN RAISE EXCEPTION 'Percentage discounts are capped at 50%%'; END IF;
    IF t->>'type' = 'amount' AND (t->>'value')::numeric > NEW.base_price THEN RAISE EXCEPTION 'An amount off cannot be more than the price'; END IF;
  END LOOP;
  IF NEW.base_price = 0 AND n > 0 AND TG_OP = 'INSERT' THEN RAISE EXCEPTION 'Free plans cannot have discounts'; END IF;
  IF NEW.venue_type = 'private' THEN NEW.is_public_place := false; NEW.auto_approve := false; ELSE NEW.is_public_place := true; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER validate_plan_v7 BEFORE INSERT OR UPDATE ON public.plans FOR EACH ROW EXECUTE FUNCTION public.validate_plan_v7();

ALTER TABLE public.join_requests DROP CONSTRAINT join_requests_status_check;
ALTER TABLE public.join_requests ADD CONSTRAINT join_requests_status_check CHECK (status IN ('pending','approved','declined','cancelled'));

CREATE OR REPLACE FUNCTION public.block_cancelled_join() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.plans WHERE id = NEW.plan_id AND status = 'cancelled') THEN RAISE EXCEPTION 'This plan was cancelled'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER block_cancelled_join BEFORE INSERT ON public.join_requests FOR EACH ROW EXECUTE FUNCTION public.block_cancelled_join();

CREATE OR REPLACE FUNCTION public.cancel_plan(_plan uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p public.plans;
BEGIN
  SELECT * INTO p FROM public.plans WHERE id = _plan FOR UPDATE;
  IF p.id IS NULL THEN RAISE EXCEPTION 'Plan not found'; END IF;
  IF auth.uid() IS NULL OR (p.host_id IS DISTINCT FROM auth.uid() AND NOT public.has_role(auth.uid(),'admin')) THEN RAISE EXCEPTION 'Only the host can cancel this plan'; END IF;
  IF p.status = 'cancelled' THEN RETURN; END IF;
  UPDATE public.plans SET status = 'cancelled', cancelled_at = now(), link_enabled = false WHERE id = _plan;
  INSERT INTO public.notifications(user_id, plan_id, title, kind, link)
  SELECT DISTINCT jr.user_id, _plan, 'Cancelled: ' || p.title, 'plan_cancelled', '/plans/' || _plan
  FROM public.join_requests jr WHERE jr.plan_id = _plan AND jr.status IN ('pending','approved') AND jr.user_id <> auth.uid();
END $$;

CREATE OR REPLACE FUNCTION public.cancel_my_join(_plan uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p public.plans;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in first'; END IF;
  UPDATE public.join_requests SET status = 'cancelled' WHERE plan_id = _plan AND user_id = auth.uid() AND status IN ('pending','approved');
  IF NOT FOUND THEN RAISE EXCEPTION 'You have no active request for this plan'; END IF;
  SELECT * INTO p FROM public.plans WHERE id = _plan;
  IF p.host_id IS NOT NULL THEN
    INSERT INTO public.notifications(user_id, plan_id, title, kind, link) VALUES (p.host_id, _plan, 'Someone cancelled their spot: ' || p.title, 'join_cancelled', '/plans/' || _plan);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.admin_all_plans(_city text DEFAULT NULL, _status text DEFAULT NULL)
RETURNS TABLE(id uuid, title text, city text, country text, area_label text, starts_at timestamptz, host_name text, visibility text, status text, going_count int, capacity int, is_example boolean, venue_type text, base_price numeric)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Admins only'; END IF;
  RETURN QUERY SELECT p.id, p.title, p.city, p.country, p.area_label, p.starts_at,
    COALESCE(split_part(pr.name,' ',1), p.example_host_name, '—'), p.visibility, p.status, p.going_count, p.capacity, p.is_example, p.venue_type, p.base_price
  FROM public.plans p LEFT JOIN public.profiles pr ON pr.id = p.host_id
  WHERE (_city IS NULL OR p.city = _city) AND (_status IS NULL OR p.status = _status)
  ORDER BY p.starts_at DESC LIMIT 1000;
END $$;

REVOKE ALL ON FUNCTION public.cancel_plan(uuid) FROM public;
REVOKE ALL ON FUNCTION public.cancel_my_join(uuid) FROM public;
REVOKE ALL ON FUNCTION public.admin_all_plans(text,text) FROM public;
GRANT EXECUTE ON FUNCTION public.cancel_plan(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_my_join(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_all_plans(text,text) TO authenticated;