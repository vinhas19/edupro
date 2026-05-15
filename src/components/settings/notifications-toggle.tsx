"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  publicKey: string | null;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const out = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) out[i] = rawData.charCodeAt(i);
  return out;
}

export function NotificationsToggle({ publicKey }: Props) {
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const ok = "serviceWorker" in navigator && "PushManager" in window && typeof Notification !== "undefined";
    setSupported(ok);
    if (!ok) return;
    navigator.serviceWorker.getRegistration().then((reg) => {
      reg?.pushManager.getSubscription().then((sub) => setEnabled(!!sub));
    });
  }, []);

  async function enable() {
    if (!publicKey) {
      toast.error("Notificações push não estão configuradas no servidor.");
      return;
    }
    setBusy(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        toast.error("Permissão recusada.");
        return;
      }
      const reg = await navigator.serviceWorker.register("/sw.js");
      const keyBytes = urlBase64ToUint8Array(publicKey);
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: keyBytes.buffer.slice(0) as ArrayBuffer,
      });
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
      if (!res.ok) {
        toast.error("Não foi possível registar.");
        return;
      }
      setEnabled(true);
      toast.success("Notificações ativadas");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setEnabled(false);
      toast.success("Notificações desativadas");
    } finally {
      setBusy(false);
    }
  }

  if (!supported) {
    return (
      <p className="text-[12px] text-[var(--muted-foreground)]">
        Este navegador não suporta notificações push.
      </p>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-[13px] font-medium">Notificações push</p>
        <p className="text-[11px] text-[var(--muted-foreground)]">
          {enabled ? "Estás a receber notificações neste dispositivo." : "Recebe avisos sobre trabalhos, notas e mensagens."}
        </p>
      </div>
      {enabled ? (
        <Button size="sm" variant="outline" onClick={disable} disabled={busy}>
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><BellOff className="mr-1.5 h-3.5 w-3.5" />Desativar</>}
        </Button>
      ) : (
        <Button size="sm" onClick={enable} disabled={busy}>
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Bell className="mr-1.5 h-3.5 w-3.5" />Ativar</>}
        </Button>
      )}
    </div>
  );
}
