import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { hasRole } from "@/lib/permissions";
import { NewLessonForm } from "@/components/lessons/new-lesson-form";

export default async function NewLessonPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!hasRole(session.user.role, Role.TEACHER)) redirect("/dashboard");

  const { id: userId, role, schoolId } = session.user;

  const assignments = await prisma.subjectAssignment.findMany({
    where: {
      teacherId: userId,
      class: { academicYear: { active: true } },
    },
    include: {
      subject: true,
      class: true,
    },
    orderBy: { class: { name: "asc" } },
  });

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Registar Aula / Sumário</h1>
        <p className="text-muted-foreground">Registe o sumário e as presenças da aula</p>
      </div>
      <NewLessonForm assignments={assignments} teacherId={userId} />
    </div>
  );
}
