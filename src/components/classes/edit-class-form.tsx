"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";

interface Props {
  cls: {
    id: string;
    name: string;
    year: number;
    classDirectorId: string | null;
    academicYearId: string;
  };
  directors: { id: string; name: string }[];
  years: { id: string; label: string }[];
}

export function EditClassForm({ cls, directors, years }: Props) {
  const router = useRouter();
  const [name, setName] = useState(cls.name);
  const [year, setYear] = useState(cls.year.toString());
  const [directorId, setDirectorId] = useState(cls.classDirectorId ?? "");
  const [yearId, setYearId] = useState(cls.academicYearId);
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    try {
      const res = await fetch(`/api/classes/${cls.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          year: parseInt(year),
          classDirectorId: directorId || null,
          academicYearId: yearId,
        }),
      });
      if (!res.ok) {
        toast.error("Erro ao guardar");
        return;
      }
      toast.success("Turma actualizada");
      router.push(`/dashboard/classes/${cls.id}`);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function del() {
    if (!confirm("Apagar esta turma? Só é possível se não tiver alunos nem aulas.")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/classes/${cls.id}`, { method: "DELETE" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        toast.error(j.error || "Erro ao apagar");
        return;
      }
      toast.success("Turma apagada");
      router.push("/dashboard/classes");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div>
          <Label htmlFor="cl-name">Nome</Label>
          <Input id="cl-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="cl-year">Ano (1=10º, 2=11º, 3=12º)</Label>
            <Input id="cl-year" type="number" min="1" max="3" value={year} onChange={(e) => setYear(e.target.value)} />
          </div>
          <div>
            <Label>Ano Letivo</Label>
            <Select value={yearId} onValueChange={(v: string | null) => setYearId(v ?? "")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y.id} value={y.id}>{y.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label>Diretor de Turma</Label>
          <Select value={directorId} onValueChange={(v: string | null) => setDirectorId(v ?? "")}>
            <SelectTrigger><SelectValue placeholder="Sem diretor" /></SelectTrigger>
            <SelectContent>
              {directors.map((d) => (
                <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex justify-between pt-2">
          <Button variant="outline" onClick={del} disabled={loading} className="text-red-600 border-red-200 hover:bg-red-50">
            <Trash2 className="mr-2 h-3.5 w-3.5" />Apagar turma
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.back()}>Cancelar</Button>
            <Button onClick={save} disabled={loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />A guardar...</> : "Guardar"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
