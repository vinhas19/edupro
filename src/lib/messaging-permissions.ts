import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { hasRole } from "@/lib/permissions";

/**
 * Regras de quem pode mandar mensagem a quem:
 *
 *  ADMIN / SCHOOL_ADMIN / SUPER_ADMIN → toda a gente da escola
 *  COURSE_DIRECTOR  → toda a gente da escola (gestão de curso)
 *  CLASS_DIRECTOR (DT) → toda a gente da escola (gerem turma + são professores)
 *  TEACHER          → alunos das suas turmas + outros professores/DTs/admins + EE dos seus alunos
 *  STUDENT          → professores e DT da sua turma + admins
 *  GUARDIAN         → DT do filho + professores que lecionam ao filho + admins
 *
 * Regras simétricas: A pode mandar a B implica que B vê A na sua lista
 * (mas a permissão real é verificada no envio).
 */
export async function canSendMessage(
  senderId: string,
  senderRole: Role,
  recipientId: string,
  schoolId: string,
): Promise<boolean> {
  if (senderId === recipientId) return false;

  // Mesma escola obrigatório (já validado no caller normalmente)
  const recipient = await prisma.user.findUnique({
    where: { id: recipientId },
    select: { role: true, schoolId: true },
  });
  if (!recipient || recipient.schoolId !== schoolId) return false;

  // Admin / DirCurso → toda a gente
  if (hasRole(senderRole, Role.COURSE_DIRECTOR)) return true;

  // DT → toda a gente
  if (senderRole === Role.CLASS_DIRECTOR) return true;

  // Outro lado é admin/dir.curso → permitido (qualquer um pode contactar)
  if (hasRole(recipient.role, Role.COURSE_DIRECTOR)) return true;
  if (recipient.role === Role.CLASS_DIRECTOR) return true;

  // ── PROFESSOR ─────────────────────────────────────────────────────────
  if (senderRole === Role.TEACHER) {
    // Outro professor → permitido
    if (recipient.role === Role.TEACHER) return true;

    // Aluno → tem de ser de uma turma onde leciona
    if (recipient.role === Role.STUDENT) {
      const enr = await prisma.enrollment.findFirst({
        where: {
          studentId: recipientId,
          status: "ACTIVE",
          class: { subjectAssignments: { some: { teacherId: senderId } } },
        },
      });
      return !!enr;
    }

    // EE → tem de ser EE de um aluno seu
    if (recipient.role === Role.GUARDIAN) {
      const link = await prisma.guardianLink.findFirst({
        where: {
          guardianId: recipientId,
          student: {
            enrollments: {
              some: {
                status: "ACTIVE",
                class: { subjectAssignments: { some: { teacherId: senderId } } },
              },
            },
          },
        },
      });
      return !!link;
    }

    return false;
  }

  // ── ALUNO ─────────────────────────────────────────────────────────────
  if (senderRole === Role.STUDENT) {
    // Só pode contactar professor da sua turma (DT já foi tratado acima)
    if (recipient.role !== Role.TEACHER) return false;
    const assign = await prisma.subjectAssignment.findFirst({
      where: {
        teacherId: recipientId,
        class: { enrollments: { some: { studentId: senderId, status: "ACTIVE" } } },
      },
    });
    return !!assign;
  }

  // ── EE ────────────────────────────────────────────────────────────────
  if (senderRole === Role.GUARDIAN) {
    if (recipient.role !== Role.TEACHER) return false;
    // tem de lecionar/dirigir uma turma de um educando
    const wards = await prisma.guardianLink.findMany({
      where: { guardianId: senderId },
      select: { studentId: true },
    });
    if (wards.length === 0) return false;
    const studentIds = wards.map((w) => w.studentId);
    const assign = await prisma.subjectAssignment.findFirst({
      where: {
        teacherId: recipientId,
        class: { enrollments: { some: { studentId: { in: studentIds }, status: "ACTIVE" } } },
      },
    });
    return !!assign;
  }

  return false;
}

