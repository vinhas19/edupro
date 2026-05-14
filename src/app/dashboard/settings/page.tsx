import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Role, Plan } from "@prisma/client";
import { hasRole } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const PLAN_LABELS: Record<Plan, string> = {
  FREE: "Gratuito",
  BASIC: "Básico",
  PRO: "Pro",
  ENTERPRISE: "Enterprise",
};

const PLAN_COLORS: Record<Plan, string> = {
  FREE: "bg-muted text-muted-foreground",
  BASIC: "bg-blue-100 text-blue-700",
  PRO: "bg-purple-100 text-purple-700",
  ENTERPRISE: "bg-amber-100 text-amber-700",
};

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { role, schoolId } = session.user;
  if (!hasRole(role, Role.SCHOOL_ADMIN)) redirect("/dashboard");

  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    include: {
      _count: {
        select: {
          users: true,
          academicYears: true,
        },
      },
    },
  });

  if (!school) redirect("/dashboard");

  const currentYear = await prisma.academicYear.findFirst({
    where: { schoolId, active: true },
    include: {
      _count: {
        select: { classes: true },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Definições</h1>
        <p className="text-muted-foreground">Configurações da escola</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informações da Escola</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">Nome</span>
              <span className="text-sm font-medium">{school.name}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">Slug</span>
              <code className="text-xs bg-muted px-2 py-0.5 rounded">{school.slug}</code>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">Plano</span>
              <Badge variant="outline" className={PLAN_COLORS[school.plan]}>
                {PLAN_LABELS[school.plan]}
              </Badge>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">Estado</span>
              <Badge variant="outline" className={school.active ? "text-green-700 bg-green-50" : "text-red-700 bg-red-50"}>
                {school.active ? "Ativo" : "Inativo"}
              </Badge>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">Utilizadores</span>
              <span className="text-sm font-medium">{school._count.users}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ano Letivo Atual</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {currentYear ? (
              <>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm text-muted-foreground">Ano</span>
                  <span className="text-sm font-medium">{currentYear.label}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm text-muted-foreground">Início</span>
                  <span className="text-sm font-medium">
                    {new Date(currentYear.startDate).toLocaleDateString("pt-PT")}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm text-muted-foreground">Fim</span>
                  <span className="text-sm font-medium">
                    {new Date(currentYear.endDate).toLocaleDateString("pt-PT")}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-muted-foreground">Turmas</span>
                  <span className="text-sm font-medium">{currentYear._count.classes}</span>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum ano letivo ativo</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
