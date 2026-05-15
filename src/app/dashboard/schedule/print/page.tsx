import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

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
  let title = `${school?.name ?? "EduPro"} · Horário`;

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

  // Group by day
  const byDay = new Map<number, typeof blocks>();
  for (const b of blocks) {
    const arr = byDay.get(b.dayOfWeek) ?? [];
    arr.push(b);
    byDay.set(b.dayOfWeek, arr);
  }

  return (
    <html lang="pt-PT">
      <head>
        <title>{title} — EduPro</title>
        <style>{`
          @page { size: A4 landscape; margin: 14mm; }
          html, body { background: white; color: black; margin: 0; font-family: -apple-system, "Segoe UI", "Inter", sans-serif; }
          h1 { font-size: 18pt; margin: 0 0 4pt; }
          .meta { color: #555; font-size: 9pt; margin-bottom: 12pt; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 0.5pt solid #999; padding: 4pt 6pt; text-align: left; vertical-align: top; font-size: 9pt; }
          th { background: #f3f3f5; font-weight: 600; }
          .time { font-variant-numeric: tabular-nums; white-space: nowrap; color: #666; }
          .subj { font-weight: 600; }
          .meta-row td { color: #666; font-size: 8pt; }
          .print-btn { background: #007aff; color: white; border: none; padding: 8px 14px; border-radius: 6px; font-weight: 600; cursor: pointer; }
          @media print { .no-print { display: none; } }
        `}</style>
      </head>
      <body>
        <div className="no-print" style={{ padding: "12px 16px", borderBottom: "1px solid #ddd", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <a href="/dashboard/schedule" style={{ color: "#007aff" }}>← Voltar</a>
          <button className="print-btn" onClick={() => (typeof window !== "undefined" ? window.print() : undefined)} style={{ background: "#007aff", color: "white", border: "none", padding: "8px 14px", borderRadius: 6 }}>
            🖨️ Imprimir / Guardar PDF
          </button>
        </div>

        <main style={{ padding: "16px" }}>
          <h1>{title}</h1>
          <p className="meta">
            Horário: {school?.dayStart}–{school?.dayEnd} · Gerado em {new Date().toLocaleString("pt-PT")}
          </p>

          <table>
            <thead>
              <tr>
                {DAYS.map((d) => <th key={d.value}>{d.label}</th>)}
              </tr>
            </thead>
            <tbody>
              <tr>
                {DAYS.map((d) => {
                  const dayBlocks = (byDay.get(d.value) ?? []).slice().sort(
                    (a, b) => timeToMin(a.startTime) - timeToMin(b.startTime),
                  );
                  return (
                    <td key={d.value} style={{ width: "20%", minHeight: "300pt" }}>
                      {dayBlocks.length === 0 ? (
                        <span style={{ color: "#aaa", fontSize: 8 }}>—</span>
                      ) : (
                        dayBlocks.map((b) => (
                          <div key={b.id} style={{ marginBottom: 6, paddingBottom: 6, borderBottom: "0.5pt dashed #ccc" }}>
                            <div className="time">{b.startTime}–{b.endTime}</div>
                            <div className="subj">{b.subject.name}</div>
                            <div style={{ fontSize: 8, color: "#666" }}>
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
      </body>
    </html>
  );
}
