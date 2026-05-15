"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Bell, Mail, MessageSquare, Smartphone, Loader2, ShieldCheck } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Channel = "IN_APP" | "PUSH" | "EMAIL" | "SMS";

interface Preferences {
  scheduleChanges: Channel[];
  lessonCancelled: Channel[];
  absences: Channel[];
  justifications: Channel[];
  grades: Channel[];
  assignments: Channel[];
  messages: Channel[];
  announcements: Channel[];
  fctPapMilestones: Channel[];
  substitutions: Channel[];
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  phoneE164: string | null;
  phoneVerified: boolean;
}

const CATEGORIES: { key: keyof Preferences; label: string; description: string }[] = [
  { key: "scheduleChanges", label: "Alterações de horário", description: "Quando uma aula é movida, criada ou removida." },
  { key: "lessonCancelled", label: "Aulas canceladas", description: "Aula cancelada sem substituição (urgente)." },
  { key: "substitutions", label: "Substituições", description: "Professor substituto atribuído ou alterado." },
  { key: "absences", label: "Faltas registadas", description: "Quando é registada uma falta (alertas para EE)." },
  { key: "justifications", label: "Justificações", description: "Resposta a um pedido de justificação de falta." },
  { key: "grades", label: "Notas publicadas", description: "Nova nota de módulo, teste ou trabalho." },
  { key: "assignments", label: "Trabalhos", description: "Novos trabalhos, prazos a aproximar-se, devoluções." },
  { key: "messages", label: "Mensagens", description: "Mensagens diretas recebidas." },
  { key: "announcements", label: "Anúncios", description: "Comunicados da escola ou turma." },
  { key: "fctPapMilestones", label: "FCT / PAP", description: "Atualizações de estado, prazos, avaliações." },
];

const CHANNELS: { value: Channel; label: string; icon: typeof Bell; available: (p: Preferences) => boolean }[] = [
  { value: "IN_APP", label: "Na app", icon: Bell, available: () => true },
  { value: "PUSH", label: "Push", icon: Smartphone, available: (p) => p.pushEnabled },
  { value: "EMAIL", label: "Email", icon: Mail, available: (p) => p.emailEnabled },
  { value: "SMS", label: "SMS", icon: MessageSquare, available: (p) => p.smsEnabled && p.phoneVerified },
];

interface Props {
  initial: Preferences;
}

