import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { hasRole } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RoomManager } from "@/components/rooms/room-manager";

const TYPE_LABELS: Record<string, string> = {
  CLASSROOM: "Sala de aula",
  LAB: "Laboratório",
  WORKSHOP: "Oficina",
  GYM: "Ginásio",
  AUDITORIUM: "Auditório",
  OTHER: "Outro",
};

export default async function RoomsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!hasRole(session.user.role, Role.SCHOOL_ADMIN)) redirect("/dashboard");

  const rooms = await prisma.room.findMany({
    where: { schoolId: session.user.schoolId },
    include: { _count: { select: { scheduleBlocks: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--tint-teal)] mb-1">
          Administração
        </div>
        <h1 className="text-2xl sm:text-[28px] font-bold tracking-[-0.022em]">Salas</h1>
        <p className="text-[13px] text-[var(--muted-foreground)]">
          {rooms.length} sala{rooms.length !== 1 ? "s" : ""}. Aparecem no horário ao atribuir uma aula.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nova sala</CardTitle>
        </CardHeader>
        <CardContent>
          <RoomManager
            rooms={rooms.map((r) => ({
              id: r.id,
              name: r.name,
              capacity: r.capacity,
              type: r.type,
              usageCount: r._count.scheduleBlocks,
            }))}
            typeLabels={TYPE_LABELS}
          />
        </CardContent>
      </Card>
    </div>
  );
}
