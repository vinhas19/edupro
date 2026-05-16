"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface Props {
  receiptId: string;
  /** Quando true, mostra apenas o ícone (uso compacto). Default false. */
  iconOnly?: boolean;
}

export function MarkReadButton({ receiptId, iconOnly = false }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function markRead() {
    setBusy(true);
    try {
      await fetch(`/api/notifications/read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiptId }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (iconOnly) {
    return (
      <button
        type="button"
        onClick={markRead}
        disabled={busy}
        title="Marcar como lida"
        className="shrink-0 inline-flex h-7 w-7 items-center justify-center rounded-full border border-blue-200 bg-white text-blue-600 hover:bg-blue-50 disabled:opacity-50 transition-colors"
      >
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={markRead}
      disabled={busy}
      className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-white px-3 py-1 text-[12px] font-medium text-blue-700 hover:bg-blue-50 disabled:opacity-50 transition-colors"
    >
      {busy ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <Check className="h-3 w-3" />
      )}
      Marcar lida
    </button>
  );
}

export function MarkAllReadButton({ count }: { count: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function markAll() {
    setBusy(true);
    try {
      await fetch(`/api/notifications/read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (count === 0) return null;

  return (
    <button
      type="button"
      onClick={markAll}
      disabled={busy}
      className="inline-flex items-center gap-1.5 rounded-lg border bg-white px-3 py-1.5 text-[12px] font-medium hover:bg-muted disabled:opacity-50 transition-colors"
    >
      {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
      Marcar todas como lidas
    </button>
  );
}
