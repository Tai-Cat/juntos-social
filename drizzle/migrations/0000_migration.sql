
-- PROFILES (public-facing fields only)
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  pronouns text,
  interests text[] NOT NULL DEFAULT '{}',
  home_city text NOT NULL DEFAULT 'Paris',
  verified boolean NOT NULL DEFAULT false,
  reliability_score int NOT NULL DEFAULT 100,
  no_show_count int NOT NULL DEFAULT 0,
  onboarded boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles readable by signed-in users" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- Users cannot edit their own reliability / no-show counters
CREATE OR REPLACE FUNCTION public.protect_profile_counters() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF current_user = 'authenticated' THEN
    NEW.reliability_score := OLD.reliability_score;
    NEW.no_show_count := OLD.no_show_count;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER protect_profile_counters BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_profile_counters();

-- PRIVATE: self-described gender, never public
CREATE TABLE public.profile_private (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  gender text NOT NULL DEFAULT 'prefer_not_to_say' CHECK (gender IN ('woman','man','non_binary','prefer_not_to_say'))
);
GRANT SELECT, INSERT, UPDATE ON public.profile_private TO authenticated;
GRANT ALL ON public.profile_private TO service_role;
ALTER TABLE public.profile_private ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own gender" ON public.profile_private FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "insert own gender" ON public.profile_private FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "update own gender" ON public.profile_private FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, name) VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', ''));
  INSERT INTO public.profile_private (user_id) VALUES (NEW.id);
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- PLANS
CREATE TABLE public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  category text NOT NULL,
  kind text NOT NULL DEFAULT 'chill' CHECK (kind IN ('partner_venue','chill')),
  area_label text NOT NULL,
  starts_at timestamptz NOT NULL,
  capacity int NOT NULL DEFAULT 4 CHECK (capacity BETWEEN 2 AND 30),
  base_price numeric(8,2) NOT NULL DEFAULT 0,
  audience text NOT NULL DEFAULT 'everyone' CHECK (audience IN ('everyone','women_only','men_only','nonbinary_only','lgbtq_friendly')),
  step_free boolean NOT NULL DEFAULT false,
  is_travel boolean NOT NULL DEFAULT false,
  country text NOT NULL DEFAULT 'France',
  city text NOT NULL DEFAULT 'Paris',
  recurring_weekly boolean NOT NULL DEFAULT false,
  is_public_place boolean NOT NULL DEFAULT true CHECK (is_public_place),
  auto_approve boolean NOT NULL DEFAULT false,
  description text,
  base_going int NOT NULL DEFAULT 1,
  going_count int NOT NULL DEFAULT 1,
  is_example boolean NOT NULL DEFAULT false,
  example_host_name text,
  example_host_verified boolean,
  example_host_reliability int,
  parent_plan_id uuid REFERENCES public.plans(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.plans TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.plans TO authenticated;
GRANT ALL ON public.plans TO service_role;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plans are public" ON public.plans FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "host inserts own plan" ON public.plans FOR INSERT TO authenticated WITH CHECK (host_id = auth.uid() AND is_example = false);
CREATE POLICY "host updates own plan" ON public.plans FOR UPDATE TO authenticated USING (host_id = auth.uid()) WITH CHECK (host_id = auth.uid());
CREATE POLICY "host deletes own plan" ON public.plans FOR DELETE TO authenticated USING (host_id = auth.uid());

-- PRIVATE exact address
CREATE TABLE public.plan_addresses (
  plan_id uuid PRIMARY KEY REFERENCES public.plans(id) ON DELETE CASCADE,
  address text NOT NULL
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.plan_addresses TO authenticated;
GRANT ALL ON public.plan_addresses TO service_role;
ALTER TABLE public.plan_addresses ENABLE ROW LEVEL SECURITY;

-- JOIN REQUESTS
CREATE TABLE public.join_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','declined')),
  bring_buddy boolean NOT NULL DEFAULT false,
  no_show boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (plan_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.join_requests TO authenticated;
GRANT ALL ON public.join_requests TO service_role;
ALTER TABLE public.join_requests ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_plan_host(_plan uuid, _user uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.plans WHERE id = _plan AND host_id = _user)
$$;
CREATE OR REPLACE FUNCTION public.is_plan_member(_plan uuid, _user uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_plan_host(_plan, _user) OR EXISTS (
    SELECT 1 FROM public.join_requests WHERE plan_id = _plan AND user_id = _user AND status = 'approved')
$$;

CREATE POLICY "requester sees own requests" ON public.join_requests FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_plan_member(plan_id, auth.uid()));
CREATE POLICY "requester creates own request" ON public.join_requests FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND status = 'pending');
CREATE POLICY "host updates requests" ON public.join_requests FOR UPDATE TO authenticated
  USING (public.is_plan_host(plan_id, auth.uid())) WITH CHECK (public.is_plan_host(plan_id, auth.uid()));
CREATE POLICY "requester cancels own request" ON public.join_requests FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "host reads address" ON public.plan_addresses FOR SELECT TO authenticated
  USING (public.is_plan_host(plan_id, auth.uid()));
CREATE POLICY "host writes address" ON public.plan_addresses FOR INSERT TO authenticated
  WITH CHECK (public.is_plan_host(plan_id, auth.uid()));
CREATE POLICY "host updates address" ON public.plan_addresses FOR UPDATE TO authenticated
  USING (public.is_plan_host(plan_id, auth.uid()));
CREATE POLICY "host deletes address" ON public.plan_addresses FOR DELETE TO authenticated
  USING (public.is_plan_host(plan_id, auth.uid()));

-- Approved joiners get the address only from 2 hours before start
CREATE OR REPLACE FUNCTION public.get_plan_address(_plan uuid) RETURNS text
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE p public.plans; addr text;
BEGIN
  SELECT * INTO p FROM public.plans WHERE id = _plan;
  IF p.id IS NULL THEN RETURN NULL; END IF;
  IF p.host_id = auth.uid() OR (
     EXISTS (SELECT 1 FROM public.join_requests WHERE plan_id = _plan AND user_id = auth.uid() AND status = 'approved')
     AND now() >= p.starts_at - interval '2 hours') THEN
    SELECT address INTO addr FROM public.plan_addresses WHERE plan_id = _plan;
    RETURN addr;
  END IF;
  RETURN NULL;
END $$;

-- Eligibility + auto-approval on join
CREATE OR REPLACE FUNCTION public.check_join_request() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p public.plans; prof public.profiles; g text;
BEGIN
  SELECT * INTO p FROM public.plans WHERE id = NEW.plan_id;
  SELECT * INTO prof FROM public.profiles WHERE id = NEW.user_id;
  SELECT gender INTO g FROM public.profile_private WHERE user_id = NEW.user_id;
  IF p.host_id = NEW.user_id THEN RAISE EXCEPTION 'You are hosting this plan'; END IF;
  IF p.starts_at < now() THEN RAISE EXCEPTION 'This plan has already started'; END IF;
  IF EXISTS (SELECT 1 FROM public.blocks WHERE (blocker_id = p.host_id AND blocked_id = NEW.user_id)) THEN
    RAISE EXCEPTION 'You cannot join this plan';
  END IF;
  IF p.audience IN ('women_only','men_only','nonbinary_only') THEN
    IF NOT prof.verified THEN RAISE EXCEPTION 'Verify your identity to join this plan'; END IF;
    IF (p.audience = 'women_only' AND g IS DISTINCT FROM 'woman')
      OR (p.audience = 'men_only' AND g IS DISTINCT FROM 'man')
      OR (p.audience = 'nonbinary_only' AND g IS DISTINCT FROM 'non_binary') THEN
      RAISE EXCEPTION 'This plan is for a specific group';
    END IF;
  END IF;
  IF (p.is_example OR (p.auto_approve AND prof.no_show_count < 2))
     AND p.going_count + 1 + (CASE WHEN NEW.bring_buddy THEN 1 ELSE 0 END) <= p.capacity THEN
    NEW.status := 'approved';
  ELSE
    NEW.status := 'pending';
  END IF;
  RETURN NEW;
END $$;

-- going_count maintenance
CREATE OR REPLACE FUNCTION public.refresh_going_count() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE pid uuid := COALESCE(NEW.plan_id, OLD.plan_id);
BEGIN
  UPDATE public.plans SET going_count = base_going + COALESCE((
    SELECT sum(1 + CASE WHEN bring_buddy THEN 1 ELSE 0 END) FROM public.join_requests
    WHERE plan_id = pid AND status = 'approved'), 0)
  WHERE id = pid;
  RETURN NULL;
END $$;
CREATE TRIGGER join_requests_count AFTER INSERT OR UPDATE OR DELETE ON public.join_requests
FOR EACH ROW EXECUTE FUNCTION public.refresh_going_count();

-- TRIPS
CREATE TABLE public.trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  country text NOT NULL,
  city text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  interests text[] NOT NULL DEFAULT '{}',
  is_example boolean NOT NULL DEFAULT false,
  example_name text,
  example_verified boolean,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_date >= start_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trips TO authenticated;
GRANT ALL ON public.trips TO service_role;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trips visible to signed-in users" ON public.trips FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert own trip" ON public.trips FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND is_example = false);
CREATE POLICY "update own trip" ON public.trips FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "delete own trip" ON public.trips FOR DELETE TO authenticated USING (user_id = auth.uid());

-- SAFETY: reports and blocks
CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_user_id uuid,
  target_plan_id uuid REFERENCES public.plans(id) ON DELETE SET NULL,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.reports TO authenticated;
GRANT ALL ON public.reports TO service_role;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "file own reports" ON public.reports FOR INSERT TO authenticated WITH CHECK (reporter_id = auth.uid());
CREATE POLICY "see own reports" ON public.reports FOR SELECT TO authenticated USING (reporter_id = auth.uid());

CREATE TABLE public.blocks (
  blocker_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id)
);
GRANT SELECT, INSERT, DELETE ON public.blocks TO authenticated;
GRANT ALL ON public.blocks TO service_role;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "manage own blocks" ON public.blocks FOR ALL TO authenticated USING (blocker_id = auth.uid()) WITH CHECK (blocker_id = auth.uid());

