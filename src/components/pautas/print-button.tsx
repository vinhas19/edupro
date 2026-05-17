"use client";

export function PrintPautaButton() {
  return (
    <button
      onClick={() => window.print()}
      style={{
        background: "#007aff",
        color: "white",
        border: "none",
        padding: "8px 14px",
        borderRadius: 6,
        fontSize: 13,
        fontWeight: 600,
        cursor: "pointer",
      }}
    >
      🖨️ Imprimir / Guardar PDF
    </button>
  );
}
