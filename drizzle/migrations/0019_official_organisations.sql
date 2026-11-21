ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS is_official boolean NOT NULL DEFAULT false;
ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS about text NOT NULL DEFAULT '';
CREATE OR REPLACE FUNCTION public.protect_org_official() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF current_user IN ('authenticated','anon') AND NEW.is_official IS DISTINCT FROM OLD.is_official THEN
    RAISE EXCEPTION 'Official status is granted by Juntos review only';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS protect_org_official ON public.organisations;
CREATE TRIGGER protect_org_official BEFORE UPDATE ON public.organisations FOR EACH ROW EXECUTE FUNCTION public.protect_org_official();