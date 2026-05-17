"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Lectiva] FATAL:", error);
  }, [error]);

  return (
    <html lang="pt">
      <body style={{ margin: 0, fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif" }}>
        <div style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          background: "#f5f5f7",
        }}>
          <div style={{
            maxWidth: 420,
            background: "white",
            borderRadius: 14,
            padding: 28,
            textAlign: "center",
            boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
          }}>
            <h1 style={{ fontSize: 22, margin: "0 0 8px", letterSpacing: "-0.022em" }}>Falha crítica</h1>
            <p style={{ fontSize: 14, color: "#6e6e73", margin: "0 0 20px" }}>
              A aplicação encontrou um problema irrecuperável.
            </p>
            <button
              onClick={reset}
              style={{
                background: "#007aff",
                color: "white",
                border: "none",
                padding: "10px 18px",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Recarregar
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
