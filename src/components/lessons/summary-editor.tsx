"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil, Loader2, X, Save } from "lucide-react";
import { toast } from "sonner";

interface Props {
  lessonId: string;
  initialSummary: string | null;
  initialLessonNumber: number | null;
  canEdit: boolean;
}

export function SummaryEditor({ lessonId, initialSummary, initialLessonNumber, canEdit }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [summary, setSummary] = useState(initialSummary ?? "");
  const [lessonNumber, setLessonNumber] = useState(initialLessonNumber?.toString() ?? "");
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      const res = await fetch(`/api/lessons/${lessonId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summary: summary.trim(),
          lessonNumber: lessonNumber ? parseInt(lessonNumber) : null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(typeof data.error === "string" ? data.error : "Erro ao guardar sumário");
        return;
      }
      toast.success("Sumário guardado");
      setEditing(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  function cancel() {
    setSummary(initialSummary ?? "");
    setLessonNumber(initialLessonNumber?.toString() ?? "");
    setEditing(false);
  }

  if (!editing) {
    return (
      <div className="space-y-3">
        {initialSummary ? (
          <p className="text-sm whitespace-pre-wrap">{initialSummary}</p>
        ) : (
          <p className="text-sm text-muted-foreground italic">Sem sumário registado.</p>
        )}
        {canEdit && (
          <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
            <Pencil className="mr-1.5 h-3.5 w-3.5" />
            {initialSummary ? "Editar sumário" : "Registar sumário"}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[1fr_120px] gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="lesson-summary" className="text-xs">Sumário</Label>
          <Textarea
            id="lesson-summary"
            rows={5}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Descreva os conteúdos lecionados..."
            disabled={busy}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lesson-number" className="text-xs">Nº da aula</Label>
          <Input
            id="lesson-number"
            type="number"
            min="1"
            value={lessonNumber}
            onChange={(e) => setLessonNumber(e.target.value)}
            placeholder="ex: 42"
            disabled={busy}
          />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="ghost" onClick={cancel} disabled={busy}>
          <X className="mr-1.5 h-3.5 w-3.5" />Cancelar
        </Button>
        <Button size="sm" onClick={save} disabled={busy}>
          {busy ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1.5 h-3.5 w-3.5" />}
          Guardar
        </Button>
      </div>
    </div>
  );
}
