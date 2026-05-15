"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function JustificationDecision({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<null | "APPROVED" | "REJECTED">(null);

  async function decide(decision: "APPROVED" | "REJECTED") {
    setLoading(decision);
    try {
      const res = await fetch(`/api/attendance/justifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      if (!res.ok) {
        toast.error("Erro ao decidir");
        return;
      }
      toast.success(decision === "APPROVED" ? "Aprovada" : "Rejeitada");
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" variant="outline" onClick={() => decide("APPROVED")} disabled={loading !== null}>
        {loading === "APPROVED" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Check className="mr-1 h-3.5 w-3.5" />Aprovar</>}
      </Button>
      <Button size="sm" variant="outline" onClick={() => decide("REJECTED")} disabled={loading !== null}
        className="text-[var(--destructive)]">
        {loading === "REJECTED" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><X className="mr-1 h-3.5 w-3.5" />Rejeitar</>}
      </Button>
    </div>
  );
}
