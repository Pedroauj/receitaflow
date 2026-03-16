

# Conversor de Planilhas Financeiras

## Página Inicial
- Grid de cards de clientes disponíveis (inicialmente apenas "Martin Brower")
- Cada card com nome, descrição e botão "Abrir"
- Estrutura extensível via array de configuração de clientes

## Página Martin Brower — Upload e Configuração
- Dropzone para upload de `.xls`/`.xlsx`
- Date pickers: Data de Vencimento e Data de Recebimento
- Campo numérico: Valor recebido no banco (formato BRL)
- Botão "Processar" habilitado apenas quando todos os campos estiverem preenchidos

## Processamento (client-side com SheetJS)
1. Leitura da planilha e extração das colunas: `Data Vcto.`, `Valor Bruto`, `Nº da Fatura`
2. Filtro por data de vencimento informada
3. Soma dos valores brutos e comparação com valor do banco
4. Se divergente: banner inline com a diferença em destaque
5. Se confere: segue para parsing de faturas

## Parsing de Fatura
- `^36(\d+)` → Série 36, Doc = restante
- `^1(\d+)` → Série 1, Doc = restante
- Outros → registrados como erro

## Tela de Resultado
- Resumo: Qtd documentos, Total processado, Valor banco, Status (confere/diverge)
- Lista de erros de parsing (se houver)
- Botão "Baixar planilha final"

## Planilha de Saída (gerada via SheetJS)
- Colunas: `FILIAL`, `SERIE`, `Nº DOCUMENTO`, `TIPO DOCUMENTO`, `VALOR PAGO`
- FILIAL e TIPO DOCUMENTO com valores fixos do modelo
- Data de recebimento incluída se aplicável

## Design
- Tipografia Geist Sans/Mono com `tabular-nums` para valores
- Paleta cinza-azulado, cor apenas em ações primárias e indicadores de status
- Container `max-w-5xl`, cards com shadow sutil, sem modais, sem animações de entrada

## Arquitetura
- Configuração de clientes como array extensível (nome, descrição, rota, componente)
- Cada cliente tem seu próprio processador, facilitando adição futura de novos clientes

