import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { hasRole } from "@/lib/permissions";
import { EditClassForm } from "@/components/classes/edit-class-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function EditClassPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!hasRole(session.user.role, Role.SCHOOL_ADMIN)) redirect("/dashboard");

  const cls = await prisma.class.findUnique({
    where: { id },
    include: { course: true },
  });
  if (!cls || cls.course.schoolId !== session.user.schoolId) notFound();

  const [directors, years] = await Promise.all([
    prisma.user.findMany({
      where: {
        schoolId: session.user.schoolId,
        role: { in: [Role.CLASS_DIRECTOR, Role.TEACHER, Role.COURSE_DIRECTOR] },
        active: true,
      },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.academicYear.findMany({
      where: { schoolId: session.user.schoolId },
      select: { id: true, label: true },
      orderBy: { startDate: "desc" },
    }),
  ]);

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/classes/${id}`}><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Editar Turma</h1>
          <p className="text-muted-foreground text-sm">{cls.name}</p>
        </div>
      </div>
      <EditClassForm
        cls={{
          id: cls.id,
          name: cls.name,
          year: cls.year,
          classDirectorId: cls.classDirectorId,
          academicYearId: cls.academicYearId,
        }}
        directors={directors}
        years={years}
      />
    </div>
  );
}
