"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

const METHODS = [
  { v: "BANK_TRANSFER", l: "Transferência" },
  { v: "MULTIBANCO", l: "Multibanco" },
  { v: "MBWAY", l: "MB WAY" },
  { v: "CARD", l: "Cartão" },
  { v: "CASH", l: "Numerário" },
  { v: "CHECK", l: "Cheque" },
  { v: "OTHER", l: "Outro" },
];

export function NewPaymentButton({
  invoiceId,
  remaining,
  currency,
}: {
  invoiceId: string;
  remaining: number;
  currency: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(remaining.toFixed(2));
  const [method, setMethod] = useState("BANK_TRANSFER");
  const [reference, setReference] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    const n = parseFloat(amount);
    if (!n || n <= 0) {
      toast.error("Valor inválido.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/billing/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId, amount: n, method, reference: reference.trim() || undefined }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(typeof data.error === "string" ? data.error : "Erro");
        return;
      }
      toast.success("Pagamento registado");
      setOpen(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />Registar pagamento
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md rounded-[12px] bg-[var(--card)] shadow-[var(--card-shadow)] p-5 space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-[16px] font-semibold tracking-[-0.012em]">Registar pagamento</h3>
              <button onClick={() => setOpen(false)} className="h-7 w-7 rounded-[6px] hover:bg-[var(--muted)] flex items-center justify-center">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="amount">Valor ({currency})</Label>
                <Input id="amount" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Método</Label>
                <Select value={method} onValueChange={(v: string | null) => setMethod(v ?? "BANK_TRANSFER")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {METHODS.map((m) => <SelectItem key={m.v} value={m.v}>{m.l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ref">Referência (opcional)</Label>
              <Input id="ref" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="ex: ID transferência, número de cheque" />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={submit} disabled={busy}>
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Registar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
