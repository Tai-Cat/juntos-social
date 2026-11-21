ALTER TABLE public.plans DROP CONSTRAINT IF EXISTS plans_capacity_check;
ALTER TABLE public.plans ADD CONSTRAINT plans_capacity_check CHECK (capacity >= 2 AND capacity <= 500);