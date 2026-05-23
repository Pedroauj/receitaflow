-- Tabela de histórico de notas de abastecimento processadas.
-- Compartilhada entre todos os usuários. Cada nota expira automaticamente
-- após 30 dias (expires_at), mantendo o banco enxuto.
-- Upsert por (cnpj, n_nf): re-exportar a mesma nota atualiza o registro.

CREATE TABLE IF NOT EXISTS public.notas_processadas (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  n_nf        text        NOT NULL,
  cnpj        text        NOT NULL,
  posto_nome  text        NOT NULL,
  placa       text        NOT NULL DEFAULT '',
  file_name   text        NOT NULL,
  xml_content text        NOT NULL,
  uploaded_by uuid        REFERENCES auth.users(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  expires_at  timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  CONSTRAINT notas_processadas_cnpj_nnf_key UNIQUE (cnpj, n_nf)
);

CREATE INDEX notas_processadas_n_nf_idx     ON public.notas_processadas (n_nf);
CREATE INDEX notas_processadas_cnpj_idx     ON public.notas_processadas (cnpj);
CREATE INDEX notas_processadas_expires_idx  ON public.notas_processadas (expires_at);
CREATE INDEX notas_processadas_created_idx  ON public.notas_processadas (created_at DESC);

ALTER TABLE public.notas_processadas ENABLE ROW LEVEL SECURITY;

-- Todos os usuários autenticados veem apenas notas não expiradas
CREATE POLICY "notas_select_authenticated"
  ON public.notas_processadas FOR SELECT
  TO authenticated
  USING (expires_at > NOW());

-- Usuários autenticados podem inserir/atualizar suas próprias notas
CREATE POLICY "notas_insert_authenticated"
  ON public.notas_processadas FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "notas_update_authenticated"
  ON public.notas_processadas FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Limpeza lazy: qualquer usuário pode deletar registros expirados
CREATE POLICY "notas_delete_expired"
  ON public.notas_processadas FOR DELETE
  TO authenticated
  USING (expires_at < NOW());
