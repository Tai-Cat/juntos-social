ALTER TABLE public.interest_levels DROP CONSTRAINT IF EXISTS interest_levels_level_check;
ALTER TABLE public.interest_levels ADD CONSTRAINT interest_levels_level_check CHECK (level IN ('any','beginner','intermediate','advanced','professional'));

CREATE OR REPLACE FUNCTION public.normalize_profile_interests() RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  NEW.interests := COALESCE((SELECT array_agg(v ORDER BY first_pos) FROM (SELECT v, min(pos) first_pos FROM unnest(NEW.interests) WITH ORDINALITY AS t(raw,pos), lower(trim(regexp_replace(raw,'\s+',' ','g'))) v WHERE char_length(v) BETWEEN 1 AND 60 GROUP BY v) d),'{}');
  RETURN NEW;
END $$;

ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS organisation_id uuid REFERENCES public.organisations(id) ON DELETE CASCADE;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'alert';
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS link text;

ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS entry_rule text CHECK (entry_rule IN ('manual','domain','domain_and_answer'));
ALTER TABLE public.organisation_members ADD COLUMN IF NOT EXISTS joined_at timestamptz;
ALTER TABLE public.organisation_members ALTER COLUMN joined_at SET DEFAULT now();
ALTER TABLE public.organisation_members ADD COLUMN IF NOT EXISTS joined_via text NOT NULL DEFAULT 'manual';

CREATE TABLE public.user_verified_emails(
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  email text NOT NULL,
  verified_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(user_id,email)
);
GRANT SELECT ON public.user_verified_emails TO authenticated;
GRANT ALL ON public.user_verified_emails TO service_role;
ALTER TABLE public.user_verified_emails ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own verified emails" ON public.user_verified_emails FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.push_subscriptions(
  endpoint text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_subscriptions TO authenticated;
