import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { PrintButton } from "@/components/schedule/print-button";

const DAYS = [
  { value: 1, label: "Segunda" },
  { value: 2, label: "Terça" },
  { value: 3, label: "Quarta" },
  { value: 4, label: "Quinta" },
  { value: 5, label: "Sexta" },
];

function timeToMin(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export default async function PrintSchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ classId?: string; teacherId?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const sp = await searchParams;

  const schoolId = session.user.schoolId;
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    select: { name: true, dayStart: true, dayEnd: true },
  });

  const where: { class?: { id?: string; course: { schoolId: string } }; teacherId?: string; classId?: string } = {
    class: { course: { schoolId } },
  };
  let title = `${school?.name ?? "Lectiva"} · Horário`;

  if (sp.classId) {
    where.classId = sp.classId;
    const cls = await prisma.class.findUnique({ where: { id: sp.classId }, select: { name: true } });
    if (cls) title = `Turma ${cls.name}`;
  } else if (sp.teacherId) {
    where.teacherId = sp.teacherId;
    const t = await prisma.user.findUnique({ where: { id: sp.teacherId }, select: { name: true } });
    if (t) title = `Horário · ${t.name}`;
  } else if (session.user.role === Role.STUDENT) {
    const enrollment = await prisma.enrollment.findFirst({
      where: { studentId: session.user.id, status: "ACTIVE" },
    });
    if (enrollment) where.classId = enrollment.classId;
  } else if (session.user.role === Role.TEACHER) {
    where.teacherId = session.user.id;
    title = `${session.user.name} · Horário`;
  }

  const blocks = await prisma.scheduleBlock.findMany({
    where,
    include: {
      subject: { select: { name: true } },
      teacher: { select: { name: true } },
      room: { select: { name: true } },
      class: { select: { name: true } },
    },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });

  const byDay = new Map<number, typeof blocks>();
  for (const b of blocks) {
    const arr = byDay.get(b.dayOfWeek) ?? [];
    arr.push(b);
    byDay.set(b.dayOfWeek, arr);
  }

  return (
    <>
      <style>{`
        @page { size: A4 landscape; margin: 14mm; }
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
        }
      `}</style>
      <div
        className="schedule-print-overlay fixed inset-0 z-[100] bg-white text-black overflow-auto"
        style={{ printColorAdjust: "exact" }}
      >
        <div className="no-print flex items-center justify-between gap-3 border-b bg-white px-4 py-3 sticky top-0">
          <a href="/dashboard/schedule" className="text-sm text-blue-600 hover:underline">
            ← Voltar
          </a>
          <PrintButton />
        </div>

        <main className="p-6 print:p-0 max-w-[1400px] mx-auto">
          <h1 className="text-2xl font-bold mb-1">{title}</h1>
          <p className="text-xs text-gray-600 mb-4">
            Horário: {school?.dayStart}–{school?.dayEnd} · Gerado em {new Date().toLocaleString("pt-PT")}
          </p>

          <table className="w-full border-collapse text-[10pt]">
            <thead>
              <tr>
                {DAYS.map((d) => (
                  <th
                    key={d.value}
                    className="border border-gray-400 bg-gray-100 px-2 py-1.5 text-left font-semibold"
                  >
                    {d.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {DAYS.map((d) => {
                  const dayBlocks = (byDay.get(d.value) ?? [])
                    .slice()
                    .sort((a, b) => timeToMin(a.startTime) - timeToMin(b.startTime));
                  return (
                    <td
                      key={d.value}
                      className="border border-gray-400 align-top p-2"
                      style={{ width: "20%", minHeight: "400pt" }}
                    >
                      {dayBlocks.length === 0 ? (
                        <span className="text-gray-400 text-[8pt]">—</span>
                      ) : (
                        dayBlocks.map((b) => (
                          <div
                            key={b.id}
                            className="mb-1.5 pb-1.5 border-b border-dashed border-gray-300 last:border-0"
                          >
                            <div className="text-gray-600 tabular-nums whitespace-nowrap text-[8.5pt]">
                              {b.startTime}–{b.endTime}
                            </div>
                            <div className="font-semibold">{b.subject.name}</div>
                            <div className="text-[8pt] text-gray-600">
                              {b.class.name}
                              {b.teacher && ` · ${b.teacher.name}`}
                              {b.room && ` · ${b.room.name}`}
                            </div>
                          </div>
                        ))
                      )}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </main>
      </div>
    </>
  );
}
