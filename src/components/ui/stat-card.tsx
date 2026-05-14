import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  className?: string;
  iconClassName?: string;
}

export function StatCard({ title, value, description, icon: Icon, trend, className, iconClassName }: StatCardProps) {
  return (
    <div className={cn("rounded-xl border bg-white p-6 shadow-sm", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
          {trend && (
            <p className={cn("text-xs font-medium", trend.value >= 0 ? "text-green-600" : "text-red-500")}>
              {trend.value >= 0 ? "+" : ""}{trend.value}% {trend.label}
            </p>
          )}
        </div>
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50", iconClassName)}>
          <Icon className="h-5 w-5 text-blue-600" />
        </div>
      </div>
    </div>
  );
}
