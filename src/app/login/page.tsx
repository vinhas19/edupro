"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { GraduationCap, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const loginSchema = z.object({
  schoolSlug: z.string().min(1, "Identificador da escola obrigatório"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Password com mínimo 6 caracteres"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  const defaultSlug = searchParams.get("school") || "";

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { schoolSlug: defaultSlug, email: "", password: "" },
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        ...data,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Credenciais inválidas. Verifique os seus dados.");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      toast.error("Erro ao autenticar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-[var(--background)] p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-3">
          <div
            className="h-14 w-14 rounded-[14px] flex items-center justify-center text-white"
            style={{ background: "linear-gradient(135deg, var(--tint-blue), #0058c9)", boxShadow: "var(--card-shadow)" }}
          >
            <GraduationCap className="h-7 w-7" strokeWidth={1.8} />
          </div>
          <div className="text-center">
            <h1 className="text-[28px] font-bold tracking-[-0.022em]">EduPro</h1>
            <p className="text-[14px] text-[var(--muted-foreground)]">
              Plataforma de gestão escolar
            </p>
          </div>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Iniciar Sessão</CardTitle>
            <CardDescription>
              Aceda com as suas credenciais escolares
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="schoolSlug">Escola</Label>
                <Input
                  id="schoolSlug"
                  placeholder="ex: vendas-novas"
                  {...register("schoolSlug")}
                />
                {errors.schoolSlug && (
                  <p className="text-xs text-red-500">{errors.schoolSlug.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Identificador único da sua escola
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="utilizador@escola.pt"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-xs text-red-500">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Palavra-passe</Label>
                  <a
                    href={`/forgot-password?school=${encodeURIComponent(defaultSlug)}`}
                    className="text-[11px] text-[var(--primary)] hover:underline"
                  >
                    Esqueci-me
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  {...register("password")}
                />
                {errors.password && (
                  <p className="text-xs text-red-500">{errors.password.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    A autenticar...
                  </>
                ) : (
                  "Entrar"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} EduPro · Gestão de Cursos Profissionais
        </p>
      </div>
    </div>
  );
}
