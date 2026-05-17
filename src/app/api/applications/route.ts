import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit } from "@/lib/rate-limit";
import { z } from "zod";
import { sendEmail } from "@/lib/email";

const schema = z.object({
  schoolSlug: z.string().min(1),
  courseId: z.string().optional(),
  academicYearId: z.string().optional(),

  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  birthDate: z.string().optional(),
  citizenId: z.string().optional(),
  vatId: z.string().optional(),
  address: z.string().optional(),
  postalCode: z.string().optional(),
  city: z.string().optional(),

  previousSchool: z.string().optional(),
  previousYear: z.string().optional(),
  previousGrade: z.number().optional(),

  guardianName: z.string().optional(),
  guardianEmail: z.string().email().optional().or(z.literal("")),
  guardianPhone: z.string().optional(),
  guardianRelation: z.string().optional(),

  documents: z.array(z.object({
    kind: z.string(),
    url: z.string().url(),
    name: z.string(),
  })).optional(),
});

export async function POST(req: Request) {
  const blocked = enforceRateLimit(req, { key: "applications:submit", limit: 5, windowMs: 60_000 });
  if (blocked) return blocked;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", details: parsed.error.format() }, { status: 400 });
  }

  const school = await prisma.school.findUnique({ where: { slug: parsed.data.schoolSlug } });
  if (!school || !school.active) return NextResponse.json({ error: "Escola não encontrada" }, { status: 404 });
  if (!school.featureEnrollment) {
    return NextResponse.json({ error: "Esta escola não aceita inscrições online." }, { status: 403 });
  }

  const app = await prisma.application.create({
    data: {
      schoolId: school.id,
      courseId: parsed.data.courseId,
      academicYearId: parsed.data.academicYearId,
      fullName: parsed.data.fullName.trim(),
      email: parsed.data.email.toLowerCase(),
      phone: parsed.data.phone,
      birthDate: parsed.data.birthDate ? new Date(parsed.data.birthDate) : null,
      citizenId: parsed.data.citizenId,
      vatId: parsed.data.vatId,
      address: parsed.data.address,
      postalCode: parsed.data.postalCode,
      city: parsed.data.city,
      previousSchool: parsed.data.previousSchool,
      previousYear: parsed.data.previousYear,
      previousGrade: parsed.data.previousGrade,
      guardianName: parsed.data.guardianName,
      guardianEmail: parsed.data.guardianEmail || null,
      guardianPhone: parsed.data.guardianPhone,
      guardianRelation: parsed.data.guardianRelation,
      documentsJson: parsed.data.documents ?? undefined,
    },
  });

  // Confirmação ao candidato
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  await sendEmail({
    to: parsed.data.email,
    subject: `Candidatura recebida — ${school.name}`,
    html: `<p>Olá ${parsed.data.fullName.split(" ")[0]},</p><p>Recebemos a tua candidatura a <strong>${school.name}</strong>. Será analisada nos próximos dias e contactar-te-emos por email.</p><p>Referência: <code>${app.id.slice(-8).toUpperCase()}</code></p>`,
    text: `Candidatura recebida em ${school.name}. Referência: ${app.id.slice(-8).toUpperCase()}`,
    tag: "application-received",
  }).catch(() => {});

  return NextResponse.json({ id: app.id }, { status: 201 });
}
