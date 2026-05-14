import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { hasRole } from "@/lib/permissions";
import { NewPapForm } from "@/components/pap/new-pap-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function NewPapPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!hasRole(session.user.role, Role.CLASS_DIRECTOR)) redirect("/dashboard/pap");

  const [enrollments, teachers] = await Promise.all([
    prisma.enrollment.findMany({
      where: {
        status: "ACTIVE",
        class: {
          course: { schoolId: session.user.schoolId },
          academicYear: { active: true },
          ...(session.user.role === Role.CLASS_DIRECTOR ? { classDirectorId: session.user.id } : {}),
        },
      },
      include: {
        student: { select: { name: true } },
        class: { select: { name: true } },
      },
      orderBy: { student: { name: "asc" } },
    }),
    prisma.user.findMany({
      where: {
        schoolId: session.user.schoolId,
        role: { in: [Role.TEACHER, Role.CLASS_DIRECTOR, Role.COURSE_DIRECTOR] },
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
          <Link href="/dashboard/pap"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Nova PAP</h1>
          <p className="text-muted-foreground text-sm">Registar uma Prova de Aptidão Profissional</p>
        </div>
      </div>
      <NewPapForm enrollments={enrollments} teachers={teachers} />
    </div>
  );
}
