"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, UserCog, Save, X } from "lucide-react";
import { toast } from "sonner";

interface Teacher {
  id: string;
  name: string;
}

interface Props {
  papId: string;
  currentAdvisorId: string | null;
  currentAdvisorName: string | null;
  teachers: Teacher[];
  canEdit: boolean;
}

export function AdvisorPicker({ papId, currentAdvisorId, currentAdvisorName, teachers, canEdit }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState(currentAdvisorId ?? "");
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!selected) {
      toast.error("Seleciona um orientador.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/pap/${papId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ advisorId: selected }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(typeof data.error === "string" ? data.error : "Erro ao atribuir orientador");
        return;
      }
      toast.success("Orientador atribuído");
      setEditing(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        {currentAdvisorName ? (
          <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
            <UserCog className="h-3 w-3" /> Orientador: <span className="font-medium text-foreground">{currentAdvisorName}</span>
          </span>
        ) : (
          <span className="text-xs text-muted-foreground italic">Sem orientador atribuído.</span>
        )}
        {canEdit && (
          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setEditing(true)}>
            {currentAdvisorId ? "Mudar" : "Atribuir"}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Select
        value={selected}
        items={Object.fromEntries(teachers.map((t) => [t.id, t.name]))}
        onValueChange={(v: string | null) => setSelected(v ?? "")}
      >
        <SelectTrigger className="h-8 w-[240px]"><SelectValue placeholder="Selecionar professor..." /></SelectTrigger>
        <SelectContent>
          {teachers.map((t) => (
            <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button size="sm" onClick={save} disabled={busy || !selected}>
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1.5 h-3.5 w-3.5" />}
        Guardar
      </Button>
      <Button size="sm" variant="ghost" onClick={() => { setSelected(currentAdvisorId ?? ""); setEditing(false); }} disabled={busy}>
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
