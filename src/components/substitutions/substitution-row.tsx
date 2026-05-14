"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { UserCheck, Loader2, XCircle, CheckCircle2 } from "lucide-react";

interface Suggestion {
  id: string;
  name: string;
  teachesSubject: boolean;
}

interface Props {
  id: string;
  subject: { id: string; name: string };
  className: string;
  startTime: string;
  endTime: string;
  dayOfWeek: number;
  status: string;
  substitute: { id: string; name: string } | null;
  excludeTeacherId: string;
}

const STATUS_META: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Por cobrir", color: "bg-orange-100 text-orange-700" },
  ASSIGNED: { label: "Atribuído", color: "bg-blue-100 text-blue-700" },
  CONFIRMED: { label: "Confirmado", color: "bg-green-100 text-green-700" },
  CANCELLED: { label: "Cancelado", color: "bg-gray-100 text-gray-600" },
};

export function SubstitutionRow({ id, subject, className, startTime, endTime, dayOfWeek, status, substitute, excludeTeacherId }: Props) {
  const router = useRouter();
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const meta = STATUS_META[status] ?? STATUS_META.PENDING;

  async function loadSuggestions() {
    setLoading(true);
    try {
      const res = await fetch("/api/substitutions/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectId: subject.id,
          dayOfWeek,
          startTime,
          endTime,
          excludeTeacherId,
        }),
      });
      if (!res.ok) {
        toast.error("Erro ao procurar substitutos");
        return;
      }
      setSuggestions(await res.json());
    } finally {
      setLoading(false);
    }
  }

  async function assign(substituteId: string | null) {
    setAssigning(true);
    try {
      const res = await fetch(`/api/substitutions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ substituteId }),
      });
      if (!res.ok) {
        toast.error("Erro ao atribuir");
        return;
      }
      toast.success(substituteId ? "Substituto atribuído" : "Substituto removido");
      router.refresh();
    } finally {
      setAssigning(false);
    }
  }

  async function cancel() {
    if (!confirm("Cancelar esta aula?")) return;
    await fetch(`/api/substitutions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CANCELLED" }),
    });
    toast.success("Aula cancelada");
    router.refresh();
  }

  return (
    <Card>
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="font-medium">{subject.name}</p>
            <p className="text-xs text-muted-foreground">
              {className} · {startTime}–{endTime}
            </p>
          </div>
          <Badge className={meta.color}>{meta.label}</Badge>
        </div>

        {substitute && (
          <div className="flex items-center justify-between text-sm bg-blue-50 rounded px-3 py-1.5">
            <span><UserCheck className="inline h-3.5 w-3.5 mr-1.5" />Substituto: <strong>{substitute.name}</strong></span>
            <Button size="sm" variant="ghost" onClick={() => assign(null)} disabled={assigning}>
              <XCircle className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}

        {status !== "CANCELLED" && status !== "CONFIRMED" && (
          <div className="flex gap-2">
            {!suggestions ? (
              <Button size="sm" variant="outline" onClick={loadSuggestions} disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
                Procurar substituto
              </Button>
            ) : (
              <Button size="sm" variant="ghost" onClick={() => setSuggestions(null)}>Fechar</Button>
            )}
            <Button size="sm" variant="outline" onClick={cancel}>Cancelar aula</Button>
          </div>
        )}

        {suggestions && (
          <div className="border-t pt-2 space-y-1">
            {suggestions.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">
                Sem professores disponíveis nesse horário.
              </p>
            ) : (
              suggestions.map((s) => (
                <div key={s.id} className="flex items-center justify-between text-sm py-1">
                  <div className="flex items-center gap-2">
                    <span>{s.name}</span>
                    {s.teachesSubject && (
                      <Badge variant="secondary" className="text-xs">
                        <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />Lecciona disciplina
                      </Badge>
                    )}
                  </div>
                  <Button size="sm" onClick={() => assign(s.id)} disabled={assigning}>
                    Atribuir
                  </Button>
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
