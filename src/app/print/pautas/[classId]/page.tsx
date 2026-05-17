import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { hasRole } from "@/lib/permissions";
import { PrintPautaButton } from "@/components/pautas/print-button";

export default async function PautaPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!hasRole(session.user.role, Role.CLASS_DIRECTOR)) redirect("/dashboard");
  const { classId } = await params;

  const school = await prisma.school.findUnique({
    where: { id: session.user.schoolId },
    select: { name: true, address: true, billingVatId: true, featurePautas: true },
  });
  if (!school?.featurePautas) notFound();

  const cls = await prisma.class.findUnique({
    where: { id: classId },
    include: {
      course: {
        include: {
          subjects: {
            include: { modules: { orderBy: { number: "asc" } } },
            orderBy: { order: "asc" },
          },
        },
      },
      academicYear: true,
      classDirector: { select: { name: true } },
      enrollments: {
        where: { status: "ACTIVE" },
        include: {
          student: {
            include: {
              moduleProgress: { select: { moduleId: true, grade: true, status: true } },
            },
          },
        },
        orderBy: { student: { name: "asc" } },
      },
    },
  });
  if (!cls || cls.course.schoolId !== session.user.schoolId) notFound();

  const subjects = cls.course.subjects;
  const today = new Date().toLocaleDateString("pt-PT");

  return (
    <>
      <style>{`
        .pauta { font-family: -apple-system, "Segoe UI", "Inter", sans-serif; color: #1d1d1f; padding: 16px 8px; }
        .pauta .toolbar { padding: 12px 16px; border-bottom: 1px solid #ddd; display: flex; justify-content: space-between; align-items: center; }
        .pauta h1 { font-size: 18pt; margin: 0; letter-spacing: -0.022em; }
        .pauta .meta { color:#555; font-size: 9pt; margin-top: 4px; }
        .pauta .school { text-align: right; font-size: 9pt; color: #555; }
        .pauta .school strong { color: #1d1d1f; font-size: 11pt; }
        .pauta table { width: 100%; border-collapse: collapse; margin-bottom: 12pt; }
        .pauta th, .pauta td { border: 0.5pt solid #999; padding: 4pt 6pt; font-size: 8pt; vertical-align: middle; }
        .pauta th { background: #f3f3f5; font-weight: 600; text-align: center; color: #1d1d1f; }
        .pauta td.name { text-align: left; min-width: 120pt; }
        .pauta td.grade { font-variant-numeric: tabular-nums; text-align: center; min-width: 28pt; }
        .pauta td.pass { background: rgba(52,199,89,0.08); }
        .pauta td.fail { background: rgba(255,59,48,0.08); color: #c2271e; }
        .pauta .subject-h { background:#e8e8ec !important; font-weight:700; }
        .pauta .footer { margin-top: 22pt; display: grid; grid-template-columns: 1fr 1fr; gap: 24pt; font-size: 9pt; }
        .pauta .sig { border-top: 0.5pt solid #999; padding-top: 4pt; text-align: center; }
        .pauta .legend { font-size: 8pt; color: #666; margin-top: 8pt; }
        .pauta .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px; }
      `}</style>

      <div className="pauta">
        <div className="toolbar no-print">
          <a href="/dashboard/pautas" style={{ color: "#007aff" }}>← Voltar</a>
          <PrintPautaButton />
        </div>

        <div className="header">
          <div>
            <h1>Pauta Final — {cls.name}</h1>
            <p className="meta">
              {cls.course.name} ({cls.course.code}) · Ano lectivo {cls.academicYear.label}
              {cls.classDirector && ` · Diretor de turma: ${cls.classDirector.name}`}
            </p>
            <p className="meta">Gerada em {today}</p>
          </div>
          <div className="school">
            <strong>{school.name}</strong>
            {school.address && <div>{school.address}</div>}
            {school.billingVatId && <div>NIF: {school.billingVatId}</div>}
          </div>
        </div>

        {subjects.map((s) => {
          const mods = s.modules;
          if (mods.length === 0) return null;
          return (
            <table key={s.id}>
              <thead>
                <tr className="subject-h">
                  <th colSpan={mods.length + 2}>{s.name} — {s.totalHours}h</th>
                </tr>
                <tr>
                  <th rowSpan={2}>Aluno</th>
                  {mods.map((m) => (
                    <th key={m.id}>M{m.number}</th>
                  ))}
                  <th rowSpan={2}>Final</th>
                </tr>
                <tr>
                  {mods.map((m) => (
                    <th key={m.id + "h"} style={{ fontWeight: 400, fontSize: 7 }}>{m.hours}h</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cls.enrollments.map((enr) => {
                  const grades: number[] = [];
                  return (
                    <tr key={enr.id}>
                      <td className="name">{enr.student.name}</td>
                      {mods.map((m) => {
                        const p = enr.student.moduleProgress.find((sp) => sp.moduleId === m.id);
                        const g = p?.grade;
                        if (g != null) grades.push(g);
                        const pass = g != null && g >= 10;
                        const fail = g != null && g < 10;
                        return (
                          <td key={m.id} className={"grade " + (pass ? "pass" : fail ? "fail" : "")}>
                            {g != null ? g.toFixed(1) : "—"}
                          </td>
                        );
                      })}
                      <td className="grade">
                        {grades.length === mods.length && grades.length > 0
                          ? (grades.reduce((a, b) => a + b, 0) / grades.length).toFixed(1)
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          );
        })}

        <p className="legend">
          Notação: classificação numérica de 0 a 20. <strong>Aprovação ≥ 10</strong>. Fundo verde = aprovado, fundo vermelho = não aprovado, "—" = ainda não avaliado.
        </p>

        <div className="footer">
          <div>
            <div style={{ height: "32pt" }} />
            <div className="sig">Diretor(a) de Turma</div>
            <div style={{ textAlign: "center", fontSize: 8 }}>{cls.classDirector?.name ?? ""}</div>
          </div>
          <div>
            <div style={{ height: "32pt" }} />
            <div className="sig">Direção Pedagógica</div>
          </div>
        </div>
      </div>
    </>
  );
}
