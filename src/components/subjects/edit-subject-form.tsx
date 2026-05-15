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
import { Loader2, Plus, Trash2, X } from "lucide-react";

interface ModuleItem {
  id?: string;
  name: string;
  number: string;
  hours: string;
  description?: string;
}

interface Props {
  subject: {
    id: string;
    name: string;
    code: string | null;
    component: string;
    totalHours: number;
    courseId: string;
    course: { name: string; code: string };
    modules: { id: string; name: string; number: number; hours: number; description: string | null }[];
  };
}

export function EditSubjectForm({ subject }: Props) {
  const router = useRouter();
  const [name, setName] = useState(subject.name);
  const [code, setCode] = useState(subject.code ?? "");
  const [component, setComponent] = useState(subject.component);
  const [totalHours, setTotalHours] = useState(String(subject.totalHours));
  const [modules, setModules] = useState<ModuleItem[]>(
    subject.modules.map((m) => ({
      id: m.id,
      name: m.name,
      number: String(m.number),
      hours: String(m.hours),
      description: m.description ?? "",
    })),
  );
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function addModule() {
    setModules([...modules, { name: "", number: String(modules.length + 1), hours: "" }]);
  }
  function removeModule(i: number) {
    setModules(modules.filter((_, idx) => idx !== i));
  }
  function updateModule(i: number, field: keyof ModuleItem, value: string) {
    setModules(modules.map((m, idx) => (idx === i ? { ...m, [field]: value } : m)));
  }

  async function save() {
    if (!name.trim() || !totalHours) {
      toast.error("Preencha nome e horas totais");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/subjects/${subject.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          code: code.trim() || null,
          component,
          totalHours: parseInt(totalHours),
          modules: modules
            .filter((m) => m.name.trim() && m.hours)
            .map((m) => ({
              id: m.id,
              name: m.name.trim(),
              number: parseInt(m.number) || 1,
              hours: parseInt(m.hours),
              description: m.description?.trim() || null,
            })),
        }),
      });
      if (!res.ok) {
        toast.error("Erro ao guardar disciplina");
        return;
      }
      toast.success("Disciplina atualizada");
      router.push("/dashboard/subjects");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!confirm(`Apagar a disciplina "${subject.name}"? Esta ação não pode ser revertida.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/subjects/${subject.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(typeof data.error === "string" ? data.error : "Não foi possível apagar");
        return;
      }
      toast.success("Disciplina apagada");
      router.push("/dashboard/subjects");
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="space-y-1.5">
          <Label className="text-[12px] font-medium">Curso</Label>
          <p className="text-[13px]">{subject.course.name} ({subject.course.code})</p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2 space-y-2">
            <Label htmlFor="edit-name">Nome</Label>
            <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-code">Código</Label>
            <Input id="edit-code" value={code} onChange={(e) => setCode(e.target.value)} />
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
            <Label htmlFor="edit-hours">Carga horária total</Label>
            <Input id="edit-hours" type="number" value={totalHours} onChange={(e) => setTotalHours(e.target.value)} />
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t">
          <div className="flex items-center justify-between">
            <Label>Módulos</Label>
            <Button type="button" variant="outline" size="sm" onClick={addModule}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />Adicionar
            </Button>
          </div>
          {modules.length === 0 ? (
            <p className="text-xs text-muted-foreground">Sem módulos definidos.</p>
          ) : (
            <div className="space-y-1.5">
              {modules.map((m, i) => (
                <div key={m.id ?? `new-${i}`} className="grid grid-cols-[60px_1fr_80px_auto] gap-2 items-center">
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

        <div className="flex justify-between gap-2 pt-2 border-t">
          <Button variant="outline" onClick={remove} disabled={deleting || saving} className="text-[var(--destructive)] hover:text-[var(--destructive)]">
            {deleting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />A apagar...</> : <><Trash2 className="mr-1.5 h-3.5 w-3.5" />Apagar</>}
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.back()}>Cancelar</Button>
            <Button onClick={save} disabled={saving || deleting}>
              {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />A guardar...</> : "Guardar"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
