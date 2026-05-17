import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { hasRole } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

const schema = z.object({
  // Para emitir 1 factura individual:
  studentId: z.string().optional(),
  // OU para emitir em massa a vários alunos:
  studentIds: z.array(z.string()).optional(),
  // OU a todos os alunos activos de uma turma:
  classId: z.string().optional(),
  description: z.string().min(2),
  amount: z.number().positive(),
  vatRate: z.number().min(0).max(50).default(0),
  dueDate: z.string(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasRole(session.user.role, Role.SCHOOL_ADMIN)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const school = await prisma.school.findUnique({
    where: { id: session.user.schoolId },
    select: { featureBilling: true, billingCurrency: true },
  });
  if (!school?.featureBilling) {
    return NextResponse.json({ error: "Faturação não está ativa nesta escola." }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  // Determinar conjunto de alunos
  let studentIds: string[] = [];
  if (parsed.data.studentId) studentIds = [parsed.data.studentId];
  else if (parsed.data.studentIds) studentIds = parsed.data.studentIds;
  else if (parsed.data.classId) {
    const enrolls = await prisma.enrollment.findMany({
      where: { classId: parsed.data.classId, status: "ACTIVE" },
      select: { studentId: true },
    });
    studentIds = enrolls.map((e) => e.studentId);
  }

  if (studentIds.length === 0) {
    return NextResponse.json({ error: "Sem alunos a faturar." }, { status: 400 });
  }

  // Verifica que todos os alunos pertencem à escola
  const valid = await prisma.user.count({
    where: { id: { in: studentIds }, schoolId: session.user.schoolId },
  });
  if (valid !== studentIds.length) {
    return NextResponse.json({ error: "Alunos inválidos." }, { status: 400 });
  }

  const amount = parsed.data.amount;
  const vatRate = parsed.data.vatRate;
  const vatAmount = Math.round(amount * vatRate) / 100;
  const total = amount + vatAmount;

  // Próximo número de factura — usa contagem actual + ano
  const year = new Date().getFullYear();
  const yearStart = new Date(year, 0, 1);
  const yearCount = await prisma.invoice.count({
    where: { schoolId: session.user.schoolId, createdAt: { gte: yearStart } },
  });

  let nextNum = yearCount + 1;
  const created: { id: string; number: string }[] = [];

  for (const sid of studentIds) {
    const number = `FT ${year}/${String(nextNum).padStart(5, "0")}`;
    nextNum++;
    const inv = await prisma.invoice.create({
      data: {
        schoolId: session.user.schoolId,
        studentId: sid,
        number,
        description: parsed.data.description,
        amount,
        currency: school.billingCurrency,
        vatRate,
        vatAmount,
        total,
        dueDate: new Date(parsed.data.dueDate),
      },
    });
    created.push({ id: inv.id, number: inv.number });
  }

  await logAudit({
    schoolId: session.user.schoolId,
    userId: session.user.id,
    action: "invoice.create",
    entity: "Invoice",
    meta: { count: created.length, description: parsed.data.description },
  });

  return NextResponse.json({ created }, { status: 201 });
}
