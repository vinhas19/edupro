import { Role } from "@prisma/client";

export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: "Super Administrador",
  SCHOOL_ADMIN: "Administrador",
  COURSE_DIRECTOR: "Diretor de Curso",
  CLASS_DIRECTOR: "Diretor de Turma",
  TEACHER: "Professor",
  STUDENT: "Aluno",
};

export const ROLE_HIERARCHY: Record<Role, number> = {
  SUPER_ADMIN: 6,
  SCHOOL_ADMIN: 5,
  COURSE_DIRECTOR: 4,
  CLASS_DIRECTOR: 3,
  TEACHER: 2,
  STUDENT: 1,
};

export function hasRole(userRole: Role, requiredRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export function isStaff(role: Role): boolean {
  return hasRole(role, Role.TEACHER);
}

export function isAdmin(role: Role): boolean {
  return hasRole(role, Role.SCHOOL_ADMIN);
}

export function canManageClasses(role: Role): boolean {
  return hasRole(role, Role.CLASS_DIRECTOR);
}

export function canManageCourses(role: Role): boolean {
  return hasRole(role, Role.COURSE_DIRECTOR);
}

// Module status display
export const MODULE_STATUS_LABELS = {
  NOT_STARTED: "Não Iniciado",
  IN_PROGRESS: "Em Curso",
  COMPLETED: "Concluído",
  RECURSO: "Em Recurso",
  SPECIAL_EPOCH: "Época Especial",
  APPROVED: "Aprovado",
  FAILED: "Reprovado",
} as const;

export const MODULE_STATUS_COLORS = {
  NOT_STARTED: "bg-gray-100 text-gray-600",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-green-100 text-green-700",
  RECURSO: "bg-yellow-100 text-yellow-700",
  SPECIAL_EPOCH: "bg-orange-100 text-orange-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  FAILED: "bg-red-100 text-red-700",
} as const;

export const ATTENDANCE_LABELS = {
  PRESENT: "Presente",
  ABSENT: "Falta",
  JUSTIFIED: "Falta Justificada",
  LATE: "Atraso",
} as const;

export const COMPONENT_LABELS = {
  SOCIOCULTURAL: "Sociocultural",
  SCIENTIFIC: "Científica",
  TECHNICAL: "Técnica/Tecnológica",
  FCT: "FCT",
  PAP: "PAP",
} as const;

export const PAP_STATUS_LABELS = {
  PROPOSAL: "Proposta",
  DEVELOPMENT: "Desenvolvimento",
  SUBMITTED: "Entregue",
  PRESENTATION: "Apresentação",
  COMPLETED: "Concluído",
  FAILED: "Reprovado",
} as const;

export const FCT_STATUS_LABELS = {
  PLANNED: "Planeado",
  ONGOING: "Em Curso",
  COMPLETED: "Concluído",
  CANCELLED: "Cancelado",
} as const;
