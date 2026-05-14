"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface Props {
  userId: string;
  active: boolean;
  isSelf: boolean;
}

export function UserActions({ userId, active, isSelf }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggleActive() {
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !active }),
      });
      if (!res.ok) {
        toast.error("Erro ao actualizar");
        return;
      }
      toast.success(active ? "Utilizador desativado" : "Utilizador ativado");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword() {
    const pwd = prompt("Nova password (mínimo 8 caracteres):");
    if (!pwd || pwd.length < 8) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: pwd }),
      });
      if (!res.ok) {
        toast.error("Erro ao actualizar password");
        return;
      }
      toast.success("Password actualizada");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={resetPassword} disabled={loading || isSelf}>
        Redefinir Password
      </Button>
      <Button
        variant={active ? "outline" : "default"}
        size="sm"
        onClick={toggleActive}
        disabled={loading || isSelf}
      >
        {loading && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
        {active ? "Desativar" : "Ativar"}
      </Button>
    </div>
  );
}
