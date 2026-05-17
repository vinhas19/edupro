"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[EduPro] Unhandled error:", error);
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      import("@sentry/nextjs").then((Sentry) => Sentry.captureException(error)).catch(() => {});
    }
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--background)]">
      <div className="max-w-md w-full rounded-[14px] bg-[var(--card)] shadow-[var(--card-shadow)] p-6 space-y-4 text-center">
        <div
          className="h-14 w-14 mx-auto rounded-full flex items-center justify-center text-white"
          style={{ background: "var(--destructive)" }}
        >
          <AlertTriangle className="h-7 w-7" />
        </div>
        <div>
          <h1 className="text-[20px] font-bold tracking-[-0.022em]">Algo correu mal</h1>
          <p className="text-[13px] text-[var(--muted-foreground)] mt-1">
            Ocorreu um erro inesperado. Já fomos notificados.
          </p>
          {error.digest && (
            <p className="text-[11px] text-[var(--muted-foreground)] mt-2 font-mono">
              ID: {error.digest}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Button onClick={reset}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />Tentar de novo
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard">
              <Home className="mr-1.5 h-3.5 w-3.5" />Voltar ao painel
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
