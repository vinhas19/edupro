import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { canReadClass, canWriteToSubjectFolder } from "@/lib/docs-permissions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FolderClosed, ClipboardCheck } from "lucide-react";
import Link from "next/link";
import { FileRow } from "@/components/files/file-row";
import { R2UploadButton } from "@/components/files/r2-upload-button";
import { NewFolderButton } from "@/components/documents/new-folder-button";
import { NewTaskButton } from "@/components/documents/new-task-button";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

export default async function ModuleDocumentsPage({
  params,
}: {
  params: Promise<{ classId: string; subjectId: string; moduleId: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { classId, subjectId, moduleId } = await params;

  const ok = await canReadClass(session.user.id, session.user.role, session.user.schoolId, classId);
  if (!ok) notFound();

  const [cls, subject, mod] = await Promise.all([
    prisma.class.findUnique({ where: { id: classId }, select: { id: true, name: true } }),
    prisma.subject.findUnique({ where: { id: subjectId }, select: { id: true, name: true } }),
    prisma.module.findUnique({ where: { id: moduleId }, select: { id: true, name: true, number: true, subjectId: true } }),
  ]);
  if (!cls || !subject || !mod || mod.subjectId !== subjectId) notFound();

  const canWrite = await canWriteToSubjectFolder(
    session.user.id,
    session.user.role,
    session.user.schoolId,
    classId,
    subjectId,
  );

  // Folders at root of this module (parentId null)
  const folders = await prisma.folder.findMany({
    where: { classId, subjectId, moduleId, parentId: null },
    include: { _count: { select: { files: true, children: true } } },
    orderBy: { name: "asc" },
  });

  // Files directly in this module (no sub-folder)
  const files = await prisma.file.findMany({
    where: { classId, subjectId, moduleId, folderId: null, visibility: "CLASS_SHARED" },
    include: { owner: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  // Tasks (assignments) in this module
  const tasks = await prisma.classroomPost.findMany({
    where: { classId, subjectId, moduleId, type: "ASSIGNMENT" },
    include: { _count: { select: { submissions: true } } },
    orderBy: { createdAt: "desc" },
  });

  // Student's own submissions for these tasks
  const ownSubmissions =
    session.user.role === "STUDENT"
      ? await prisma.submission.findMany({
          where: {
            studentId: session.user.id,
            postId: { in: tasks.map((t) => t.id) },
          },
          select: { postId: true, status: true, grade: true },
        })
      : [];
  const subByPost = new Map(ownSubmissions.map((s) => [s.postId, s]));

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/dashboard/documents/${classId}/${subjectId}`}><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--tint-purple)] mb-0.5">
              {cls.name} · {subject.name}
            </div>
            <h1 className="text-2xl sm:text-[28px] font-bold tracking-[-0.022em]">
              M{mod.number} — {mod.name}
            </h1>
          </div>
        </div>
        {canWrite && (
          <div className="flex gap-2 flex-wrap">
            <NewFolderButton classId={classId} subjectId={subjectId} moduleId={moduleId} />
            <NewTaskButton classId={classId} subjectId={subjectId} moduleId={moduleId} />
            <R2UploadButton
              visibility="CLASS_SHARED"
              classId={classId}
              subjectId={subjectId}
              moduleId={moduleId}
              size="sm"
              label="Carregar ficheiro"
            />
          </div>
        )}
      </div>

      {tasks.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.04em] text-[var(--muted-foreground)]">
            Tarefas
          </h2>
          <ul className="space-y-2">
            {tasks.map((t) => {
              const overdue = t.dueDate ? new Date() > t.dueDate : false;
              const own = subByPost.get(t.id);
              return (
                <li key={t.id}>
                  <Link
                    href={`/dashboard/documents/task/${t.id}`}
                    className="flex items-center gap-3 rounded-[12px] bg-[var(--card)] p-3.5 shadow-[var(--card-shadow)] hover:bg-[var(--muted)]/40 transition-colors"
                  >
                    <div
                      className="h-10 w-10 rounded-[10px] flex items-center justify-center text-white shrink-0"
                      style={{ background: "var(--tint-orange)" }}
                    >
                      <ClipboardCheck className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold truncate">{t.title}</p>
                      <p className="text-[11px] text-[var(--muted-foreground)] tabular-nums">
                        {t.dueDate
                          ? `Entrega até ${format(t.dueDate, "d 'de' MMM yyyy, HH:mm", { locale: pt })}`
                          : "Sem prazo"}
                        {t.maxGrade != null && ` · até ${t.maxGrade} valores`}
                        {t.countsForModule && " · conta para módulo"}
                      </p>
                    </div>
                    {own ? (
                      <Badge
                        variant="outline"
                        style={{
                          color:
                            own.status === "GRADED" ? "var(--tint-green)"
                            : own.status === "LATE" ? "var(--tint-orange)"
                            : own.status === "SUBMITTED" ? "var(--tint-blue)"
                            : "var(--muted-foreground)",
                        }}
                      >
                        {own.status === "GRADED"
                          ? `Avaliada · ${own.grade?.toFixed(1) ?? "-"}`
                          : own.status === "SUBMITTED"
                            ? "Entregue"
                            : own.status === "LATE"
                              ? "Atrasada"
                              : "Por entregar"}
                      </Badge>
                    ) : canWrite ? (
                      <Badge variant="outline" className="text-[var(--muted-foreground)]">
                        {t._count.submissions} entregas
                      </Badge>
                    ) : overdue ? (
                      <Badge variant="outline" className="text-[var(--destructive)]">Prazo expirado</Badge>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {folders.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.04em] text-[var(--muted-foreground)]">
            Pastas
          </h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {folders.map((f) => (
              <li key={f.id}>
                <Link
                  href={`/dashboard/documents/${classId}/${subjectId}/${moduleId}/folder/${f.id}`}
                  className="flex items-center gap-3 rounded-[12px] bg-[var(--card)] p-4 shadow-[var(--card-shadow)] hover:bg-[var(--muted)]/40 transition-colors"
                >
                  <FolderClosed className="h-5 w-5 text-[var(--tint-yellow)] shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-semibold truncate">{f.name}</p>
                    <p className="text-[11px] text-[var(--muted-foreground)]">
                      {f._count.files} ficheiro{f._count.files !== 1 ? "s" : ""}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-2">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.04em] text-[var(--muted-foreground)]">
          Ficheiros
        </h2>
        {files.length === 0 ? (
          <div className="rounded-[12px] bg-[var(--card)] p-6 shadow-[var(--card-shadow)] text-center text-[13px] text-[var(--muted-foreground)]">
            Sem ficheiros neste módulo.
          </div>
        ) : (
          <div className="space-y-1.5">
            {files.map((f) => (
              <FileRow
                key={f.id}
                {...f}
                ownerName={f.owner.name}
                canDelete={canWrite || f.ownerId === session.user.id}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
