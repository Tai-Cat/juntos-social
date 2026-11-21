CREATE FUNCTION public.public_host(_id uuid) RETURNS TABLE(name text,verified boolean,reliability_score integer) LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT split_part(p.name,' ',1),p.verified,p.reliability_score FROM public.profiles p WHERE p.id=_id AND EXISTS(SELECT 1 FROM public.plans WHERE host_id=_id) $$;
REVOKE ALL ON FUNCTION public.public_host(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_host(uuid) TO anon,authenticated,service_role;
GRANT SELECT ON public.trips TO anon;
CREATE POLICY "visitors read example trips" ON public.trips FOR SELECT TO anon USING(is_example);