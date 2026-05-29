-- Security fix: restrict notas_processadas UPDATE to the record owner.
-- The original policy used USING(true) WITH CHECK(true), which allowed any
-- authenticated user to overwrite any other user's nota. Now only the
-- uploader (uploaded_by = auth.uid()) can update their own records.

DROP POLICY IF EXISTS "notas_update_authenticated" ON public.notas_processadas;

CREATE POLICY "notas_update_own"
  ON public.notas_processadas FOR UPDATE
  TO authenticated
  USING (auth.uid() = uploaded_by)
  WITH CHECK (auth.uid() = uploaded_by);
