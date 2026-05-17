import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { hasRole } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { enforceRateLimit } from "@/lib/rate-limit";
import bcrypt from "bcryptjs";

interface Row {
  name: string;
  email: string;
  role?: string;
  password?: string;
}

function parseCSV(text: string): Row[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];
  const headers = lines[0].split(/[;,]/).map((h) => h.trim().toLowerCase());
  const idx = {
    name: headers.indexOf("name") !== -1 ? headers.indexOf("name") : headers.indexOf("nome"),
    email: headers.indexOf("email"),
    role: headers.indexOf("role") !== -1 ? headers.indexOf("role") : headers.indexOf("papel"),
    password: headers.indexOf("password") !== -1 ? headers.indexOf("password") : headers.indexOf("palavra-passe"),
  };
  if (idx.name === -1 || idx.email === -1) {
    throw new Error("CSV: colunas 'name' (ou 'nome') e 'email' são obrigatórias.");
  }
  const rows: Row[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(/[;,]/).map((c) => c.trim());
    if (!cells[idx.name] || !cells[idx.email]) continue;
    rows.push({
      name: cells[idx.name],
      email: cells[idx.email].toLowerCase(),
      role: idx.role !== -1 ? cells[idx.role] : undefined,
      password: idx.password !== -1 ? cells[idx.password] : undefined,
    });
  }
  return rows;
}

const ROLE_MAP: Record<string, Role> = {
  student: Role.STUDENT,
  aluno: Role.STUDENT,
  teacher: Role.TEACHER,
  professor: Role.TEACHER,
  guardian: Role.GUARDIAN,
  ee: Role.GUARDIAN,
  encarregado: Role.GUARDIAN,
  class_director: Role.CLASS_DIRECTOR,
  diretor_turma: Role.CLASS_DIRECTOR,
  admin: Role.SCHOOL_ADMIN,
  administrador: Role.SCHOOL_ADMIN,
};

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasRole(session.user.role, Role.SCHOOL_ADMIN)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Cap CSV imports: 5/min per admin
  const blocked = enforceRateLimit(req, {
    key: "import:users",
    limit: 5,
    windowMs: 60_000,
    clientId: session.user.id,
  });
  if (blocked) return blocked;

  const ct = req.headers.get("content-type") ?? "";
  let csvText = "";
  if (ct.includes("application/json")) {
    const body = await req.json();
    csvText = typeof body.csv === "string" ? body.csv : "";
  } else {
    csvText = await req.text();
  }

  let rows: Row[];
  try {
    rows = parseCSV(csvText);
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erro no CSV" }, { status: 400 });
  }
  if (rows.length === 0) return NextResponse.json({ error: "CSV vazio" }, { status: 400 });

  const results = {
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [] as { line: number; email: string; error: string }[],
  };

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const role = r.role ? ROLE_MAP[r.role.toLowerCase()] ?? Role.STUDENT : Role.STUDENT;
    try {
      const existing = await prisma.user.findUnique({
        where: { email_schoolId: { email: r.email, schoolId: session.user.schoolId } },
      });
      if (existing) {
        await prisma.user.update({
          where: { id: existing.id },
          data: { name: r.name, role },
        });
        results.updated++;
      } else {
        const pwd = r.password && r.password.length >= 6 ? r.password : Math.random().toString(36).slice(2, 10);
        const passwordHash = await bcrypt.hash(pwd, 10);
        await prisma.user.create({
          data: {
            name: r.name,
            email: r.email,
            role,
            schoolId: session.user.schoolId,
            passwordHash,
          },
        });
        results.created++;
      }
    } catch (err: unknown) {
      results.skipped++;
      results.errors.push({
        line: i + 2,
        email: r.email,
        error: err instanceof Error ? err.message : "Erro desconhecido",
      });
    }
  }

  await logAudit({
    schoolId: session.user.schoolId,
    userId: session.user.id,
    action: "import.users",
    entity: "User",
    meta: {
      created: results.created,
      updated: results.updated,
      skipped: results.skipped,
    },
  });

  return NextResponse.json(results);
}