CREATE TRIGGER check_join_request BEFORE INSERT ON public.join_requests
FOR EACH ROW EXECUTE FUNCTION public.check_join_request();

-- PLAN CHAT (closes 24h after start)
CREATE TABLE public.plan_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 1000),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.plan_messages TO authenticated;
GRANT ALL ON public.plan_messages TO service_role;
ALTER TABLE public.plan_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read chat" ON public.plan_messages FOR SELECT TO authenticated USING (public.is_plan_member(plan_id, auth.uid()));
CREATE POLICY "members post while open" ON public.plan_messages FOR INSERT TO authenticated WITH CHECK (
  user_id = auth.uid() AND public.is_plan_member(plan_id, auth.uid())
  AND EXISTS (SELECT 1 FROM public.plans p WHERE p.id = plan_id AND now() < p.starts_at + interval '24 hours'));

-- WOULD HANG AGAIN + WAVES
CREATE TABLE public.hang_again (
  plan_id uuid NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (plan_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.hang_again TO authenticated;
GRANT ALL ON public.hang_again TO service_role;
ALTER TABLE public.hang_again ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read votes" ON public.hang_again FOR SELECT TO authenticated USING (public.is_plan_member(plan_id, auth.uid()));
CREATE POLICY "members vote" ON public.hang_again FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND public.is_plan_member(plan_id, auth.uid()));
CREATE POLICY "remove own vote" ON public.hang_again FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.waves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  to_trip uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (from_user, to_trip)
);
GRANT SELECT, INSERT ON public.waves TO authenticated;
GRANT ALL ON public.waves TO service_role;
ALTER TABLE public.waves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "send waves" ON public.waves FOR INSERT TO authenticated WITH CHECK (from_user = auth.uid());
CREATE POLICY "see own waves" ON public.waves FOR SELECT TO authenticated USING (
  from_user = auth.uid() OR EXISTS (SELECT 1 FROM public.trips t WHERE t.id = to_trip AND t.user_id = auth.uid()));

