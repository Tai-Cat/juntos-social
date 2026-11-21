CREATE OR REPLACE FUNCTION public.org_member(_org uuid, _user uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $function$
 SELECT EXISTS(SELECT 1 FROM public.organisation_members WHERE organisation_id=_org AND user_id=_user)
  OR EXISTS(SELECT 1 FROM public.organisations c JOIN public.organisation_members m ON m.organisation_id=c.parent_id WHERE c.id=_org AND c.question='' AND c.entry_rule IS NULL AND m.user_id=_user) $function$;

CREATE OR REPLACE FUNCTION public.request_org_access(_org uuid, _answer text) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $f$
DECLARE ph text; result text:='pending'; via text:='manual'; o public.organisations; rule text; dom boolean; parent_member boolean; ans text:=trim(coalesce(_answer,''));
BEGIN
 SELECT * INTO o FROM public.organisations WHERE id=_org;
 IF auth.uid() IS NULL OR o.id IS NULL OR o.visibility='private' OR length(ans)>2000 THEN RAISE EXCEPTION 'Access request unavailable'; END IF;
 IF EXISTS(SELECT 1 FROM public.organisation_members WHERE organisation_id=_org AND user_id=auth.uid()) THEN RETURN 'approved'; END IF;
 rule := public.effective_entry_rule(_org);
 dom := public.my_domain_ok(_org);
 parent_member := o.parent_id IS NOT NULL AND EXISTS(SELECT 1 FROM public.organisation_members WHERE organisation_id=o.parent_id AND user_id=auth.uid());
 IF parent_member AND o.question='' AND o.entry_rule IS NULL THEN result:='approved'; via:='inherited';
 ELSIF rule='domain' AND dom THEN result:='approved'; via:='domain';
 ELSIF rule='domain_and_answer' AND dom AND length(ans)>0 THEN result:='approved'; via:='domain';
 ELSE
  IF length(ans)<1 AND NOT parent_member THEN RAISE EXCEPTION 'Answer the join question'; END IF;
  IF length(ans)>0 THEN
   SELECT passphrase_hash INTO ph FROM public.organisation_secrets WHERE organisation_id=_org;
   IF ph IS NOT NULL AND ph=encode(sha256(convert_to(ans,'UTF8')),'hex') THEN result:='approved'; via:='passphrase'; END IF;
  END IF;
 END IF;
 IF length(ans)<1 THEN ans := CASE via WHEN 'domain' THEN 'Verified email domain' ELSE 'Member of parent organisation' END; END IF;
 INSERT INTO public.organisation_requests(organisation_id,user_id,answer,status) VALUES(_org,auth.uid(),ans,result) ON CONFLICT(organisation_id,user_id) DO UPDATE SET answer=excluded.answer,status=excluded.status;
 IF result='approved' THEN INSERT INTO public.organisation_members(organisation_id,user_id,joined_via) VALUES(_org,auth.uid(),via) ON CONFLICT DO NOTHING; END IF;
 RETURN result;
END $f$;