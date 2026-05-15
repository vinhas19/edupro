"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, FileText } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { toast } from "sonner";

interface Submission {
  id: string;
  studentId: string;
  studentName: string;
  status: string;
  submittedAt: Date | string | null;
  grade: number | null;
  feedback: string | null;
  files: { id: string; name: string; url: string }[];
}

interface Props {
  postId: string;
  maxGrade: number;
  submissions: Submission[];
}

export function TeacherGradingPanel({ maxGrade, submissions }: Props) {
  const submitted = submissions.filter((s) => s.status !== "NOT_SUBMITTED");
  const pending = submissions.filter((s) => s.status === "NOT_SUBMITTED");

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h3 className="text-[15px] font-semibold">Submissões</h3>
          <div className="flex gap-1.5">
            <Badge variant="outline">{submitted.length} entregues</Badge>
            <Badge variant="outline" className="text-[var(--muted-foreground)]">{pending.length} por entregar</Badge>
          </div>
        </div>

        {submitted.length > 0 && (
          <div className="space-y-2">
            {submitted.map((s) => (
              <SubmissionCard key={s.id} submission={s} maxGrade={maxGrade} />
            ))}
          </div>
        )}

        {pending.length > 0 && (
          <details>
            <summary className="text-[12px] text-[var(--muted-foreground)] cursor-pointer">
              {pending.length} aluno{pending.length !== 1 ? "s" : ""} por entregar
            </summary>
            <ul className="mt-2 space-y-0.5">
              {pending.map((s) => (
                <li key={s.id} className="text-[13px] text-[var(--muted-foreground)]">
                  · {s.studentName}
                </li>
              ))}
            </ul>
          </details>
        )}
      </CardContent>
    </Card>
  );
}

function SubmissionCard({ submission, maxGrade }: { submission: Submission; maxGrade: number }) {
  const router = useRouter();
  const [grade, setGrade] = useState(submission.grade?.toString() ?? "");
  const [feedback, setFeedback] = useState(submission.feedback ?? "");
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      const num = grade === "" ? null : parseFloat(grade);
      if (num != null && (Number.isNaN(num) || num < 0 || num > maxGrade)) {
        toast.error(`Nota tem de estar entre 0 e ${maxGrade}.`);
        return;
      }
      const res = await fetch(`/api/classroom/submissions/${submission.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grade: num,
          feedback: feedback.trim() || undefined,
          status: num != null ? "GRADED" : "RETURNED",
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(typeof data.error === "string" ? data.error : "Erro ao guardar");
        return;
      }
      toast.success("Avaliação guardada");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-[10px] border border-[var(--separator)] p-3 space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <p className="text-[14px] font-semibold">{submission.studentName}</p>
          {submission.submittedAt && (
            <p className="text-[11px] text-[var(--muted-foreground)] tabular-nums">
              {format(submission.submittedAt, "d 'de' MMM yyyy, HH:mm", { locale: pt })}
            </p>
          )}
        </div>
        <Badge
          variant="outline"
          style={{
            color:
              submission.status === "GRADED" ? "var(--tint-green)"
              : submission.status === "LATE" ? "var(--tint-orange)"
              : "var(--tint-blue)",
          }}
        >
          {submission.status === "GRADED" ? "Avaliada" : submission.status === "LATE" ? "Atrasada" : "Entregue"}
        </Badge>
      </div>

      {submission.files.length > 0 && (
        <ul className="space-y-0.5">
          {submission.files.map((f) => (
            <li key={f.id} className="flex items-center gap-1.5 text-[12px]">
              <FileText className="h-3 w-3 text-[var(--muted-foreground)]" />
              <a href={f.url} target="_blank" rel="noreferrer" className="text-[var(--primary)] hover:underline truncate">
                {f.name}
              </a>
            </li>
          ))}
        </ul>
      )}

      <div className="grid grid-cols-[120px_1fr_auto] gap-2 items-end pt-1">
        <div className="space-y-1">
          <label className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--muted-foreground)]">
            Nota (0–{maxGrade})
          </label>
          <Input
            type="number"
            step="0.1"
            min={0}
            max={maxGrade}
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            className="h-9 tabular-nums"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--muted-foreground)]">
            Feedback
          </label>
          <Textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={2}
            placeholder="Comentário ao aluno (opcional)"
          />
        </div>
        <Button onClick={save} disabled={busy} size="sm">
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Save className="mr-1.5 h-3.5 w-3.5" />Guardar</>}
        </Button>
      </div>
    </div>
  );
}
