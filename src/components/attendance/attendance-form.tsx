"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Check, X, Clock, AlertCircle, Save, CheckCheck } from "lucide-react";
import { AttendanceStatus } from "@prisma/client";
import { cn } from "@/lib/utils";

type Student = { id: string; name: string; email: string };

// Apple tints for the 4-state segmented control
const STATUS_OPTIONS: {
  value: AttendanceStatus;
  short: string;
  long: string;
  icon: React.ElementType;
  tint: string;
  textOn: string;
}[] = [
  { value: "PRESENT",   short: "P", long: "Presente",    icon: Check,        tint: "var(--tint-green)",  textOn: "#fff" },
  { value: "ABSENT",    short: "F", long: "Falta",       icon: X,            tint: "var(--tint-red)",    textOn: "#fff" },
  { value: "LATE",      short: "A", long: "Atraso",      icon: Clock,        tint: "var(--tint-orange)", textOn: "#fff" },
  { value: "JUSTIFIED", short: "J", long: "Justificada", icon: AlertCircle,  tint: "var(--tint-blue)",   textOn: "#fff" },
];

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

const STUDENT_TINTS = [
  "var(--tint-pink)", "var(--tint-blue)", "var(--tint-purple)",
  "var(--tint-orange)", "var(--tint-green)", "var(--tint-teal)",
  "var(--tint-red)", "var(--tint-indigo)", "var(--tint-cyan)",
];

export function AttendanceForm({
  lessonId,
  students,
  existingRecords,
}: {
  lessonId: string;
  students: Student[];
  existingRecords: Record<string, AttendanceStatus>;
}) {
  const router = useRouter();
  const [records, setRecords] = useState<Record<string, AttendanceStatus>>(existingRecords);
  const [saving, setSaving] = useState(false);

  function markAll(status: AttendanceStatus) {
    const all: Record<string, AttendanceStatus> = {};
    students.forEach((s) => (all[s.id] = status));
    setRecords(all);
  }

  function toggle(studentId: string, status: AttendanceStatus) {
    setRecords((prev) => ({ ...prev, [studentId]: status }));
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId,
          records: Object.entries(records).map(([studentId, status]) => ({ studentId, status })),
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Presenças registadas");
      router.push("/dashboard/lessons");
      router.refresh();
    } catch {
      toast.error("Erro ao guardar presenças");
    } finally {
      setSaving(false);
    }
  }

  const counts = STATUS_OPTIONS.map((o) => ({
    ...o,
    count: Object.values(records).filter((s) => s === o.value).length,
  }));
  const recorded = Object.keys(records).length;
  const pendingCount = students.length - recorded;
  const pct = students.length > 0 ? Math.round((recorded / students.length) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Summary + toolbar */}
      <div className="bg-[var(--card)] rounded-[12px] shadow-[var(--card-shadow)] p-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
          {counts.map((c) => (
            <div
              key={c.value}
              className="flex items-center gap-2.5 rounded-[10px] p-2.5"
              style={{ background: `color-mix(in srgb, ${c.tint} 12%, transparent)` }}
            >
              <span
                className="h-7 w-7 rounded-[7px] flex items-center justify-center text-white shrink-0"
                style={{ background: c.tint }}
              >
                <c.icon className="h-3.5 w-3.5" strokeWidth={2.2} />
              </span>
              <div className="min-w-0">
                <div className="text-[20px] font-bold tabular-nums leading-none">{c.count}</div>
                <div className="text-[11px] text-[var(--muted-foreground)]">{c.long}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex-1">
            <div className="text-[11px] text-[var(--muted-foreground)] mb-1 tabular-nums">
              {recorded}/{students.length} alunos · {pendingCount} por registar
            </div>
            <div className="h-1.5 rounded-full bg-[var(--muted)] overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, background: "var(--tint-blue)" }}
              />
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => markAll("PRESENT")}
            className="shrink-0"
          >
            <CheckCheck className="mr-1.5 h-3.5 w-3.5" />
            Todos presentes
          </Button>
        </div>
      </div>

      {/* Student rows */}
      <div className="bg-[var(--card)] rounded-[12px] shadow-[var(--card-shadow)] overflow-hidden">
        {students.map((student, idx) => {
          const current = records[student.id];
          const tint = STUDENT_TINTS[idx % STUDENT_TINTS.length];
          return (
            <div
              key={student.id}
              className={cn(
                "flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3",
                idx > 0 && "border-t border-[var(--separator)]"
              )}
            >
              {/* Number + avatar + name (always grouped) */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span className="text-[11px] font-mono font-semibold text-[var(--muted-foreground)] tabular-nums w-5 text-right shrink-0">
                  {idx + 1}
                </span>
                <span
                  className="h-7 w-7 rounded-full flex items-center justify-center text-white text-[10px] font-semibold shrink-0"
                  style={{ background: tint }}
                >
                  {getInitials(student.name)}
                </span>
                <p className="text-[13px] font-medium truncate flex-1">{student.name}</p>
              </div>

              {/* Segmented control */}
              <div className="flex items-center gap-1 sm:gap-1.5 sm:shrink-0 sm:justify-end">
                {STATUS_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const active = current === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => toggle(student.id, opt.value)}
                      className={cn(
                        "flex-1 sm:flex-none flex items-center justify-center gap-1 rounded-[6px]",
                        "h-9 sm:h-7 px-2 sm:px-2.5",
                        "text-[11px] font-semibold transition-colors",
                        active
                          ? "text-white shadow-[inset_0_0_0_0.5px_rgba(0,0,0,0.1)]"
                          : "bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--secondary)]"
                      )}
                      style={active ? { background: opt.tint } : undefined}
                      aria-label={opt.long}
                      title={opt.long}
                    >
                      <Icon className="h-3.5 w-3.5" strokeWidth={2.2} />
                      <span className="hidden sm:inline">{opt.long}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-end pt-2 sticky bottom-0">
        <Button onClick={save} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? "A guardar..." : "Guardar Presenças"}
        </Button>
      </div>
    </div>
  );
}
