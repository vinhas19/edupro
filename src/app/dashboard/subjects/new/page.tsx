import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { hasRole } from "@/lib/permissions";
import { NewSubjectForm } from "@/components/subjects/new-subject-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function NewSubjectPage({
  searchParams,
}: {
  searchParams: Promise<{ courseId?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!hasRole(session.user.role, Role.SCHOOL_ADMIN)) redirect("/dashboard");

  const { courseId } = await searchParams;

  const courses = await prisma.course.findMany({
    where: { schoolId: session.user.schoolId, active: true },
    select: { id: true, name: true, code: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={courseId ? `/dashboard/courses/${courseId}` : "/dashboard/subjects"}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Nova Disciplina</h1>
          <p className="text-muted-foreground text-sm">Adicionar disciplina a um curso</p>
        </div>
      </div>
      <NewSubjectForm courses={courses} defaultCourseId={courseId} />
    </div>
  );
}
