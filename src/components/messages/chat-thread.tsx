"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Send, Loader2 } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { pt } from "date-fns/locale";

interface Msg {
  id: string;
  content: string;
  createdAt: string | Date;
  readAt: string | Date | null;
  sender: { id: string; name: string; image: string | null };
}

interface Props {
  conversationId: string;
  recipientId: string;
  currentUserId: string;
  initialMessages: Msg[];
}

function dateLabel(d: Date) {
  if (isToday(d)) return "Hoje";
  if (isYesterday(d)) return "Ontem";
  return format(d, "d 'de' MMMM yyyy", { locale: pt });
}

export function ChatThread({ conversationId, recipientId, currentUserId, initialMessages }: Props) {
  const router = useRouter();
  const [messages, setMessages] = useState<Msg[]>(initialMessages);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Mark as read on mount
  useEffect(() => {
    fetch("/api/messages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId }),
    }).then(() => router.refresh());
  }, [conversationId, router]);

  // Polling every 5s for new messages
  useEffect(() => {
    const t = setInterval(async () => {
      const res = await fetch(`/api/messages/${conversationId}`);
      if (!res.ok) return;
      const fresh: Msg[] = await res.json();
      setMessages(fresh);
    }, 5000);
    return () => clearInterval(t);
  }, [conversationId]);

  async function send() {
    if (!content.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId, content: content.trim() }),
      });
      if (!res.ok) {
        toast.error("Erro ao enviar");
        return;
      }
      setContent("");
      // Optimistic refresh
      const r = await fetch(`/api/messages/${conversationId}`);
      if (r.ok) setMessages(await r.json());
    } finally {
      setSending(false);
    }
  }

  let lastDate = "";
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12">
            Sem mensagens ainda. Envie a primeira!
          </p>
        ) : (
          messages.map((m) => {
            const d = new Date(m.createdAt);
            const day = dateLabel(d);
            const showDay = day !== lastDate;
            lastDate = day;
            const isMe = m.sender.id === currentUserId;
            return (
              <div key={m.id}>
                {showDay && (
                  <div className="text-center text-xs text-muted-foreground my-3">
                    <span className="bg-muted px-2 py-0.5 rounded-full">{day}</span>
                  </div>
                )}
                <div className={`flex ${isMe ? "justify-end" : "justify-start"} mb-1`}>
                  <div
                    className={`max-w-[70%] rounded-2xl px-3 py-2 text-sm ${
                      isMe
                        ? "bg-blue-600 text-white rounded-br-sm"
                        : "bg-muted rounded-bl-sm"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{m.content}</p>
                    <p className={`text-[10px] mt-1 ${isMe ? "text-blue-100" : "text-muted-foreground"}`}>
                      {format(d, "HH:mm")}
                      {isMe && m.readAt && " ·  Lida"}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      <div className="border-t p-3 flex gap-2 items-end">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Escreva uma mensagem..."
          rows={1}
          className="flex-1 resize-none min-h-[40px] max-h-32"
        />
        <Button onClick={send} disabled={sending || !content.trim()} size="icon">
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
