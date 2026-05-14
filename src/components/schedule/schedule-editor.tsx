"use client";

import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Trash2, X, AlertTriangle, Loader2 } from "lucide-react";

const DAYS = [
  { value: 1, label: "Segunda" },
  { value: 2, label: "Terça" },
  { value: 3, label: "Quarta" },
  { value: 4, label: "Quinta" },
  { value: 5, label: "Sexta" },
];

const TIME_SLOTS = [
  "08:00", "08:50", "09:40", "10:40", "11:30",
  "12:20", "13:10", "14:00", "14:50", "15:40", "16:30", "17:20",
];

interface Block {
  id: string;
  classId: string;
  teacherId: string | null;
  subjectId: string;
  roomId: string | null;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  subject: { name: string };
  teacher: { name: string } | null;
  room: { name: string } | null;
  class: { name: string };
}

interface Props {
  classId: string;
  blocks: Block[];
  subjects: { id: string; name: string; teachers: { id: string; name: string }[] }[];
  rooms: { id: string; name: string }[];
}

export function ScheduleEditor({ classId, blocks, subjects, rooms }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState<{ day: number; time: string } | null>(null);
  const [subjectId, setSubjectId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [endTime, setEndTime] = useState("");
  const [saving, setSaving] = useState(false);
  const [conflicts, setConflicts] = useState<string[]>([]);

  const byCell = new Map<string, Block>();
  for (const b of blocks) byCell.set(`${b.dayOfWeek}-${b.startTime}`, b);

  const teachersForSelected = subjects.find((s) => s.id === subjectId)?.teachers ?? [];

  function open(day: number, time: string) {
    setEditing({ day, time });
    setSubjectId("");
    setTeacherId("");
    setRoomId("");
    // Default end time: +50min
    const idx = TIME_SLOTS.indexOf(time);
    setEndTime(idx >= 0 && idx + 1 < TIME_SLOTS.length ? TIME_SLOTS[idx + 1] : "");
    setConflicts([]);
  }

  async function save() {
    if (!editing || !subjectId || !endTime) return;
    setSaving(true);
    setConflicts([]);
    try {
      const res = await fetch("/api/schedule/blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId,
          subjectId,
          teacherId: teacherId || undefined,
          roomId: roomId || undefined,
          dayOfWeek: editing.day,
          startTime: editing.time,
          endTime,
        }),
      });
      if (res.status === 409) {
        const j = await res.json();
        setConflicts((j.conflicts ?? []).map((c: any) => c.message));
        return;
      }
      if (!res.ok) {
        toast.error("Erro ao criar bloco");
        return;
      }
      toast.success("Bloco adicionado");
      setEditing(null);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function remove(blockId: string) {
    if (!confirm("Apagar este bloco?")) return;
    const res = await fetch(`/api/schedule/blocks/${blockId}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Erro ao apagar");
      return;
    }
    toast.success("Removido");
    router.refresh();
  }

  return (
    <>
      <Card>
        <CardContent className="pt-6 overflow-x-auto">
          <div className="grid min-w-[800px]" style={{ gridTemplateColumns: "80px repeat(5, 1fr)" }}>
            <div className="border-b pb-2" />
            {DAYS.map((d) => (
              <div key={d.value} className="border-b pb-2 text-center text-sm font-semibold">
                {d.label}
              </div>
            ))}
            {TIME_SLOTS.map((time) => (
              <Fragment key={time}>
                <div className="py-2 pr-3 text-xs text-muted-foreground text-right border-b">{time}</div>
                {DAYS.map((d) => {
                  const block = byCell.get(`${d.value}-${time}`);
                  return (
                    <div key={`${d.value}-${time}`} className="border-b border-l p-1 min-h-[44px]">
                      {block ? (
                        <div className="group relative rounded border bg-blue-50 px-2 py-1 text-xs">
                          <p className="font-semibold line-clamp-1">{block.subject.name}</p>
                          <p className="text-[10px] opacity-75 line-clamp-1">
                            {block.teacher?.name ?? "Sem prof."}
                            {block.room && ` · ${block.room.name}`}
                          </p>
                          <button
                            onClick={() => remove(block.id)}
                            className="absolute top-0 right-0 hidden group-hover:flex items-center justify-center h-5 w-5 bg-red-500 text-white rounded-bl"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => open(d.value, time)}
                          className="w-full h-full flex items-center justify-center rounded text-muted-foreground/30 hover:bg-blue-50 hover:text-blue-600 transition"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </Fragment>
            ))}
          </div>
        </CardContent>
      </Card>

      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setEditing(null)}>
          <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">
                  {DAYS.find((d) => d.value === editing.day)?.label} · {editing.time}
                </h3>
                <Button variant="ghost" size="icon" onClick={() => setEditing(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Disciplina</Label>
                <Select value={subjectId} onValueChange={(v: string | null) => { setSubjectId(v ?? ""); setTeacherId(""); }}>
                  <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                  <SelectContent>
                    {subjects.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {subjectId && (
                <div className="space-y-2">
                  <Label>Professor</Label>
                  <Select value={teacherId} onValueChange={(v: string | null) => setTeacherId(v ?? "")}>
                    <SelectTrigger><SelectValue placeholder="Sem professor" /></SelectTrigger>
                    <SelectContent>
                      {teachersForSelected.length === 0 ? (
                        <div className="px-2 py-1.5 text-xs text-muted-foreground">Sem professor atribuído a esta disciplina/turma</div>
                      ) : teachersForSelected.map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Sala (opcional)</Label>
                <Select value={roomId} onValueChange={(v: string | null) => setRoomId(v ?? "")}>
                  <SelectTrigger><SelectValue placeholder="Sem sala" /></SelectTrigger>
                  <SelectContent>
                    {rooms.map((r) => (
                      <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Fim</Label>
                <Select value={endTime} onValueChange={(v: string | null) => setEndTime(v ?? "")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.filter((t) => t > editing.time).map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {conflicts.length > 0 && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 space-y-1">
                  <div className="flex items-center gap-2 text-red-700 text-sm font-medium">
                    <AlertTriangle className="h-4 w-4" />
                    Conflitos detectados
                  </div>
                  {conflicts.map((c, i) => (
                    <p key={i} className="text-xs text-red-700">· {c}</p>
                  ))}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
                <Button onClick={save} disabled={saving || !subjectId || !endTime}>
                  {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />A guardar...</> : "Adicionar"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
