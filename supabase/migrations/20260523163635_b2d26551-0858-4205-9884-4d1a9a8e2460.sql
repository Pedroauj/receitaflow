CREATE TABLE public.notas_processadas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  n_nf TEXT NOT NULL,
  cnpj TEXT NOT NULL,
  posto_nome TEXT NOT NULL,
  placa TEXT NOT NULL DEFAULT '',
  file_name TEXT NOT NULL,
  xml_content TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
  CONSTRAINT unique_cnpj_nnf UNIQUE (cnpj, n_nf)
);

-- Índices
CREATE INDEX idx_notas_n_nf ON public.notas_processadas(n_nf);
CREATE INDEX idx_notas_cnpj ON public.notas_processadas(cnpj);
CREATE INDEX idx_notas_expires_at ON public.notas_processadas(expires_at);
CREATE INDEX idx_notas_created_at_desc ON public.notas_processadas(created_at DESC);

-- RLS
ALTER TABLE public.notas_processadas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view non-expired notas"
  ON public.notas_processadas
  FOR SELECT
  TO authenticated
  USING (expires_at > NOW());

CREATE POLICY "Authenticated can insert own notas"
  ON public.notas_processadas
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Authenticated can update notas"
  ON public.notas_processadas
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated can delete expired notas"
  ON public.notas_processadas
  FOR DELETE
  TO authenticated
  USING (expires_at < NOW());