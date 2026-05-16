"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { addDays, format, isToday } from "date-fns";
import { pt } from "date-fns/locale";

const DAYS = [
  { value: 1, short: "Seg", long: "Segunda" },
  { value: 2, short: "Ter", long: "Terça" },
  { value: 3, short: "Qua", long: "Quarta" },
  { value: 4, short: "Qui", long: "Quinta" },
  { value: 5, short: "Sex", long: "Sexta" },
];

const TINTS = [
  "var(--tint-indigo)", "var(--tint-red)", "var(--tint-green)",
  "var(--tint-orange)", "var(--tint-pink)", "var(--tint-purple)",
  "var(--tint-teal)", "var(--tint-cyan)", "var(--tint-brown)",
];

interface Block {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  subject: { id: string; name: string };
  teacher: { name: string } | null;
  room: { name: string } | null;
  class: { name: string };
  meetingUrl?: string | null;
}

interface Props {
  blocks: Block[];
  showClass?: boolean;
  dayStart?: string;
  dayEnd?: string;
  timeSlots?: { startTime: string; endTime: string; label?: string | null }[];
  /** Data da segunda-feira da semana mostrada. Default: semana atual. */
  weekStart?: Date;
}

function timeToMin(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
function minToHHMM(m: number) {
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

const PX_PER_MIN = 1.4;        // 50 min ≈ 70 px (legível)
const HEADER_PX = 52;          // espaço para "Seg" + data
const LABEL_COL_PX = 72;

export function ScheduleGrid({
  blocks,
  showClass,
  dayStart = "08:00",
  dayEnd = "18:30",
  timeSlots,
  weekStart,
}: Props) {
  // Data por cada dia da semana mostrada
  const weekDates = DAYS.map((d, i) =>
    weekStart ? addDays(weekStart, i) : null,
  );
  // Grid cobre toda a janela onde podem haver aulas:
  //   início = mais cedo entre dayStart, 1º bloco e 1º timeSlot (floor à hora cheia)
  //   fim    = mais tarde entre dayEnd, último bloco e último timeSlot (usado tal qual)
  // Não arredondamos o fim para cima — usamos o valor exacto para que o grid termine
  // onde a escola realmente termina (ex.: dayEnd=18:30 → grid acaba a 18:30, não 19:00).
  const earliestBlockStart = blocks.reduce(
    (min, b) => Math.min(min, timeToMin(b.startTime)),
    Infinity,
  );
  const earliestSlotStart = (timeSlots ?? []).reduce(
    (min, s) => Math.min(min, timeToMin(s.startTime)),
    Infinity,
  );
  const latestBlockEnd = blocks.reduce(
    (max, b) => Math.max(max, timeToMin(b.endTime)),
    0,
  );
  const latestSlotEnd = (timeSlots ?? []).reduce(
    (max, s) => Math.max(max, timeToMin(s.endTime)),
    0,
  );
  const rawStart = Math.min(
    timeToMin(dayStart),
    earliestBlockStart,
    earliestSlotStart,
  );
  const rawEnd = Math.max(
    timeToMin(dayEnd),
    latestBlockEnd,
    latestSlotEnd,
  );
  const startMin = Math.floor(rawStart / 60) * 60;
  const endMin = Math.max(rawEnd, startMin + 60);
  const totalMins = endMin - startMin;
  const totalPx = totalMins * PX_PER_MIN;

  const topFor = (t: string) => (timeToMin(t) - startMin) * PX_PER_MIN;
  const heightFor = (a: string, b: string) =>
    Math.max(22, (timeToMin(b) - timeToMin(a)) * PX_PER_MIN);

  // Hour marks (full hours within range)
  const hourMarks: number[] = [];
  const firstHour = Math.ceil(startMin / 60) * 60;
  for (let m = firstHour; m <= endMin; m += 60) hourMarks.push(m);

  // Half-hour faint marks
  const halfMarks: number[] = [];
  for (let m = firstHour - 30; m < endMin; m += 60) {
    if (m > startMin) halfMarks.push(m);
  }

  // Labels in left column:
  //  - se a escola definiu timeSlots → mostra início de cada slot + fim do último slot
  //  - acrescenta marcas de hora cheia para o intervalo antes do 1º slot e depois do último
  //    (para que a área "fora dos slots" mas dentro do horário escolar tenha referências)
  //  - sem timeSlots → fallback puro a horas cheias
  const slotLabelMinutes: { min: number; label: string }[] = (() => {
    const slots = (timeSlots ?? [])
      .map((s) => ({
        start: timeToMin(s.startTime),
        end: timeToMin(s.endTime),
        startStr: s.startTime,
        endStr: s.endTime,
      }))
      .filter((s) => s.start >= startMin && s.end <= endMin)
      .sort((a, b) => a.start - b.start);

    if (!slots.length) {
      return hourMarks.map((m) => ({ min: m, label: minToHHMM(m) }));
    }

    const arr: { min: number; label: string }[] = [];
    const seen = new Set<number>();
    const push = (m: number, label: string) => {
      if (m < startMin || m > endMin) return;
      if (seen.has(m)) return;
      seen.add(m);
      arr.push({ min: m, label });
    };

    const firstSlotStart = slots[0].start;
    const lastSlotEnd = slots[slots.length - 1].end;

    // Marcas de hora cheia antes do 1º slot (ex.: dayStart=07:00, 1º slot=08:00 → marca 07:00)
    for (let m = startMin; m < firstSlotStart; m += 60) {
      push(m, minToHHMM(m));
    }
    // Cada início de slot + fim do último slot
    for (const s of slots) push(s.start, s.startStr);
    push(lastSlotEnd, minToHHMM(lastSlotEnd));
    // Marcas de hora cheia depois do último slot até ao fim do grid
    const firstHourAfter = Math.ceil((lastSlotEnd + 1) / 60) * 60;
    for (let m = firstHourAfter; m <= endMin; m += 60) {
      push(m, minToHHMM(m));
    }
    return arr.sort((a, b) => a.min - b.min);
  })();

  // Stable color per subject
  const subjectIds = [...new Set(blocks.map((b) => b.subject.id))];
  const colorOf = (sid: string) => TINTS[subjectIds.indexOf(sid) % TINTS.length];

  // Today indicator (1..7 schema). Sunday=0 in JS → 7 in schema.
  // Só marca "hoje" se estivermos a ver a semana atual (ou se weekStart não foi passado)
  const realTodayDow = new Date().getDay() === 0 ? 7 : new Date().getDay();
  const showingCurrentWeek = !weekStart || weekDates.some((d) => d && isToday(d));
  const todayDow = showingCurrentWeek ? realTodayDow : -1;

  // Mobile: single-day view via tabs
  const [activeDay, setActiveDay] = useState(Math.min(5, Math.max(1, todayDow)));
  const mobileBlocks = blocks
    .filter((b) => b.dayOfWeek === activeDay)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Desktop: blocos visíveis no horário escolar configurado
  const visibleBlocks = blocks.filter((b) => {
    const s = timeToMin(b.startTime);
    const e = timeToMin(b.endTime);
    return e > startMin && s < endMin && b.dayOfWeek >= 1 && b.dayOfWeek <= 5;
  });
  const hiddenCount = blocks.length - visibleBlocks.length;

  // Agrupar por dia para detectar sobreposições (lanes) e dar largura proporcional
  const blocksByDay = new Map<number, Block[]>();
  for (const b of visibleBlocks) {
    const arr = blocksByDay.get(b.dayOfWeek) ?? [];
    arr.push(b);
    blocksByDay.set(b.dayOfWeek, arr);
  }
  // Compute lane index for overlapping blocks within the same day
  function laneLayout(dayBlocks: Block[]): Map<string, { lane: number; lanes: number }> {
    const sorted = [...dayBlocks].sort(
      (a, b) =>
        timeToMin(a.startTime) - timeToMin(b.startTime) ||
        timeToMin(a.endTime) - timeToMin(b.endTime),
    );
    // group into clusters that mutually overlap
    const result = new Map<string, { lane: number; lanes: number }>();
    let cluster: Block[] = [];
    let clusterEnd = -Infinity;

    function flushCluster() {
      if (!cluster.length) return;
      // Greedy lane assignment
      const lanes: number[] = []; // lane -> endMin of last block in that lane
      const assign = new Map<string, number>();
      for (const b of cluster) {
        const s = timeToMin(b.startTime);
        const e = timeToMin(b.endTime);
        let placed = -1;
        for (let i = 0; i < lanes.length; i++) {
          if (lanes[i] <= s) {
            placed = i;
            lanes[i] = e;
            break;
          }
        }
        if (placed === -1) {
          lanes.push(e);
          placed = lanes.length - 1;
        }
        assign.set(b.id, placed);
      }
      const totalLanes = lanes.length;
      for (const b of cluster) {
        result.set(b.id, { lane: assign.get(b.id)!, lanes: totalLanes });
      }
      cluster = [];
      clusterEnd = -Infinity;
    }

    for (const b of sorted) {
      const s = timeToMin(b.startTime);
      const e = timeToMin(b.endTime);
      if (s >= clusterEnd) flushCluster();
      cluster.push(b);
      clusterEnd = Math.max(clusterEnd, e);
    }
    flushCluster();
    return result;
  }

  const dayLaneMaps = new Map<number, Map<string, { lane: number; lanes: number }>>();
  for (const [day, dayBlocks] of blocksByDay.entries()) {
    dayLaneMaps.set(day, laneLayout(dayBlocks));
  }

  return (
    <>
      {/* Mobile day tabs */}
      <div className="md:hidden -mx-1 mb-3 overflow-x-auto">
        <div className="flex gap-1 px-1 min-w-max">
          {DAYS.map((d) => (
            <button
              key={d.value}
              onClick={() => setActiveDay(d.value)}
              className={cn(
                "flex-1 min-w-[64px] rounded-[7px] px-3 py-2 text-[12px] font-semibold text-center transition-colors",
                activeDay === d.value
                  ? "bg-[var(--primary)] text-white"
                  : d.value === todayDow
                    ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                    : "bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--secondary)]",
              )}
            >
              {d.short}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile single-day list */}
      <div className="md:hidden space-y-2">
        {mobileBlocks.length === 0 ? (
          <div className="text-center py-12 text-[13px] text-[var(--muted-foreground)]">
            Sem aulas em {DAYS.find((d) => d.value === activeDay)?.long.toLowerCase()}.
          </div>
        ) : (
          mobileBlocks.map((b) => (
            <div
              key={b.id}
              className="rounded-[10px] p-3 text-white"
              style={{
                background: colorOf(b.subject.id),
                boxShadow:
                  "inset 0 -16px 24px -16px rgba(0,0,0,0.25), var(--card-shadow)",
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold opacity-90 tabular-nums">
                  {b.startTime}–{b.endTime}
                </span>
                {b.room && (
                  <span className="text-[11px] opacity-80">{b.room.name}</span>
                )}
              </div>
              <p className="text-[15px] font-semibold leading-tight">
                {b.subject.name}
              </p>
              {b.teacher && (
                <p className="text-[12px] opacity-90">{b.teacher.name}</p>
              )}
              {showClass && (
                <p className="text-[11px] opacity-75">{b.class.name}</p>
              )}
            </div>
          ))
        )}
      </div>

      {/* Desktop/tablet grid (absolute positioning, prevents overlap visual issues) */}
      <div className="hidden md:block overflow-x-auto relative">
        <div
          className="relative min-w-[760px]"
          style={{ height: HEADER_PX + totalPx }}
        >
          {/* Header row: corner + day names */}
          <div
            className="absolute top-0 left-0 right-0 grid border-b border-[var(--separator)]"
            style={{
              gridTemplateColumns: `${LABEL_COL_PX}px repeat(5, minmax(0, 1fr))`,
              height: HEADER_PX,
            }}
          >
            <div />
            {DAYS.map((d, i) => {
              const date = weekDates[i];
              return (
                <div
                  key={`h-${d.value}`}
                  className={cn(
                    "flex flex-col items-center justify-center text-[11px] font-semibold uppercase tracking-[0.04em]",
                    d.value === todayDow
                      ? "text-[var(--tint-blue)] bg-[var(--accent)]"
                      : "text-[var(--muted-foreground)]",
                  )}
                >
                  <span>{d.short}</span>
                  {date && (
                    <span className="text-[10px] font-normal tabular-nums opacity-80">
                      {format(date, "d MMM", { locale: pt })}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Body */}
          <div
            className="absolute left-0 right-0"
            style={{ top: HEADER_PX, height: totalPx }}
          >
            {/* Day columns background (separators + today highlight) */}
            <div
              className="absolute inset-0 grid"
              style={{
                gridTemplateColumns: `${LABEL_COL_PX}px repeat(5, minmax(0, 1fr))`,
              }}
            >
              <div />
              {DAYS.map((d) => (
                <div
                  key={`col-${d.value}`}
                  className={cn(
                    "border-l border-[var(--separator)]",
                    d.value === todayDow && "bg-[var(--accent)]/30",
                  )}
                />
              ))}
            </div>

            {/* Half-hour faint lines */}
            {halfMarks.map((m) => (
              <div
                key={`hm-${m}`}
                className="absolute border-t border-dashed border-[var(--separator)]/50 pointer-events-none"
                style={{
                  left: LABEL_COL_PX,
                  right: 0,
                  top: (m - startMin) * PX_PER_MIN,
                }}
              />
            ))}

            {/* Hour solid lines */}
            {hourMarks.map((m) => (
              <div
                key={`hl-${m}`}
                className="absolute border-t border-[var(--separator)] pointer-events-none"
                style={{
                  left: LABEL_COL_PX,
                  right: 0,
                  top: (m - startMin) * PX_PER_MIN,
                }}
              />
            ))}

            {/* Time column labels */}
            {slotLabelMinutes.map((it, i) => (
              <div
                key={`lbl-${i}-${it.min}`}
                className="absolute text-[11px] font-mono tabular-nums text-[var(--muted-foreground)] pr-2 text-right"
                style={{
                  left: 0,
                  width: LABEL_COL_PX,
                  top: (it.min - startMin) * PX_PER_MIN - 7,
                  lineHeight: "14px",
                  background: "var(--card)",
                  zIndex: 3,
                }}
              >
                {it.label}
              </div>
            ))}

            {/* Blocks */}
            {visibleBlocks.map((b) => {
              const lanes = dayLaneMaps.get(b.dayOfWeek);
              const info = lanes?.get(b.id) ?? { lane: 0, lanes: 1 };
              const dayIndex = b.dayOfWeek - 1; // 0..4
              return (
                <div
                  key={b.id}
                  className="absolute rounded-[8px] text-white overflow-hidden px-2 py-1.5"
                  style={{
                    top: topFor(b.startTime) + 1,
                    height: heightFor(b.startTime, b.endTime) - 2,
                    left: `calc(${LABEL_COL_PX}px + (100% - ${LABEL_COL_PX}px) * ${
                      (dayIndex + info.lane / info.lanes) / 5
                    } + 2px)`,
                    width: `calc((100% - ${LABEL_COL_PX}px) / 5 / ${info.lanes} - 4px)`,
                    background: colorOf(b.subject.id),
                    boxShadow:
                      "inset 0 -16px 24px -16px rgba(0,0,0,0.25), 0 0 0 0.5px rgba(0,0,0,0.06)",
                    zIndex: 2,
                  }}
                  title={`${b.subject.name} · ${b.class.name} · ${b.startTime}–${b.endTime}${
                    b.room ? ` · ${b.room.name}` : ""
                  }`}
                >
                  <p className="text-[12px] font-semibold leading-tight line-clamp-1">
                    {b.subject.name}
                  </p>
                  {b.teacher && (
                    <p className="text-[10px] opacity-95 leading-tight line-clamp-1">
                      {b.teacher.name}
                    </p>
                  )}
                  {showClass && heightFor(b.startTime, b.endTime) >= 60 && (
                    <p className="text-[10px] opacity-75 leading-tight line-clamp-1">
                      {b.class.name}
                    </p>
                  )}
                  {b.room && heightFor(b.startTime, b.endTime) >= 70 && (
                    <p className="text-[10px] opacity-80 leading-tight line-clamp-1">
                      {b.room.name}
                    </p>
                  )}
                  {heightFor(b.startTime, b.endTime) >= 40 && (
                    <p className="text-[10px] opacity-75 tabular-nums absolute bottom-1 right-2">
                      {b.startTime}–{b.endTime}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {hiddenCount > 0 && (
          <p className="mt-2 text-[11px] text-[var(--muted-foreground)]">
            {hiddenCount} bloco{hiddenCount !== 1 ? "s" : ""} fora dos dias úteis (Seg–Sex).
          </p>
        )}
      </div>
    </>
  );
}
