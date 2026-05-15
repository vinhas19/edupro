"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";

interface Props {
  attendanceRecordId: string;
  defaultReason?: string;
  defaultUrl?: string | null;
  triggerLabel?: string;
}

export function JustificationDialog({ attendanceRecordId, defaultReason, defaultUrl, triggerLabel = "Justificar" }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(defaultReason ?? "");
  const [documentUrl, setDocumentUrl] = useState(defaultUrl ?? "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function submit() {
    if (reason.trim().length < 5) {
      toast.error("Motivo demasiado curto (mínimo 5 caracteres).");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/attendance/justifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attendanceRecordId,
          reason: reason.trim(),
          documentUrl: documentUrl.trim() || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(typeof data.error === "string" ? data.error : "Erro ao submeter justificação");
        return;
      }
      toast.success("Justificação submetida");
      setOpen(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>{triggerLabel}</Button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-[12px] bg-[var(--card)] shadow-[var(--card-shadow)] p-5 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-[16px] font-semibold tracking-[-0.012em]">Justificar falta</h3>
              <button onClick={() => setOpen(false)} aria-label="Fechar" className="h-7 w-7 rounded-[6px] hover:bg-[var(--muted)] flex items-center justify-center">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="reason">Motivo</Label>
                <Textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={4}
                  placeholder="ex: Consulta médica, doença, motivos familiares..."
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="docUrl">Atestado/Comprovativo (URL — opcional)</Label>
                <Input
                  id="docUrl"
                  value={documentUrl}
                  onChange={(e) => setDocumentUrl(e.target.value)}
                  placeholder="https://..."
                />
                <p className="text-[11px] text-[var(--muted-foreground)]">
                  Carrega primeiro o ficheiro em "Documentos" e cola aqui o URL.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={submit} disabled={loading}>
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />A enviar…</> : "Submeter"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
