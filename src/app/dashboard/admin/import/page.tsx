import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { hasRole } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CsvImporter } from "@/components/admin/csv-importer";

export default async function ImportPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!hasRole(session.user.role, Role.SCHOOL_ADMIN)) redirect("/dashboard");

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--tint-teal)] mb-1">
          Administração
        </div>
        <h1 className="text-2xl sm:text-[28px] font-bold tracking-[-0.022em]">Importar dados</h1>
        <p className="text-[13px] text-[var(--muted-foreground)]">
          Importa utilizadores a partir de um ficheiro CSV.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Utilizadores (alunos, professores, EE)</CardTitle>
          <p className="text-[12px] text-[var(--muted-foreground)]">
            Colunas: <code className="text-[11px] bg-[var(--muted)] px-1 py-0.5 rounded">name</code>,{" "}
            <code className="text-[11px] bg-[var(--muted)] px-1 py-0.5 rounded">email</code>,{" "}
            <code className="text-[11px] bg-[var(--muted)] px-1 py-0.5 rounded">role</code> (opcional),{" "}
            <code className="text-[11px] bg-[var(--muted)] px-1 py-0.5 rounded">password</code> (opcional).
            Separador <code className="text-[11px] bg-[var(--muted)] px-1 py-0.5 rounded">,</code> ou{" "}
            <code className="text-[11px] bg-[var(--muted)] px-1 py-0.5 rounded">;</code>.
            Roles aceites: <code className="text-[11px]">student</code>, <code className="text-[11px]">teacher</code>, <code className="text-[11px]">guardian</code>, <code className="text-[11px]">class_director</code>, <code className="text-[11px]">admin</code>.
          </p>
        </CardHeader>
        <CardContent>
          <CsvImporter />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Exemplo</CardTitle></CardHeader>
        <CardContent>
          <pre className="text-[12px] bg-[var(--muted)] rounded p-3 overflow-x-auto">
{`name,email,role,password
Ana Silva,ana@escola.pt,student,
João Costa,joao@escola.pt,teacher,
Maria Pais,maria@familia.pt,guardian,FamSenha123`}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
