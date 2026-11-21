ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS meet_genders text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS gender_plans_only boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS languages text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS max_distance_km integer NOT NULL DEFAULT 25,
  ADD COLUMN IF NOT EXISTS notify_messages boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_invites boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_alerts boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS profile_visibility text NOT NULL DEFAULT 'friends';
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS ticket_url text;

CREATE TABLE public.friend_preferences (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  friend_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  frequency text NOT NULL DEFAULT 'default',
  time_window text NOT NULL DEFAULT 'any',
  note text NOT NULL DEFAULT '',
  PRIMARY KEY (user_id, friend_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.friend_preferences TO authenticated;
GRANT ALL ON public.friend_preferences TO service_role;
ALTER TABLE public.friend_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own friend preferences" ON public.friend_preferences FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid() AND public.are_friends(user_id, friend_id) AND char_length(note) <= 300);

CREATE OR REPLACE FUNCTION public.leave_org(_org uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  DELETE FROM public.organisation_members WHERE organisation_id=_org AND user_id=auth.uid() AND role='member';
END $$;
GRANT EXECUTE ON FUNCTION public.leave_org(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.guard_v4_plan() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$ BEGIN IF NEW.age_min IS NOT NULL AND (NEW.age_min<18 OR NEW.age_min>120) OR NEW.age_max IS NOT NULL AND (NEW.age_max<coalesce(NEW.age_min,18) OR NEW.age_max>120) THEN RAISE EXCEPTION 'Choose a valid adult age range.'; END IF; IF NEW.host_id IS NULL THEN RETURN NEW; END IF; IF TG_OP='INSERT' AND NOT NEW.is_example AND NOT EXISTS(SELECT 1 FROM public.profile_private WHERE user_id=NEW.host_id AND age_verified AND date_of_birth<=current_date-interval '18 years') THEN RAISE EXCEPTION 'Complete demo age verification before hosting.'; END IF; IF NEW.organisation_id IS NOT NULL AND NOT NEW.is_example AND NOT public.org_admin(NEW.organisation_id,NEW.host_id) THEN RAISE EXCEPTION 'Only organisation admins can host on its behalf.'; END IF; RETURN NEW; END $function$;