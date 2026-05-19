"use client";

import { usePathname } from "next/navigation";
import { TweaksPopover } from "@/components/layout/tweaks-popover";

export function FloatingTweaks() {
  const pathname = usePathname();
  // The dashboard already exposes the same popover in its topbar; don't duplicate.
  if (pathname?.startsWith("/dashboard")) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-[110] rounded-full bg-[var(--card)] border border-[var(--border)] p-1 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.15),0_1px_3px_rgba(0,0,0,0.08)]"
    >
      <TweaksPopover />
    </div>
  );
}
