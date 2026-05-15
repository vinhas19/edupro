import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { hasRole } from "@/lib/permissions";

/**
 * Pode o utilizador criar/editar conteúdo (pastas, tarefas, ficheiros)
 * para a combinação (turma, disciplina)?
 *
 * Regras:
 *  - SUPER_ADMIN ou SCHOOL_ADMIN → sim
 *  - Diretor da turma → sim para qualquer disciplina da turma
 *  - Professor com SubjectAssignment(teacherId, subjectId, classId) → sim só para a sua disciplina
 *  - Restantes → não
 */
export async function canWriteToSubjectFolder(
  userId: string,
  userRole: Role,
  schoolId: string,
  classId: string,
  subjectId: string | null | undefined,
): Promise<boolean> {
  if (hasRole(userRole, Role.SCHOOL_ADMIN)) return true;

  const cls = await prisma.class.findUnique({
    where: { id: classId },
    include: { course: { select: { schoolId: true } } },
  });
  if (!cls || cls.course.schoolId !== schoolId) return false;

  if (cls.classDirectorId === userId) return true;

  if (!subjectId) return false;
  if (userRole !== Role.TEACHER && userRole !== Role.CLASS_DIRECTOR && userRole !== Role.COURSE_DIRECTOR) {
    return false;
  }

  const assignment = await prisma.subjectAssignment.findFirst({
    where: { teacherId: userId, classId, subjectId },
  });
  return !!assignment;
}

/**
 * Pode o utilizador ver o conteúdo da turma (lista de disciplinas/módulos/pastas)?
 *  - Aluno: tem de estar enrolled ACTIVE
 *  - EE: tem de estar ligado a um aluno enrolled ACTIVE
 *  - Professor/DT/admin: aplicam-se as regras de write OR estar a lecionar OUTRA disciplina da turma
 */
export async function canReadClass(
  userId: string,
  userRole: Role,
  schoolId: string,
  classId: string,
): Promise<boolean> {
  if (hasRole(userRole, Role.SCHOOL_ADMIN)) return true;

  const cls = await prisma.class.findUnique({
    where: { id: classId },
    include: { course: { select: { schoolId: true } } },
  });
  if (!cls || cls.course.schoolId !== schoolId) return false;

  if (userRole === Role.STUDENT) {
    const enr = await prisma.enrollment.findFirst({
      where: { classId, studentId: userId, status: "ACTIVE" },
    });
    return !!enr;
  }

  if (userRole === Role.GUARDIAN) {
    const wards = await prisma.guardianLink.findMany({
      where: { guardianId: userId },
      select: { studentId: true },
    });
    if (wards.length === 0) return false;
    const enr = await prisma.enrollment.findFirst({
      where: {
        classId,
        studentId: { in: wards.map((w) => w.studentId) },
        status: "ACTIVE",
      },
    });
    return !!enr;
  }

  // Teacher / DT / CourseDirector — must teach in the class or be DT
  if (cls.classDirectorId === userId) return true;
  const assignment = await prisma.subjectAssignment.findFirst({
    where: { teacherId: userId, classId },
  });
  return !!assignment;
}