-- Host marks a no-show: reliability drops, 2+ means always needs approval
CREATE OR REPLACE FUNCTION public.mark_no_show(_request uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.join_requests; p public.plans;
BEGIN
  SELECT * INTO r FROM public.join_requests WHERE id = _request;
  SELECT * INTO p FROM public.plans WHERE id = r.plan_id;
  IF p.host_id IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'Only the host can do this'; END IF;
  IF p.starts_at > now() THEN RAISE EXCEPTION 'The plan has not happened yet'; END IF;
  IF r.no_show OR r.status <> 'approved' THEN RETURN; END IF;
  UPDATE public.join_requests SET no_show = true WHERE id = _request;
  UPDATE public.profiles SET no_show_count = no_show_count + 1,
    reliability_score = GREATEST(0, reliability_score - 15) WHERE id = r.user_id;
END $$;

-- "Same time next week?" copies the plan for the same group
CREATE OR REPLACE FUNCTION public.repeat_plan(_plan uuid) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p public.plans; new_id uuid; new_host uuid;
BEGIN
  SELECT * INTO p FROM public.plans WHERE id = _plan;
  IF NOT public.is_plan_member(_plan, auth.uid()) THEN RAISE EXCEPTION 'Only people from this plan can repeat it'; END IF;
  SELECT id INTO new_id FROM public.plans WHERE parent_plan_id = _plan LIMIT 1;
  IF new_id IS NOT NULL THEN RETURN new_id; END IF;
  new_host := COALESCE(p.host_id, auth.uid());
  INSERT INTO public.plans (host_id, title, category, kind, area_label, starts_at, capacity, base_price, audience,
    step_free, is_travel, country, city, recurring_weekly, auto_approve, description, parent_plan_id)
  VALUES (new_host, p.title, p.category, p.kind, p.area_label, p.starts_at + interval '7 days', p.capacity, p.base_price,
    p.audience, p.step_free, p.is_travel, p.country, p.city, true, p.auto_approve, p.description, _plan)
  RETURNING id INTO new_id;
  INSERT INTO public.plan_addresses (plan_id, address)
    SELECT new_id, address FROM public.plan_addresses WHERE plan_id = _plan;
  ALTER TABLE public.join_requests DISABLE TRIGGER check_join_request;
  INSERT INTO public.join_requests (plan_id, user_id, status, bring_buddy)
    SELECT new_id, user_id, 'approved', bring_buddy FROM public.join_requests
    WHERE plan_id = _plan AND status = 'approved' AND NOT no_show AND user_id <> new_host;
  ALTER TABLE public.join_requests ENABLE TRIGGER check_join_request;
  RETURN new_id;
END $$;

-- SEED: example plans (Paris + travel cities)
INSERT INTO public.plans (title, category, kind, area_label, starts_at, capacity, base_price, audience, step_free, is_travel, country, city, recurring_weekly, description, base_going, going_count, is_example, example_host_name, example_host_verified, example_host_reliability) VALUES
('Wheel-throwing pottery at Atelier Terre', 'Pottery', 'partner_venue', 'Bastille, 11e', date_trunc('hour', now()) + interval '1 day 18 hours', 8, 38, 'everyone', true, false, 'France', 'Paris', false, 'Two hours on the wheel with a ceramicist. Clay and firing included.', 3, 3, true, 'Camille', true, 96),
('Ramen tasting crawl', 'Food', 'partner_venue', 'Rue Sainte-Anne, 1er', date_trunc('hour', now()) + interval '2 days 19 hours', 6, 22, 'everyone', false, false, 'France', 'Paris', false, 'Three bowls, three shops, one long walk.', 4, 4, true, 'Kenji', true, 92),
('Bouldering intro session', 'Climbing', 'partner_venue', 'Pantin, Canal de l''Ourcq', date_trunc('hour', now()) + interval '3 days 10 hours', 8, 18, 'everyone', false, false, 'France', 'Paris', true, 'Beginner-friendly. Shoes included.', 2, 2, true, 'Inès', true, 99),
('Dog walk, Bois de Vincennes', 'Dog walk', 'chill', 'Lac Daumesnil, 12e', date_trunc('hour', now()) + interval '1 day 9 hours', 6, 0, 'everyone', true, false, 'France', 'Paris', true, 'Loop around the lake. Dogs and dogless welcome.', 3, 3, true, 'Théo', true, 94),
('Laundry run + coffee', 'Errands', 'chill', 'Oberkampf, 11e', date_trunc('hour', now()) + interval '90 minutes', 4, 0, 'everyone', true, false, 'France', 'Paris', true, 'Load the machines, grab a flat white next door while they spin.', 2, 2, true, 'Sam', false, 88),
('Marché d''Aligre wander', 'Market', 'chill', 'Aligre, 12e', date_trunc('hour', now()) + interval '2 days 9 hours', 6, 0, 'everyone', true, false, 'France', 'Paris', true, 'Cheese, flowers, and the covered market.', 2, 2, true, 'Lou', true, 97),
('Sunset run along the Seine', 'Running', 'chill', 'Quai de la Tournelle, 5e', date_trunc('hour', now()) + interval '1 day 19 hours', 8, 0, 'women_only', false, false, 'France', 'Paris', true, 'Easy 6 km pace, no one left behind.', 4, 4, true, 'Aïcha', true, 98),
('Board-game night', 'Games', 'partner_venue', 'Le Marais, 3e', date_trunc('hour', now()) + interval '4 days 20 hours', 8, 8, 'lgbtq_friendly', true, false, 'France', 'Paris', true, 'Cosy café with a 400-game library.', 3, 3, true, 'Alex', true, 95),
('Daytime co-working', 'Co-working', 'chill', 'Canal Saint-Martin, 10e', date_trunc('hour', now()) + interval '1 day 10 hours', 6, 0, 'everyone', true, false, 'France', 'Paris', false, 'Quiet café, focus sprints, lunch together.', 2, 2, true, 'Nour', true, 91),
('Step-free museum visit', 'Culture', 'chill', 'Musée d''Orsay, 7e', date_trunc('hour', now()) + interval '3 days 14 hours', 5, 0, 'everyone', true, false, 'France', 'Paris', false, 'Impressionists floor, fully accessible route.', 2, 2, true, 'Jules', true, 100),
('Natural wine bar dinner', 'Dinner', 'partner_venue', 'Belleville, 20e', date_trunc('hour', now()) + interval '5 days 20 hours', 6, 30, 'everyone', false, false, 'France', 'Paris', false, 'Small plates, long table.', 3, 3, true, 'Margaux', true, 93),
('Off-peak climbing, quiet gym', 'Climbing', 'chill', 'Bercy, 12e', date_trunc('hour', now()) + interval '2 days 14 hours', 4, 0, 'nonbinary_only', false, false, 'France', 'Paris', false, 'Weekday afternoon, empty walls.', 2, 2, true, 'River', true, 97),
('Pastel de nata baking class', 'Food', 'partner_venue', 'Alfama', current_date + interval '20 days 15 hours', 8, 35, 'everyone', false, true, 'Portugal', 'Lisbon', false, 'Hands-on class in a tiny tiled kitchen.', 3, 3, true, 'Rita', true, 96),
('Sunset at Miradouro da Graça', 'Wander', 'chill', 'Graça', current_date + interval '22 days 18 hours', 6, 0, 'everyone', false, true, 'Portugal', 'Lisbon', false, 'Bring a snack, watch the city go orange.', 2, 2, true, 'Tomás', true, 90),
('Port cellar tour', 'Drinks', 'partner_venue', 'Vila Nova de Gaia', current_date + interval '25 days 16 hours', 8, 20, 'everyone', true, true, 'Portugal', 'Porto', false, 'Cellar walk with tasting.', 2, 2, true, 'Beatriz', true, 94),
('Trastevere evening walk', 'Wander', 'chill', 'Trastevere', current_date + interval '30 days 19 hours', 6, 0, 'everyone', false, true, 'Italy', 'Rome', false, 'Cobbles, gelato, no agenda.', 3, 3, true, 'Luca', true, 92),
('Beach volleyball', 'Sport', 'chill', 'Barceloneta', current_date + interval '18 days 11 hours', 8, 0, 'everyone', false, true, 'Spain', 'Barcelona', false, 'All levels, we rotate teams.', 4, 4, true, 'Marta', true, 95),
('Tapas evening', 'Dinner', 'partner_venue', 'El Born', current_date + interval '19 days 21 hours', 6, 25, 'lgbtq_friendly', true, true, 'Spain', 'Barcelona', false, 'Shared plates at a neighbourhood bar.', 2, 2, true, 'Pau', true, 98);

INSERT INTO public.plan_addresses (plan_id, address)
SELECT id, 'Example address for ' || area_label || ', ' || city FROM public.plans WHERE is_example;

INSERT INTO public.trips (country, city, start_date, end_date, interests, is_example, example_name, example_verified) VALUES
('Portugal', 'Lisbon', current_date + 18, current_date + 25, ARRAY['food','hiking','photography','coffee'], true, 'Maya', true),
('Portugal', 'Lisbon', current_date + 20, current_date + 27, ARRAY['music','food','museums'], true, 'Oskar', true),
('Portugal', 'Porto', current_date + 23, current_date + 28, ARRAY['wine','architecture','running'], true, 'Priya', true),
('Italy', 'Rome', current_date + 28, current_date + 34, ARRAY['museums','food','history'], true, 'Sofia', false),
('Spain', 'Barcelona', current_date + 16, current_date + 22, ARRAY['beach','climbing','food'], true, 'Jonas', true),
('Spain', 'Barcelona', current_date + 17, current_date + 24, ARRAY['nightlife','music','architecture'], true, 'Ade', true);
