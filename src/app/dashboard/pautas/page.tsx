import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { hasRole } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FileSpreadsheet, Printer } from "lucide-react";

export default async function PautasPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!hasRole(session.user.role, Role.CLASS_DIRECTOR)) redirect("/dashboard");

  const school = await prisma.school.findUnique({
    where: { id: session.user.schoolId },
    select: { featurePautas: true },
  });
  if (!school?.featurePautas) notFound();

  const classes = await prisma.class.findMany({
    where: {
      course: { schoolId: session.user.schoolId },
      academicYear: { active: true },
      ...(session.user.role === Role.CLASS_DIRECTOR && !hasRole(session.user.role, Role.SCHOOL_ADMIN)
        ? { classDirectorId: session.user.id }
        : {}),
    },
    include: {
      course: { select: { name: true, code: true } },
      _count: { select: { enrollments: true } },
    },
    orderBy: [{ year: "asc" }, { name: "asc" }],
  });

  return (
    <div className="space-y-5">
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--tint-blue)] mb-1">
          Administração
        </div>
        <h1 className="text-2xl sm:text-[28px] font-bold tracking-[-0.022em]">Pautas oficiais</h1>
        <p className="text-[13px] text-[var(--muted-foreground)]">
          Exporta as pautas finais em PDF para entregar ao IEFP / ANQEP.
        </p>
      </div>

      {classes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-[13px] text-[var(--muted-foreground)]">
            Sem turmas no ano lectivo ativo.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {classes.map((c) => (
            <Card key={c.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{c.name}</CardTitle>
                    <p className="text-[12px] text-[var(--muted-foreground)]">
                      {c.course.name} · {c._count.enrollments} alunos
                    </p>
                  </div>
                  <FileSpreadsheet className="h-5 w-5 text-[var(--tint-blue)]" />
                </div>
              </CardHeader>
              <CardContent>
                <Button size="sm" asChild>
                  <Link href={`/print/pautas/${c.id}`} target="_blank">
                    <Printer className="mr-1.5 h-3.5 w-3.5" />Gerar pauta
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
