CREATE TABLE public.contact_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  message text NOT NULL,
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.contact_submissions TO authenticated;
GRANT ALL ON public.contact_submissions TO service_role;
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read contact messages" ON public.contact_submissions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.submit_contact(_name text, _email text, _message text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _id uuid;
BEGIN
  _name := btrim(coalesce(_name,'')); _email := btrim(coalesce(_email,'')); _message := btrim(coalesce(_message,''));
  IF length(_name) < 1 OR length(_name) > 100 THEN RAISE EXCEPTION 'Please enter your name'; END IF;
  IF _email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' OR length(_email) > 255 THEN RAISE EXCEPTION 'Please enter a valid email'; END IF;
  IF length(_message) < 5 OR length(_message) > 2000 THEN RAISE EXCEPTION 'Message must be 5 to 2000 characters'; END IF;
  INSERT INTO public.contact_submissions(name,email,message,user_id) VALUES (_name,_email,_message,auth.uid()) RETURNING id INTO _id;
  INSERT INTO public.notifications(user_id,title,kind,link)
  SELECT ur.user_id, 'Contact from ' || _name || ' (' || _email || '): ' || left(_message, 180), 'contact', NULL
  FROM public.user_roles ur WHERE ur.role = 'admin';
  RETURN _id;
END $$;
REVOKE ALL ON FUNCTION public.submit_contact(text,text,text) FROM public;
GRANT EXECUTE ON FUNCTION public.submit_contact(text,text,text) TO anon, authenticated;