CREATE TABLE public.postos_abastecimento (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cnpj text NOT NULL UNIQUE,
  nome text NOT NULL,
  tags text[] NOT NULL DEFAULT '{}',
  first_seen timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.postos_abastecimento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view postos"
  ON public.postos_abastecimento FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can insert own postos"
  ON public.postos_abastecimento FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated can update postos"
  ON public.postos_abastecimento FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE TRIGGER set_postos_abastecimento_updated_at
  BEFORE UPDATE ON public.postos_abastecimento
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_postos_abastecimento_nome ON public.postos_abastecimento(nome);