"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Loader2, MailCheck, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const sp = useSearchParams();
  const [schoolSlug, setSchoolSlug] = useState(sp?.get("school") ?? "");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!schoolSlug.trim() || !email.trim()) {
      toast.error("Preenche escola e email.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, schoolSlug }),
      });
      if (res.ok) setSent(true);
      else toast.error("Não foi possível processar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--background)]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="h-12 w-12 mx-auto rounded-full flex items-center justify-center text-white mb-2"
               style={{ background: "var(--tint-blue)" }}>
            <GraduationCap className="h-6 w-6" />
          </div>
          <CardTitle>Esqueci-me da palavra-passe</CardTitle>
          <CardDescription>
            Indica a tua escola e email e enviamos-te um link para definir uma nova palavra-passe.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="space-y-3 text-center">
              <div className="h-14 w-14 mx-auto rounded-full flex items-center justify-center text-white"
                   style={{ background: "var(--tint-green)" }}>
                <MailCheck className="h-7 w-7" />
              </div>
              <p className="text-[14px]">Se a conta existir, enviámos um email com instruções.</p>
              <p className="text-[12px] text-[var(--muted-foreground)]">
                Verifica também a pasta de spam. O link expira em 1 hora.
              </p>
              <Button variant="outline" asChild>
                <Link href="/login">
                  <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />Voltar ao login
                </Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="school">Escola</Label>
                <Input id="school" value={schoolSlug} onChange={(e) => setSchoolSlug(e.target.value)} placeholder="ex: escola-profissional" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="utilizador@escola.pt" />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />A enviar…</> : "Enviar link"}
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
