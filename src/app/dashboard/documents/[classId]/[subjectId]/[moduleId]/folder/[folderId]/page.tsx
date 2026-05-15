import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { canReadClass, canWriteToSubjectFolder } from "@/lib/docs-permissions";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FolderClosed } from "lucide-react";
import Link from "next/link";
import { FileRow } from "@/components/files/file-row";
import { R2UploadButton } from "@/components/files/r2-upload-button";
import { NewFolderButton } from "@/components/documents/new-folder-button";
import { FolderDeleteButton } from "@/components/documents/folder-delete-button";

export default async function FolderDocumentsPage({
  params,
}: {
  params: Promise<{ classId: string; subjectId: string; moduleId: string; folderId: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { classId, subjectId, moduleId, folderId } = await params;

  const ok = await canReadClass(session.user.id, session.user.role, session.user.schoolId, classId);
  if (!ok) notFound();

  const folder = await prisma.folder.findUnique({
    where: { id: folderId },
    include: {
      class: { select: { name: true } },
      subject: { select: { name: true } },
      module: { select: { name: true, number: true } },
    },
  });
  if (!folder || folder.classId !== classId || folder.subjectId !== subjectId || folder.moduleId !== moduleId) notFound();

  const canWrite = await canWriteToSubjectFolder(
    session.user.id,
    session.user.role,
    session.user.schoolId,
    classId,
    subjectId,
  );

  const [children, files] = await Promise.all([
    prisma.folder.findMany({
      where: { parentId: folderId },
      include: { _count: { select: { files: true, children: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.file.findMany({
      where: { folderId },
      include: { owner: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/dashboard/documents/${classId}/${subjectId}/${moduleId}`}><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--tint-purple)] mb-0.5">
              {folder.class?.name} · {folder.subject?.name} · M{folder.module?.number}
            </div>
            <h1 className="text-2xl sm:text-[28px] font-bold tracking-[-0.022em] flex items-center gap-2">
              <FolderClosed className="h-6 w-6 text-[var(--tint-yellow)]" />
              {folder.name}
            </h1>
          </div>
        </div>
        {canWrite && (
          <div className="flex gap-2 flex-wrap">
            <NewFolderButton classId={classId} subjectId={subjectId} moduleId={moduleId} parentId={folderId} />
            <R2UploadButton
              visibility="CLASS_SHARED"
              classId={classId}
              subjectId={subjectId}
              moduleId={moduleId}
              folderId={folderId}
              size="sm"
              label="Carregar ficheiro"
            />
            {children.length === 0 && files.length === 0 && (
              <FolderDeleteButton folderId={folderId} redirectTo={`/dashboard/documents/${classId}/${subjectId}/${moduleId}`} />
            )}
          </div>
        )}
      </div>

      {children.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.04em] text-[var(--muted-foreground)]">
            Sub-pastas
          </h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {children.map((f) => (
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
            Sem ficheiros nesta pasta.
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
