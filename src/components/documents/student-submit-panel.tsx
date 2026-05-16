"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { R2UploadButton } from "@/components/files/r2-upload-button";
import { Loader2, CheckCircle2, AlertTriangle, FileText, Eye, Download } from "lucide-react";
import { toast } from "sonner";
import { downloadFile } from "@/lib/download-file";

interface Existing {
  id: string;
  status: string;
  submittedAt: Date | string | null;
  grade: number | null;
  feedback: string | null;
  files: { id: string; name: string; url: string }[];
}

interface Props {
  postId: string;
  isOverdue: boolean;
  allowLate: boolean;
  existing: Existing | null;
}

export function StudentSubmitPanel({ postId, isOverdue, allowLate, existing }: Props) {
  const router = useRouter();
  const [comment, setComment] = useState("");
  const [pendingFileIds, setPendingFileIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const blockedLate = isOverdue && !allowLate;
  const alreadyGraded = existing?.status === "GRADED";

  async function submit() {
    if (pendingFileIds.length === 0 && !comment.trim()) {
      toast.error("Adiciona pelo menos um ficheiro ou um comentário.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/classroom/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          fileIds: pendingFileIds,
          comment: comment.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(typeof data.error === "string" ? data.error : "Erro ao entregar");
        return;
      }
      toast.success(isOverdue ? "Entregue (atrasada)" : "Entregue");
      setComment("");
      setPendingFileIds([]);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h3 className="text-[15px] font-semibold">A tua entrega</h3>
          {existing && (
            <Badge
              variant="outline"
              style={{
                color:
                  existing.status === "GRADED" ? "var(--tint-green)"
                  : existing.status === "LATE" ? "var(--tint-orange)"
                  : existing.status === "SUBMITTED" ? "var(--tint-blue)"
                  : "var(--muted-foreground)",
              }}
            >
              {existing.status === "GRADED" ? `Avaliada · ${existing.grade?.toFixed(1) ?? "-"} valores`
                : existing.status === "SUBMITTED" ? "Entregue"
                : existing.status === "LATE" ? "Entregue (atrasada)"
                : "Por entregar"}
            </Badge>
          )}
        </div>

        {existing && existing.files.length > 0 && (
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--muted-foreground)]">
              Ficheiros entregues
            </p>
            <ul className="space-y-1">
              {existing.files.map((f) => (
                <li key={f.id} className="flex items-center gap-2 text-[13px]">
                  <FileText className="h-3.5 w-3.5 text-[var(--muted-foreground)] shrink-0" />
                  <span className="truncate flex-1">{f.name}</span>
                  <a
                    href={f.url}
                    target="_blank"
                    rel="noreferrer"
                    title="Visualizar"
                    className="inline-flex h-6 w-6 items-center justify-center rounded hover:bg-[var(--muted)]"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </a>
                  <button
                    type="button"
                    title="Transferir"
                    onClick={() => downloadFile(f.url, f.name)}
                    className="inline-flex h-6 w-6 items-center justify-center rounded hover:bg-[var(--muted)]"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {alreadyGraded && existing?.feedback && (
          <div className="rounded-[8px] bg-[var(--accent)] p-3 space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--accent-foreground)]">
              Feedback do professor
            </p>
            <p className="text-[13px] whitespace-pre-wrap">{existing.feedback}</p>
          </div>
        )}

        {blockedLate ? (
          <div className="rounded-[8px] p-3 text-[13px] flex items-start gap-2"
               style={{ background: "rgba(255,59,48,0.08)", color: "var(--destructive)" }}>
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>O prazo passou e esta tarefa não permite entregas atrasadas.</span>
          </div>
        ) : (
          <>
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--muted-foreground)]">
                {existing && existing.files.length > 0 ? "Substituir/adicionar ficheiros" : "Anexar ficheiros"}
              </p>
              <R2UploadButton
                visibility="SUBMISSION"
                size="sm"
                variant="outline"
                label="Adicionar ficheiro"
                autoRefresh={false}
                onUploaded={(files) => setPendingFileIds((prev) => [...prev, ...files.map((f) => f.id)])}
              />
              {pendingFileIds.length > 0 && (
                <p className="text-[11px] text-[var(--tint-green)]">
                  {pendingFileIds.length} ficheiro(s) prontos para entregar
                </p>
              )}
            </div>

            <Textarea
              placeholder="Comentário privado para o professor (opcional)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />

            <div className="flex justify-between items-center gap-2 flex-wrap">
              {isOverdue && allowLate && (
                <span className="text-[12px] text-[var(--tint-orange)] flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Prazo expirado — a entrega será marcada como atrasada
                </span>
              )}
              <Button onClick={submit} disabled={busy} className="ml-auto">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                  <><CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />Entregar</>
                )}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
