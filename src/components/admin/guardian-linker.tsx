"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface User { id: string; name: string; email: string }
interface Link {
  id: string;
  guardianName: string;
  guardianEmail: string;
  studentName: string;
  studentEmail: string;
  kind: string | null;
}

interface Props {
  guardians: User[];
  students: User[];
  links: Link[];
}

export function GuardianLinker({ guardians, students, links }: Props) {
  const router = useRouter();
  const [guardianId, setGuardianId] = useState(guardians[0]?.id ?? "");
  const [studentId, setStudentId] = useState(students[0]?.id ?? "");
  const [kind, setKind] = useState("");
  const [busy, setBusy] = useState(false);

  async function create() {
    if (!guardianId || !studentId) {
      toast.error("Escolhe EE e aluno.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/guardian-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guardianId, studentId, kind: kind.trim() || null }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(typeof data.error === "string" ? data.error : "Erro ao criar ligação");
        return;
      }
      toast.success("Ligação criada");
      setKind("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Remover esta ligação?")) return;
    setBusy(true);
    try {
      const res = await fetch("/api/guardian-links", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        toast.error("Erro ao remover");
        return;
      }
      toast.success("Ligação removida");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_140px_auto] gap-2 items-end">
        <div className="space-y-1.5">
          <Label>Encarregado</Label>
          <Select value={guardianId} onValueChange={(v: string | null) => setGuardianId(v ?? "")}>
            <SelectTrigger><SelectValue placeholder="Selecionar EE..." /></SelectTrigger>
            <SelectContent>
              {guardians.map((g) => (
                <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Aluno</Label>
          <Select value={studentId} onValueChange={(v: string | null) => setStudentId(v ?? "")}>
            <SelectTrigger><SelectValue placeholder="Selecionar aluno..." /></SelectTrigger>
            <SelectContent>
              {students.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="kind">Parentesco</Label>
          <Input id="kind" value={kind} onChange={(e) => setKind(e.target.value)} placeholder="ex: Mãe, Pai, Tutor" />
        </div>
        <Button onClick={create} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="mr-1.5 h-3.5 w-3.5" />Ligar</>}
        </Button>
      </div>

      <div className="border-t border-[var(--separator)] pt-4">
        <h3 className="text-[14px] font-semibold mb-3">Ligações existentes</h3>
        {links.length === 0 ? (
          <p className="text-[13px] text-[var(--muted-foreground)] py-4 text-center">Sem ligações.</p>
        ) : (
          <ul className="divide-y divide-[var(--separator)]">
            {links.map((l) => (
              <li key={l.id} className="py-2.5 flex items-center justify-between gap-3 flex-wrap">
                <div className="text-[13px]">
                  <p>
                    <span className="font-medium">{l.guardianName}</span>
                    {l.kind && <span className="text-[var(--muted-foreground)]"> ({l.kind})</span>}
                    <span className="text-[var(--muted-foreground)]"> → </span>
                    <span className="font-medium">{l.studentName}</span>
                  </p>
                  <p className="text-[11px] text-[var(--muted-foreground)]">
                    {l.guardianEmail} · {l.studentEmail}
                  </p>
                </div>
                <Button size="icon" variant="ghost" onClick={() => remove(l.id)} disabled={busy} className="text-[var(--destructive)]">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
