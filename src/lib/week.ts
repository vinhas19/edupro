import { startOfWeek } from "date-fns";

/**
 * Devolve a segunda-feira (início da semana) da data passada via search param.
 * Se inválido ou vazio, devolve a segunda-feira da semana atual.
 */
export function getWeekStartFromSearchParams(weekParam?: string): Date {
  if (weekParam) {
    const d = new Date(weekParam);
    if (!isNaN(d.getTime())) return startOfWeek(d, { weekStartsOn: 1 });
  }
  return startOfWeek(new Date(), { weekStartsOn: 1 });
}
