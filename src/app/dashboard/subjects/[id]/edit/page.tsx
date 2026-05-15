import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { hasRole } from "@/lib/permissions";
import { EditSubjectForm } from "@/components/subjects/edit-subject-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function EditSubjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!hasRole(session.user.role, Role.SCHOOL_ADMIN)) redirect("/dashboard");

  const { id } = await params;

  const subject = await prisma.subject.findUnique({
    where: { id },
    include: {
      course: { select: { name: true, code: true, schoolId: true } },
      modules: { orderBy: { order: "asc" } },
    },
  });

  if (!subject || subject.course.schoolId !== session.user.schoolId) notFound();

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/subjects">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-[-0.022em]">Editar disciplina</h1>
          <p className="text-muted-foreground text-sm">{subject.name}</p>
        </div>
      </div>
      <EditSubjectForm
        subject={{
          id: subject.id,
          name: subject.name,
          code: subject.code,
          component: subject.component,
          totalHours: subject.totalHours,
          courseId: subject.courseId,
          course: { name: subject.course.name, code: subject.course.code },
          modules: subject.modules.map((m) => ({
            id: m.id,
            name: m.name,
            number: m.number,
            hours: m.hours,
            description: m.description,
          })),
        }}
      />
    </div>
  );
}
