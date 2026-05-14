"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, UserX } from "lucide-react";

interface Props {
  teachers: { id: string; name: string }[];
}

export function AbsenceForm({ teachers }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [teacherId, setTeacherId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("17:20");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!teacherId) {
      toast.error("Selecione um professor");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/absences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherId, date, startTime, endTime, reason: reason || undefined }),
      });
      if (!res.ok) {
        toast.error("Erro ao registar ausência");
        return;
      }
      const j = await res.json();
      toast.success(`Ausência registada — ${j.affectedClasses} aula(s) afectada(s)`);
      setOpen(false);
      setTeacherId("");
      setReason("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>
        <UserX className="mr-2 h-4 w-4" />Marcar Ausência
      </Button>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="space-y-2">
          <Label>Professor ausente</Label>
          <Select value={teacherId} onValueChange={(v: string | null) => setTeacherId(v ?? "")}>
            <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
            <SelectContent>
              {teachers.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-2">
            <Label htmlFor="abs-date">Data</Label>
            <Input id="abs-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="abs-start">Início</Label>
            <Input id="abs-start" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="abs-end">Fim</Label>
            <Input id="abs-end" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="abs-reason">Motivo (opcional)</Label>
          <Textarea id="abs-reason" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={loading || !teacherId}>
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />A registar...</> : "Registar ausência"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
