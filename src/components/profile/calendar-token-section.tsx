"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, RefreshCw, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function CalendarTokenSection({ initialToken }: { initialToken: string | null }) {
  const [token, setToken] = useState(initialToken);
  const [loading, setLoading] = useState(false);

  const url = typeof window !== "undefined" && token
    ? `${window.location.origin}/api/calendar/${token}`
    : token ? `/api/calendar/${token}` : null;

  async function generate() {
    setLoading(true);
    try {
      const res = await fetch("/api/user/ical-token", { method: "POST" });
      if (!res.ok) {
        toast.error("Não foi possível gerar o link");
        return;
      }
      const data = await res.json();
      setToken(data.token);
      toast.success("Link gerado");
    } finally {
      setLoading(false);
    }
  }

  async function revoke() {
    if (!confirm("Revogar o link atual? Vais ter de re-subscrever no Google/Apple Calendar.")) return;
    setLoading(true);
    try {
      const res = await fetch("/api/user/ical-token", { method: "DELETE" });
      if (!res.ok) {
        toast.error("Erro ao revogar");
        return;
      }
      setToken(null);
      toast.success("Link revogado");
    } finally {
      setLoading(false);
    }
  }

  async function copyUrl() {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    toast.success("Link copiado");
  }

  if (!token) {
    return (
      <div className="space-y-2">
        <p className="text-[12px] text-[var(--muted-foreground)]">
          Ainda não geraste um link. Após gerar, podes colá-lo no Google Calendar (Adicionar &gt; Por URL) ou no Apple Calendar (Ficheiro &gt; Nova subscrição de calendário).
        </p>
        <Button size="sm" onClick={generate} disabled={loading}>
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Gerar link iCal"}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <code className="flex-1 min-w-[200px] text-[11px] bg-[var(--muted)] px-2 py-1.5 rounded break-all">
          {url}
        </code>
        <Button size="icon" variant="outline" onClick={copyUrl} aria-label="Copiar">
          <Copy className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={generate} disabled={loading}>
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" />Regenerar
        </Button>
        <Button size="sm" variant="outline" onClick={revoke} disabled={loading} className="text-[var(--destructive)]">
          <Trash2 className="mr-1.5 h-3.5 w-3.5" />Revogar
        </Button>
      </div>
      <p className="text-[11px] text-[var(--muted-foreground)]">
        Privado — não partilhes este link. Atualiza-se automaticamente quando o horário muda.
      </p>
    </div>
  );
}
