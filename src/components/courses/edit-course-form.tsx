"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";

interface Props {
  course: {
    id: string;
    name: string;
    code: string;
    formationArea: string;
    level: number;
    totalHours: number;
    description: string | null;
    directorId: string | null;
    active: boolean;
  };
  directors: { id: string; name: string }[];
}

export function EditCourseForm({ course, directors }: Props) {
  const router = useRouter();
  const [name, setName] = useState(course.name);
  const [code, setCode] = useState(course.code);
  const [formationArea, setFormationArea] = useState(course.formationArea);
  const [level, setLevel] = useState(course.level.toString());
  const [totalHours, setTotalHours] = useState(course.totalHours.toString());
  const [description, setDescription] = useState(course.description ?? "");
  const [directorId, setDirectorId] = useState(course.directorId ?? "");
  const [active, setActive] = useState(course.active);
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    try {
      const res = await fetch(`/api/courses/${course.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          code,
          formationArea,
          level: parseInt(level),
          totalHours: parseInt(totalHours),
          description: description || null,
          directorId: directorId || null,
          active,
        }),
      });
      if (!res.ok) {
        toast.error("Erro ao guardar");
        return;
      }
      toast.success("Curso actualizado");
      router.push(`/dashboard/courses/${course.id}`);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function softDelete() {
    if (!confirm(`Desactivar o curso "${course.name}"? As turmas existentes mantêm-se mas o curso deixa de aparecer nas listas.`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/courses/${course.id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Erro ao desactivar");
        return;
      }
      toast.success("Curso desactivado");
      router.push("/dashboard/courses");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div>
          <Label htmlFor="c-name">Nome</Label>
          <Input id="c-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="c-code">Código</Label>
            <Input id="c-code" value={code} onChange={(e) => setCode(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="c-area">Área de Formação</Label>
            <Input id="c-area" value={formationArea} onChange={(e) => setFormationArea(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="c-level">Nível</Label>
            <Input id="c-level" type="number" min="1" max="5" value={level} onChange={(e) => setLevel(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="c-hours">Horas totais</Label>
            <Input id="c-hours" type="number" value={totalHours} onChange={(e) => setTotalHours(e.target.value)} />
          </div>
        </div>
        <div>
          <Label>Diretor de Curso</Label>
          <Select
            value={directorId}
            items={Object.fromEntries(directors.map((d) => [d.id, d.name]))}
            onValueChange={(v: string | null) => setDirectorId(v ?? "")}
          >
            <SelectTrigger><SelectValue placeholder="Sem diretor" /></SelectTrigger>
            <SelectContent>
              {directors.map((d) => (
                <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="c-desc">Descrição</Label>
          <Textarea id="c-desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <p className="text-sm font-medium">Curso activo</p>
            <p className="text-xs text-muted-foreground">Desactive para esconder das listas</p>
          </div>
          <Switch checked={active} onCheckedChange={setActive} />
        </div>

        <div className="flex justify-between pt-2">
          <Button variant="outline" onClick={softDelete} disabled={loading} className="text-red-600 border-red-200 hover:bg-red-50">
            <Trash2 className="mr-2 h-3.5 w-3.5" />Desactivar curso
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
