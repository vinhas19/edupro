"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Check, X } from "lucide-react";
import { toast } from "sonner";

export function SubstituteActions({ substitutionId, status }: { substitutionId: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<null | "CONFIRM" | "DECLINE">(null);
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState("");

  async function respond(decision: "CONFIRM" | "DECLINE") {
    if (decision === "DECLINE" && !declining) {
      setDeclining(true);
      return;
    }
    setBusy(decision);
    try {
      const res = await fetch(`/api/substitutions/${substitutionId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision,
          reason: decision === "DECLINE" ? (reason.trim() || undefined) : undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(typeof data.error === "string" ? data.error : "Erro");
        return;
      }
      toast.success(decision === "CONFIRM" ? "Substituição confirmada" : "Recusada");
      setDeclining(false);
      setReason("");
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  if (status === "CONFIRMED") {
    return (
      <span className="text-[12px] text-[var(--tint-green)] font-medium flex items-center gap-1">
        <Check className="h-3.5 w-3.5" />Confirmada
      </span>
    );
  }

  if (declining) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <Input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Motivo (opcional)"
          className="h-8 text-[12px] w-44"
          autoFocus
        />
        <Button size="sm" variant="outline" onClick={() => respond("DECLINE")} disabled={busy !== null} className="text-[var(--destructive)]">
          {busy === "DECLINE" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Confirmar recusa"}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => { setDeclining(false); setReason(""); }}>
          Cancelar
        </Button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" onClick={() => respond("CONFIRM")} disabled={busy !== null}>
        {busy === "CONFIRM" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : (
          <><Check className="mr-1 h-3.5 w-3.5" />Aceitar</>
        )}
      </Button>
      <Button size="sm" variant="outline" onClick={() => respond("DECLINE")} disabled={busy !== null} className="text-[var(--destructive)]">
        <X className="mr-1 h-3.5 w-3.5" />Recusar
      </Button>
    </div>
  );
}
