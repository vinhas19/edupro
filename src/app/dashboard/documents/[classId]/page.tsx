import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { canReadClass, visibleSubjectIds } from "@/lib/docs-permissions";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen } from "lucide-react";
import Link from "next/link";
import { COMPONENT_LABELS } from "@/lib/permissions";

export default async function ClassDocumentsPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { classId } = await params;

  const ok = await canReadClass(session.user.id, session.user.role, session.user.schoolId, classId);
  if (!ok) notFound();

  const visibleIds = await visibleSubjectIds(session.user.id, session.user.role, classId);

  const cls = await prisma.class.findUnique({
    where: { id: classId },
    include: {
      course: {
        include: {
          subjects: {
            where: visibleIds === "ALL" ? undefined : { id: { in: visibleIds } },
            include: { _count: { select: { modules: true } } },
            orderBy: { order: "asc" },
          },
        },
      },
    },
  });
  if (!cls) notFound();

  const COMPONENT_TINT: Record<string, string> = {
    SOCIOCULTURAL: "var(--tint-blue)",
    SCIENTIFIC: "var(--tint-purple)",
    TECHNICAL: "var(--tint-orange)",
    FCT: "var(--tint-teal)",
    PAP: "var(--tint-pink)",
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/documents"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--tint-purple)] mb-0.5">
            Documentos · {cls.course.name}
          </div>
          <h1 className="text-2xl sm:text-[28px] font-bold tracking-[-0.022em]">{cls.name}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {cls.course.subjects.map((s) => (
          <Link
            key={s.id}
            href={`/dashboard/documents/${classId}/${s.id}`}
            className="group rounded-[12px] bg-[var(--card)] p-4 shadow-[var(--card-shadow)] hover:bg-[var(--muted)]/40 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div
                className="h-10 w-10 rounded-[10px] flex items-center justify-center text-white shrink-0"
                style={{ background: COMPONENT_TINT[s.component] ?? "var(--tint-gray)" }}
              >
                <BookOpen className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[14px] font-semibold truncate">{s.name}</p>
                <p className="text-[11px] text-[var(--muted-foreground)] truncate">
                  {COMPONENT_LABELS[s.component]} · {s._count.modules} módulos
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
