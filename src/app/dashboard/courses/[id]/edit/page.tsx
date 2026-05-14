import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { hasRole } from "@/lib/permissions";
import { EditCourseForm } from "@/components/courses/edit-course-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function EditCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!hasRole(session.user.role, Role.SCHOOL_ADMIN)) redirect("/dashboard");

  const course = await prisma.course.findUnique({ where: { id } });
  if (!course || course.schoolId !== session.user.schoolId) notFound();

  const directors = await prisma.user.findMany({
    where: {
      schoolId: session.user.schoolId,
      role: { in: [Role.COURSE_DIRECTOR, Role.SCHOOL_ADMIN] },
      active: true,
    },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/courses/${id}`}><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Editar Curso</h1>
          <p className="text-muted-foreground text-sm">{course.name}</p>
        </div>
      </div>
      <EditCourseForm course={course} directors={directors} />
    </div>
  );
}
