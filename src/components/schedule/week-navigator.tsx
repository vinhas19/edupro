"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { addDays, format, isSameWeek } from "date-fns";
import { pt } from "date-fns/locale";

interface Props {
  weekStart: Date;
}

export function WeekNavigator({ weekStart }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();

  function go(date: Date) {
    const params = new URLSearchParams(search?.toString() ?? "");
    params.set("week", format(date, "yyyy-MM-dd"));
    router.push(`${pathname}?${params.toString()}`);
  }

  function goToToday() {
    const params = new URLSearchParams(search?.toString() ?? "");
    params.delete("week");
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  const prev = addDays(weekStart, -7);
  const next = addDays(weekStart, 7);
  const friday = addDays(weekStart, 4);
  const isCurrentWeek = isSameWeek(weekStart, new Date(), { weekStartsOn: 1 });

  return (
    <div className="flex items-center gap-1.5 rounded-lg border bg-card px-2 py-1">
      <Button
        size="icon"
        variant="ghost"
        className="h-7 w-7"
        onClick={() => go(prev)}
        aria-label="Semana anterior"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
      </Button>
      <div className="min-w-[160px] text-center px-1">
        <p className="text-[12px] font-medium tabular-nums">
          {format(weekStart, "d MMM", { locale: pt })} – {format(friday, "d MMM yyyy", { locale: pt })}
        </p>
        {!isCurrentWeek && (
          <button
            type="button"
            onClick={goToToday}
            className="text-[10px] text-primary hover:underline inline-flex items-center gap-0.5"
          >
            <CalendarDays className="h-2.5 w-2.5" />
            Ir para esta semana
          </button>
        )}
        {isCurrentWeek && (
          <p className="text-[10px] text-muted-foreground">Esta semana</p>
        )}
      </div>
      <Button
        size="icon"
        variant="ghost"
        className="h-7 w-7"
        onClick={() => go(next)}
        aria-label="Semana seguinte"
      >
        <ChevronRight className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

