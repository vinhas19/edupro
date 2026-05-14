"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Plus } from "lucide-react";

export function NewTopicForm({ classId }: { classId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/classroom/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId, name: name.trim() }),
      });
      if (!res.ok) {
        toast.error("Erro ao criar tópico");
        return;
      }
      setName("");
      setOpen(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Plus className="mr-1.5 h-3.5 w-3.5" />Criar Tópico
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nome do tópico"
        className="h-8 max-w-xs"
        autoFocus
      />
      <Button size="sm" onClick={submit} disabled={loading || !name.trim()}>Criar</Button>
      <Button size="sm" variant="ghost" onClick={() => { setOpen(false); setName(""); }}>Cancelar</Button>
    </div>
  );
}
