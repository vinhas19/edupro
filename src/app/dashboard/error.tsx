"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Lectiva/dashboard]", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center py-12">
      <div className="max-w-md w-full rounded-[12px] bg-[var(--card)] shadow-[var(--card-shadow)] p-6 space-y-3 text-center">
        <div
          className="h-12 w-12 mx-auto rounded-full flex items-center justify-center text-white"
          style={{ background: "var(--destructive)" }}
        >
          <AlertTriangle className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-[17px] font-semibold tracking-[-0.012em]">Não foi possível carregar esta secção</h2>
          <p className="text-[13px] text-[var(--muted-foreground)] mt-1">
            Tenta novamente. Se persistir, contacta o administrador.
          </p>
          {error.digest && (
            <p className="text-[11px] text-[var(--muted-foreground)] mt-2 font-mono">{error.digest}</p>
          )}
        </div>
        <Button onClick={reset} size="sm">
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" />Tentar de novo
        </Button>
      </div>
    </div>
  );
}
