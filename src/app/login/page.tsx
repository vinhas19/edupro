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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2 text-blue-700">
            <GraduationCap className="h-10 w-10" />
            <span className="text-3xl font-bold">EduPro</span>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Plataforma de Gestão para Escolas Profissionais
          </p>
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
                <Label htmlFor="password">Password</Label>
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
