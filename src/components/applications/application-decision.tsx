"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Check, X, Clock } from "lucide-react";
import { toast } from "sonner";

interface Props {
  id: string;
  currentStatus: string;
  classes: { id: string; name: string; _count: { enrollments: number } }[];
}

export function ApplicationDecision({ id, currentStatus, classes }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<null | string>(null);
  const [classId, setClassId] = useState(classes[0]?.id ?? "");
  const [reason, setReason] = useState("");

  async function decide(status: string) {
    if (status === "REJECTED" && !reason.trim()) {
      toast.error("Indica o motivo da rejeição.");
      return;
    }
    setBusy(status);
    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          rejectionReason: status === "REJECTED" ? reason.trim() : undefined,
          classId: status === "ACCEPTED" && classId ? classId : undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(typeof data.error === "string" ? data.error : "Erro");
        return;
      }
      toast.success("Decisão registada");
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h3 className="text-[15px] font-semibold">Decisão</h3>
          <span className="text-[11px] text-[var(--muted-foreground)] uppercase tracking-[0.04em]">
            Estado atual: <strong>{currentStatus}</strong>
          </span>
        </div>

        {classes.length > 0 && (
          <div className="space-y-1">
            <Label className="text-[12px]">Matricular em (ao aceitar)</Label>
            <Select value={classId} onValueChange={(v: string | null) => setClassId(v ?? "")}>
              <SelectTrigger><SelectValue placeholder="Sem matrícula automática" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Sem matrícula automática</SelectItem>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} ({c._count.enrollments} alunos)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-1">
          <Label className="text-[12px]">Motivo (se rejeitar)</Label>
          <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="ex: Vagas esgotadas" />
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          <Button size="sm" onClick={() => decide("UNDER_REVIEW")} disabled={busy !== null} variant="outline">
            {busy === "UNDER_REVIEW" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Clock className="mr-1 h-3.5 w-3.5" />Em análise</>}
          </Button>
          <Button size="sm" onClick={() => decide("WAITLISTED")} disabled={busy !== null} variant="outline">
            Lista de espera
          </Button>
          <Button size="sm" onClick={() => decide("REJECTED")} disabled={busy !== null} variant="outline" className="text-[var(--destructive)]">
            {busy === "REJECTED" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><X className="mr-1 h-3.5 w-3.5" />Rejeitar</>}
          </Button>
          <Button size="sm" onClick={() => decide("ACCEPTED")} disabled={busy !== null} className="ml-auto">
            {busy === "ACCEPTED" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Check className="mr-1 h-3.5 w-3.5" />Aceitar e criar conta</>}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
