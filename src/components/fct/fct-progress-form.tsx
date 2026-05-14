"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface Props {
  id: string;
  completedHours: number;
  requiredHours: number;
  status: string;
  grade: number | null;
  notes: string | null;
}

export function FctProgressForm({ id, completedHours, requiredHours, status, grade, notes }: Props) {
  const router = useRouter();
  const [hours, setHours] = useState(completedHours.toString());
  const [st, setSt] = useState(status);
  const [g, setG] = useState(grade?.toString() ?? "");
  const [n, setN] = useState(notes ?? "");
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    try {
      const res = await fetch(`/api/fct/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          completedHours: parseInt(hours) || 0,
          status: st,
          grade: g ? parseFloat(g) : null,
          notes: n || null,
        }),
      });
      if (!res.ok) {
        toast.error("Erro ao guardar");
        return;
      }
      toast.success("Actualizado");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Actualizar Progresso</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="fct-hours">Horas concluídas (de {requiredHours})</Label>
            <Input id="fct-hours" type="number" min="0" max={requiredHours} value={hours} onChange={(e) => setHours(e.target.value)} />
          </div>
          <div>
            <Label>Estado</Label>
            <Select value={st} onValueChange={(v: string | null) => setSt(v ?? status)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="PLANNED">Planeado</SelectItem>
                <SelectItem value="ONGOING">Em Curso</SelectItem>
                <SelectItem value="COMPLETED">Concluído</SelectItem>
                <SelectItem value="CANCELLED">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="fct-grade">Nota Final (0-20, opcional)</Label>
          <Input id="fct-grade" type="number" min="0" max="20" step="0.5" value={g} onChange={(e) => setG(e.target.value)} />
        </div>

        <div>
          <Label htmlFor="fct-notes">Observações</Label>
          <Textarea id="fct-notes" rows={3} value={n} onChange={(e) => setN(e.target.value)} />
        </div>

        <Button onClick={save} disabled={loading}>
          {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />A guardar...</> : "Guardar"}
        </Button>
      </CardContent>
    </Card>
  );
}
