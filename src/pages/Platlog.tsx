return (
  <div className="w-full">
    <div className="mx-auto w-full max-w-[1560px] px-6 py-6 space-y-6">

      {/* HEADER PADRONIZADO */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/dashboard")}
            className="h-9 w-9"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              Platlog
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Baixa por planilha com desconto manual
            </p>
          </div>
        </div>
      </div>

      {/* CARD PRINCIPAL MAIS CLEAN */}
      <div className="rounded-2xl border border-border bg-card/60 backdrop-blur-sm p-6">

        <p className="text-sm font-medium text-foreground mb-4">
          Planilha de entrada
        </p>

        {/* DROPZONE MELHORADO */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => document.getElementById("platlog-file-input")?.click()}
          className="cursor-pointer rounded-xl border border-dashed border-border bg-background/40 p-12 text-center transition hover:border-primary/50"
        >
          {file ? (
            <div className="flex items-center justify-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center">
                <FileCheck className="h-5 w-5 text-primary" />
              </div>

              <div className="text-left">
                <p className="text-sm font-medium text-foreground">
                  {file.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  Clique para trocar o arquivo
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-4">
                <Upload className="h-6 w-6 text-muted-foreground" />
              </div>

              <p className="text-sm font-medium text-foreground">
                Arraste ou clique para selecionar a planilha
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Formatos aceitos: .xlsx e .xls
              </p>
            </>
          )}

          <input
            id="platlog-file-input"
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {/* INPUT */}
        <div className="mt-6">
          <label className="text-sm font-medium text-foreground">
            Desconto total informado por e-mail
          </label>

          <Input
            value={discountInput}
            onChange={(e) => {
              setDiscountInput(e.target.value);
              setResult(null);
            }}
            placeholder="Ex.: 1.250,50"
            className="mt-2 h-10"
          />

          <p className="text-xs text-muted-foreground mt-2">
            O desconto será aplicado automaticamente no maior valor.
          </p>
        </div>

        {/* BOTÃO MELHOR POSICIONADO */}
        <div className="mt-6 flex justify-start">
          <Button
            disabled={!file || processing}
            onClick={handleProcess}
          >
            {processing ? "Processando..." : "Processar planilha"}
          </Button>
        </div>
      </div>

      {/* RESULTADO */}
      {result && result.totalDocumentos > 0 && (
        <div className="space-y-5">

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <SummaryCard label="Docs" value={result.totalDocumentos} index={0} />
            <SummaryCard label="Original" value={formatBRL(result.totalValorOriginal)} index={1} />
            <SummaryCard label="Descontos" value={formatBRL(result.totalDescontos)} index={2} />
            <SummaryCard label="Final" value={formatBRL(result.totalValorFinal)} index={3} />
          </div>

          <DataTable
            title="Prévia"
            badge={`${result.documents.length}`}
            columns={[
              { key: "filial", label: "Filial" },
              { key: "serie", label: "Série" },
              { key: "numeroDocumento", label: "Documento" },
              { key: "tipoDocumento", label: "Tipo" },
              { key: "valorOriginal", label: "Original", render: (r: any) => formatBRL(r.valorOriginal) },
              { key: "descontoAplicado", label: "Desconto", render: (r: any) => formatBRL(r.descontoAplicado) },
              { key: "valorFinal", label: "Final", render: (r: any) => formatBRL(r.valorFinal) },
            ]}
            data={result.documents}
            keyExtractor={(row: any, i) => `${row.numeroDocumento}_${i}`}
          />

          <Button onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Baixar planilha final
          </Button>
        </div>
      )}

    </div>
  </div>
);