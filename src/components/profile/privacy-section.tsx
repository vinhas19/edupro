"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Trash2, Loader2, X, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export function PrivacySection() {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  function downloadExport() {
    // Direct browser download via GET
    window.location.href = "/api/me/export";
  }

  async function deleteAccount() {
    if (confirm !== "APAGAR A MINHA CONTA") {
      toast.error("Escreve exatamente 'APAGAR A MINHA CONTA' para confirmar.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/me/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(typeof data.error === "string" ? data.error : "Não foi possível apagar a conta.");
        return;
      }
      toast.success("Conta apagada. A terminar sessão…");
      await signOut({ callbackUrl: "/login" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-[13px] font-medium">Exportar os meus dados</p>
          <p className="text-[11px] text-[var(--muted-foreground)]">
            Download em JSON de toda a tua informação (RGPD art. 20º).
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={downloadExport}>
          <Download className="mr-1.5 h-3.5 w-3.5" />Transferir
        </Button>
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap pt-3 border-t border-[var(--separator)]">
        <div>
          <p className="text-[13px] font-medium text-[var(--destructive)]">Apagar a minha conta</p>
          <p className="text-[11px] text-[var(--muted-foreground)] max-w-md">
            Os dados pessoais são anonimizados. Histórico académico (notas/faltas) é conservado anonimamente pela escola por obrigação legal.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="text-[var(--destructive)]">
          <Trash2 className="mr-1.5 h-3.5 w-3.5" />Apagar conta
        </Button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setOpen(false)}>
          <div
            className="w-full max-w-md rounded-[12px] bg-[var(--card)] shadow-[var(--card-shadow)] p-5 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-[16px] font-semibold tracking-[-0.012em]">Apagar conta</h3>
              <button onClick={() => setOpen(false)} className="h-7 w-7 rounded-[6px] hover:bg-[var(--muted)] flex items-center justify-center">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div
              className="flex items-start gap-2 rounded-[8px] p-3 text-[12px]"
              style={{ background: "rgba(255,59,48,0.10)", color: "var(--destructive)" }}
            >
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                Esta ação é <strong>irreversível</strong>. Ficarás sem acesso à plataforma. Os teus dados pessoais (nome, email) serão anonimizados.
              </span>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="conf">Escreve <code className="text-[11px] bg-[var(--muted)] px-1 rounded">APAGAR A MINHA CONTA</code></Label>
              <Input id="conf" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="APAGAR A MINHA CONTA" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pwd">Confirma a tua palavra-passe</Label>
              <Input id="pwd" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={deleteAccount} disabled={busy || confirm !== "APAGAR A MINHA CONTA" || !password} className="text-white" style={{ background: "var(--destructive)" }}>
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Apagar definitivamente"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
