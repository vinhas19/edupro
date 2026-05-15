import { cn } from "@/lib/utils";

interface Props {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /** Reduce padding when card holds a list/table */
  flush?: boolean;
}

export function PanelCard({ title, action, children, className, flush }: Props) {
  return (
    <section
      className={cn(
        "bg-[var(--card)] text-[var(--card-foreground)] rounded-[12px] shadow-[var(--card-shadow)] flex flex-col",
        className
      )}
    >
      <header className="flex items-center justify-between gap-2 px-4 pt-3.5 pb-2">
        <h3 className="text-[13px] font-semibold tracking-[-0.005em]">{title}</h3>
        {action}
      </header>
      <div className={cn(flush ? "px-0 pb-0" : "px-4 pb-4", "flex-1")}>{children}</div>
    </section>
  );
}
