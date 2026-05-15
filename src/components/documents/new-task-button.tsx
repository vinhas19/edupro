"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ClipboardCheck, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  classId: string;
  subjectId: string;
  moduleId: string;
}

export function NewTaskButton({ classId, subjectId, moduleId }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [maxGrade, setMaxGrade] = useState("20");
  const [countsForModule, setCountsForModule] = useState(true);
  const [allowLate, setAllowLate] = useState(true);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!title.trim()) {
      toast.error("Indica um título para a tarefa.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/classroom/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId,
          subjectId,
          moduleId,
          type: "ASSIGNMENT",
          title: title.trim(),
          content: content.trim() || undefined,
          dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
          maxGrade: maxGrade ? parseFloat(maxGrade) : undefined,
          countsForModule,
          allowLate,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(typeof data.error === "string" ? data.error : "Erro ao criar tarefa");
        return;
      }
      toast.success("Tarefa criada");
      setOpen(false);
      setTitle(""); setContent(""); setDueDate(""); setMaxGrade("20");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <ClipboardCheck className="mr-1.5 h-3.5 w-3.5" />Nova tarefa
      </Button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setOpen(false)}>
          <div
            className="w-full max-w-lg rounded-[12px] bg-[var(--card)] shadow-[var(--card-shadow)] p-5 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-[16px] font-semibold tracking-[-0.012em]">Nova tarefa</h3>
              <button onClick={() => setOpen(false)} aria-label="Fechar" className="h-7 w-7 rounded-[6px] hover:bg-[var(--muted)] flex items-center justify-center">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="task-title">Título</Label>
              <Input
                id="task-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="ex: Trabalho de pesquisa M2"
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="task-content">Instruções</Label>
              <Textarea
                id="task-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                placeholder="O que o aluno deve fazer, formato de entrega, critérios..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="task-due">Data de entrega</Label>
                <Input
                  id="task-due"
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="task-max">Nota máxima</Label>
                <Input
                  id="task-max"
                  type="number"
                  step="0.5"
                  value={maxGrade}
                  onChange={(e) => setMaxGrade(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-[var(--separator)]">
              <label className="flex items-center gap-2 text-[13px]">
                <input
                  type="checkbox"
                  checked={countsForModule}
                  onChange={(e) => setCountsForModule(e.target.checked)}
                />
                <span>Contar a nota para a avaliação do módulo</span>
              </label>
              <label className="flex items-center gap-2 text-[13px]">
                <input
                  type="checkbox"
                  checked={allowLate}
                  onChange={(e) => setAllowLate(e.target.checked)}
                />
                <span>Permitir entregas após o prazo (marca como "Atrasada")</span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={submit} disabled={busy}>
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Criar tarefa"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
