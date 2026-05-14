"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, Clock, AlertCircle, Save } from "lucide-react";
import { AttendanceStatus } from "@prisma/client";

type Student = { id: string; name: string; email: string };

const STATUS_OPTIONS: { value: AttendanceStatus; label: string; icon: React.ReactNode; className: string }[] = [
  { value: "PRESENT", label: "Presente", icon: <Check className="h-3.5 w-3.5" />, className: "bg-green-100 text-green-700 border-green-200 hover:bg-green-200" },
  { value: "ABSENT", label: "Falta", icon: <X className="h-3.5 w-3.5" />, className: "bg-red-100 text-red-700 border-red-200 hover:bg-red-200" },
  { value: "JUSTIFIED", label: "Justificada", icon: <AlertCircle className="h-3.5 w-3.5" />, className: "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200" },
  { value: "LATE", label: "Atraso", icon: <Clock className="h-3.5 w-3.5" />, className: "bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200" },
];

const STATUS_BADGE: Record<AttendanceStatus, string> = {
  PRESENT: "bg-green-100 text-green-700 border-green-200",
  ABSENT: "bg-red-100 text-red-700 border-red-200",
  JUSTIFIED: "bg-blue-100 text-blue-700 border-blue-200",
  LATE: "bg-orange-100 text-orange-700 border-orange-200",
};

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

  const markAll = (status: AttendanceStatus) => {
    const all: Record<string, AttendanceStatus> = {};
    students.forEach((s) => (all[s.id] = status));
    setRecords(all);
  };

  const toggle = (studentId: string, status: AttendanceStatus) => {
    setRecords((prev) => ({ ...prev, [studentId]: status }));
  };

  const save = async () => {
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
      toast.success("Presenças registadas com sucesso");
      router.push("/dashboard/lessons");
      router.refresh();
    } catch {
      toast.error("Erro ao guardar presenças");
    } finally {
      setSaving(false);
    }
  };

  const presentCount = Object.values(records).filter((s) => s === "PRESENT").length;
  const absentCount = Object.values(records).filter((s) => s === "ABSENT" || s === "JUSTIFIED").length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            {presentCount} presentes
          </Badge>
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            {absentCount} faltas
          </Badge>
          <Badge variant="outline">
            {students.length - Object.keys(records).length} por registar
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Marcar todos:</span>
          {STATUS_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              variant="outline"
              size="sm"
              className={`text-xs ${opt.className}`}
              onClick={() => markAll(opt.value)}
            >
              {opt.icon}
              <span className="ml-1">{opt.label}</span>
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {students.map((student, idx) => {
          const current = records[student.id];
          return (
            <Card key={student.id}>
              <CardContent className="flex items-center gap-3 py-3">
                <span className="text-sm text-muted-foreground w-6 text-right">{idx + 1}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium">{student.name}</p>
                  <p className="text-xs text-muted-foreground">{student.email}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  {STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => toggle(student.id, opt.value)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                        current === opt.value
                          ? opt.className + " ring-2 ring-offset-1 ring-current"
                          : "bg-muted/40 text-muted-foreground border-transparent hover:bg-muted"
                      }`}
                    >
                      {opt.icon}
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex justify-end pt-2">
        <Button onClick={save} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" />
          {saving ? "A guardar..." : "Guardar Presenças"}
        </Button>
      </div>
    </div>
  );
}
