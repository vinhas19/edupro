import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { hasRole } from "@/lib/permissions";
import { NewNotificationForm } from "@/components/notifications/new-notification-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function NewNotificationPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { role, id: userId, schoolId } = session.user;
  if (!hasRole(role, Role.CLASS_DIRECTOR)) redirect("/dashboard/notifications");

  const classes = await prisma.class.findMany({
    where: { academicYear: { schoolId } },
    include: { course: { select: { name: true } } },
    orderBy: { name: "asc" },
  });

  const users = await prisma.user.findMany({
    where: { schoolId },
    select: { id: true, name: true, role: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/notifications">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Enviar Aviso</h1>
          <p className="text-muted-foreground text-sm">Crie e envie uma comunicação</p>
        </div>
      </div>

      <NewNotificationForm senderId={userId} classes={classes} users={users} />
    </div>
  );
}
