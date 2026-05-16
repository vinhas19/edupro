"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const schema = z.object({
  name: z.string().min(2, "Nome obrigatório"),
  email: z.string().email("Email inválido"),
  role: z.enum(["SCHOOL_ADMIN", "COURSE_DIRECTOR", "CLASS_DIRECTOR", "TEACHER", "STUDENT", "GUARDIAN"]),
  password: z.string().min(8, "Mínimo 8 caracteres"),
});

type FormData = z.infer<typeof schema>;

const ROLES = [
  { value: "STUDENT", label: "Aluno" },
  { value: "GUARDIAN", label: "Encarregado de Educação" },
  { value: "TEACHER", label: "Professor" },
  { value: "CLASS_DIRECTOR", label: "Diretor de Turma" },
  { value: "COURSE_DIRECTOR", label: "Diretor de Curso" },
  { value: "SCHOOL_ADMIN", label: "Administrador" },
];

export function NewUserForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: "STUDENT" },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        toast.error(j.error || "Erro ao criar utilizador");
        return;
      }
      toast.success("Utilizador criado com sucesso!");
      router.push("/dashboard/users");
      router.refresh();
    } catch {
      toast.error("Erro ao criar utilizador.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome Completo</Label>
            <Input id="name" placeholder="ex: João Silva" {...register("name")} />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="utilizador@escola.pt" {...register("email")} />
            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Perfil</Label>
            <Select
              defaultValue="STUDENT"
              items={Object.fromEntries(ROLES.map((r) => [r.value, r.label]))}
              onValueChange={(v: string | null) => setValue("role", (v ?? "STUDENT") as FormData["role"])}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password Inicial</Label>
            <Input id="password" type="password" placeholder="Mínimo 8 caracteres" {...register("password")} />
            {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
            <p className="text-xs text-muted-foreground">O utilizador poderá alterar a password após o primeiro login.</p>
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
            <Button type="submit" disabled={loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />A criar...</> : "Criar Utilizador"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
