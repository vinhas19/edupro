import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { canReadClass, canWriteToSubjectFolder } from "@/lib/docs-permissions";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FolderClosed } from "lucide-react";
import Link from "next/link";

export default async function SubjectDocumentsPage({
  params,
}: {
  params: Promise<{ classId: string; subjectId: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { classId, subjectId } = await params;

  const ok = await canReadClass(session.user.id, session.user.role, session.user.schoolId, classId);
  if (!ok) notFound();

  const [cls, subject] = await Promise.all([
    prisma.class.findUnique({ where: { id: classId }, select: { id: true, name: true } }),
    prisma.subject.findUnique({
      where: { id: subjectId },
      include: {
        modules: { orderBy: { number: "asc" } },
        course: { select: { schoolId: true } },
      },
    }),
  ]);
  if (!cls || !subject || subject.course.schoolId !== session.user.schoolId) notFound();

  const canWrite = await canWriteToSubjectFolder(
    session.user.id,
    session.user.role,
    session.user.schoolId,
    classId,
    subjectId,
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/documents/${classId}`}><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--tint-purple)] mb-0.5">
            {cls.name} · Documentos
          </div>
          <h1 className="text-2xl sm:text-[28px] font-bold tracking-[-0.022em]">{subject.name}</h1>
          {canWrite && (
            <p className="text-[12px] text-[var(--tint-green)] mt-1">
              Podes adicionar conteúdo a esta disciplina.
            </p>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.04em] text-[var(--muted-foreground)] mb-2">
          Módulos
        </h2>
        {subject.modules.length === 0 ? (
          <div className="rounded-[12px] bg-[var(--card)] p-6 shadow-[var(--card-shadow)] text-center text-[13px] text-[var(--muted-foreground)]">
            Esta disciplina ainda não tem módulos definidos.
          </div>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {subject.modules.map((m) => (
              <li key={m.id}>
                <Link
                  href={`/dashboard/documents/${classId}/${subjectId}/${m.id}`}
                  className="group flex items-center gap-3 rounded-[12px] bg-[var(--card)] p-4 shadow-[var(--card-shadow)] hover:bg-[var(--muted)]/40 transition-colors"
                >
                  <div
                    className="h-10 w-10 rounded-[10px] flex items-center justify-center text-white shrink-0 text-[13px] font-bold tabular-nums"
                    style={{ background: "var(--tint-indigo)" }}
                  >
                    M{m.number}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[14px] font-semibold truncate">{m.name}</p>
                    <p className="text-[11px] text-[var(--muted-foreground)]">{m.hours}h</p>
                  </div>
                  <FolderClosed className="h-4 w-4 text-[var(--muted-foreground)] ml-auto" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
