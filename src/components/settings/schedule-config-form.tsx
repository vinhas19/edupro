"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  initial: {
    dayStart: string;
    dayEnd: string;
    blockMinutes: number;
    breakMinutes: number;
  };
}

export function ScheduleConfigForm({ initial }: Props) {
  const router = useRouter();
  const [dayStart, setDayStart] = useState(initial.dayStart);
  const [dayEnd, setDayEnd] = useState(initial.dayEnd);
  const [blockMinutes, setBlockMinutes] = useState(initial.blockMinutes);
  const [breakMinutes, setBreakMinutes] = useState(initial.breakMinutes);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [pending, startTransition] = useTransition();

  async function onSave() {
    setError(null);
    setOk(false);
    const res = await fetch("/api/school", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dayStart, dayEnd, blockMinutes, breakMinutes }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(typeof data.error === "string" ? data.error : "Não foi possível guardar.");
      return;
    }
    setOk(true);
    startTransition(() => router.refresh());
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="dayStart" className="text-[12px] font-medium">Início do dia</Label>
          <Input
            id="dayStart"
            type="time"
            value={dayStart}
            onChange={(e) => setDayStart(e.target.value)}
            className="h-9 tabular-nums"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dayEnd" className="text-[12px] font-medium">Fim do dia</Label>
          <Input
            id="dayEnd"
            type="time"
            value={dayEnd}
            onChange={(e) => setDayEnd(e.target.value)}
            className="h-9 tabular-nums"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="blockMinutes" className="text-[12px] font-medium">Duração do bloco (min)</Label>
          <Input
            id="blockMinutes"
            type="number"
            min={20}
            max={120}
            value={blockMinutes}
            onChange={(e) => setBlockMinutes(Number(e.target.value))}
            className="h-9 tabular-nums"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="breakMinutes" className="text-[12px] font-medium">Intervalo (min)</Label>
          <Input
            id="breakMinutes"
            type="number"
            min={0}
            max={60}
            value={breakMinutes}
            onChange={(e) => setBreakMinutes(Number(e.target.value))}
            className="h-9 tabular-nums"
          />
        </div>
      </div>

      {error && (
        <p className="text-[12px] text-[var(--destructive)]">{error}</p>
      )}
      {ok && !error && (
        <p className="text-[12px] text-[var(--tint-green)]">Configuração guardada.</p>
      )}

      <div className="flex justify-end">
        <Button size="sm" onClick={onSave} disabled={pending}>
          {pending ? "A guardar…" : "Guardar"}
        </Button>
      </div>
    </div>
  );
}
