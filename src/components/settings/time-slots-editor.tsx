"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Wand2 } from "lucide-react";

interface Slot {
  id?: string;
  startTime: string;
  endTime: string;
  label?: string | null;
}

interface Props {
  initial: Slot[];
  defaults: { dayStart: string; dayEnd: string; blockMinutes: number; breakMinutes: number };
}

function toMin(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
function toHHMM(m: number) {
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

export function TimeSlotsEditor({ initial, defaults }: Props) {
  const router = useRouter();
  const [slots, setSlots] = useState<Slot[]>(initial);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [saving, setSaving] = useState(false);
  const [, startTransition] = useTransition();

  function update(i: number, field: keyof Slot, value: string) {
    setSlots((prev) => prev.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)));
  }

  function add() {
    const last = slots[slots.length - 1];
    const start = last ? last.endTime : defaults.dayStart;
    const end = toHHMM(Math.min(toMin(start) + defaults.blockMinutes, 23 * 60 + 59));
    setSlots([...slots, { startTime: start, endTime: end, label: "" }]);
  }

  function remove(i: number) {
    setSlots(slots.filter((_, idx) => idx !== i));
  }

  function generate() {
    if (!confirm("Gerar blocos automaticamente substitui a lista atual. Continuar?")) return;
    const start = toMin(defaults.dayStart);
    const end = toMin(defaults.dayEnd);
    const block = defaults.blockMinutes;
    const brk = defaults.breakMinutes;
    const out: Slot[] = [];
    let cur = start;
    let n = 1;
    while (cur + block <= end) {
      out.push({
        startTime: toHHMM(cur),
        endTime: toHHMM(cur + block),
        label: `${n}º bloco`,
      });
      cur += block + brk;
      n++;
    }
    setSlots(out);
  }

  async function save() {
    setError(null);
    setOk(false);

    for (const s of slots) {
      if (!/^\d{2}:\d{2}$/.test(s.startTime) || !/^\d{2}:\d{2}$/.test(s.endTime)) {
        setError("Formato de hora inválido. Usa HH:MM.");
        return;
      }
      if (toMin(s.startTime) >= toMin(s.endTime)) {
        setError(`Bloco ${s.startTime}–${s.endTime}: a entrada tem de ser anterior à saída.`);
        return;
      }
    }

    setSaving(true);
    try {
      const res = await fetch("/api/school/time-slots", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slots: slots.map((s) => ({
            startTime: s.startTime,
            endTime: s.endTime,
            label: s.label?.trim() || null,
          })),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(typeof data.error === "string" ? data.error : "Não foi possível guardar.");
        return;
      }
      setOk(true);
      startTransition(() => router.refresh());
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-[12px] text-[var(--muted-foreground)]">
          Define manualmente cada bloco do dia. A coluna de horas no horário usa estes valores.
        </p>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={generate}>
            <Wand2 className="mr-1.5 h-3.5 w-3.5" />Gerar automaticamente
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={add}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />Adicionar bloco
          </Button>
        </div>
      </div>

      {slots.length === 0 ? (
        <p className="text-[12px] text-[var(--muted-foreground)] py-4 text-center">
          Sem blocos definidos. Adiciona manualmente ou usa "Gerar automaticamente" com base no início/fim do dia.
        </p>
      ) : (
        <div className="space-y-1.5">
          <div className="grid grid-cols-[40px_1fr_1fr_1.4fr_auto] gap-2 text-[10px] font-semibold uppercase tracking-[0.04em] text-[var(--muted-foreground)] px-1">
            <span>Nº</span>
            <span>Entrada</span>
            <span>Saída</span>
            <span>Etiqueta</span>
            <span></span>
          </div>
          {slots.map((s, i) => (
            <div key={s.id ?? `new-${i}`} className="grid grid-cols-[40px_1fr_1fr_1.4fr_auto] gap-2 items-center">
              <span className="text-[12px] tabular-nums text-[var(--muted-foreground)] text-center">{i + 1}</span>
              <Input
                type="time"
                value={s.startTime}
                onChange={(e) => update(i, "startTime", e.target.value)}
                className="h-9 tabular-nums"
              />
              <Input
                type="time"
                value={s.endTime}
                onChange={(e) => update(i, "endTime", e.target.value)}
                className="h-9 tabular-nums"
              />
              <Input
                placeholder="ex: 1º bloco / Almoço"
                value={s.label ?? ""}
                onChange={(e) => update(i, "label", e.target.value)}
                className="h-9"
              />
              <Button type="button" variant="ghost" size="icon" onClick={() => remove(i)} aria-label="Remover bloco">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-[12px] text-[var(--destructive)]">{error}</p>}
      {ok && !error && <p className="text-[12px] text-[var(--tint-green)]">Blocos guardados.</p>}

      <div className="flex justify-end pt-1">
        <Button size="sm" onClick={save} disabled={saving}>
          {saving ? "A guardar…" : "Guardar blocos"}
        </Button>
      </div>
    </div>
  );
}
