import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { hasRole } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GuardianLinker } from "@/components/admin/guardian-linker";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function GuardiansPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!hasRole(session.user.role, Role.SCHOOL_ADMIN)) redirect("/dashboard");

  const [guardians, students, links] = await Promise.all([
    prisma.user.findMany({
      where: { schoolId: session.user.schoolId, role: Role.GUARDIAN, active: true },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: { schoolId: session.user.schoolId, role: Role.STUDENT, active: true },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
    prisma.guardianLink.findMany({
      where: {
        guardian: { schoolId: session.user.schoolId },
      },
      include: {
        guardian: { select: { name: true, email: true } },
        student: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--tint-indigo)] mb-1">
          Administração
        </div>
        <h1 className="text-2xl sm:text-[28px] font-bold tracking-[-0.022em]">Encarregados de educação</h1>
        <p className="text-[13px] text-[var(--muted-foreground)]">
          Liga utilizadores com perfil "Encarregado" aos respetivos alunos.
        </p>
      </div>

      {guardians.length === 0 && (
        <Card>
          <CardContent className="py-6 text-center text-[13px] text-[var(--muted-foreground)]">
            Ainda não há utilizadores com perfil <strong>Encarregado</strong>.{" "}
            <Link href="/dashboard/users/new" className="text-[var(--primary)] hover:underline">
              Criar agora
            </Link>.
          </CardContent>
        </Card>
      )}

      {guardians.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Nova ligação</CardTitle></CardHeader>
          <CardContent>
            <GuardianLinker
              guardians={guardians}
              students={students}
              links={links.map((l) => ({
                id: l.id,
                guardianName: l.guardian.name,
                guardianEmail: l.guardian.email,
                studentName: l.student.name,
                studentEmail: l.student.email,
                kind: l.kind,
              }))}
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Como funciona</CardTitle></CardHeader>
        <CardContent className="text-[13px] space-y-2 text-[var(--muted-foreground)]">
          <p>1. Cria um utilizador com perfil <strong>Encarregado de Educação</strong> em <Link href="/dashboard/users/new" className="text-[var(--primary)] hover:underline">Novo utilizador</Link>.</p>
          <p>2. Liga o EE a um ou mais alunos nesta página.</p>
          <p>3. O EE faz login com o seu email e senha. Será redirecionado para <code className="text-[11px] bg-[var(--muted)] px-1 py-0.5 rounded">/dashboard/guardian</code> com o portal pessoal.</p>
          <p>4. No portal vê o boletim, faltas recentes e trabalhos pendentes dos educandos.</p>
        </CardContent>
      </Card>

      <div>
        <Button variant="outline" asChild>
          <Link href="/dashboard/users">← Utilizadores</Link>
        </Button>
      </div>
    </div>
  );
}
