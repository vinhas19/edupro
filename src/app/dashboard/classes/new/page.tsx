import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { hasRole } from "@/lib/permissions";
import { NewClassForm } from "@/components/classes/new-class-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function NewClassPage({
  searchParams,
}: {
  searchParams: Promise<{ courseId?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!hasRole(session.user.role, Role.SCHOOL_ADMIN)) redirect("/dashboard");

  const { courseId } = await searchParams;

  const [courses, years, directors] = await Promise.all([
    prisma.course.findMany({
      where: { schoolId: session.user.schoolId, active: true },
      select: { id: true, name: true, code: true },
      orderBy: { name: "asc" },
    }),
    prisma.academicYear.findMany({
      where: { schoolId: session.user.schoolId },
      select: { id: true, label: true, active: true },
      orderBy: [{ active: "desc" }, { startDate: "desc" }],
    }),
    prisma.user.findMany({
      where: {
        schoolId: session.user.schoolId,
        role: { in: [Role.CLASS_DIRECTOR, Role.TEACHER, Role.COURSE_DIRECTOR] },
        active: true,
      },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/classes"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Nova Turma</h1>
          <p className="text-muted-foreground text-sm">Criar uma turma no ano letivo</p>
        </div>
      </div>
      <NewClassForm courses={courses} years={years} directors={directors} defaultCourseId={courseId} />
    </div>
  );
}
