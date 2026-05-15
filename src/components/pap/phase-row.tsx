"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Calendar, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

const PHASE_LABELS: Record<string, string> = {
  PROPOSAL: "Proposta",
  DEVELOPMENT: "Desenvolvimento",
  SUBMISSION: "Entrega",
  PRESENTATION: "Apresentação",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendente",
  IN_PROGRESS: "Em Curso",
  SUBMITTED: "Entregue",
  APPROVED: "Aprovado",
  REJECTED: "Rejeitado",
};

const STATUS_TINT: Record<string, string> = {
  PENDING: "var(--muted-foreground)",
  IN_PROGRESS: "var(--tint-blue)",
  SUBMITTED: "var(--tint-purple)",
  APPROVED: "var(--tint-green)",
  REJECTED: "var(--destructive)",
};

interface Props {
  id: string;
  phase: string;
  dueDate: Date | string | null;
  submittedAt: Date | string | null;
  status: string;
  progress?: number;
  canEdit: boolean;
}

export function PhaseRow({ id, phase, dueDate, submittedAt, status, progress = 0, canEdit }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [st, setSt] = useState(status);
  const [due, setDue] = useState(dueDate ? format(new Date(dueDate), "yyyy-MM-dd") : "");
  const [prog, setProg] = useState(progress);
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    try {
      const res = await fetch(`/api/pap/phases/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: st,
          dueDate: due ? new Date(due).toISOString() : null,
          progress: prog,
          ...(st === "APPROVED" || st === "SUBMITTED" ? { submittedAt: new Date().toISOString() } : {}),
        }),
      });
      if (!res.ok) {
        toast.error("Erro ao guardar");
        return;
      }
      toast.success("Actualizado");
      setEditing(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (!editing) {
    return (
      <div className="rounded-[10px] border border-[var(--separator)] p-3 space-y-2">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="text-[13px] font-semibold">{PHASE_LABELS[phase] ?? phase}</p>
            {dueDate && (
              <p className="text-[11px] text-[var(--muted-foreground)] flex items-center gap-1 mt-0.5">
                <Calendar className="h-3 w-3" />
                Prazo: {format(new Date(dueDate), "d 'de' MMMM yyyy", { locale: pt })}
              </p>
            )}
            {submittedAt && (
              <p className="text-[11px] text-[var(--tint-green)] mt-0.5">
                Entregue: {format(new Date(submittedAt), "d 'de' MMMM yyyy", { locale: pt })}
              </p>
            )}
          </div>
          <Badge variant="outline" style={{ color: STATUS_TINT[status] }}>{STATUS_LABELS[status] ?? status}</Badge>
          {canEdit && (
            <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>Editar</Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-[var(--muted)] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${progress}%`,
                background: STATUS_TINT[status] ?? "var(--primary)",
              }}
            />
          </div>
          <span className="text-[11px] tabular-nums text-[var(--muted-foreground)] w-8 text-right">{progress}%</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[10px] border border-[var(--separator)] p-3 space-y-2 bg-[var(--accent)]/40">
      <p className="text-[13px] font-semibold">{PHASE_LABELS[phase] ?? phase}</p>
      <div className="grid grid-cols-2 gap-2">
        <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
        <Select value={st} onValueChange={(v: string | null) => setSt(v ?? status)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="PENDING">Pendente</SelectItem>
            <SelectItem value="IN_PROGRESS">Em Curso</SelectItem>
            <SelectItem value="SUBMITTED">Entregue</SelectItem>
            <SelectItem value="APPROVED">Aprovado</SelectItem>
            <SelectItem value="REJECTED">Rejeitado</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-medium">Progresso</label>
          <span className="text-[11px] tabular-nums">{prog}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={prog}
          onChange={(e) => setProg(Number(e.target.value))}
          className="w-full accent-[var(--primary)]"
        />
      </div>
      <div className="flex gap-2 justify-end">
        <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancelar</Button>
        <Button size="sm" onClick={save} disabled={loading}>
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Guardar"}
        </Button>
      </div>
    </div>
  );
}
