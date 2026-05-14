"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save } from "lucide-react";

export function ProfileForm({
  userId,
  currentName,
  currentEmail,
}: {
  userId: string;
  currentName: string;
  currentEmail: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(currentName);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("O nome não pode estar vazio");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          currentPassword: currentPassword || undefined,
          newPassword: newPassword || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao atualizar");
      }
      toast.success("Perfil atualizado com sucesso");
      setCurrentPassword("");
      setNewPassword("");
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao atualizar perfil");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Nome</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      <div className="space-y-1.5">
        <Label>Email</Label>
        <Input value={currentEmail} disabled className="bg-muted" />
        <p className="text-xs text-muted-foreground">O email não pode ser alterado</p>
      </div>

      <div className="pt-2 border-t space-y-3">
        <p className="text-sm font-medium">Alterar palavra-passe</p>
        <div className="space-y-1.5">
          <Label>Palavra-passe atual</Label>
          <Input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Deixar em branco para não alterar"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Nova palavra-passe</Label>
          <Input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Mínimo 8 caracteres"
          />
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={saving} className="gap-2">
          <Save className="h-4 w-4" />
          {saving ? "A guardar..." : "Guardar Alterações"}
        </Button>
      </div>
    </form>
  );
}
