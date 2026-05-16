"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface Props {
  id: string;
  status: string;
  finalGrade: number | null;
}

export function PapStatusForm({ id, status, finalGrade }: Props) {
  const router = useRouter();
  const [st, setSt] = useState(status);
  const [grade, setGrade] = useState(finalGrade?.toString() ?? "");
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    try {
      const res = await fetch(`/api/pap/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: st,
          finalGrade: grade ? parseFloat(grade) : null,
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
        <CardTitle className="text-base">Estado da PAP</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Label>Estado</Label>
          <Select
            value={st}
            items={{
              PROPOSAL: "Proposta",
              DEVELOPMENT: "Desenvolvimento",
              SUBMITTED: "Entregue",
              PRESENTATION: "Apresentação",
              COMPLETED: "Concluído",
              FAILED: "Reprovado",
            }}
            onValueChange={(v: string | null) => setSt(v ?? status)}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="PROPOSAL">Proposta</SelectItem>
              <SelectItem value="DEVELOPMENT">Desenvolvimento</SelectItem>
              <SelectItem value="SUBMITTED">Entregue</SelectItem>
              <SelectItem value="PRESENTATION">Apresentação</SelectItem>
              <SelectItem value="COMPLETED">Concluído</SelectItem>
              <SelectItem value="FAILED">Reprovado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="pap-grade">Nota Final (0-20, opcional)</Label>
          <Input id="pap-grade" type="number" min="0" max="20" step="0.5" value={grade} onChange={(e) => setGrade(e.target.value)} />
        </div>
        <Button onClick={save} disabled={loading}>
          {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />A guardar...</> : "Guardar"}
        </Button>
      </CardContent>
    </Card>
  );
}
