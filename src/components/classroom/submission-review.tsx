"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { AttachmentChip } from "@/components/files/attachment-chip";

interface Submission {
  id: string;
  status: string;
  submittedAt: Date | string | null;
  grade: number | null;
  feedback: string | null;
  student: { id: string; name: string };
  files: { id: string; name: string; url: string }[];
}

export function SubmissionReview({ submission, maxGrade }: { submission: Submission; maxGrade: number | null }) {
  const router = useRouter();
  const [grade, setGrade] = useState<string>(submission.grade?.toString() ?? "");
  const [feedback, setFeedback] = useState(submission.feedback ?? "");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    try {
      const res = await fetch(`/api/classroom/submissions/${submission.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grade: grade ? parseFloat(grade) : undefined,
          feedback: feedback || undefined,
          privateComment: comment.trim() || undefined,
          status: grade ? "GRADED" : "RETURNED",
        }),
      });
      if (!res.ok) {
        toast.error("Erro ao guardar");
        return;
      }
      toast.success("Avaliação guardada");
      setComment("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardContent className="pt-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">{submission.student.name}</p>
            {submission.submittedAt ? (
              <p className="text-xs text-muted-foreground">
                Entregue em {format(new Date(submission.submittedAt), "d MMM yyyy, HH:mm", { locale: pt })}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">Não entregue</p>
            )}
          </div>
          <Badge
            className={
              submission.status === "GRADED" ? "bg-green-100 text-green-700" :
              submission.status === "SUBMITTED" ? "bg-blue-100 text-blue-700" :
              submission.status === "LATE" ? "bg-orange-100 text-orange-700" :
              submission.status === "RETURNED" ? "bg-purple-100 text-purple-700" :
              "bg-gray-100 text-gray-600"
            }
          >
            {submission.status === "NOT_SUBMITTED" ? "Por entregar" :
             submission.status === "SUBMITTED" ? "Entregue" :
             submission.status === "LATE" ? "Atrasado" :
             submission.status === "GRADED" ? "Avaliado" : "Devolvido"}
          </Badge>
        </div>

        {submission.files.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {submission.files.map((f) => (
              <AttachmentChip key={f.id} name={f.name} url={f.url} />
            ))}
          </div>
        )}

        {(submission.status === "SUBMITTED" || submission.status === "LATE" || submission.status === "GRADED") && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Nota {maxGrade ? `(/${maxGrade})` : "(0-20)"}</label>
              <Input
                type="number"
                step="0.5"
                min={0}
                max={maxGrade ?? 20}
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                placeholder="—"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Feedback público</label>
              <Input
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Comentário visível ao aluno"
              />
            </div>
          </div>
        )}

        <div>
          <label className="text-xs font-medium text-muted-foreground">Comentário privado (opcional)</label>
          <Textarea
            rows={2}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Mensagem privada apenas para este aluno"
          />
        </div>

        <Button onClick={save} disabled={loading} size="sm">
          {loading ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />A guardar...</> : "Guardar avaliação"}
        </Button>
      </CardContent>
    </Card>
  );
}
