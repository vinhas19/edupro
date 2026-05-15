import { cn } from "@/lib/utils";
import { LucideIcon, ArrowUp, ArrowDown } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  /** Apple tint CSS variable like "var(--tint-blue)" (default = blue) */
  tint?: string;
  trend?: { value: number; label?: string };
  className?: string;
  /** legacy prop kept for compatibility — overrides tint */
  iconClassName?: string;
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  tint = "var(--tint-blue)",
  trend,
  className,
  iconClassName,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1 min-h-[96px] p-4 rounded-[12px]",
        "bg-[var(--card)] text-[var(--card-foreground)]",
        "shadow-[var(--card-shadow)]",
        className
      )}
    >
      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            "w-7 h-7 rounded-[7px] flex items-center justify-center text-white shrink-0",
            iconClassName
          )}
          style={!iconClassName ? { background: tint } : undefined}
        >
          <Icon className="w-3.5 h-3.5" strokeWidth={2.2} />
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--muted-foreground)] truncate">
          {title}
        </span>
      </div>

      <div className="text-[28px] font-bold tracking-[-0.025em] tabular-nums leading-none mt-1">
        {value}
      </div>

      {description && (
        <div className="text-[12px] text-[var(--muted-foreground)]">{description}</div>
      )}

      {trend && (
        <div
          className={cn(
            "inline-flex items-center gap-0.5 text-[11px] font-semibold tabular-nums",
            trend.value >= 0 ? "text-[var(--tint-green)]" : "text-[var(--tint-red)]"
          )}
        >
          {trend.value >= 0 ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          )}
          {Math.abs(trend.value)}% {trend.label}
        </div>
      )}
    </div>
  );
}
