ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'public';
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS share_token uuid NOT NULL DEFAULT gen_random_uuid();
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS link_enabled boolean NOT NULL DEFAULT true;
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS ends_at timestamptz;
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS venue_tbc boolean NOT NULL DEFAULT false;
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS has_virtual_option boolean NOT NULL DEFAULT false;
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS members_note text;
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS interest_only boolean NOT NULL DEFAULT false;
ALTER TABLE public.plans ADD CONSTRAINT plans_visibility_check CHECK (visibility IN ('public','friends','link'));
CREATE UNIQUE INDEX IF NOT EXISTS plans_share_token_key ON public.plans(share_token);

CREATE TABLE IF NOT EXISTS public.plan_link_access (
  plan_id uuid NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (plan_id, user_id)
);
GRANT SELECT ON public.plan_link_access TO authenticated;
GRANT ALL ON public.plan_link_access TO service_role;
ALTER TABLE public.plan_link_access ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own link access" ON public.plan_link_access FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_plan_link_access(_plan uuid, _user uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.plan_link_access WHERE plan_id = _plan AND user_id = _user)
$$;

DROP POLICY IF EXISTS "plans are public" ON public.plans;
CREATE POLICY "plans are public" ON public.plans FOR SELECT TO anon, authenticated USING (
  NOT is_private AND visibility = 'public' AND public.org_access(organisation_id, auth.uid())
);
CREATE POLICY "friends and group plans" ON public.plans FOR SELECT TO authenticated USING (
  NOT is_private AND visibility = 'friends' AND (
    public.are_friends(host_id, auth.uid())
    OR (organisation_id IS NOT NULL AND public.org_member(organisation_id, auth.uid()))
  )
);
CREATE POLICY "link plans for link holders" ON public.plans FOR SELECT TO authenticated USING (
  visibility = 'link' AND link_enabled AND public.has_plan_link_access(id, auth.uid())
);

-- Teaser for anyone holding the link; never returns the address or the token.
CREATE OR REPLACE FUNCTION public.plan_link_teaser(_token uuid)
RETURNS TABLE(id uuid, title text, image_url text, area_label text, city text, starts_at timestamptz, genre text, activity text, host_name text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.title, p.image_url, p.area_label, p.city, p.starts_at, p.genre, p.activity,
         COALESCE(p.example_host_name, pr.name)
  FROM public.plans p LEFT JOIN public.profiles pr ON pr.id = p.host_id
  WHERE p.share_token = _token AND p.link_enabled AND p.visibility = 'link'
$$;
GRANT EXECUTE ON FUNCTION public.plan_link_teaser(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.open_plan_link(_token uuid) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _plan uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in to open this plan'; END IF;
  SELECT id INTO _plan FROM public.plans WHERE share_token = _token AND link_enabled AND visibility = 'link';
  IF _plan IS NULL THEN RAISE EXCEPTION 'This link has been reset or turned off'; END IF;
  INSERT INTO public.plan_link_access(plan_id, user_id) VALUES (_plan, auth.uid()) ON CONFLICT DO NOTHING;
  RETURN _plan;
END $$;
GRANT EXECUTE ON FUNCTION public.open_plan_link(uuid) TO authenticated;

-- Host resets the link: new token, and only people already approved keep access.
CREATE OR REPLACE FUNCTION public.reset_plan_link(_plan uuid) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _t uuid := gen_random_uuid();
BEGIN
  IF NOT public.is_plan_host(_plan, auth.uid()) THEN RAISE EXCEPTION 'Only the host can reset the link'; END IF;
  UPDATE public.plans SET share_token = _t, link_enabled = true WHERE id = _plan;
  DELETE FROM public.plan_link_access a WHERE a.plan_id = _plan
    AND NOT EXISTS (SELECT 1 FROM public.join_requests j WHERE j.plan_id = _plan AND j.user_id = a.user_id AND j.status = 'approved');
  RETURN _t;
END $$;
GRANT EXECUTE ON FUNCTION public.reset_plan_link(uuid) TO authenticated;

-- Past events stay viewable but cannot be joined.
CREATE OR REPLACE FUNCTION public.block_past_join() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.plans p WHERE p.id = NEW.plan_id AND COALESCE(p.ends_at, p.starts_at) < now()) THEN
    RAISE EXCEPTION 'This event has already happened';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS block_past_join ON public.join_requests;
CREATE TRIGGER block_past_join BEFORE INSERT ON public.join_requests FOR EACH ROW EXECUTE FUNCTION public.block_past_join();

-- Members-only notes (e.g. discount codes) live outside the plans row.
CREATE TABLE IF NOT EXISTS public.plan_member_notes (
  plan_id uuid PRIMARY KEY REFERENCES public.plans(id) ON DELETE CASCADE,
  note text NOT NULL
);
GRANT SELECT ON public.plan_member_notes TO authenticated;
GRANT ALL ON public.plan_member_notes TO service_role;
ALTER TABLE public.plan_member_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org members read member notes" ON public.plan_member_notes FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.plans p WHERE p.id = plan_id AND p.organisation_id IS NOT NULL AND public.org_member(p.organisation_id, auth.uid()))
);
COMMENT ON COLUMN public.plans.members_note IS 'DEPRECATED: unused; member-only notes live in plan_member_notes';