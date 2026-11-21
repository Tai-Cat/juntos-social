DROP POLICY IF EXISTS "trips visible to signed-in users" ON public.trips;
CREATE POLICY "trips visible to signed-in users" ON public.trips FOR SELECT TO authenticated
USING (is_example OR user_id = auth.uid() OR (user_id IS NOT NULL AND NOT public.people_blocked(auth.uid(), user_id)));

DROP POLICY IF EXISTS "config readable" ON public.app_config;
CREATE POLICY "config readable" ON public.app_config FOR SELECT TO anon, authenticated USING (id = true);

DROP POLICY IF EXISTS "read fictional social examples" ON public.social_examples;
CREATE POLICY "read fictional social examples" ON public.social_examples FOR SELECT TO anon, authenticated
USING (plan_id IS NULL OR EXISTS (SELECT 1 FROM public.plans p WHERE p.id = plan_id));

DROP POLICY IF EXISTS "read interest levels" ON public.interest_levels;
CREATE POLICY "read interest levels" ON public.interest_levels FOR SELECT TO authenticated
USING (user_id = auth.uid() OR NOT public.people_blocked(auth.uid(), user_id));

DROP POLICY IF EXISTS "profiles readable by signed-in users" ON public.profiles;
CREATE POLICY "profiles readable by signed-in users" ON public.profiles FOR SELECT TO authenticated
USING (id = auth.uid() OR NOT public.people_blocked(auth.uid(), id));

DROP POLICY IF EXISTS "everyone reads used activities" ON public.activities;
CREATE POLICY "everyone reads used activities" ON public.activities FOR SELECT TO anon, authenticated
USING (length(trim(name)) > 0 AND length(trim(genre)) > 0);

DROP POLICY IF EXISTS "Photo credits are public" ON public.photo_credits;
CREATE POLICY "Photo credits are public" ON public.photo_credits FOR SELECT TO anon, authenticated
USING (plan_id IS NULL OR EXISTS (SELECT 1 FROM public.plans p WHERE p.id = plan_id));