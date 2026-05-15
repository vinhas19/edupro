import Link from "next/link";
import { LucideIcon } from "lucide-react";

export interface QuickAction {
  label: string;
  href: string;
  icon: LucideIcon;
  tint: string;
}

export function QuickActions({ actions }: { actions: QuickAction[] }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {actions.map((a) => (
        <Link
          key={a.href}
          href={a.href}
          className="flex items-center gap-2.5 rounded-[10px] p-2.5 hover:bg-[var(--muted)] transition-colors"
        >
          <span
            className="h-8 w-8 rounded-[7px] flex items-center justify-center text-white shrink-0"
            style={{ background: a.tint }}
          >
            <a.icon className="h-4 w-4" strokeWidth={2.2} />
          </span>
          <span className="text-[13px] font-medium leading-tight">{a.label}</span>
        </Link>
      ))}
    </div>
  );
}
