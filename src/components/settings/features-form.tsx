"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, ClipboardList, Receipt } from "lucide-react";
import { toast } from "sonner";

interface Props {
  initial: {
    featurePautas: boolean;
    featureEnrollment: boolean;
    featureBilling: boolean;
    billingVatId: string | null;
    billingAddress: string | null;
  };
}

export function FeaturesForm({ initial }: Props) {
  const router = useRouter();
  const [pautas, setPautas] = useState(initial.featurePautas);
  const [enrollment, setEnrollment] = useState(initial.featureEnrollment);
  const [billing, setBilling] = useState(initial.featureBilling);
  const [vatId, setVatId] = useState(initial.billingVatId ?? "");
  const [address, setAddress] = useState(initial.billingAddress ?? "");
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();

  async function save() {
    setBusy(true);
    try {
      const res = await fetch("/api/school", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          featurePautas: pautas,
          featureEnrollment: enrollment,
          featureBilling: billing,
          billingVatId: vatId.trim() || null,
          billingAddress: address.trim() || null,
        }),
      });
      if (!res.ok) {
        toast.error("Não foi possível guardar.");
        return;
      }
      toast.success("Módulos atualizados");
      startTransition(() => router.refresh());
    } finally {
      setBusy(false);
    }
  }

  const ROWS = [
    {
      key: "pautas",
      icon: FileText,
      tint: "var(--tint-blue)",
      title: "Pautas oficiais em PDF",
      description: "Exportação de pautas finais por turma/disciplina, prontas a entregar ao IEFP/ANQEP.",
      value: pautas,
      onChange: setPautas,
    },
    {
      key: "enrollment",
      icon: ClipboardList,
      tint: "var(--tint-orange)",
      title: "Inscrições/matrículas online",
      description: "Formulário público de candidatura + revisão pela escola + conversão automática em aluno matriculado.",
      value: enrollment,
      onChange: setEnrollment,
    },
    {
      key: "billing",
      icon: Receipt,
      tint: "var(--tint-green)",
      title: "Faturação de propinas",
      description: "Emissão de faturas mensais, registo manual de pagamentos (Multibanco/MBWAY/transferência) e portal do aluno.",
      value: billing,
      onChange: setBilling,
    },
  ];

  return (
    <div className="space-y-3">
      {ROWS.map((row) => (
        <div key={row.key} className="flex items-start gap-3 rounded-[10px] border border-[var(--separator)] p-3">
          <div
            className="h-10 w-10 rounded-[10px] flex items-center justify-center text-white shrink-0"
            style={{ background: row.tint }}
          >
            <row.icon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-semibold">{row.title}</p>
            <p className="text-[12px] text-[var(--muted-foreground)]">{row.description}</p>
          </div>
          <Switch checked={row.value} onCheckedChange={row.onChange} />
        </div>
      ))}

      {billing && (
        <div className="rounded-[10px] border border-[var(--separator)] p-3 space-y-2 bg-[var(--accent)]/30">
          <p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--accent-foreground)]">
            Dados de faturação
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-2">
            <div className="space-y-1">
              <Label htmlFor="vat">NIF da escola</Label>
              <Input id="vat" value={vatId} onChange={(e) => setVatId(e.target.value)} placeholder="500000000" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="addr">Morada legal</Label>
              <Input id="addr" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Rua ... Nº ... 0000-000 Lisboa" />
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end pt-1">
        <Button size="sm" onClick={save} disabled={busy}>
          {busy ? "A guardar…" : "Guardar"}
        </Button>
      </div>
    </div>
  );
}
