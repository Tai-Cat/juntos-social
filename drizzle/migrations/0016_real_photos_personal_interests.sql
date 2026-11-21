ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS interest_tags text[] NOT NULL DEFAULT '{}';

CREATE OR REPLACE FUNCTION public.register_plan_gallery() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$ DECLARE url text; BEGIN IF cardinality(NEW.photos)>5 OR cardinality(NEW.photos)<>(SELECT count(DISTINCT x) FROM unnest(NEW.photos) x) THEN RAISE EXCEPTION 'Add up to 5 distinct event photos.'; END IF; IF TG_OP='UPDATE' AND NEW.photos=OLD.photos THEN RETURN NEW; END IF; DELETE FROM public.plan_photo_registry WHERE plan_id=NEW.id; FOREACH url IN ARRAY NEW.photos LOOP IF url LIKE 'storage:%' AND url NOT LIKE 'storage:plan-photos/'||NEW.host_id::text||'/%' THEN RAISE EXCEPTION 'Use your own uploaded photographs.'; END IF; INSERT INTO public.plan_photo_registry(photo,plan_id) VALUES(url,NEW.id); END LOOP; RETURN NEW; END $function$;

CREATE TABLE public.photo_credits (
  photo text PRIMARY KEY,
  provider_id text NOT NULL UNIQUE,
  plan_id uuid REFERENCES public.plans(id) ON DELETE CASCADE,
  interest text,
  provider text NOT NULL,
  photographer text NOT NULL,
  photographer_url text NOT NULL,
  source_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX photo_credits_interest_idx ON public.photo_credits(interest) WHERE interest IS NOT NULL;
GRANT SELECT ON public.photo_credits TO anon, authenticated;
GRANT ALL ON public.photo_credits TO service_role;
ALTER TABLE public.photo_credits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Photo credits are public" ON public.photo_credits FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.photo_search_cache (
  query text PRIMARY KEY,
  results jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.photo_search_cache TO service_role;
ALTER TABLE public.photo_search_cache ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.normalize_profile_interests() RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  NEW.interests := COALESCE((SELECT array_agg(v ORDER BY first_pos) FROM (SELECT v, min(pos) first_pos FROM unnest(NEW.interests) WITH ORDINALITY AS t(raw,pos), lower(trim(regexp_replace(raw,'\s+',' ','g'))) v WHERE char_length(v) BETWEEN 1 AND 60 GROUP BY v) d),'{}');
  IF cardinality(NEW.interests) > 30 AND (TG_OP='INSERT' OR cardinality(NEW.interests) > cardinality(OLD.interests)) THEN
    RAISE EXCEPTION 'You can add up to 30 interests.';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER normalize_profile_interests BEFORE INSERT OR UPDATE OF interests ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.normalize_profile_interests();

CREATE OR REPLACE FUNCTION public.community_interests() RETURNS TABLE(interest text, people integer) LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT i, count(DISTINCT p.id)::int FROM public.profiles p, unnest(p.interests) i GROUP BY i HAVING count(DISTINCT p.id) >= 3 ORDER BY i
$$;
GRANT EXECUTE ON FUNCTION public.community_interests() TO anon, authenticated;