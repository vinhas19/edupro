"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const token = sp?.get("token") ?? "";
  const school = sp?.get("school") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Mínimo 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      toast.error("As palavras-passe não coincidem.");
      return;
    }
    if (!token) {
      toast.error("Token em falta. Abre o link do email.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(typeof data.error === "string" ? data.error : "Erro.");
        return;
      }
      setDone(true);
      setTimeout(() => router.push(`/login?school=${encodeURIComponent(school)}`), 2000);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--background)]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div
            className="h-12 w-12 mx-auto rounded-full flex items-center justify-center text-white mb-2"
            style={{ background: done ? "var(--tint-green)" : "var(--tint-blue)" }}
          >
            {done ? <CheckCircle2 className="h-6 w-6" /> : <GraduationCap className="h-6 w-6" />}
          </div>
          <CardTitle>{done ? "Palavra-passe atualizada" : "Nova palavra-passe"}</CardTitle>
          <CardDescription>
            {done
              ? "A redirecionar para o login…"
              : "Escolhe uma palavra-passe segura (mínimo 8 caracteres)."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!done && (
            <form onSubmit={submit} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="pwd">Palavra-passe</Label>
                <Input id="pwd" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="conf">Confirmar</Label>
                <Input id="conf" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
              </div>
              <Button type="submit" className="w-full" disabled={loading || !token}>
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />A guardar…</> : "Definir palavra-passe"}
              </Button>
              <div className="text-center text-[12px]">
                <Link href="/login" className="text-[var(--primary)] hover:underline">Voltar ao login</Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
