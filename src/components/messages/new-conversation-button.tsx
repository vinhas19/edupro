"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MessageSquare, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function NewConversationButton({ recipientId }: { recipientId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function start() {
    setLoading(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId, content: "👋" }),
      });
      if (!res.ok) {
        toast.error("Erro ao iniciar conversa");
        return;
      }
      const data = await res.json();
      router.push(`/dashboard/messages/${data.conversationId}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={start} disabled={loading}>
      {loading ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <MessageSquare className="mr-2 h-3.5 w-3.5" />}
      Enviar Mensagem
    </Button>
  );
}
