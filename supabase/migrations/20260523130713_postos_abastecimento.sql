-- Tabela de postos de abastecimento compartilhada entre todos os usuários.
-- Quando qualquer usuário importar XMLs, os postos extraídos ficam visíveis
-- para toda a equipe, junto com as tags de placa cadastradas para cada posto.

CREATE TABLE IF NOT EXISTS public.postos_abastecimento (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  cnpj        text        NOT NULL,
  nome        text        NOT NULL,
  tags        text[]      NOT NULL DEFAULT '{}',
  first_seen  timestamptz NOT NULL DEFAULT now(),
  created_by  uuid        REFERENCES auth.users(id),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT postos_abastecimento_cnpj_key UNIQUE (cnpj)
);

ALTER TABLE public.postos_abastecimento ENABLE ROW LEVEL SECURITY;

-- Todos os usuários autenticados podem ler qualquer posto
CREATE POLICY "postos_select_authenticated"
  ON public.postos_abastecimento
  FOR SELECT
  TO authenticated
  USING (true);

-- Usuários autenticados podem inserir novos postos
CREATE POLICY "postos_insert_authenticated"
  ON public.postos_abastecimento
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Usuários autenticados podem atualizar qualquer posto (ex: adicionar/remover tags)
CREATE POLICY "postos_update_authenticated"
  ON public.postos_abastecimento
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
