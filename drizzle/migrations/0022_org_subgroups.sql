
ALTER TABLE public.organisations ADD COLUMN parent_id uuid references public.organisations(id) on delete set null, ADD COLUMN section text not null default '', ADD COLUMN archived boolean not null default false;
CREATE INDEX organisations_parent_idx ON public.organisations(parent_id);

CREATE OR REPLACE FUNCTION public.org_member(_org uuid, _user uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $f$
 SELECT EXISTS(SELECT 1 FROM public.organisation_members WHERE organisation_id=_org AND user_id=_user)
  OR EXISTS(SELECT 1 FROM public.organisations c JOIN public.organisation_members m ON m.organisation_id=c.parent_id WHERE c.id=_org AND c.question='' AND m.user_id=_user) $f$;
CREATE OR REPLACE FUNCTION public.org_admin(_org uuid, _user uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $f$
 SELECT EXISTS(SELECT 1 FROM public.organisation_members WHERE organisation_id=_org AND user_id=_user AND role IN ('owner','admin'))
  OR EXISTS(SELECT 1 FROM public.organisations c JOIN public.organisation_members m ON m.organisation_id=c.parent_id WHERE c.id=_org AND m.user_id=_user AND m.role IN ('owner','admin')) $f$;
CREATE OR REPLACE FUNCTION public.org_host(_org uuid, _user uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $f$
 SELECT public.org_admin(_org,_user) OR EXISTS(SELECT 1 FROM public.organisation_members WHERE organisation_id=_org AND user_id=_user AND role='host') $f$;

CREATE OR REPLACE FUNCTION public.request_org_access(_org uuid, _answer text) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $f$ DECLARE ph text; result text:='pending'; o public.organisations; BEGIN
 SELECT * INTO o FROM public.organisations WHERE id=_org;
 IF auth.uid() IS NULL OR o.id IS NULL OR o.visibility='private' OR length(trim(coalesce(_answer,'')))>2000 THEN RAISE EXCEPTION 'Access request unavailable'; END IF;
 IF EXISTS(SELECT 1 FROM public.organisation_members WHERE organisation_id=_org AND user_id=auth.uid()) THEN RETURN 'approved'; END IF;
 IF o.parent_id IS NOT NULL AND o.question='' AND EXISTS(SELECT 1 FROM public.organisation_members WHERE organisation_id=o.parent_id AND user_id=auth.uid()) THEN result:='approved';
 ELSE
  IF length(trim(coalesce(_answer,'')))<1 THEN RAISE EXCEPTION 'Answer the join question'; END IF;
  SELECT passphrase_hash INTO ph FROM public.organisation_secrets WHERE organisation_id=_org;
  IF ph IS NOT NULL AND ph=encode(sha256(convert_to(trim(_answer),'UTF8')),'hex') THEN result:='approved'; END IF;
 END IF;
 INSERT INTO public.organisation_requests(organisation_id,user_id,answer,status) VALUES(_org,auth.uid(),coalesce(trim(_answer),''),result) ON CONFLICT(organisation_id,user_id) DO UPDATE SET answer=excluded.answer,status=excluded.status;
 IF result='approved' THEN INSERT INTO public.organisation_members(organisation_id,user_id) VALUES(_org,auth.uid()) ON CONFLICT DO NOTHING; END IF;
 RETURN result; END $f$;

CREATE OR REPLACE FUNCTION public.create_subgroup(_parent uuid,_name text,_slug text,_section text,_description text,_question text DEFAULT '') RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $f$ DECLARE oid uuid; p public.organisations; BEGIN
 IF NOT public.org_admin(_parent,auth.uid()) THEN RAISE EXCEPTION 'Only admins of the parent organisation can add sub-groups'; END IF;
 SELECT * INTO p FROM public.organisations WHERE id=_parent;
 IF p.parent_id IS NOT NULL THEN RAISE EXCEPTION 'Sub-groups cannot have their own sub-groups'; END IF;
 IF length(trim(_name)) NOT BETWEEN 2 AND 80 OR _slug !~ '^[a-z0-9-]{3,40}$' OR length(coalesce(_section,''))>60 OR length(coalesce(_description,''))>3000 OR length(coalesce(_question,''))>500 THEN RAISE EXCEPTION 'Check the name, handle and section'; END IF;
 IF EXISTS(SELECT 1 FROM public.organisations WHERE slug=_slug) THEN RAISE EXCEPTION 'That handle is taken'; END IF;
 INSERT INTO public.organisations(name,slug,description,visibility,question,allowed_domains,about,kind,created_by,parent_id,section,city,is_example,official_status)
 VALUES(trim(_name),_slug,coalesce(_description,''),p.visibility,coalesce(_question,''),p.allowed_domains,'',p.kind,auth.uid(),_parent,coalesce(_section,''),p.city,false,'none') RETURNING id INTO oid;
 RETURN oid; END $f$;

CREATE OR REPLACE FUNCTION public.update_subgroup(_org uuid,_name text,_section text,_archived boolean) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $f$ DECLARE c public.organisations; BEGIN
 SELECT * INTO c FROM public.organisations WHERE id=_org;
 IF c.parent_id IS NULL OR NOT public.org_admin(c.parent_id,auth.uid()) THEN RAISE EXCEPTION 'Only admins of the parent organisation can change sub-groups'; END IF;
 IF length(trim(_name)) NOT BETWEEN 2 AND 80 OR length(coalesce(_section,''))>60 THEN RAISE EXCEPTION 'Check the name and section'; END IF;
 UPDATE public.organisations SET name=trim(_name),section=coalesce(_section,''),archived=_archived WHERE id=_org; END $f$;
