"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function FolderDeleteButton({ folderId, redirectTo }: { folderId: string; redirectTo: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function remove() {
    if (!confirm("Apagar esta pasta?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/folders/${folderId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(typeof data.error === "string" ? data.error : "Erro ao apagar");
        return;
      }
      toast.success("Pasta apagada");
      router.push(redirectTo);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button size="sm" variant="outline" onClick={remove} disabled={busy} className="text-[var(--destructive)]">
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Trash2 className="mr-1.5 h-3.5 w-3.5" />Apagar pasta</>}
    </Button>
  );
}
