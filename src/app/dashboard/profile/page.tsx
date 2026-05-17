import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { ProfileForm } from "@/components/profile/profile-form";
import { NotificationsToggle } from "@/components/settings/notifications-toggle";
import { CalendarTokenSection } from "@/components/profile/calendar-token-section";
import { PrivacySection } from "@/components/profile/privacy-section";
import { ROLE_LABELS } from "@/lib/permissions";
import { Bell, ChevronRight } from "lucide-react";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      school: { select: { name: true, slug: true } },
    },
  });

  if (!user) redirect("/login");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Perfil</h1>
        <p className="text-muted-foreground">Gerir informações da sua conta</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardContent className="flex flex-col items-center py-8 gap-4">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-3xl font-bold text-primary">
                {user.name?.charAt(0).toUpperCase() ?? "?"}
              </span>
            </div>
            <div className="text-center">
              <p className="font-semibold text-lg">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            <Badge variant="outline" className="mt-1">
              {ROLE_LABELS[user.role]}
            </Badge>
            <div className="text-center text-xs text-muted-foreground mt-2">
              <p>Membro desde</p>
              <p className="font-medium">{format(new Date(user.createdAt), "MMMM yyyy", { locale: pt })}</p>
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informações Pessoais</CardTitle>
            </CardHeader>
            <CardContent>
              <ProfileForm userId={user.id} currentName={user.name ?? ""} currentEmail={user.email} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Escola</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm text-muted-foreground">Escola</span>
                <span className="text-sm font-medium">{user.school.name}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-muted-foreground">Domínio</span>
                <code className="text-xs bg-muted px-2 py-0.5 rounded">{user.school.slug}.lectiva.pt</code>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notificações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <NotificationsToggle publicKey={process.env.VAPID_PUBLIC_KEY ?? null} />
              <Link
                href="/dashboard/settings/notifications"
                className="flex items-center justify-between p-3 -mx-1 rounded-lg border hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-md bg-blue-50 p-1.5 text-blue-700">
                    <Bell className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <p className="text-[13px] font-medium">Preferências detalhadas</p>
                    <p className="text-[11px] text-muted-foreground">
                      Email, SMS, horas de silêncio e por tipo.
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sincronização com calendário</CardTitle>
              <p className="text-[12px] text-muted-foreground">
                Subscreve o teu horário no Google/Apple Calendar. Mantém o link privado.
              </p>
            </CardHeader>
            <CardContent>
              <CalendarTokenSection initialToken={user.iCalToken} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Privacidade &amp; RGPD</CardTitle>
              <p className="text-[12px] text-muted-foreground">
                Direitos do titular dos dados (Regulamento Geral de Proteção de Dados).
              </p>
            </CardHeader>
            <CardContent>
              <PrivacySection />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
