import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { hasRole } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { FolderLock, Users, Shield, BookOpen, FolderOpen } from "lucide-react";
import { FileUploader } from "@/components/files/file-uploader";
import { FileRow } from "@/components/files/file-row";
import Link from "next/link";

export default async function DocumentsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id: userId, role, schoolId } = session.user;
  const isTeacher = hasRole(role, Role.TEACHER);
  const isAdmin = hasRole(role, Role.SCHOOL_ADMIN);

  // ─── Personal files (everyone) ───
  const personalFiles = await prisma.file.findMany({
    where: { ownerId: userId, visibility: "PRIVATE" },
    orderBy: { createdAt: "desc" },
  });

  // ─── Staff shared (Sala de Professores) ───
  const staffFiles = isTeacher
    ? await prisma.file.findMany({
        where: {
          visibility: "STAFF_SHARED",
          owner: { schoolId },
        },
        include: { owner: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      })
    : [];

  // ─── Admin only ───
  const adminFiles = isAdmin
    ? await prisma.file.findMany({
        where: {
          visibility: "ADMIN_SHARED",
          owner: { schoolId },
        },
        include: { owner: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      })
    : [];

  // ─── Subject/class files visible to me ───
  // Students: from classes they're enrolled in
  // Teachers: from classes they teach
  let classFiles: Array<{
    id: string;
    name: string;
    url: string;
    size: number;
    mimeType: string;
    createdAt: Date;
    ownerId: string;
    owner: { name: string };
    class: { id: string; name: string } | null;
    subject: { id: string; name: string } | null;
  }> = [];

  if (role === Role.STUDENT) {
    classFiles = await prisma.file.findMany({
      where: {
        visibility: { in: ["CLASS_SHARED", "POST_ATTACHMENT"] },
        OR: [
          { class: { enrollments: { some: { studentId: userId, status: "ACTIVE" } } } },
          { post: { class: { enrollments: { some: { studentId: userId, status: "ACTIVE" } } } } },
        ],
      },
      include: {
        owner: { select: { name: true } },
        class: { select: { id: true, name: true } },
        subject: { select: { id: true, name: true } },
        post: { include: { class: { select: { id: true, name: true } }, subject: { select: { id: true, name: true } } } },
      },
      orderBy: { createdAt: "desc" },
    }).then((files) =>
      files.map((f) => ({
        ...f,
        class: f.class ?? f.post?.class ?? null,
        subject: f.subject ?? f.post?.subject ?? null,
      }))
    );
  } else if (isTeacher) {
    classFiles = await prisma.file.findMany({
      where: {
        visibility: { in: ["CLASS_SHARED", "POST_ATTACHMENT"] },
        OR: [
          { class: { subjectAssignments: { some: { teacherId: userId } } } },
          { class: { classDirectorId: userId } },
          { post: { class: { OR: [{ subjectAssignments: { some: { teacherId: userId } } }, { classDirectorId: userId }] } } },
          { ownerId: userId },
        ],
      },
      include: {
        owner: { select: { name: true } },
        class: { select: { id: true, name: true } },
        subject: { select: { id: true, name: true } },
        post: { include: { class: { select: { id: true, name: true } }, subject: { select: { id: true, name: true } } } },
      },
      orderBy: { createdAt: "desc" },
    }).then((files) =>
      files.map((f) => ({
        ...f,
        class: f.class ?? f.post?.class ?? null,
        subject: f.subject ?? f.post?.subject ?? null,
      }))
    );
  }

  // Group class files by class
  const filesByClass = new Map<string, { name: string; files: typeof classFiles }>();
  for (const f of classFiles) {
    if (!f.class) continue;
    const key = f.class.id;
    if (!filesByClass.has(key)) filesByClass.set(key, { name: f.class.name, files: [] });
    filesByClass.get(key)!.files.push(f);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Documentos</h1>
        <p className="text-muted-foreground">
          Os teus ficheiros, partilhas da escola e materiais das turmas
        </p>
      </div>

      <Tabs defaultValue="personal">
        <TabsList>
          <TabsTrigger value="personal"><FolderLock className="mr-1.5 h-3.5 w-3.5" />Pessoal</TabsTrigger>
          {isTeacher && <TabsTrigger value="staff"><Users className="mr-1.5 h-3.5 w-3.5" />Sala de Professores</TabsTrigger>}
          {isAdmin && <TabsTrigger value="admin"><Shield className="mr-1.5 h-3.5 w-3.5" />Admin</TabsTrigger>}
          <TabsTrigger value="classes"><BookOpen className="mr-1.5 h-3.5 w-3.5" />Turmas</TabsTrigger>
        </TabsList>

        {/* ─── PERSONAL ─── */}
        <TabsContent value="personal" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">A minha pasta pessoal</CardTitle>
                <FileUploader endpoint="personalFile" label="+ Carregar ficheiro" />
              </div>
              <p className="text-xs text-muted-foreground">
                Estes ficheiros são <strong>privados</strong> — apenas tu os vês.
              </p>
            </CardHeader>
            <CardContent>
              {personalFiles.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Sem ficheiros pessoais.</p>
              ) : (
                <div className="space-y-1.5">
                  {personalFiles.map((f) => (
                    <FileRow key={f.id} {...f} canDelete />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── STAFF ─── */}
        {isTeacher && (
          <TabsContent value="staff" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Sala de Professores</CardTitle>
                  <FileUploader endpoint="staffFile" label="+ Carregar partilhado" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Partilhado entre <strong>todos os professores</strong> da escola.
                </p>
              </CardHeader>
              <CardContent>
                {staffFiles.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Nenhum documento partilhado.</p>
                ) : (
                  <div className="space-y-1.5">
                    {staffFiles.map((f) => (
                      <FileRow key={f.id} {...f} ownerName={f.owner.name} canDelete={f.ownerId === userId || isAdmin} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* ─── ADMIN ─── */}
        {isAdmin && (
          <TabsContent value="admin" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Documentos Admin</CardTitle>
                  <FileUploader endpoint="adminFile" label="+ Carregar admin" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Visível apenas a <strong>administradores</strong> e diretores da escola.
                </p>
              </CardHeader>
              <CardContent>
                {adminFiles.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Nenhum documento administrativo.</p>
                ) : (
                  <div className="space-y-1.5">
                    {adminFiles.map((f) => (
                      <FileRow key={f.id} {...f} ownerName={f.owner.name} canDelete />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* ─── CLASSES ─── */}
        <TabsContent value="classes" className="space-y-4 mt-4">
          {filesByClass.size === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FolderOpen className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
                <p className="font-medium">Sem materiais de turmas</p>
                <p className="text-sm text-muted-foreground">
                  Os materiais publicados nas turmas aparecem aqui.
                </p>
              </CardContent>
            </Card>
          ) : (
            Array.from(filesByClass.entries()).map(([classId, data]) => (
              <Card key={classId}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      <Link href={`/dashboard/classes/${classId}`} className="hover:underline">
                        {data.name}
                      </Link>
                    </CardTitle>
                    <Badge variant="secondary">{data.files.length} ficheiros</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1.5">
                    {data.files.map((f) => (
                      <FileRow
                        key={f.id}
                        {...f}
                        ownerName={`${f.owner.name}${f.subject ? ` · ${f.subject.name}` : ""}`}
                        canDelete={f.ownerId === userId || isAdmin}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
