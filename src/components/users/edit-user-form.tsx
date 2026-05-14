"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface Props {
  user: {
    id: string;
    name: string;
    role: string;
    active: boolean;
  };
  isSelf: boolean;
}

const ROLES = [
  { value: "STUDENT", label: "Aluno" },
  { value: "TEACHER", label: "Professor" },
  { value: "CLASS_DIRECTOR", label: "Diretor de Turma" },
  { value: "COURSE_DIRECTOR", label: "Diretor de Curso" },
  { value: "SCHOOL_ADMIN", label: "Administrador" },
];

export function EditUserForm({ user, isSelf }: Props) {
  const router = useRouter();
  const [name, setName] = useState(user.name);
  const [role, setRole] = useState(user.role);
  const [active, setActive] = useState(user.active);
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    try {
      const payload: Record<string, unknown> = { name };
      if (!isSelf) {
        payload.role = role;
        payload.active = active;
      }
      if (newPassword) payload.newPassword = newPassword;

      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        toast.error("Erro ao guardar");
        return;
      }
      toast.success("Utilizador actualizado");
      router.push(`/dashboard/users/${user.id}`);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div>
          <Label htmlFor="u-name">Nome</Label>
          <Input id="u-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        {!isSelf && (
          <>
            <div>
              <Label>Perfil</Label>
              <Select value={role} onValueChange={(v: string | null) => setRole(v ?? role)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Conta activa</p>
                <p className="text-xs text-muted-foreground">Desactive para bloquear o login</p>
              </div>
              <Switch checked={active} onCheckedChange={setActive} />
            </div>
          </>
        )}

        <div>
          <Label htmlFor="u-pwd">Nova password (deixar vazio para manter)</Label>
          <Input id="u-pwd" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Mínimo 8 caracteres" />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => router.back()}>Cancelar</Button>
          <Button onClick={save} disabled={loading}>
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />A guardar...</> : "Guardar"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
