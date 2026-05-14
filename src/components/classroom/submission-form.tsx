"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { R2UploadButton } from "@/components/files/r2-upload-button";
import { toast } from "sonner";
import { Loader2, Paperclip, X, CheckCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

interface ExistingFile {
  id: string;
  name: string;
  url: string;
}

interface Props {
  postId: string;
  dueDate: string | Date | null;
  status: string;
  submittedAt: string | Date | null;
  grade: number | null;
  feedback: string | null;
  existingFiles: ExistingFile[];
}

export function SubmissionForm({ postId, dueDate, status, submittedAt, grade, feedback, existingFiles }: Props) {
  const router = useRouter();
  const [attachments, setAttachments] = useState<ExistingFile[]>(existingFiles);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const submitted = ["SUBMITTED", "LATE", "GRADED", "RETURNED"].includes(status);
  const isLateNow = dueDate ? new Date() > new Date(dueDate) : false;

  async function submit() {
    setLoading(true);
    try {
      const res = await fetch("/api/classroom/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          fileIds: attachments.map((a) => a.id),
          comment: comment.trim() || undefined,
        }),
      });
      if (!res.ok) {
        toast.error("Erro ao entregar");
        return;
      }
      toast.success("Entrega registada!");
      setComment("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border p-4 space-y-3 bg-blue-50/30">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">A minha entrega</h3>
        {submitted ? (
          <Badge className="bg-green-100 text-green-700">
            <CheckCircle className="h-3 w-3 mr-1" />
            {status === "LATE" ? "Entregue (atrasado)" : status === "GRADED" ? "Avaliado" : status === "RETURNED" ? "Devolvido" : "Entregue"}
          </Badge>
        ) : isLateNow ? (
          <Badge className="bg-orange-100 text-orange-700"><Clock className="h-3 w-3 mr-1" />Atrasado</Badge>
        ) : (
          <Badge variant="outline">Não entregue</Badge>
        )}
      </div>

      {submittedAt && (
        <p className="text-xs text-muted-foreground">
          Entregue em {format(new Date(submittedAt), "d MMM yyyy, HH:mm", { locale: pt })}
        </p>
      )}

      {grade != null && (
        <div className="rounded bg-green-50 border border-green-200 p-3">
          <p className="text-xs text-muted-foreground">Nota</p>
          <p className="text-2xl font-bold text-green-700">{grade}/20</p>
          {feedback && <p className="text-sm mt-2 whitespace-pre-wrap">{feedback}</p>}
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <R2UploadButton
          visibility="SUBMISSION"
          size="sm"
          variant="outline"
          label="Anexar ficheiro"
          onUploaded={(items) => setAttachments((a) => [...a, ...items])}
        />
        {attachments.map((a) => (
          <a key={a.id} href={a.url} target="_blank" rel="noreferrer">
            <Badge variant="secondary" className="gap-1">
              <Paperclip className="h-3 w-3" />
              <span className="max-w-[160px] truncate">{a.name}</span>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setAttachments((items) => items.filter((x) => x.id !== a.id));
                }}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          </a>
        ))}
      </div>

      <Textarea
        rows={2}
        placeholder="Comentário privado para o professor (opcional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />

      <Button onClick={submit} disabled={loading} className="w-full">
        {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />A entregar...</> : submitted ? "Atualizar entrega" : "Entregar"}
      </Button>
    </div>
  );
}
