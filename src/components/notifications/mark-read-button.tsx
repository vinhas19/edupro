"use client";

import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function MarkReadButton({ receiptId }: { receiptId: string }) {
  const router = useRouter();

  const markRead = async () => {
    await fetch(`/api/notifications/read`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiptId }),
    });
    router.refresh();
  };

  return (
    <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={markRead} title="Marcar como lido">
      <Check className="h-3.5 w-3.5" />
    </Button>
  );
}
