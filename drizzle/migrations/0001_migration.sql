DROP POLICY "requester creates own request" ON public.join_requests;
CREATE POLICY "requester creates own request" ON public.join_requests FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());