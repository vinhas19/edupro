"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  schoolSlug: string;
  courses: { id: string; name: string; code: string }[];
  academicYears: { id: string; label: string; active: boolean }[];
}

export function ApplicationForm({ schoolSlug, courses, academicYears }: Props) {
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Form state
  const [courseId, setCourseId] = useState(courses[0]?.id ?? "");
  const [academicYearId, setAcademicYearId] = useState(
    academicYears.find((a) => a.active)?.id ?? academicYears[0]?.id ?? "",
  );
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    birthDate: "",
    citizenId: "",
    vatId: "",
    address: "",
    postalCode: "",
    city: "",
    previousSchool: "",
    previousYear: "",
    previousGrade: "",
    guardianName: "",
    guardianEmail: "",
    guardianPhone: "",
    guardianRelation: "",
  });
  function upd<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.fullName.trim() || !form.email.trim() || !courseId) {
      toast.error("Preenche nome, email e curso.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolSlug,
          courseId,
          academicYearId: academicYearId || undefined,
          ...form,
          previousGrade: form.previousGrade ? parseFloat(form.previousGrade) : undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(typeof data.error === "string" ? data.error : "Erro ao submeter");
        return;
      }
      const data = await res.json();
      setSubmitted(data.id);
    } finally {
      setBusy(false);
    }
  }

  if (submitted) {
    return (
      <Card>
        <CardContent className="py-10 text-center space-y-3">
          <div
            className="h-14 w-14 mx-auto rounded-full flex items-center justify-center text-white"
            style={{ background: "var(--tint-green)" }}
          >
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h2 className="text-[20px] font-semibold tracking-[-0.022em]">Candidatura recebida</h2>
          <p className="text-[13px] text-[var(--muted-foreground)] max-w-md mx-auto">
            Enviámos uma confirmação para o teu email. A escola vai analisar a candidatura e contactar-te nos próximos dias.
          </p>
          <p className="text-[11px] text-[var(--muted-foreground)] font-mono">
            Referência: {submitted.slice(-8).toUpperCase()}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={submit}>
      <Card>
        <CardContent className="p-5 space-y-4">
          <section className="space-y-3">
            <h3 className="text-[13px] font-semibold uppercase tracking-[0.04em] text-[var(--tint-blue)]">Curso pretendido</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Curso</Label>
                <Select value={courseId} onValueChange={(v: string | null) => setCourseId(v ?? "")}>
                  <SelectTrigger><SelectValue placeholder="Escolher..." /></SelectTrigger>
                  <SelectContent>
                    {courses.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Ano lectivo</Label>
                <Select value={academicYearId} onValueChange={(v: string | null) => setAcademicYearId(v ?? "")}>
                  <SelectTrigger><SelectValue placeholder="Escolher..." /></SelectTrigger>
                  <SelectContent>
                    {academicYears.map((y) => (
                      <SelectItem key={y.id} value={y.id}>{y.label}{y.active ? " (atual)" : ""}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          <section className="space-y-3 pt-2 border-t border-[var(--separator)]">
            <h3 className="text-[13px] font-semibold uppercase tracking-[0.04em] text-[var(--tint-blue)]">Dados pessoais</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Nome completo *" value={form.fullName} onChange={(v) => upd("fullName", v)} />
              <Field label="Email *" type="email" value={form.email} onChange={(v) => upd("email", v)} />
              <Field label="Telemóvel" value={form.phone} onChange={(v) => upd("phone", v)} />
              <Field label="Data de nascimento" type="date" value={form.birthDate} onChange={(v) => upd("birthDate", v)} />
              <Field label="Cartão de Cidadão" value={form.citizenId} onChange={(v) => upd("citizenId", v)} />
              <Field label="NIF" value={form.vatId} onChange={(v) => upd("vatId", v)} />
            </div>
            <Field label="Morada" value={form.address} onChange={(v) => upd("address", v)} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Código postal" value={form.postalCode} onChange={(v) => upd("postalCode", v)} />
              <Field label="Localidade" value={form.city} onChange={(v) => upd("city", v)} />
            </div>
          </section>

          <section className="space-y-3 pt-2 border-t border-[var(--separator)]">
            <h3 className="text-[13px] font-semibold uppercase tracking-[0.04em] text-[var(--tint-blue)]">Habilitações</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="Escola anterior" value={form.previousSchool} onChange={(v) => upd("previousSchool", v)} />
              <Field label="Ano concluído" value={form.previousYear} onChange={(v) => upd("previousYear", v)} placeholder="ex: 9º ano" />
              <Field label="Média" type="number" value={form.previousGrade} onChange={(v) => upd("previousGrade", v)} placeholder="0–20" />
            </div>
          </section>

          <section className="space-y-3 pt-2 border-t border-[var(--separator)]">
            <h3 className="text-[13px] font-semibold uppercase tracking-[0.04em] text-[var(--tint-blue)]">Encarregado de educação (se aplicável)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Nome" value={form.guardianName} onChange={(v) => upd("guardianName", v)} />
              <Field label="Parentesco" value={form.guardianRelation} onChange={(v) => upd("guardianRelation", v)} placeholder="Mãe, Pai, Tutor..." />
              <Field label="Email" type="email" value={form.guardianEmail} onChange={(v) => upd("guardianEmail", v)} />
              <Field label="Telemóvel" value={form.guardianPhone} onChange={(v) => upd("guardianPhone", v)} />
            </div>
          </section>

          <div className="flex justify-end pt-2 border-t border-[var(--separator)]">
            <Button type="submit" disabled={busy}>
              {busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />A submeter…</> : "Submeter candidatura"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}
