CREATE TABLE public.activities(name text PRIMARY KEY, genre text NOT NULL DEFAULT 'outdoors');
GRANT SELECT ON public.activities TO anon,authenticated;
GRANT ALL ON public.activities TO service_role;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "everyone reads used activities" ON public.activities FOR SELECT TO anon,authenticated USING(true);
CREATE FUNCTION public.register_plan_activity() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN NEW.activity:=lower(trim(regexp_replace(NEW.activity,'\s+',' ','g'))); IF char_length(NEW.activity)<1 OR char_length(NEW.activity)>80 THEN RAISE EXCEPTION 'Choose an activity between 1 and 80 characters'; END IF; INSERT INTO public.activities(name,genre) VALUES(NEW.activity,NEW.genre) ON CONFLICT(name) DO NOTHING; RETURN NEW; END $$;
CREATE TRIGGER register_plan_activity BEFORE INSERT OR UPDATE OF activity ON public.plans FOR EACH ROW EXECUTE FUNCTION public.register_plan_activity();
INSERT INTO public.activities(name,genre) SELECT DISTINCT lower(activity),min(genre) FROM public.plans GROUP BY lower(activity) ON CONFLICT DO NOTHING;