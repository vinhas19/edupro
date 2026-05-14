"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send } from "lucide-react";
import { Role } from "@prisma/client";

type ClassItem = { id: string; name: string; course: { name: string } };
type UserItem = { id: string; name: string | null; role: Role };

const ROLE_LABELS: Partial<Record<Role, string>> = {
  STUDENT: "Alunos",
  TEACHER: "Professores",
  CLASS_DIRECTOR: "Diretores de Turma",
  COURSE_DIRECTOR: "Diretores de Curso",
  SCHOOL_ADMIN: "Administradores",
};

export function NewNotificationForm({
  senderId,
  classes,
  users,
}: {
  senderId: string;
  classes: ClassItem[];
  users: UserItem[];
}) {
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const [type, setType] = useState("INFO");
  const [recipientType, setRecipientType] = useState("ALL_SCHOOL");
  const [classId, setClassId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error("Preencha o título e o conteúdo");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, type, recipientType, classId: classId || null }),
      });
      if (!res.ok) throw new Error();
      toast.success("Aviso enviado com sucesso");
      router.push("/dashboard/notifications");
      router.refresh();
    } catch {
      toast.error("Erro ao enviar aviso");
    } finally {
      setSending(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Tipo de aviso</Label>
              <Select value={type} onValueChange={(v) => v && setType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INFO">Informação</SelectItem>
                  <SelectItem value="WARNING">Aviso</SelectItem>
                  <SelectItem value="ALERT">Alerta</SelectItem>
                  <SelectItem value="DEADLINE">Prazo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Destinatários</Label>
              <Select value={recipientType} onValueChange={(v) => v && setRecipientType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL_SCHOOL">Toda a escola</SelectItem>
                  <SelectItem value="ALL_STUDENTS">Todos os alunos</SelectItem>
                  <SelectItem value="ALL_TEACHERS">Todos os professores</SelectItem>
                  <SelectItem value="CLASS_STUDENTS">Alunos de uma turma</SelectItem>
                  <SelectItem value="CLASS_TEACHERS">Professores de uma turma</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {(recipientType === "CLASS_STUDENTS" || recipientType === "CLASS_TEACHERS") && (
            <div className="space-y-1.5">
              <Label>Turma</Label>
              <Select value={classId} onValueChange={(v) => setClassId(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar turma..." />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} — {c.course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Título</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título do aviso..."
              maxLength={200}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Conteúdo</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escreva a mensagem..."
              rows={5}
              maxLength={2000}
            />
            <p className="text-xs text-muted-foreground text-right">{content.length}/2000</p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={sending} className="gap-2">
              <Send className="h-4 w-4" />
              {sending ? "A enviar..." : "Enviar Aviso"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