export function PreferencesForm({ initial }: Props) {
  const router = useRouter();
  const [prefs, setPrefs] = useState<Preferences>(initial);
  const [phoneInput, setPhoneInput] = useState(initial.phoneE164 ?? "");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [phoneBusy, setPhoneBusy] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);
  const [pending, startTransition] = useTransition();

  function toggleChannel(category: keyof Preferences, channel: Channel) {
    setPrefs((p) => {
      const current = p[category] as Channel[];
      const next = current.includes(channel)
        ? current.filter((c) => c !== channel)
        : [...current, channel];
      return { ...p, [category]: next };
    });
  }

  async function onSave() {
    setSaveBusy(true);
    try {
      const res = await fetch("/api/notifications/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduleChanges: prefs.scheduleChanges,
          lessonCancelled: prefs.lessonCancelled,
          absences: prefs.absences,
          justifications: prefs.justifications,
          grades: prefs.grades,
          assignments: prefs.assignments,
          messages: prefs.messages,
          announcements: prefs.announcements,
          fctPapMilestones: prefs.fctPapMilestones,
          substitutions: prefs.substitutions,
          quietHoursStart: prefs.quietHoursStart || null,
          quietHoursEnd: prefs.quietHoursEnd || null,
          emailEnabled: prefs.emailEnabled,
          smsEnabled: prefs.smsEnabled,
          pushEnabled: prefs.pushEnabled,
        }),
      });
      if (!res.ok) {
        toast.error("Não foi possível guardar as preferências.");
        return;
      }
      toast.success("Preferências guardadas");
    } finally {
      setSaveBusy(false);
    }
  }

  async function startVerification() {
    if (!phoneInput.trim()) {
      toast.error("Indica um número de telefone.");
      return;
    }
    setPhoneBusy(true);
    try {
      const res = await fetch("/api/phone-verification/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Falha a iniciar verificação.");
        return;
      }
      setOtpSent(true);
      toast.success(
        data.devCode
          ? `Código enviado (dev: ${data.devCode})`
          : "Código enviado por SMS",
      );
    } finally {
      setPhoneBusy(false);
    }
  }

  async function confirmCode() {
    if (!/^\d{6}$/.test(otpCode)) {
      toast.error("O código tem 6 dígitos.");
      return;
    }
    setPhoneBusy(true);
    try {
      const res = await fetch("/api/phone-verification/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: otpCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Código inválido.");
        return;
      }
      setPrefs((p) => ({ ...p, phoneE164: data.phoneE164, phoneVerified: true }));
      setOtpSent(false);
      setOtpCode("");
      toast.success("Número verificado");
      startTransition(() => router.refresh());
    } finally {
      setPhoneBusy(false);
    }
  }

  async function removePhone() {
    if (!confirm("Remover o número de telefone associado?")) return;
    setPhoneBusy(true);
    try {
      const res = await fetch("/api/phone-verification/verify", { method: "DELETE" });
      if (!res.ok) {
        toast.error("Falha a remover.");
        return;
      }
      setPrefs((p) => ({ ...p, phoneE164: null, phoneVerified: false }));
      setPhoneInput("");
      toast.success("Número removido");
    } finally {
      setPhoneBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Telefone / SMS */}
      <section className="rounded-xl border bg-card p-5">
        <header className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold">Telefone para SMS</h2>
            <p className="text-[12px] text-muted-foreground">
              Necessário para receber alertas críticos por SMS (faltas, cancelamentos).
            </p>
          </div>
          {prefs.phoneVerified ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
              <ShieldCheck className="h-3.5 w-3.5" /> Verificado
            </span>
          ) : null}
        </header>

        {prefs.phoneVerified ? (
          <div className="flex items-center justify-between gap-3">
            <code className="text-sm tabular-nums">{prefs.phoneE164}</code>
            <Button size="sm" variant="outline" onClick={removePhone} disabled={phoneBusy}>
              Remover
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <Input
                placeholder="+351 912 345 678"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                disabled={otpSent || phoneBusy}
              />
              <Button size="sm" onClick={startVerification} disabled={phoneBusy || otpSent}>
                {phoneBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Enviar código"}
              </Button>
            </div>
            {otpSent && (
              <div className="grid grid-cols-[1fr_auto_auto] gap-2">
                <Input
                  placeholder="Código (6 dígitos)"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="tabular-nums tracking-widest text-center"
                  maxLength={6}
                />
                <Button size="sm" onClick={confirmCode} disabled={phoneBusy || otpCode.length !== 6}>
                  {phoneBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Confirmar"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setOtpSent(false);
                    setOtpCode("");
                  }}
                  disabled={phoneBusy}
                >
                  Cancelar
                </Button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Master switches */}
      <section className="rounded-xl border bg-card p-5 space-y-3">
        <h2 className="text-base font-semibold">Canais ativos</h2>
        <div className="space-y-3">
          {(
            [
              { key: "pushEnabled", label: "Notificações push", icon: Smartphone, desc: "No browser e dispositivos móveis." },
              { key: "emailEnabled", label: "Email", icon: Mail, desc: "Enviado para o teu email." },
              { key: "smsEnabled", label: "SMS", icon: MessageSquare, desc: prefs.phoneVerified ? "Para o teu número verificado." : "Verifica primeiro o teu número acima." },
            ] as const
          ).map(({ key, label, icon: Icon, desc }) => (
            <div key={key} className="flex items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <Icon className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-[13px] font-medium">{label}</p>
                  <p className="text-[11px] text-muted-foreground">{desc}</p>
                </div>
              </div>
              <Switch
                checked={prefs[key]}
                onCheckedChange={(v: boolean) => setPrefs((p) => ({ ...p, [key]: v }))}
                disabled={key === "smsEnabled" && !prefs.phoneVerified}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Quiet hours */}
      <section className="rounded-xl border bg-card p-5 space-y-3">
        <h2 className="text-base font-semibold">Horas de silêncio</h2>
        <p className="text-[12px] text-muted-foreground">
          Durante este intervalo, push/email/SMS não-urgentes são suprimidos. As notificações
          na app continuam visíveis quando entrares.
        </p>
        <div className="grid grid-cols-2 gap-3 max-w-md">
          <div className="space-y-1.5">
            <Label className="text-[12px]">Início</Label>
            <Input
              type="time"
              value={prefs.quietHoursStart ?? ""}
              onChange={(e) =>
                setPrefs((p) => ({ ...p, quietHoursStart: e.target.value || null }))
              }
              className="h-9 tabular-nums"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[12px]">Fim</Label>
            <Input
              type="time"
              value={prefs.quietHoursEnd ?? ""}
              onChange={(e) =>
                setPrefs((p) => ({ ...p, quietHoursEnd: e.target.value || null }))
              }
              className="h-9 tabular-nums"
            />
          </div>
        </div>
      </section>

      {/* Matrix */}
      <section className="rounded-xl border bg-card p-5 space-y-4">
        <header>
          <h2 className="text-base font-semibold">Por tipo de notificação</h2>
          <p className="text-[12px] text-muted-foreground">
            Escolhe em que canais queres receber cada tipo.
          </p>
        </header>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 pr-2 font-medium text-[12px] text-muted-foreground">
                  Categoria
                </th>
                {CHANNELS.map((c) => {
                  const enabled = c.available(prefs);
                  const Icon = c.icon;
                  return (
                    <th
                      key={c.value}
                      className={`px-2 py-2 text-center font-medium text-[12px] ${enabled ? "text-foreground" : "text-muted-foreground/50"}`}
                    >
                      <div className="inline-flex flex-col items-center gap-0.5">
                        <Icon className="h-3.5 w-3.5" />
                        <span>{c.label}</span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {CATEGORIES.map((cat) => {
                const channels = prefs[cat.key] as Channel[];
                return (
                  <tr key={cat.key} className="border-b last:border-0">
                    <td className="py-3 pr-2">
                      <div>
                        <p className="text-[13px] font-medium">{cat.label}</p>
                        <p className="text-[11px] text-muted-foreground">{cat.description}</p>
                      </div>
                    </td>
                    {CHANNELS.map((c) => {
                      const enabled = c.available(prefs);
                      const checked = channels.includes(c.value);
                      return (
                        <td key={c.value} className="px-2 py-3 text-center">
                          <div className="inline-flex">
                            <Checkbox
                              checked={checked}
                              onCheckedChange={() => toggleChannel(cat.key, c.value)}
                              disabled={!enabled}
                            />
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <div className="flex justify-end gap-2">
        <Button onClick={onSave} disabled={saveBusy || pending}>
          {saveBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Guardar preferências"}
        </Button>
      </div>
    </div>
  );
}
