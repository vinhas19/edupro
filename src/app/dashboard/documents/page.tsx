import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { hasRole } from "@/lib/permissions";
import { Card, CardContent } from "@/components/ui/card";
import { FolderOpen, GraduationCap } from "lucide-react";
import Link from "next/link";

export default async function DocumentsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id: userId, role, schoolId } = session.user;
  const isAdmin = hasRole(role, Role.SCHOOL_ADMIN);

  // Determine which classes the user can see
  let where: Parameters<typeof prisma.class.findMany>[0] = {
    where: { course: { schoolId } },
  };
  if (role === Role.STUDENT) {
    where = {
      where: {
        course: { schoolId },
        enrollments: { some: { studentId: userId, status: "ACTIVE" } },
      },
    };
  } else if (role === Role.GUARDIAN) {
    const wards = await prisma.guardianLink.findMany({
      where: { guardianId: userId },
      select: { studentId: true },
    });
    if (wards.length === 0) {
      return (
        <div className="space-y-5 max-w-3xl">
          <h1 className="text-2xl font-bold tracking-[-0.022em]">Documentos</h1>
          <p className="text-[13px] text-[var(--muted-foreground)]">Sem educandos ligados.</p>
        </div>
      );
    }
    where = {
      where: {
        course: { schoolId },
        enrollments: { some: { studentId: { in: wards.map((w) => w.studentId) }, status: "ACTIVE" } },
      },
    };
  } else if (!isAdmin) {
    // Teacher / DT / CourseDirector: only classes they teach or direct
    where = {
      where: {
        course: { schoolId },
        OR: [
          { subjectAssignments: { some: { teacherId: userId } } },
          { classDirectorId: userId },
        ],
      },
    };
  }

  const classes = await prisma.class.findMany({
    ...where,
    include: {
      course: { select: { id: true, name: true, code: true } },
      academicYear: { select: { label: true, active: true } },
      _count: { select: { enrollments: true } },
    },
    orderBy: [{ year: "asc" }, { name: "asc" }],
  });

  return (
    <div className="space-y-5">
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--tint-purple)] mb-1">
          Documentos
        </div>
        <h1 className="text-2xl sm:text-[28px] font-bold tracking-[-0.022em]">As tuas turmas</h1>
        <p className="text-[13px] text-[var(--muted-foreground)]">
          Cada turma tem pastas automáticas por disciplina e módulo. Os professores podem criar sub-pastas e tarefas dentro de cada módulo.
        </p>
      </div>

      {classes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-[13px] text-[var(--muted-foreground)]">
            <FolderOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
            Sem turmas para mostrar.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {classes.map((c) => (
            <Link
              key={c.id}
              href={`/dashboard/documents/${c.id}`}
              className="group rounded-[12px] bg-[var(--card)] p-4 shadow-[var(--card-shadow)] hover:bg-[var(--muted)]/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className="h-10 w-10 rounded-[10px] flex items-center justify-center text-white shrink-0"
                  style={{ background: "var(--tint-blue)" }}
                >
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold truncate">{c.name}</p>
                  <p className="text-[11px] text-[var(--muted-foreground)] truncate">
                    {c.course.name} · {c._count.enrollments} alunos
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
