const sectionCardStyle: React.CSSProperties = {
  background: "linear-gradient(180deg, #18191D 0%, #15161A 100%)",
  border: "1px solid #22242A",
  borderRadius: 16,
  boxShadow: "0 8px 24px rgba(0,0,0,.16)",
};

const ConciliacaoNFE = () => {
  return (
    <div style={{ width: "100%" }}>
      <div style={{ marginBottom: 18 }}>
        <p
          style={{
            fontSize: 12,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#D7922B",
            fontWeight: 700,
            margin: 0,
          }}
        >
          NFE · Notas de itens
        </p>

        <p
          style={{
            fontSize: 14,
            color: "#8D8D96",
            margin: "8px 0 0",
          }}
        >
          Estrutura da NFe preparada. Agora vamos montar a comparação por chave.
        </p>
      </div>

      <div
        style={{
          ...sectionCardStyle,
          padding: "24px",
        }}
      >
        <p
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: "#F5F5F0",
            margin: 0,
          }}
        >
          Conciliação de NFe
        </p>

        <p
          style={{
            fontSize: 14,
            color: "#8D8D96",
            margin: "8px 0 0",
          }}
        >
          Em breve, esta aba fará a comparação entre sistema e governo usando a chave da nota.
        </p>
      </div>
    </div>
  );
};

export default ConciliacaoNFE;