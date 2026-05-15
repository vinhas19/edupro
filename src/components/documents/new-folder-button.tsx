"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FolderPlus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  classId: string;
  subjectId: string;
  moduleId?: string;
  parentId?: string;
}

export function NewFolderButton({ classId, subjectId, moduleId, parentId }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!name.trim()) {
      toast.error("Indica um nome.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), classId, subjectId, moduleId, parentId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(typeof data.error === "string" ? data.error : "Erro ao criar pasta");
        return;
      }
      toast.success("Pasta criada");
      setName("");
      setOpen(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <FolderPlus className="mr-1.5 h-3.5 w-3.5" />Nova pasta
      </Button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setOpen(false)}>
          <div
            className="w-full max-w-md rounded-[12px] bg-[var(--card)] shadow-[var(--card-shadow)] p-5 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-[16px] font-semibold tracking-[-0.012em]">Nova pasta</h3>
              <button onClick={() => setOpen(false)} aria-label="Fechar" className="h-7 w-7 rounded-[6px] hover:bg-[var(--muted)] flex items-center justify-center">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="folder-name">Nome</Label>
              <Input
                id="folder-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ex: Apontamentos, Exames, Trabalhos…"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && submit()}
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={submit} disabled={busy}>
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Criar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
