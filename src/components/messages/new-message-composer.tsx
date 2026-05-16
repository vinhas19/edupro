"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import Link from "next/link";
import { Role } from "@prisma/client";
import { ROLE_LABELS } from "@/lib/permissions";
import { toast } from "sonner";

interface Props {
  recipient: { id: string; name: string; email: string; role: Role };
}

export function NewMessageComposer({ recipient }: Props) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);

  async function send() {
    if (!content.trim()) {
      toast.error("Escreve algo primeiro.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId: recipient.id, content: content.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(typeof data.error === "string" ? data.error : "Erro ao enviar.");
        return;
      }
      toast.success("Mensagem enviada");
      router.push(`/dashboard/messages/${data.conversationId}`);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/messages"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold">Nova mensagem</h1>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-sm shrink-0">
              {recipient.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold">{recipient.name}</p>
              <p className="text-[11px] text-muted-foreground font-normal">
                {ROLE_LABELS[recipient.role]} · {recipient.email}
              </p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
            placeholder="Escreve a tua mensagem..."
            disabled={busy}
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => router.back()} disabled={busy}>Cancelar</Button>
            <Button onClick={send} disabled={busy || !content.trim()}>
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Enviar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
