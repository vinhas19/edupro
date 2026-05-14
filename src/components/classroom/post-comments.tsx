"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

interface Comment {
  id: string;
  content: string;
  createdAt: string | Date;
  author: { id: string; name: string };
}

interface Props {
  postId: string;
  comments: Comment[];
}

export function PostComments({ postId, comments }: Props) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  async function send() {
    if (!content.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/classroom/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, content: content.trim() }),
      });
      if (!res.ok) {
        toast.error("Erro ao comentar");
        return;
      }
      setContent("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      {comments.length > 0 && (
        <div className="space-y-2 pt-2">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-2 text-sm">
              <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0 text-xs font-semibold">
                {c.author.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 rounded-lg bg-muted/40 px-3 py-1.5">
                <div className="flex items-baseline gap-2">
                  <span className="font-medium">{c.author.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(c.createdAt), "d MMM, HH:mm", { locale: pt })}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{c.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2 pt-2 border-t">
        <Input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Comentar..."
          disabled={loading}
          className="flex-1 h-9"
        />
        <Button size="sm" onClick={send} disabled={loading || !content.trim()}>
          <Send className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
