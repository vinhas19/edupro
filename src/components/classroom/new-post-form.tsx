"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { R2UploadButton } from "@/components/files/r2-upload-button";
import { toast } from "sonner";
import { Loader2, Paperclip, X, Megaphone, BookOpen, ClipboardList, HelpCircle } from "lucide-react";

type PostType = "ANNOUNCEMENT" | "MATERIAL" | "ASSIGNMENT" | "QUESTION";

interface Props {
  classId: string;
  topics: { id: string; name: string }[];
  subjects: { id: string; name: string }[];
}

const TYPE_META = {
  ANNOUNCEMENT: { label: "Anúncio", icon: Megaphone, color: "bg-blue-100 text-blue-700" },
  MATERIAL: { label: "Material", icon: BookOpen, color: "bg-green-100 text-green-700" },
  ASSIGNMENT: { label: "Trabalho", icon: ClipboardList, color: "bg-orange-100 text-orange-700" },
  QUESTION: { label: "Pergunta", icon: HelpCircle, color: "bg-purple-100 text-purple-700" },
} as const;

export function NewPostForm({ classId, topics, subjects }: Props) {
  const router = useRouter();
  const [type, setType] = useState<PostType>("ANNOUNCEMENT");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [topicId, setTopicId] = useState<string>("");
  const [subjectId, setSubjectId] = useState<string>("");
  const [dueDate, setDueDate] = useState("");
  const [maxGrade, setMaxGrade] = useState("20");
  const [attachments, setAttachments] = useState<{ id: string; name: string; url: string }[]>([]);
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!content.trim() && !title.trim()) {
      toast.error("Adicione um título ou conteúdo");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/classroom/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId,
          type,
          title: title || undefined,
          content: content || undefined,
          topicId: topicId || undefined,
          subjectId: subjectId || undefined,
          dueDate: type === "ASSIGNMENT" && dueDate ? new Date(dueDate).toISOString() : undefined,
          maxGrade: type === "ASSIGNMENT" ? parseFloat(maxGrade) : undefined,
          attachmentIds: attachments.map((a) => a.id),
        }),
      });
      if (!res.ok) {
        toast.error("Erro ao publicar");
        return;
      }
      toast.success("Publicado!");
      router.refresh();
      setTitle("");
      setContent("");
      setAttachments([]);
      setDueDate("");
    } finally {
      setLoading(false);
    }
  }

  const TypeIcon = TYPE_META[type].icon;

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(TYPE_META) as PostType[]).map((t) => {
            const M = TYPE_META[t];
            const Icon = M.icon;
            return (
              <Button
                key={t}
                type="button"
                variant={type === t ? "default" : "outline"}
                size="sm"
                onClick={() => setType(t)}
              >
                <Icon className="mr-1.5 h-3.5 w-3.5" />
                {M.label}
              </Button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <Badge className={TYPE_META[type].color}><TypeIcon className="mr-1 h-3 w-3" />{TYPE_META[type].label}</Badge>
        </div>

        {(type === "ASSIGNMENT" || type === "MATERIAL" || type === "QUESTION") && (
          <div>
            <Label htmlFor="post-title">Título</Label>
            <Input
              id="post-title"
              placeholder={type === "ASSIGNMENT" ? "Título do trabalho" : type === "QUESTION" ? "A sua pergunta" : "Título do material"}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
        )}

        <div>
          <Label htmlFor="post-content">{type === "ANNOUNCEMENT" ? "Anúncio" : "Descrição"}</Label>
          <Textarea
            id="post-content"
            rows={3}
            placeholder={
              type === "ANNOUNCEMENT"
                ? "Partilhe algo com a turma..."
                : type === "ASSIGNMENT"
                ? "Instruções do trabalho..."
                : "Descrição..."
            }
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>

        {type === "ASSIGNMENT" && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="post-due">Prazo</Label>
              <Input
                id="post-due"
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="post-max">Nota máxima</Label>
              <Input
                id="post-max"
                type="number"
                step="0.5"
                value={maxGrade}
                onChange={(e) => setMaxGrade(e.target.value)}
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {topics.length > 0 && (
            <div>
              <Label>Tópico</Label>
              <Select value={topicId} onValueChange={(v: string | null) => setTopicId(v ?? "")}>
                <SelectTrigger><SelectValue placeholder="Sem tópico" /></SelectTrigger>
                <SelectContent>
                  {topics.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {subjects.length > 0 && (
            <div>
              <Label>Disciplina (opcional)</Label>
              <Select value={subjectId} onValueChange={(v: string | null) => setSubjectId(v ?? "")}>
                <SelectTrigger><SelectValue placeholder="Sem disciplina" /></SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t pt-4">
          <div className="flex items-center gap-2 flex-wrap">
            <R2UploadButton
              visibility="POST_ATTACHMENT"
              size="sm"
              variant="outline"
              label="Anexar"
              onUploaded={(items) => setAttachments((a) => [...a, ...items])}
            />
            {attachments.map((a) => (
              <Badge key={a.id} variant="secondary" className="gap-1">
                <Paperclip className="h-3 w-3" />
                <span className="max-w-[160px] truncate">{a.name}</span>
                <button onClick={() => setAttachments((items) => items.filter((x) => x.id !== a.id))}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <Button onClick={submit} disabled={loading}>
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />A publicar...</> : "Publicar"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
