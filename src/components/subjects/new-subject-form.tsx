"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Plus, X } from "lucide-react";

interface ModuleItem {
  name: string;
  number: string;
  hours: string;
}

interface Props {
  courses: { id: string; name: string; code: string }[];
  defaultCourseId?: string;
}

export function NewSubjectForm({ courses, defaultCourseId }: Props) {
  const router = useRouter();
  const [courseId, setCourseId] = useState(defaultCourseId ?? "");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [component, setComponent] = useState("TECHNICAL");
  const [totalHours, setTotalHours] = useState("");
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [loading, setLoading] = useState(false);

  function addModule() {
    setModules([...modules, { name: "", number: (modules.length + 1).toString(), hours: "" }]);
  }
  function removeModule(i: number) {
    setModules(modules.filter((_, idx) => idx !== i));
  }
  function updateModule(i: number, field: keyof ModuleItem, value: string) {
    setModules(modules.map((m, idx) => (idx === i ? { ...m, [field]: value } : m)));
  }

  async function submit() {
    if (!courseId || !name.trim() || !totalHours) {
      toast.error("Preencha curso, nome e horas totais");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          name: name.trim(),
          code: code.trim() || undefined,
          component,
          totalHours: parseInt(totalHours),
          modules: modules
            .filter((m) => m.name.trim() && m.hours)
            .map((m) => ({
              name: m.name.trim(),
              number: parseInt(m.number),
              hours: parseInt(m.hours),
            })),
        }),
      });
      if (!res.ok) {
        toast.error("Erro ao criar disciplina");
        return;
      }
      toast.success("Disciplina criada");
      router.push(`/dashboard/courses/${courseId}`);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="space-y-2">
          <Label>Curso</Label>
          <Select value={courseId} onValueChange={(v: string | null) => setCourseId(v ?? "")}>
            <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
            <SelectContent>
              {courses.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name} ({c.code})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2 space-y-2">
            <Label htmlFor="subj-name">Nome</Label>
            <Input id="subj-name" placeholder="ex: Português" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="subj-code">Código (opcional)</Label>
            <Input id="subj-code" placeholder="ex: PORT" value={code} onChange={(e) => setCode(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Componente de Formação</Label>
            <Select value={component} onValueChange={(v: string | null) => setComponent(v ?? "TECHNICAL")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="SOCIOCULTURAL">Sociocultural</SelectItem>
                <SelectItem value="SCIENTIFIC">Científica</SelectItem>
                <SelectItem value="TECHNICAL">Técnica/Tecnológica</SelectItem>
                <SelectItem value="FCT">FCT</SelectItem>
                <SelectItem value="PAP">PAP</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="subj-hours">Carga horária total</Label>
            <Input id="subj-hours" type="number" placeholder="ex: 320" value={totalHours} onChange={(e) => setTotalHours(e.target.value)} />
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t">
          <div className="flex items-center justify-between">
            <Label>Módulos (opcional)</Label>
            <Button type="button" variant="outline" size="sm" onClick={addModule}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />Adicionar
            </Button>
          </div>
          {modules.length === 0 ? (
            <p className="text-xs text-muted-foreground">Pode definir os módulos agora ou mais tarde.</p>
          ) : (
            <div className="space-y-1.5">
              {modules.map((m, i) => (
                <div key={i} className="grid grid-cols-[60px_1fr_80px_auto] gap-2 items-center">
                  <Input
                    placeholder="Nº"
                    value={m.number}
                    onChange={(e) => updateModule(i, "number", e.target.value)}
                  />
                  <Input
                    placeholder="Nome do módulo"
                    value={m.name}
                    onChange={(e) => updateModule(i, "name", e.target.value)}
                  />
                  <Input
                    placeholder="Horas"
                    type="number"
                    value={m.hours}
                    onChange={(e) => updateModule(i, "hours", e.target.value)}
                  />
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeModule(i)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              <Badge variant="outline" className="text-xs">
                Total módulos: {modules.reduce((s, m) => s + (parseInt(m.hours) || 0), 0)}h
              </Badge>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => router.back()}>Cancelar</Button>
          <Button onClick={submit} disabled={loading}>
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />A criar...</> : "Criar Disciplina"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