GRANT ALL ON public.push_subscriptions TO service_role;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own push subscriptions" ON public.push_subscriptions FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.effective_entry_rule(_org uuid) RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT coalesce(o.entry_rule, p.entry_rule, 'manual') FROM public.organisations o LEFT JOIN public.organisations p ON p.id=o.parent_id WHERE o.id=_org
$$;
GRANT EXECUTE ON FUNCTION public.effective_entry_rule(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.user_has_domain(_user uuid, _domains text[]) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT cardinality(_domains)>0 AND (
    EXISTS(SELECT 1 FROM auth.users u WHERE u.id=_user AND u.email_confirmed_at IS NOT NULL AND lower(split_part(u.email,'@',2))=ANY(_domains))
    OR EXISTS(SELECT 1 FROM public.user_verified_emails v WHERE v.user_id=_user AND lower(split_part(v.email,'@',2))=ANY(_domains)))
$$;
REVOKE ALL ON FUNCTION public.user_has_domain(uuid,text[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.user_has_domain(uuid,text[]) TO service_role;

CREATE OR REPLACE FUNCTION public.my_domain_ok(_org uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT public.user_has_domain(auth.uid(), CASE WHEN cardinality(o.allowed_domains)>0 THEN o.allowed_domains ELSE coalesce(p.allowed_domains,'{}') END)
  FROM public.organisations o LEFT JOIN public.organisations p ON p.id=o.parent_id WHERE o.id=_org
$$;
GRANT EXECUTE ON FUNCTION public.my_domain_ok(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.set_entry_rule(_org uuid, _rule text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NOT public.org_admin(_org, auth.uid()) THEN RAISE EXCEPTION 'Organisation admins only'; END IF;
  IF _rule IS NOT NULL AND _rule NOT IN ('manual','domain','domain_and_answer') THEN RAISE EXCEPTION 'Unknown rule'; END IF;
  IF _rule IS NULL AND NOT EXISTS(SELECT 1 FROM public.organisations WHERE id=_org AND parent_id IS NOT NULL) THEN _rule := 'manual'; END IF;
  UPDATE public.organisations SET entry_rule=_rule WHERE id=_org;
END $$;
GRANT EXECUTE ON FUNCTION public.set_entry_rule(uuid,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.request_org_access(_org uuid, _answer text) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $f$
DECLARE ph text; result text:='pending'; via text:='manual'; o public.organisations; rule text; dom boolean; ans text:=trim(coalesce(_answer,''));
BEGIN
 SELECT * INTO o FROM public.organisations WHERE id=_org;
 IF auth.uid() IS NULL OR o.id IS NULL OR o.visibility='private' OR length(ans)>2000 THEN RAISE EXCEPTION 'Access request unavailable'; END IF;
 IF EXISTS(SELECT 1 FROM public.organisation_members WHERE organisation_id=_org AND user_id=auth.uid()) THEN RETURN 'approved'; END IF;
 rule := public.effective_entry_rule(_org);
 dom := public.my_domain_ok(_org);
 IF o.parent_id IS NOT NULL AND o.question='' AND o.entry_rule IS NULL AND EXISTS(SELECT 1 FROM public.organisation_members WHERE organisation_id=o.parent_id AND user_id=auth.uid()) THEN result:='approved'; via:='inherited';
 ELSIF rule='domain' AND dom THEN result:='approved'; via:='domain';
 ELSIF rule='domain_and_answer' AND dom AND length(ans)>0 THEN result:='approved'; via:='domain';
 ELSE
  IF length(ans)<1 THEN RAISE EXCEPTION 'Answer the join question'; END IF;
  SELECT passphrase_hash INTO ph FROM public.organisation_secrets WHERE organisation_id=_org;
  IF ph IS NOT NULL AND ph=encode(sha256(convert_to(ans,'UTF8')),'hex') THEN result:='approved'; via:='passphrase'; END IF;
 END IF;
 IF length(ans)<1 THEN ans := CASE via WHEN 'domain' THEN 'Verified email domain' ELSE 'Member of parent organisation' END; END IF;
 INSERT INTO public.organisation_requests(organisation_id,user_id,answer,status) VALUES(_org,auth.uid(),ans,result) ON CONFLICT(organisation_id,user_id) DO UPDATE SET answer=excluded.answer,status=excluded.status;
 IF result='approved' THEN INSERT INTO public.organisation_members(organisation_id,user_id,joined_via) VALUES(_org,auth.uid(),via) ON CONFLICT DO NOTHING; END IF;
 RETURN result;
END $f$;

CREATE OR REPLACE FUNCTION public.notify_org_request() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE o public.organisations; who text;
BEGIN
  SELECT * INTO o FROM public.organisations WHERE id=NEW.organisation_id;
  SELECT split_part(name,' ',1) INTO who FROM public.profiles WHERE id=NEW.user_id;
  who := coalesce(nullif(who,''),'Someone');
  IF NEW.status='pending' AND (TG_OP='INSERT' OR OLD.status<>'pending') THEN
    INSERT INTO public.notifications(user_id,title,kind,organisation_id,link)
    SELECT DISTINCT m.user_id, who||' asked to join '||o.name, 'org_request', o.id, '/organisation-admin/'||o.id
    FROM public.organisation_members m WHERE m.role IN ('owner','admin') AND m.organisation_id IN (o.id, o.parent_id) AND m.user_id<>NEW.user_id;
  ELSIF NEW.status='approved' AND TG_OP='INSERT' OR (TG_OP='UPDATE' AND NEW.status='approved' AND OLD.status<>'approved' AND OLD.status<>'pending') THEN
    INSERT INTO public.notifications(user_id,title,kind,organisation_id,link)
    SELECT DISTINCT m.user_id, who||' joined '||o.name||' (auto-approved)', 'org_joined', o.id, '/organisation-admin/'||o.id
    FROM public.organisation_members m WHERE m.role IN ('owner','admin') AND m.organisation_id IN (o.id, o.parent_id) AND m.user_id<>NEW.user_id;
  END IF;
  IF TG_OP='UPDATE' AND OLD.status='pending' AND NEW.status IN ('approved','declined') THEN
    INSERT INTO public.notifications(user_id,title,kind,organisation_id,link)
    VALUES(NEW.user_id, 'Your request to join '||o.name||' was '||NEW.status, 'org_status', o.id, '/organisations/'||o.slug);
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER notify_org_request AFTER INSERT OR UPDATE OF status ON public.organisation_requests FOR EACH ROW EXECUTE FUNCTION public.notify_org_request();

CREATE OR REPLACE FUNCTION public.can_view_plan(_plan uuid, _uid uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS(SELECT 1 FROM public.plans p WHERE p.id=_plan AND (
    p.host_id=_uid
    OR (NOT p.is_private AND p.visibility='public' AND public.org_access(p.organisation_id,_uid))
    OR (NOT p.is_private AND p.visibility='friends' AND (public.are_friends(p.host_id,_uid) OR (p.organisation_id IS NOT NULL AND public.org_member(p.organisation_id,_uid))))
    OR (p.visibility='link' AND p.link_enabled AND public.has_plan_link_access(p.id,_uid))
    OR (p.is_private AND _uid=ANY(p.private_participants) AND public.org_access(p.organisation_id,_uid))))
$$;
REVOKE ALL ON FUNCTION public.can_view_plan(uuid,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_view_plan(uuid,uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.plan_people(_plan uuid) RETURNS TABLE(user_id uuid, name text, verified boolean, status text, hidden boolean) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE uid uuid := auth.uid(); host boolean;
BEGIN
  IF uid IS NULL OR NOT public.can_view_plan(_plan, uid) THEN RETURN; END IF;
  SELECT (p.host_id=uid OR (p.organisation_id IS NOT NULL AND public.org_host(p.organisation_id,uid))) INTO host FROM public.plans p WHERE p.id=_plan;
  RETURN QUERY
  WITH people AS (
    SELECT j.user_id u, 'going'::text s FROM public.join_requests j WHERE j.plan_id=_plan AND j.status='approved'
    UNION
    SELECT sp.user_id, 'interested' FROM public.saved_plans sp WHERE sp.plan_id=_plan AND NOT EXISTS(SELECT 1 FROM public.join_requests j2 WHERE j2.plan_id=_plan AND j2.user_id=sp.user_id AND j2.status='approved')
  )
  SELECT pr.id,
    CASE WHEN host OR pr.id=uid OR public.are_friends(pr.id,uid) OR coalesce(us.profile_visibility,'friends')<>'nobody' THEN split_part(pr.name,' ',1) ELSE NULL END,
    pr.verified, people.s,
    NOT (host OR pr.id=uid OR public.are_friends(pr.id,uid) OR coalesce(us.profile_visibility,'friends')<>'nobody')
  FROM people JOIN public.profiles pr ON pr.id=people.u LEFT JOIN public.user_settings us ON us.user_id=pr.id
  WHERE NOT public.people_blocked(uid, pr.id)
  ORDER BY people.s, pr.name;
END $$;
REVOKE ALL ON FUNCTION public.plan_people(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.plan_people(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.person_card(_user uuid) RETURNS TABLE(id uuid, name text, verified boolean, home_city text, interests text[], hidden boolean, friend_status text) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE uid uuid := auth.uid(); vis text; fr text; open boolean;
BEGIN
  IF uid IS NULL OR public.people_blocked(uid,_user) THEN RETURN; END IF;
  SELECT coalesce(profile_visibility,'friends') INTO vis FROM public.user_settings WHERE user_id=_user;
  SELECT f.status||CASE WHEN f.status='pending' AND f.requester=uid THEN '_sent' WHEN f.status='pending' THEN '_received' ELSE '' END INTO fr FROM public.friendships f WHERE (f.requester=uid AND f.recipient=_user) OR (f.requester=_user AND f.recipient=uid) LIMIT 1;
  open := _user=uid OR fr='accepted' OR coalesce(vis,'friends')<>'nobody';
  RETURN QUERY SELECT p.id, CASE WHEN open THEN split_part(p.name,' ',1) ELSE NULL END, p.verified,
    CASE WHEN open THEN p.home_city ELSE NULL END, CASE WHEN open THEN p.interests ELSE '{}'::text[] END, NOT open, coalesce(fr,'none')
  FROM public.profiles p WHERE p.id=_user AND p.onboarded;
END $$;
REVOKE ALL ON FUNCTION public.person_card(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.person_card(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.start_org_email_demo(uuid,text) FROM authenticated;