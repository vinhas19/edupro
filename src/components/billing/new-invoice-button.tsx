"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  classes: { id: string; name: string; course: { name: string } }[];
}

export function NewInvoiceButton({ classes }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [classId, setClassId] = useState(classes[0]?.id ?? "");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [vatRate, setVatRate] = useState("0");
  const [dueDate, setDueDate] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!classId || !description.trim() || !amount || !dueDate) {
      toast.error("Preenche todos os campos.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/billing/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId,
          description: description.trim(),
          amount: parseFloat(amount),
          vatRate: parseFloat(vatRate),
          dueDate: new Date(dueDate).toISOString(),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(typeof data.error === "string" ? data.error : "Erro");
        return;
      }
      const data = await res.json();
      toast.success(`${data.created.length} faturas emitidas`);
      setOpen(false);
      setDescription(""); setAmount(""); setDueDate("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="mr-1.5 h-3.5 w-3.5" />Emitir em massa
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md rounded-[12px] bg-[var(--card)] shadow-[var(--card-shadow)] p-5 space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-[16px] font-semibold tracking-[-0.012em]">Emitir faturas a uma turma</h3>
              <button onClick={() => setOpen(false)} className="h-7 w-7 rounded-[6px] hover:bg-[var(--muted)] flex items-center justify-center">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <Label>Turma</Label>
              <Select value={classId} onValueChange={(v: string | null) => setClassId(v ?? "")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.course.name} · {c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-[var(--muted-foreground)]">
                Será emitida 1 factura por aluno matriculado activo.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="desc">Descrição</Label>
              <Input id="desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="ex: Propina Janeiro 2026" />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="amount">Valor (€)</Label>
                <Input id="amount" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="50.00" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="vat">IVA (%)</Label>
                <Input id="vat" type="number" step="0.01" value={vatRate} onChange={(e) => setVatRate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="due">Vencimento</Label>
                <Input id="due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={submit} disabled={busy}>
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Emitir"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