/**
 * Devolve a lista de utilizadores com quem o user pode iniciar uma conversa.
 * Usado para popular o autocomplete de "Nova conversa".
 */
export async function listMessageableUsers(
  userId: string,
  userRole: Role,
  schoolId: string,
): Promise<{ id: string; name: string; email: string; role: Role }[]> {
  const baseSelect = { id: true, name: true, email: true, role: true } as const;

  // Admin / DirCurso / DT → toda a gente da escola
  if (
    hasRole(userRole, Role.COURSE_DIRECTOR) ||
    userRole === Role.CLASS_DIRECTOR
  ) {
    return prisma.user.findMany({
      where: { schoolId, id: { not: userId }, active: true },
      select: baseSelect,
      orderBy: { name: "asc" },
    });
  }

  if (userRole === Role.TEACHER) {
    // Alunos das suas turmas + todos profs/DTs/admins + EE dos seus alunos
    const assigns = await prisma.subjectAssignment.findMany({
      where: { teacherId: userId },
      select: { classId: true },
    });
    const classIds = [...new Set(assigns.map((a) => a.classId))];

    const enrollments = await prisma.enrollment.findMany({
      where: { classId: { in: classIds }, status: "ACTIVE" },
      select: { studentId: true },
    });
    const studentIds = [...new Set(enrollments.map((e) => e.studentId))];

    const links = await prisma.guardianLink.findMany({
      where: { studentId: { in: studentIds } },
      select: { guardianId: true },
    });
    const guardianIds = [...new Set(links.map((l) => l.guardianId))];

    return prisma.user.findMany({
      where: {
        schoolId,
        id: { not: userId },
        active: true,
        OR: [
          { role: { in: [Role.SCHOOL_ADMIN, Role.COURSE_DIRECTOR, Role.CLASS_DIRECTOR, Role.TEACHER] } },
          { id: { in: studentIds } },
          { id: { in: guardianIds } },
        ],
      },
      select: baseSelect,
      orderBy: [{ role: "asc" }, { name: "asc" }],
    });
  }

  if (userRole === Role.STUDENT) {
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId: userId, status: "ACTIVE" },
      select: {
        class: {
          select: {
            classDirectorId: true,
            subjectAssignments: { select: { teacherId: true } },
          },
        },
      },
    });
    const teacherIds = new Set<string>();
    for (const e of enrollments) {
      if (e.class.classDirectorId) teacherIds.add(e.class.classDirectorId);
      for (const a of e.class.subjectAssignments) teacherIds.add(a.teacherId);
    }
    return prisma.user.findMany({
      where: {
        schoolId,
        active: true,
        OR: [
          { id: { in: [...teacherIds] } },
          { role: { in: [Role.SCHOOL_ADMIN, Role.COURSE_DIRECTOR] } },
        ],
      },
      select: baseSelect,
      orderBy: [{ role: "asc" }, { name: "asc" }],
    });
  }

  if (userRole === Role.GUARDIAN) {
    const wards = await prisma.guardianLink.findMany({
      where: { guardianId: userId },
      select: { studentId: true },
    });
    const studentIds = wards.map((w) => w.studentId);

    const enrollments = await prisma.enrollment.findMany({
      where: { studentId: { in: studentIds }, status: "ACTIVE" },
      select: {
        class: {
          select: {
            classDirectorId: true,
            subjectAssignments: { select: { teacherId: true } },
          },
        },
      },
    });
    const teacherIds = new Set<string>();
    for (const e of enrollments) {
      if (e.class.classDirectorId) teacherIds.add(e.class.classDirectorId);
      for (const a of e.class.subjectAssignments) teacherIds.add(a.teacherId);
    }
    return prisma.user.findMany({
      where: {
        schoolId,
        active: true,
        OR: [
          { id: { in: [...teacherIds] } },
          { role: { in: [Role.SCHOOL_ADMIN, Role.COURSE_DIRECTOR] } },
        ],
      },
      select: baseSelect,
      orderBy: [{ role: "asc" }, { name: "asc" }],
    });
  }

  return [];
}
