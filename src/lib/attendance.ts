/**
 * Regula n.º 235-A/2018: máximo de 10% de faltas injustificadas
 * e mínimo de 90% de assiduidade para aprovação.
 * Calcula limites por módulo (horas do módulo × blocos/h).
 */

export function calcAbsenceLimit(totalHours: number, pct = 0.1): number {
  // arredondado por excesso (limite de faltas permitido)
  return Math.ceil(totalHours * pct);
}

export function calcMinAttendance(totalHours: number, pct = 0.9): number {
  // arredondado por defeito (mínimo de horas de assiduidade)
  return Math.floor(totalHours * pct);
}

export function getAbsenceRisk(
  absences: number,
  totalHours: number,
  pct = 0.1
): "ok" | "warning" | "exceeded" {
  const limit = calcAbsenceLimit(totalHours, pct);
  const oneThird = Math.ceil(limit / 3);
  if (absences >= limit) return "exceeded";
  if (absences >= oneThird) return "warning";
  return "ok";
}

export function calcFinalGrade(components: {
  fsc: number; // Formação Sociocultural
  fc: number;  // Formação Científica
  ft: number;  // Formação Técnica/Tecnológica
  fct: number; // FCT
  pap: number; // PAP
}): number {
  const raw =
    0.22 * components.fsc +
    0.22 * components.fc +
    0.22 * components.ft +
    0.11 * components.fct +
    0.23 * components.pap;
  return Math.round(raw);
}
