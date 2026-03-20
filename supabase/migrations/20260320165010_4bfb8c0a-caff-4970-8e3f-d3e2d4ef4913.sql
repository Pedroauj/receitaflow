-- Allow masters to update any profile
CREATE POLICY "Masters can update any profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.is_master(auth.uid()))
WITH CHECK (public.is_master(auth.uid()));
