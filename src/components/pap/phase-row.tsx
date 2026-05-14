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

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-gray-100 text-gray-600",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  SUBMITTED: "bg-purple-100 text-purple-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
};

interface Props {
  id: string;
  phase: string;
  dueDate: Date | string | null;
  submittedAt: Date | string | null;
  status: string;
  canEdit: boolean;
}

export function PhaseRow({ id, phase, dueDate, submittedAt, status, canEdit }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [st, setSt] = useState(status);
  const [due, setDue] = useState(dueDate ? format(new Date(dueDate), "yyyy-MM-dd") : "");
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
      <div className="flex items-center gap-3 rounded border p-3">
        <div className="flex-1">
          <p className="text-sm font-medium">{PHASE_LABELS[phase] ?? phase}</p>
          {dueDate && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <Calendar className="h-3 w-3" />
              Prazo: {format(new Date(dueDate), "d MMM yyyy", { locale: pt })}
            </p>
          )}
          {submittedAt && (
            <p className="text-xs text-green-600 mt-0.5">
              Entregue: {format(new Date(submittedAt), "d MMM yyyy", { locale: pt })}
            </p>
          )}
        </div>
        <Badge className={STATUS_COLORS[status]}>{status}</Badge>
        {canEdit && (
          <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>Editar</Button>
        )}
      </div>
    );
  }

  return (
    <div className="rounded border p-3 space-y-2 bg-blue-50/30">
      <p className="text-sm font-medium">{PHASE_LABELS[phase] ?? phase}</p>
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
      <div className="flex gap-2 justify-end">
        <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancelar</Button>
        <Button size="sm" onClick={save} disabled={loading}>
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Guardar"}
        </Button>
      </div>
    </div>
  );
}
