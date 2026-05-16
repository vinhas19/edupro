import {
  PrismaClient,
  Role,
  FormationComponent,
  ModuleStatus,
  EvaluationType,
  FctStatus,
  FctDocType,
  PapStatus,
  PapPhaseType,
  PhaseStatus,
  JuryRole,
  NotificationType,
  RecipientType,
  NotificationCategory,
  DeliveryStatus,
  AttendanceStatus,
  JustificationStatus,
  DocumentCategory,
  DocumentAccess,
  RoomType,
  PostType,
  SubmissionStatus,
  FileVisibility,
  SubstitutionStatus,
} from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";
dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as any);

// ─── helpers ──────────────────────────────────────────────────────────────────
const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
};
const daysAhead = (n: number) => daysAgo(-n);
const pick = <T>(arr: T[], i: number) => arr[i % arr.length];

async function main() {
  console.log("🌱 Seeding database (comprehensive)...");

  // ─── School ────────────────────────────────────────────────────────────────
  const school = await prisma.school.upsert({
    where: { slug: "vendas-novas" },
    update: {},
    create: {
      name: "Agrupamento de Escolas de Vendas Novas",
      slug: "vendas-novas",
      email: "geral@aevendasnovas.edu.pt",
      phone: "265 889 010",
      address: "Rua Principal, Vendas Novas",
      plan: "PRO",
      dayStart: "08:00",
      dayEnd: "17:20",
      blockMinutes: 50,
      breakMinutes: 10,
    },
  });
  console.log("✅ School:", school.slug);

  // ─── TimeSlots (8 blocos + almoço) ─────────────────────────────────────────
  const timeSlotsData = [
    { order: 1, startTime: "08:00", endTime: "08:50", label: "1º bloco" },
    { order: 2, startTime: "08:50", endTime: "09:40", label: "2º bloco" },
    { order: 3, startTime: "09:50", endTime: "10:40", label: "3º bloco" },
    { order: 4, startTime: "10:40", endTime: "11:30", label: "4º bloco" },
    { order: 5, startTime: "11:40", endTime: "12:30", label: "5º bloco" },
    { order: 6, startTime: "13:30", endTime: "14:20", label: "6º bloco" },
    { order: 7, startTime: "14:30", endTime: "15:20", label: "7º bloco" },
    { order: 8, startTime: "15:30", endTime: "16:20", label: "8º bloco" },
  ];
  for (const ts of timeSlotsData) {
    await prisma.timeSlot.upsert({
      where: { schoolId_order: { schoolId: school.id, order: ts.order } },
      update: ts,
      create: { ...ts, schoolId: school.id },
    });
  }

  // ─── Academic Year ─────────────────────────────────────────────────────────
  const academicYear = await prisma.academicYear.upsert({
    where: { id: "ay-2425" },
    update: {},
    create: {
      id: "ay-2425",
      label: "2024/2025",
      startDate: new Date("2024-09-16"),
      endDate: new Date("2025-07-11"),
      active: true,
      schoolId: school.id,
    },
  });

  // ─── Password hash (partilhado por todos) ──────────────────────────────────
  const hash = await bcrypt.hash("password123", 12);

  // ─── Users ─────────────────────────────────────────────────────────────────
  // Admin
  const admin = await prisma.user.upsert({
    where: { email_schoolId: { email: "admin@aevendasnovas.edu.pt", schoolId: school.id } },
    update: {},
    create: {
      name: "Adélia Bentes",
      email: "admin@aevendasnovas.edu.pt",
      passwordHash: hash,
      role: Role.SCHOOL_ADMIN,
      schoolId: school.id,
      phoneE164: "+351912000001",
      phoneVerified: true,
    },
  });

  // Diretores de curso (2)
  const courseDirectorTAI = await prisma.user.upsert({
    where: { email_schoolId: { email: "joao.silva@aevendasnovas.edu.pt", schoolId: school.id } },
    update: {},
    create: {
      name: "João Silva",
      email: "joao.silva@aevendasnovas.edu.pt",
      passwordHash: hash,
      role: Role.COURSE_DIRECTOR,
      schoolId: school.id,
      phoneE164: "+351912000002",
      phoneVerified: true,
    },
  });
  const courseDirectorGPSI = await prisma.user.upsert({
    where: { email_schoolId: { email: "rita.alves@aevendasnovas.edu.pt", schoolId: school.id } },
    update: {},
    create: {
      name: "Rita Alves",
      email: "rita.alves@aevendasnovas.edu.pt",
      passwordHash: hash,
      role: Role.COURSE_DIRECTOR,
      schoolId: school.id,
    },
  });

  // Diretores de turma (3)
  const classDirectorTAI1 = await prisma.user.upsert({
    where: { email_schoolId: { email: "maria.costa@aevendasnovas.edu.pt", schoolId: school.id } },
    update: {},
    create: {
      name: "Maria Costa",
      email: "maria.costa@aevendasnovas.edu.pt",
      passwordHash: hash,
      role: Role.CLASS_DIRECTOR,
      schoolId: school.id,
      phoneE164: "+351912000003",
      phoneVerified: true,
    },
  });
  const classDirectorTAI2 = await prisma.user.upsert({
    where: { email_schoolId: { email: "antonio.pinto@aevendasnovas.edu.pt", schoolId: school.id } },
    update: {},
    create: {
      name: "António Pinto",
      email: "antonio.pinto@aevendasnovas.edu.pt",
      passwordHash: hash,
      role: Role.CLASS_DIRECTOR,
      schoolId: school.id,
    },
  });
  const classDirectorGPSI1 = await prisma.user.upsert({
    where: { email_schoolId: { email: "sofia.morais@aevendasnovas.edu.pt", schoolId: school.id } },
    update: {},
    create: {
      name: "Sofia Morais",
      email: "sofia.morais@aevendasnovas.edu.pt",
      passwordHash: hash,
      role: Role.CLASS_DIRECTOR,
      schoolId: school.id,
    },
  });

  // Professores (6)
  const teacherNames = [
    { email: "carlos.santos", name: "Carlos Santos" },
    { email: "ana.ferreira", name: "Ana Ferreira" },
    { email: "luis.machado", name: "Luís Machado" },
    { email: "patricia.dias", name: "Patrícia Dias" },
    { email: "miguel.lopes", name: "Miguel Lopes" },
    { email: "catarina.serra", name: "Catarina Serra" },
  ];
  const teachers = await Promise.all(
    teacherNames.map((t, i) =>
      prisma.user.upsert({
        where: { email_schoolId: { email: `${t.email}@aevendasnovas.edu.pt`, schoolId: school.id } },
        update: {},
        create: {
          name: t.name,
          email: `${t.email}@aevendasnovas.edu.pt`,
          passwordHash: hash,
          role: Role.TEACHER,
          schoolId: school.id,
          phoneE164: i < 3 ? `+35191200010${i}` : null,
          phoneVerified: i < 3,
        },
      }),
    ),
  );
  const [tCarlos, tAna, tLuis, tPatricia, tMiguel, tCatarina] = teachers;

  // Alunos — 6 por turma × 3 turmas = 18
  const studentDataByClass: Record<string, { name: string }[]> = {
    "TAI1A": [
      { name: "Beatriz Oliveira" }, { name: "Diogo Mendes" }, { name: "Filipa Rodrigues" },
      { name: "Gonçalo Pereira" }, { name: "Inês Martins" }, { name: "João Figueiredo" },
    ],
    "TAI2A": [
      { name: "Leonor Tavares" }, { name: "Mateus Cardoso" }, { name: "Núria Antunes" },
      { name: "Pedro Vieira" }, { name: "Rita Sousa" }, { name: "Tiago Almeida" },
    ],
    "GPSI1A": [
      { name: "Vasco Reis" }, { name: "Ana Marques" }, { name: "Bruno Henriques" },
      { name: "Carolina Pinto" }, { name: "David Lourenço" }, { name: "Eva Branco" },
    ],
  };

  const allStudents: Record<string, any[]> = {};
  for (const [classCode, students] of Object.entries(studentDataByClass)) {
    allStudents[classCode] = await Promise.all(
      students.map(async (s) => {
        const email = `${s.name.toLowerCase().replace(/ /g, ".").normalize("NFD").replace(/[̀-ͯ]/g, "")}@aluno.aevendasnovas.edu.pt`;
        return prisma.user.upsert({
          where: { email_schoolId: { email, schoolId: school.id } },
          update: {},
          create: {
            name: s.name,
            email,
            passwordHash: hash,
            role: Role.STUDENT,
            schoolId: school.id,
          },
        });
      }),
    );
  }

  // Encarregados de Educação (1 por aluno dos primeiros 8) — 8 EE
  const guardianNamesByStudent: { studentName: string; guardianName: string; kind: string }[] = [
    { studentName: "Beatriz Oliveira", guardianName: "Helena Oliveira", kind: "Mãe" },
    { studentName: "Diogo Mendes", guardianName: "Ricardo Mendes", kind: "Pai" },
    { studentName: "Filipa Rodrigues", guardianName: "Cláudia Rodrigues", kind: "Mãe" },
    { studentName: "Gonçalo Pereira", guardianName: "Sérgio Pereira", kind: "Pai" },
    { studentName: "Leonor Tavares", guardianName: "Sandra Tavares", kind: "Mãe" },
    { studentName: "Mateus Cardoso", guardianName: "Paulo Cardoso", kind: "Pai" },
    { studentName: "Vasco Reis", guardianName: "Marta Reis", kind: "Mãe" },
    { studentName: "Ana Marques", guardianName: "Nuno Marques", kind: "Pai" },
  ];

  const guardians: Record<string, any> = {};
  for (const g of guardianNamesByStudent) {
    const email = `${g.guardianName.toLowerCase().replace(/ /g, ".").normalize("NFD").replace(/[̀-ͯ]/g, "")}@encarregado.pt`;
    guardians[g.studentName] = await prisma.user.upsert({
      where: { email_schoolId: { email, schoolId: school.id } },
      update: {},
      create: {
        name: g.guardianName,
        email,
        passwordHash: hash,
        role: Role.GUARDIAN,
        schoolId: school.id,
        phoneE164: `+35193500${String(Object.keys(guardians).length).padStart(4, "0")}`,
        phoneVerified: true,
      },
    });
  }

  // GuardianLinks
  const allStudentsList = [
    ...allStudents.TAI1A,
    ...allStudents.TAI2A,
    ...allStudents.GPSI1A,
  ];
  const studentByName = Object.fromEntries(allStudentsList.map((s) => [s.name, s]));

  for (const g of guardianNamesByStudent) {
    const student = studentByName[g.studentName];
    const guardian = guardians[g.studentName];
    if (!student || !guardian) continue;
    await prisma.guardianLink.upsert({
      where: { guardianId_studentId: { guardianId: guardian.id, studentId: student.id } },
      update: {},
      create: {
        guardianId: guardian.id,
        studentId: student.id,
        kind: g.kind,
      },
    });
  }
  console.log(`✅ Users: 1 admin, 2 dir.curso, 3 dir.turma, 6 prof, 18 alunos, 8 EE`);

  // ─── Cursos ────────────────────────────────────────────────────────────────
  const courseTAI = await prisma.course.upsert({
    where: { code_schoolId: { code: "TAI", schoolId: school.id } },
    update: {},
    create: {
      name: "Técnico de Análise Laboratorial",
      code: "TAI",
      formationArea: "Química",
      level: 4,
      totalHours: 3250,
      schoolId: school.id,
      directorId: courseDirectorTAI.id,
    },
  });
  const courseGPSI = await prisma.course.upsert({
    where: { code_schoolId: { code: "GPSI", schoolId: school.id } },
    update: {},
    create: {
      name: "Técnico de Gestão e Programação de Sistemas Informáticos",
      code: "GPSI",
      formationArea: "Informática",
      level: 4,
      totalHours: 3200,
      schoolId: school.id,
      directorId: courseDirectorGPSI.id,
    },
  });

  // ─── Disciplinas (limpar e recriar para idempotência) ──────────────────────
  await prisma.subject.deleteMany({ where: { course: { schoolId: school.id } } });

  const subjectsTAI = await Promise.all([
    prisma.subject.create({ data: { courseId: courseTAI.id, name: "Português", code: "PORT", component: FormationComponent.SOCIOCULTURAL, totalHours: 320, order: 1 } }),
    prisma.subject.create({ data: { courseId: courseTAI.id, name: "Matemática", code: "MAT", component: FormationComponent.SCIENTIFIC, totalHours: 250, order: 2 } }),
    prisma.subject.create({ data: { courseId: courseTAI.id, name: "Inglês", code: "ING", component: FormationComponent.SOCIOCULTURAL, totalHours: 220, order: 3 } }),
    prisma.subject.create({ data: { courseId: courseTAI.id, name: "Bioquímica", code: "BIOQ", component: FormationComponent.SCIENTIFIC, totalHours: 250, order: 4 } }),
    prisma.subject.create({ data: { courseId: courseTAI.id, name: "Técnicas Laboratoriais", code: "TLAB", component: FormationComponent.TECHNICAL, totalHours: 400, order: 5 } }),
    prisma.subject.create({ data: { courseId: courseTAI.id, name: "Técnicas de Análises Alimentares", code: "TANA", component: FormationComponent.TECHNICAL, totalHours: 300, order: 6 } }),
  ]);
  const [sPort, sMat, sIng, sBio, sLab, sAna] = subjectsTAI;

  const subjectsGPSI = await Promise.all([
    prisma.subject.create({ data: { courseId: courseGPSI.id, name: "Português", code: "PORT", component: FormationComponent.SOCIOCULTURAL, totalHours: 320, order: 1 } }),
    prisma.subject.create({ data: { courseId: courseGPSI.id, name: "Programação e Sistemas de Informação", code: "PSI", component: FormationComponent.TECHNICAL, totalHours: 400, order: 2 } }),
    prisma.subject.create({ data: { courseId: courseGPSI.id, name: "Sistemas Operativos", code: "SO", component: FormationComponent.TECHNICAL, totalHours: 300, order: 3 } }),
    prisma.subject.create({ data: { courseId: courseGPSI.id, name: "Redes de Comunicação", code: "RC", component: FormationComponent.TECHNICAL, totalHours: 250, order: 4 } }),
  ]);
  const [sPortG, sPSI, sSO, sRC] = subjectsGPSI;

  // ─── Módulos ───────────────────────────────────────────────────────────────
  const modulesPort = await Promise.all(
    [
      { n: 1, name: "Textos dos Média", h: 24 },
      { n: 2, name: "Literatura Portuguesa", h: 30 },
      { n: 3, name: "Leitura e Escrita", h: 26 },
      { n: 4, name: "Textos Técnicos", h: 24 },
    ].map(({ n, name, h }) => prisma.module.create({ data: { subjectId: sPort.id, name, number: n, hours: h, order: n } })),
  );

  const modulesLab = await Promise.all(
    [
      { n: 1, name: "Segurança no Laboratório", h: 25 },
      { n: 2, name: "Técnicas Básicas", h: 35 },
      { n: 3, name: "Análises Físico-Químicas", h: 40 },
      { n: 4, name: "Análises Microbiológicas", h: 45 },
      { n: 5, name: "Controlo de Qualidade", h: 35 },
    ].map(({ n, name, h }) => prisma.module.create({ data: { subjectId: sLab.id, name, number: n, hours: h, order: n } })),
  );

  const modulesBio = await Promise.all(
    [
      { n: 1, name: "Bioquímica das Moléculas", h: 40 },
      { n: 2, name: "Metabolismo Celular", h: 50 },
      { n: 3, name: "Enzimologia", h: 35 },
    ].map(({ n, name, h }) => prisma.module.create({ data: { subjectId: sBio.id, name, number: n, hours: h, order: n } })),
  );

  const modulesPSI = await Promise.all(
    [
      { n: 1, name: "Algoritmia", h: 40 },
      { n: 2, name: "Programação Estruturada", h: 60 },
      { n: 3, name: "Programação Orientada a Objetos", h: 60 },
      { n: 4, name: "Bases de Dados", h: 50 },
    ].map(({ n, name, h }) => prisma.module.create({ data: { subjectId: sPSI.id, name, number: n, hours: h, order: n } })),
  );

  // ─── Turmas ────────────────────────────────────────────────────────────────
  await prisma.class.deleteMany({ where: { course: { schoolId: school.id } } });
  const classTAI1 = await prisma.class.create({
    data: { courseId: courseTAI.id, academicYearId: academicYear.id, name: "TAI 1ºA", year: 1, classDirectorId: classDirectorTAI1.id },
  });
  const classTAI2 = await prisma.class.create({
    data: { courseId: courseTAI.id, academicYearId: academicYear.id, name: "TAI 2ºA", year: 2, classDirectorId: classDirectorTAI2.id },
  });
  const classGPSI1 = await prisma.class.create({
    data: { courseId: courseGPSI.id, academicYearId: academicYear.id, name: "GPSI 1ºA", year: 1, classDirectorId: classDirectorGPSI1.id },
  });

  // ─── Enrollments ───────────────────────────────────────────────────────────
  const enrollMap: Record<string, string> = {
    TAI1A: classTAI1.id,
    TAI2A: classTAI2.id,
    GPSI1A: classGPSI1.id,
  };
  for (const [code, classId] of Object.entries(enrollMap)) {
    await Promise.all(
      allStudents[code].map((s: any) =>
        prisma.enrollment.upsert({
          where: { studentId_classId: { studentId: s.id, classId } },
          update: {},
          create: { studentId: s.id, classId },
        }),
      ),
    );
  }

  // ─── SubjectAssignments ────────────────────────────────────────────────────
  await prisma.subjectAssignment.deleteMany({
    where: { class: { course: { schoolId: school.id } } },
  });
  const assignments: { teacherId: string; subjectId: string; classId: string }[] = [
    // TAI 1ºA
    { teacherId: classDirectorTAI1.id, subjectId: sPort.id, classId: classTAI1.id },
    { teacherId: tCarlos.id, subjectId: sLab.id, classId: classTAI1.id },
    { teacherId: tAna.id, subjectId: sBio.id, classId: classTAI1.id },
    { teacherId: tLuis.id, subjectId: sMat.id, classId: classTAI1.id },
    { teacherId: tPatricia.id, subjectId: sIng.id, classId: classTAI1.id },
    { teacherId: tCarlos.id, subjectId: sAna.id, classId: classTAI1.id },
    // TAI 2ºA
    { teacherId: classDirectorTAI2.id, subjectId: sPort.id, classId: classTAI2.id },
    { teacherId: tCarlos.id, subjectId: sLab.id, classId: classTAI2.id },
    { teacherId: tAna.id, subjectId: sBio.id, classId: classTAI2.id },
    { teacherId: tLuis.id, subjectId: sMat.id, classId: classTAI2.id },
    // GPSI 1ºA
    { teacherId: classDirectorGPSI1.id, subjectId: sPortG.id, classId: classGPSI1.id },
    { teacherId: tMiguel.id, subjectId: sPSI.id, classId: classGPSI1.id },
    { teacherId: tCatarina.id, subjectId: sSO.id, classId: classGPSI1.id },
    { teacherId: tMiguel.id, subjectId: sRC.id, classId: classGPSI1.id },
  ];
  for (const a of assignments) {
    await prisma.subjectAssignment.create({ data: a });
  }

  // ─── Salas ─────────────────────────────────────────────────────────────────
  await prisma.room.deleteMany({ where: { schoolId: school.id } });
  const rooms = await Promise.all([
    prisma.room.create({ data: { schoolId: school.id, name: "Sala 1.1", capacity: 30, type: RoomType.CLASSROOM } }),
    prisma.room.create({ data: { schoolId: school.id, name: "Sala 1.2", capacity: 28, type: RoomType.CLASSROOM } }),
    prisma.room.create({ data: { schoolId: school.id, name: "Sala 2.1", capacity: 30, type: RoomType.CLASSROOM } }),
    prisma.room.create({ data: { schoolId: school.id, name: "Lab. Química A", capacity: 20, type: RoomType.LAB } }),
    prisma.room.create({ data: { schoolId: school.id, name: "Lab. Informática", capacity: 24, type: RoomType.LAB } }),
    prisma.room.create({ data: { schoolId: school.id, name: "Auditório", capacity: 120, type: RoomType.AUDITORIUM } }),
  ]);
  const [sala1_1, sala1_2, sala2_1, labQuim, labInf, audit] = rooms;

  // ─── Horário (semanal completo) ────────────────────────────────────────────
  await prisma.scheduleBlock.deleteMany({
    where: { class: { course: { schoolId: school.id } } },
  });
  type Block = { classId: string; teacherId: string; subjectId: string; roomId: string; day: number; start: string; end: string };
  const blocks: Block[] = [
    // TAI 1ºA — segunda a sexta
    // Segunda
    { classId: classTAI1.id, teacherId: classDirectorTAI1.id, subjectId: sPort.id, roomId: sala1_1.id, day: 1, start: "08:00", end: "08:50" },
    { classId: classTAI1.id, teacherId: classDirectorTAI1.id, subjectId: sPort.id, roomId: sala1_1.id, day: 1, start: "08:50", end: "09:40" },
    { classId: classTAI1.id, teacherId: tLuis.id, subjectId: sMat.id, roomId: sala1_1.id, day: 1, start: "09:50", end: "10:40" },
    { classId: classTAI1.id, teacherId: tLuis.id, subjectId: sMat.id, roomId: sala1_1.id, day: 1, start: "10:40", end: "11:30" },
    { classId: classTAI1.id, teacherId: tCarlos.id, subjectId: sLab.id, roomId: labQuim.id, day: 1, start: "13:30", end: "14:20" },
    { classId: classTAI1.id, teacherId: tCarlos.id, subjectId: sLab.id, roomId: labQuim.id, day: 1, start: "14:30", end: "15:20" },
    // Terça
    { classId: classTAI1.id, teacherId: tCarlos.id, subjectId: sLab.id, roomId: labQuim.id, day: 2, start: "08:00", end: "08:50" },
    { classId: classTAI1.id, teacherId: tCarlos.id, subjectId: sLab.id, roomId: labQuim.id, day: 2, start: "08:50", end: "09:40" },
    { classId: classTAI1.id, teacherId: tAna.id, subjectId: sBio.id, roomId: sala1_1.id, day: 2, start: "09:50", end: "10:40" },
    { classId: classTAI1.id, teacherId: tAna.id, subjectId: sBio.id, roomId: sala1_1.id, day: 2, start: "10:40", end: "11:30" },
    { classId: classTAI1.id, teacherId: tPatricia.id, subjectId: sIng.id, roomId: sala1_1.id, day: 2, start: "11:40", end: "12:30" },
    // Quarta
    { classId: classTAI1.id, teacherId: tAna.id, subjectId: sBio.id, roomId: sala1_1.id, day: 3, start: "10:40", end: "11:30" },
    { classId: classTAI1.id, teacherId: tAna.id, subjectId: sBio.id, roomId: sala1_1.id, day: 3, start: "11:40", end: "12:30" },
    { classId: classTAI1.id, teacherId: tCarlos.id, subjectId: sAna.id, roomId: labQuim.id, day: 3, start: "13:30", end: "14:20" },
    { classId: classTAI1.id, teacherId: tCarlos.id, subjectId: sAna.id, roomId: labQuim.id, day: 3, start: "14:30", end: "15:20" },
    // Quinta
    { classId: classTAI1.id, teacherId: tAna.id, subjectId: sBio.id, roomId: sala1_1.id, day: 4, start: "08:00", end: "08:50" },
    { classId: classTAI1.id, teacherId: tLuis.id, subjectId: sMat.id, roomId: sala1_1.id, day: 4, start: "08:50", end: "09:40" },
    { classId: classTAI1.id, teacherId: tPatricia.id, subjectId: sIng.id, roomId: sala1_1.id, day: 4, start: "09:50", end: "10:40" },
    { classId: classTAI1.id, teacherId: classDirectorTAI1.id, subjectId: sPort.id, roomId: sala1_1.id, day: 4, start: "10:40", end: "11:30" },
    // Sexta
    { classId: classTAI1.id, teacherId: tCarlos.id, subjectId: sLab.id, roomId: labQuim.id, day: 5, start: "08:00", end: "08:50" },
    { classId: classTAI1.id, teacherId: tCarlos.id, subjectId: sLab.id, roomId: labQuim.id, day: 5, start: "08:50", end: "09:40" },
    { classId: classTAI1.id, teacherId: tPatricia.id, subjectId: sIng.id, roomId: sala1_1.id, day: 5, start: "09:50", end: "10:40" },

    // TAI 2ºA — só alguns blocos exemplo
    { classId: classTAI2.id, teacherId: classDirectorTAI2.id, subjectId: sPort.id, roomId: sala1_2.id, day: 1, start: "08:00", end: "08:50" },
    { classId: classTAI2.id, teacherId: tAna.id, subjectId: sBio.id, roomId: sala1_2.id, day: 1, start: "09:50", end: "10:40" },
    { classId: classTAI2.id, teacherId: tCarlos.id, subjectId: sLab.id, roomId: labQuim.id, day: 2, start: "13:30", end: "14:20" },
    { classId: classTAI2.id, teacherId: tCarlos.id, subjectId: sLab.id, roomId: labQuim.id, day: 2, start: "14:30", end: "15:20" },
    { classId: classTAI2.id, teacherId: tLuis.id, subjectId: sMat.id, roomId: sala1_2.id, day: 3, start: "08:00", end: "08:50" },
    { classId: classTAI2.id, teacherId: tLuis.id, subjectId: sMat.id, roomId: sala1_2.id, day: 3, start: "08:50", end: "09:40" },

    // GPSI 1ºA — só alguns blocos exemplo
    { classId: classGPSI1.id, teacherId: classDirectorGPSI1.id, subjectId: sPortG.id, roomId: sala2_1.id, day: 1, start: "10:40", end: "11:30" },
    { classId: classGPSI1.id, teacherId: tMiguel.id, subjectId: sPSI.id, roomId: labInf.id, day: 2, start: "08:00", end: "08:50" },
    { classId: classGPSI1.id, teacherId: tMiguel.id, subjectId: sPSI.id, roomId: labInf.id, day: 2, start: "08:50", end: "09:40" },
    { classId: classGPSI1.id, teacherId: tCatarina.id, subjectId: sSO.id, roomId: labInf.id, day: 3, start: "13:30", end: "14:20" },
    { classId: classGPSI1.id, teacherId: tMiguel.id, subjectId: sRC.id, roomId: labInf.id, day: 4, start: "13:30", end: "14:20" },
    { classId: classGPSI1.id, teacherId: tMiguel.id, subjectId: sRC.id, roomId: labInf.id, day: 4, start: "14:30", end: "15:20" },
  ];
  const createdBlocks = await Promise.all(
    blocks.map((b) =>
      prisma.scheduleBlock.create({
        data: {
          classId: b.classId,
          teacherId: b.teacherId,
          subjectId: b.subjectId,
          roomId: b.roomId,
          dayOfWeek: b.day,
          startTime: b.start,
          endTime: b.end,
        },
      }),
    ),
  );
  console.log(`✅ Schedule blocks: ${createdBlocks.length}`);

  // ─── Aulas históricas (últimas 2 semanas) + presenças ──────────────────────
  // Pegamos em alguns blocos e geramos aulas em datas passadas
  const tai1Students = allStudents.TAI1A;
  const lessonsData = [
    { block: 0, daysAgo: 12, summary: "Introdução aos textos jornalísticos. Análise de uma notícia de capa. Discussão sobre objetividade." },
    { block: 4, daysAgo: 12, summary: "Normas de segurança em laboratório. Equipamentos de proteção individual. Pictogramas." },
    { block: 6, daysAgo: 11, summary: "Práticas de pesagem e medições. Uso da balança analítica e provetas." },
    { block: 8, daysAgo: 11, summary: "Estrutura das proteínas. Tipos de aminoácidos. Ligação peptídica." },
    { block: 13, daysAgo: 10, summary: "Análise de água: determinação de pH e dureza. Resultados práticos." },
    { block: 15, daysAgo: 9, summary: "Metabolismo da glicose. Glicólise e ciclo de Krebs." },
    { block: 19, daysAgo: 8, summary: "Ensaios de identificação de adulterações em laticínios." },
    { block: 0, daysAgo: 5, summary: "Continuação: análise de reportagens. Distinção entre opinião e informação." },
    { block: 6, daysAgo: 4, summary: "Titulação ácido-base. Identificação do ponto de equivalência." },
    { block: 8, daysAgo: 4, summary: "Enzimas: nomenclatura e classificação. Atividade enzimática." },
    { block: 13, daysAgo: 3, summary: "Determinação de cálcio em águas. Método por complexometria." },
    { block: 19, daysAgo: 2, summary: "Pesquisa de microrganismos em alimentos: técnicas de sementeira." },
  ];

  for (const ld of lessonsData) {
    const block = createdBlocks[ld.block];
    if (!block) continue;
    const lesson = await prisma.lesson.create({
      data: {
        scheduleBlockId: block.id,
        classId: block.classId,
        teacherId: block.teacherId!,
        subjectId: block.subjectId,
        date: daysAgo(ld.daysAgo),
        startTime: block.startTime,
        endTime: block.endTime,
        summary: ld.summary,
        lessonNumber: 30 - ld.daysAgo,
      },
    });
    // Presenças variáveis: maioria presente, alguns ausentes / atrasados / justificados
    const classStudents = block.classId === classTAI1.id ? tai1Students :
      block.classId === classTAI2.id ? allStudents.TAI2A : allStudents.GPSI1A;
    await Promise.all(
      classStudents.map((s: any, i: number) => {
        let status: AttendanceStatus = AttendanceStatus.PRESENT;
        // Padrão: 1 ausente, 1 atrasado, 1 justificado em algumas aulas
        if (ld.daysAgo % 3 === 0 && i === 2) status = AttendanceStatus.ABSENT;
        if (ld.daysAgo % 4 === 0 && i === 3) status = AttendanceStatus.LATE;
        if (ld.daysAgo % 5 === 0 && i === 4) status = AttendanceStatus.JUSTIFIED;
        return prisma.attendanceRecord.create({
          data: { lessonId: lesson.id, studentId: s.id, status },
        });
      }),
    );
  }
  console.log(`✅ Lessons: ${lessonsData.length} (com presenças)`);

  // ─── Justificações de Falta ────────────────────────────────────────────────
  const absentRecords = await prisma.attendanceRecord.findMany({
    where: { status: AttendanceStatus.ABSENT },
    take: 6,
  });
  if (absentRecords.length >= 3) {
    await prisma.absenceJustification.create({
      data: {
        attendanceRecordId: absentRecords[0].id,
        reason: "Consulta médica programada. Atestado em anexo.",
        documentUrl: "https://example.com/atestado-medico.pdf",
        status: JustificationStatus.PENDING,
      },
    });
    await prisma.absenceJustification.create({
      data: {
        attendanceRecordId: absentRecords[1].id,
        reason: "Doença súbita. Atestado médico em anexo.",
        documentUrl: "https://example.com/atestado-2.pdf",
        status: JustificationStatus.APPROVED,
        approvedById: classDirectorTAI1.id,
        approvedAt: daysAgo(2),
      },
    });
    await prisma.absenceJustification.create({
      data: {
        attendanceRecordId: absentRecords[2].id,
        reason: "Compromisso pessoal não justificável.",
        status: JustificationStatus.REJECTED,
        approvedById: classDirectorTAI1.id,
        approvedAt: daysAgo(1),
      },
    });
  }
  console.log(`✅ Justificações: 3 (PENDING + APPROVED + REJECTED)`);

  // ─── StudentModuleProgress + ModuleEvaluations ─────────────────────────────
  const allModules = [...modulesPort, ...modulesLab, ...modulesBio];
  for (const student of tai1Students) {
    // Módulo 1 de Lab: aprovado com nota
    const progress1 = await prisma.studentModuleProgress.create({
      data: {
        studentId: student.id,
        moduleId: modulesLab[0].id,
        status: ModuleStatus.APPROVED,
        grade: 13 + Math.random() * 6,
        completedAt: daysAgo(60),
      },
    });
    await prisma.moduleEvaluation.create({
      data: {
        progressId: progress1.id,
        type: EvaluationType.NORMAL,
        grade: 13 + Math.random() * 6,
        date: daysAgo(60),
        notes: "Teste escrito normal",
      },
    });

    // Módulo 1 de Port: aprovado
    const progress2 = await prisma.studentModuleProgress.create({
      data: {
        studentId: student.id,
        moduleId: modulesPort[0].id,
        status: ModuleStatus.APPROVED,
        grade: 12 + Math.random() * 7,
        completedAt: daysAgo(45),
      },
    });
    await prisma.moduleEvaluation.create({
      data: {
        progressId: progress2.id,
        type: EvaluationType.NORMAL,
        grade: 12 + Math.random() * 7,
        date: daysAgo(45),
      },
    });

    // Módulo 2 de Lab: em curso
    await prisma.studentModuleProgress.create({
      data: {
        studentId: student.id,
        moduleId: modulesLab[1].id,
        status: ModuleStatus.IN_PROGRESS,
      },
    });
  }

  // Aluno em recurso
  const progressRecurso = await prisma.studentModuleProgress.create({
    data: {
      studentId: tai1Students[2].id,
      moduleId: modulesBio[0].id,
      status: ModuleStatus.RECURSO,
      grade: 8.5,
    },
  });
  await prisma.moduleEvaluation.create({
    data: { progressId: progressRecurso.id, type: EvaluationType.NORMAL, grade: 8.5, date: daysAgo(30) },
  });
  console.log(`✅ Module progress + evaluations`);

  // ─── FCT ───────────────────────────────────────────────────────────────────
  // Aluno do 2º ano em FCT ongoing
  const fctOngoing = await prisma.fctRecord.create({
    data: {
      studentId: allStudents.TAI2A[0].id,
      classId: classTAI2.id,
      companyName: "Laboratório Cervejas do Alentejo, Lda.",
      supervisorName: "Eng. Pedro Alves",
      supervisorEmail: "pedro.alves@cervejas-alentejo.pt",
      supervisorPhone: "+351265123456",
      startDate: daysAgo(60),
      endDate: daysAhead(30),
      requiredHours: 420,
      completedHours: 220,
      status: FctStatus.ONGOING,
    },
  });
  await prisma.fctDocument.create({
    data: { fctId: fctOngoing.id, type: FctDocType.PROTOCOL, title: "Protocolo FCT 2024/25", fileUrl: "https://example.com/protocolo.pdf" },
  });
  await prisma.fctDocument.create({
    data: { fctId: fctOngoing.id, type: FctDocType.INSURANCE, title: "Seguro escolar", fileUrl: "https://example.com/seguro.pdf" },
  });

  // FCT planeada
  await prisma.fctRecord.create({
    data: {
      studentId: allStudents.TAI2A[1].id,
      classId: classTAI2.id,
      companyName: "Águas do Sado, S.A.",
      supervisorName: "Dra. Inês Coutinho",
      supervisorEmail: "ines.coutinho@aguas-sado.pt",
      startDate: daysAhead(15),
      endDate: daysAhead(105),
      requiredHours: 420,
      completedHours: 0,
      status: FctStatus.PLANNED,
    },
  });

  // FCT concluída
  await prisma.fctRecord.create({
    data: {
      studentId: allStudents.TAI2A[2].id,
      classId: classTAI2.id,
      companyName: "Embraer Évora",
      supervisorName: "Eng. Tiago Mesquita",
      startDate: daysAgo(180),
      endDate: daysAgo(60),
      requiredHours: 420,
      completedHours: 420,
      grade: 16,
      status: FctStatus.COMPLETED,
    },
  });
  console.log(`✅ FCT: 3 registos (ONGOING, PLANNED, COMPLETED)`);

  // ─── PAP ───────────────────────────────────────────────────────────────────
  const pap1 = await prisma.papRecord.create({
    data: {
      studentId: allStudents.TAI2A[0].id,
      classId: classTAI2.id,
      advisorId: tCarlos.id,
      title: "Controlo de Qualidade em Cervejas Artesanais",
      description: "Implementação de um sistema de controlo de qualidade microbiológico e físico-químico para cervejas artesanais.",
      status: PapStatus.DEVELOPMENT,
    },
  });
  await prisma.papPhase.createMany({
    data: [
      { papId: pap1.id, phase: PapPhaseType.PROPOSAL, dueDate: daysAgo(60), submittedAt: daysAgo(65), status: PhaseStatus.APPROVED, progress: 100 },
      { papId: pap1.id, phase: PapPhaseType.DEVELOPMENT, dueDate: daysAhead(20), status: PhaseStatus.IN_PROGRESS, progress: 60 },
      { papId: pap1.id, phase: PapPhaseType.SUBMISSION, dueDate: daysAhead(45), status: PhaseStatus.PENDING, progress: 0 },
      { papId: pap1.id, phase: PapPhaseType.PRESENTATION, dueDate: daysAhead(60), status: PhaseStatus.PENDING, progress: 0 },
    ],
  });
  await prisma.papJuryMember.createMany({
    data: [
      { papId: pap1.id, userId: admin.id, role: JuryRole.PRESIDENT },
      { papId: pap1.id, userId: tCarlos.id, role: JuryRole.ADVISOR },
      { papId: pap1.id, userId: tAna.id, role: JuryRole.MEMBER },
    ],
  });

  // PAP submetida
  const pap2 = await prisma.papRecord.create({
    data: {
      studentId: allStudents.TAI2A[1].id,
      classId: classTAI2.id,
      advisorId: tAna.id,
      title: "Análise de pesticidas em águas residuais",
      description: "Aplicação de HPLC para deteção de resíduos de pesticidas.",
      status: PapStatus.SUBMITTED,
    },
  });
  await prisma.papPhase.createMany({
    data: [
      { papId: pap2.id, phase: PapPhaseType.PROPOSAL, dueDate: daysAgo(90), submittedAt: daysAgo(95), status: PhaseStatus.APPROVED, progress: 100 },
      { papId: pap2.id, phase: PapPhaseType.DEVELOPMENT, dueDate: daysAgo(30), submittedAt: daysAgo(32), status: PhaseStatus.APPROVED, progress: 100 },
      { papId: pap2.id, phase: PapPhaseType.SUBMISSION, dueDate: daysAgo(5), submittedAt: daysAgo(3), status: PhaseStatus.SUBMITTED, progress: 100 },
      { papId: pap2.id, phase: PapPhaseType.PRESENTATION, dueDate: daysAhead(10), status: PhaseStatus.PENDING, progress: 0 },
    ],
  });
  console.log(`✅ PAP: 2 registos`);

  // ─── Documents (escola) ────────────────────────────────────────────────────
  await prisma.document.deleteMany({ where: { schoolId: school.id } });
  await prisma.document.createMany({
    data: [
      { schoolId: school.id, uploaderId: admin.id, category: DocumentCategory.REGULATIONS, title: "Regulamento Interno 2024/2025", description: "Regulamento interno do agrupamento", fileUrl: "https://example.com/regulamento.pdf", accessLevel: DocumentAccess.STUDENT },
      { schoolId: school.id, uploaderId: admin.id, category: DocumentCategory.REGULATIONS, title: "Estatuto do Aluno", description: "Direitos e deveres do aluno", fileUrl: "https://example.com/estatuto.pdf", accessLevel: DocumentAccess.STUDENT },
      { schoolId: school.id, uploaderId: courseDirectorTAI.id, category: DocumentCategory.PLANIFICATIONS, title: "Planificação TAI 1ºA", description: "Planificação anual", fileUrl: "https://example.com/plan-tai.pdf", accessLevel: DocumentAccess.STAFF },
      { schoolId: school.id, uploaderId: admin.id, category: DocumentCategory.MINUTES, title: "Ata reunião conselho pedagógico 02/2025", fileUrl: "https://example.com/ata.pdf", accessLevel: DocumentAccess.STAFF },
      { schoolId: school.id, uploaderId: admin.id, category: DocumentCategory.FCT_DOCS, title: "Manual FCT 2024/25", fileUrl: "https://example.com/manual-fct.pdf", accessLevel: DocumentAccess.STUDENT },
    ],
  });

  // ─── Folders & Files (turma TAI 1ºA — disciplina Lab) ──────────────────────
  const folderRoot = await prisma.folder.create({
    data: {
      name: "Material de Apoio",
      classId: classTAI1.id,
      subjectId: sLab.id,
      moduleId: modulesLab[0].id,
      createdById: tCarlos.id,
    },
  });
  await prisma.folder.create({
    data: {
      name: "Apresentações",
      classId: classTAI1.id,
      subjectId: sLab.id,
      moduleId: modulesLab[0].id,
      parentId: folderRoot.id,
      createdById: tCarlos.id,
    },
  });
  await prisma.file.createMany({
    data: [
      {
        name: "Normas-Seguranca-Lab.pdf",
        storageKey: "files/seed/normas-seg.pdf",
        url: "https://example.com/normas-seg.pdf",
        size: 245000,
        mimeType: "application/pdf",
        ownerId: tCarlos.id,
        visibility: FileVisibility.CLASS_SHARED,
        classId: classTAI1.id,
        subjectId: sLab.id,
        moduleId: modulesLab[0].id,
        folderId: folderRoot.id,
      },
      {
        name: "Pictogramas-Quimicos.pdf",
        storageKey: "files/seed/pictogramas.pdf",
        url: "https://example.com/pictogramas.pdf",
        size: 180000,
        mimeType: "application/pdf",
        ownerId: tCarlos.id,
        visibility: FileVisibility.CLASS_SHARED,
        classId: classTAI1.id,
        subjectId: sLab.id,
        moduleId: modulesLab[0].id,
        folderId: folderRoot.id,
      },
    ],
  });
  console.log(`✅ Documents + Folders + Files`);

  // ─── Classroom: Topics + Posts + Submissions ───────────────────────────────
  await prisma.classroomTopic.deleteMany({ where: { class: { course: { schoolId: school.id } } } });
  const topic1 = await prisma.classroomTopic.create({
    data: { classId: classTAI1.id, name: "Avisos gerais", order: 1 },
  });
  const topic2 = await prisma.classroomTopic.create({
    data: { classId: classTAI1.id, name: "Módulo 2: Técnicas Básicas", order: 2 },
  });

  // 1. Anúncio
  const post1 = await prisma.classroomPost.create({
    data: {
      classId: classTAI1.id,
      topicId: topic1.id,
      authorId: classDirectorTAI1.id,
      type: PostType.ANNOUNCEMENT,
      content: "Bom dia turma! Lembrem-se que amanhã temos a saída de estudo ao laboratório regional. Encontro às 08:30 à porta principal.",
    },
  });

  // 2. Material
  const post2 = await prisma.classroomPost.create({
    data: {
      classId: classTAI1.id,
      topicId: topic2.id,
      subjectId: sLab.id,
      moduleId: modulesLab[1].id,
      authorId: tCarlos.id,
      type: PostType.MATERIAL,
      title: "Apontamentos: Técnicas de pesagem",
      content: "Em anexo, apontamentos para a aula de quinta-feira. Estudem antes da aula.",
    },
  });

  // 3. Assignment (com prazo e nota máxima)
  const post3 = await prisma.classroomPost.create({
    data: {
      classId: classTAI1.id,
      topicId: topic2.id,
      subjectId: sLab.id,
      moduleId: modulesLab[1].id,
      authorId: tCarlos.id,
      type: PostType.ASSIGNMENT,
      title: "Relatório: Análise de água",
      content: "Entreguem o relatório da última prática laboratorial. Estrutura: Introdução, Materiais e Métodos, Resultados, Discussão, Conclusão.",
      dueDate: daysAhead(7),
      maxGrade: 20,
      countsForModule: true,
    },
  });

  // 4. Question
  await prisma.classroomPost.create({
    data: {
      classId: classTAI1.id,
      topicId: topic1.id,
      authorId: classDirectorTAI1.id,
      type: PostType.QUESTION,
      title: "Pergunta sobre a visita de estudo",
      content: "Quem precisa de transporte para a visita de estudo? Respondam por aqui até quinta-feira.",
    },
  });

  // Comentários no anúncio
  await prisma.postComment.createMany({
    data: [
      { postId: post1.id, authorId: tai1Students[0].id, content: "Obrigada pelo lembrete!" },
      { postId: post1.id, authorId: tai1Students[1].id, content: "Posso atrasar-me 10min? Tenho consulta." },
      { postId: post1.id, authorId: classDirectorTAI1.id, content: "Sim, sem problema. Avisa o motorista." },
    ],
  });

  // Submissions para o assignment (post3)
  for (let i = 0; i < tai1Students.length; i++) {
    const s = tai1Students[i];
    let status: SubmissionStatus = SubmissionStatus.NOT_SUBMITTED;
    let submittedAt: Date | null = null;
    let grade: number | null = null;
    let feedback: string | null = null;
    let reviewedAt: Date | null = null;
    let reviewerId: string | null = null;

    if (i === 0) {
      status = SubmissionStatus.GRADED;
      submittedAt = daysAgo(2);
      grade = 16;
      feedback = "Excelente trabalho! Bem estruturado, com boa discussão dos resultados.";
      reviewedAt = daysAgo(1);
      reviewerId = tCarlos.id;
    } else if (i === 1) {
      status = SubmissionStatus.GRADED;
      submittedAt = daysAgo(3);
      grade = 12;
      feedback = "Resultados corretos mas a discussão precisa de mais aprofundamento.";
      reviewedAt = daysAgo(1);
      reviewerId = tCarlos.id;
    } else if (i === 2) {
      status = SubmissionStatus.SUBMITTED;
      submittedAt = daysAgo(1);
    } else if (i === 3) {
      status = SubmissionStatus.LATE;
      submittedAt = new Date();
    }
    // i === 4, 5 ficam NOT_SUBMITTED

    await prisma.submission.create({
      data: {
        postId: post3.id,
        studentId: s.id,
        status,
        submittedAt,
        grade,
        feedback,
        reviewedAt,
        reviewerId,
      },
    });
  }
  console.log(`✅ Classroom: 4 posts + comentários + submissões`);

  // ─── Conversations + Messages ──────────────────────────────────────────────
  // Helper para garantir user1Id < user2Id
  const convo = async (a: string, b: string) => {
    const [u1, u2] = [a, b].sort();
    return prisma.conversation.upsert({
      where: { user1Id_user2Id: { user1Id: u1, user2Id: u2 } },
      update: {},
      create: { user1Id: u1, user2Id: u2, schoolId: school.id },
    });
  };

  const conv1 = await convo(classDirectorTAI1.id, tai1Students[0].id);
  await prisma.message.createMany({
    data: [
      { conversationId: conv1.id, senderId: tai1Students[0].id, content: "Stora, posso entregar o relatório amanhã? Estive doente." },
      { conversationId: conv1.id, senderId: classDirectorTAI1.id, content: "Claro, manda-me até sexta. Boas melhoras!" },
      { conversationId: conv1.id, senderId: tai1Students[0].id, content: "Obrigada!" },
    ],
  });

  const conv2 = await convo(tCarlos.id, classDirectorTAI1.id);
  await prisma.message.createMany({
    data: [
      { conversationId: conv2.id, senderId: tCarlos.id, content: "A Inês tem faltado bastante. Podes verificar?" },
      { conversationId: conv2.id, senderId: classDirectorTAI1.id, content: "Vou contactar a EE hoje." },
    ],
  });

  const conv3 = await convo(guardians["Beatriz Oliveira"].id, classDirectorTAI1.id);
  await prisma.message.createMany({
    data: [
      { conversationId: conv3.id, senderId: classDirectorTAI1.id, content: "Boa tarde, queria conversar sobre o desempenho da Beatriz." },
      { conversationId: conv3.id, senderId: guardians["Beatriz Oliveira"].id, content: "Boa tarde, claro. Quando podemos marcar?" },
    ],
  });
  console.log(`✅ Conversas + mensagens`);

  // ─── TeacherAbsence + Substitution ─────────────────────────────────────────
  const absence1 = await prisma.teacherAbsence.create({
    data: {
      teacherId: tAna.id,
      date: daysAhead(1),
      startTime: "08:00",
      endTime: "12:30",
      reason: "Consulta médica",
      createdById: admin.id,
    },
  });

  // Substituições para os blocos da Ana amanhã (terça = day 2)
  const anaBlocksTuesday = createdBlocks.filter(
    (b) => b.teacherId === tAna.id && b.dayOfWeek === 2,
  );
  for (const b of anaBlocksTuesday) {
    await prisma.substitution.create({
      data: {
        absenceId: absence1.id,
        scheduleBlockId: b.id,
        classId: b.classId,
        subjectId: b.subjectId,
        startTime: b.startTime,
        endTime: b.endTime,
        substituteId: tLuis.id,
        status: SubstitutionStatus.CONFIRMED,
      },
    });
  }

  const absence2 = await prisma.teacherAbsence.create({
    data: {
      teacherId: tCarlos.id,
      date: daysAhead(2),
      startTime: "13:30",
      endTime: "15:20",
      reason: "Formação externa",
      createdById: admin.id,
    },
  });
  const carlosBlocksWed = createdBlocks.filter(
    (b) => b.teacherId === tCarlos.id && b.dayOfWeek === 3 && b.startTime >= "13:30",
  );
  for (const b of carlosBlocksWed) {
    await prisma.substitution.create({
      data: {
        absenceId: absence2.id,
        scheduleBlockId: b.id,
        classId: b.classId,
        subjectId: b.subjectId,
        startTime: b.startTime,
        endTime: b.endTime,
        status: SubstitutionStatus.PENDING,
      },
    });
  }
  console.log(`✅ TeacherAbsence + Substitutions`);

  // ─── NotificationPreference (exemplos personalizados) ──────────────────────
  await prisma.notificationPreference.upsert({
    where: { userId: classDirectorTAI1.id },
    update: {},
    create: {
      userId: classDirectorTAI1.id,
      quietHoursStart: "22:00",
      quietHoursEnd: "07:00",
      emailEnabled: true,
      smsEnabled: false,
      pushEnabled: true,
    },
  });
  // Encarregado de educação: prefere email para tudo
  await prisma.notificationPreference.upsert({
    where: { userId: guardians["Beatriz Oliveira"].id },
    update: {},
    create: {
      userId: guardians["Beatriz Oliveira"].id,
      grades: ["EMAIL", "IN_APP"],
      absences: ["EMAIL", "IN_APP", "SMS"],
      lessonCancelled: ["EMAIL", "SMS", "IN_APP"],
      quietHoursStart: "22:30",
      quietHoursEnd: "07:30",
    },
  });
  console.log(`✅ NotificationPreferences`);

  // ─── Notificações (in-app) ─────────────────────────────────────────────────
  const notif1 = await prisma.notification.create({
    data: {
      schoolId: school.id,
      senderId: admin.id,
      title: "Início das épocas especiais",
      content: "As épocas especiais de avaliação decorrerão entre 23 e 27 de junho de 2025.",
      type: NotificationType.DEADLINE,
      recipientType: RecipientType.ALL_SCHOOL,
    },
  });
  await prisma.notificationRecipient.createMany({
    data: allStudentsList.map((s) => ({ notificationId: notif1.id, recipientId: s.id })),
    skipDuplicates: true,
  });

  const notif2 = await prisma.notification.create({
    data: {
      schoolId: school.id,
      senderId: classDirectorTAI1.id,
      title: "Visita de estudo amanhã",
      content: "Lembrete: encontro às 08:30 à porta principal.",
      type: NotificationType.INFO,
      recipientType: RecipientType.CLASS_STUDENTS,
      classId: classTAI1.id,
    },
  });
  const tai1Recipients = await Promise.all(
    tai1Students.map((s) =>
      prisma.notificationRecipient.upsert({
        where: { notificationId_recipientId: { notificationId: notif2.id, recipientId: s.id } },
        update: {},
        create: { notificationId: notif2.id, recipientId: s.id },
      }),
    ),
  );

  // Deliveries de exemplo (variando status)
  for (let i = 0; i < tai1Recipients.length; i++) {
    const r = tai1Recipients[i];
    await prisma.notificationDelivery.create({
      data: {
        recipientId: r.id,
        channel: "IN_APP",
        status: DeliveryStatus.SENT,
        category: NotificationCategory.ANNOUNCEMENT,
        sentAt: daysAgo(0),
      },
    });
    await prisma.notificationDelivery.create({
      data: {
        recipientId: r.id,
        channel: "EMAIL",
        status: i % 4 === 0 ? DeliveryStatus.SKIPPED : DeliveryStatus.SENT,
        category: NotificationCategory.ANNOUNCEMENT,
        target: tai1Students[i].email,
        sentAt: daysAgo(0),
        error: i % 4 === 0 ? "no_provider_configured" : null,
      },
    });
  }
  console.log(`✅ Notifications + recipients + deliveries`);

  console.log("\n✅ Seed completo!");
  console.log("\n📋 Credenciais de login (password: password123):");
  console.log("  ──────────────────────────────────────────────────────");
  console.log("  ADMIN");
  console.log("    admin@aevendasnovas.edu.pt");
  console.log("  ");
  console.log("  DIREÇÃO");
  console.log("    joao.silva@aevendasnovas.edu.pt        (Dir. Curso TAI)");
  console.log("    rita.alves@aevendasnovas.edu.pt        (Dir. Curso GPSI)");
  console.log("    maria.costa@aevendasnovas.edu.pt       (Dir. Turma TAI1ºA)");
  console.log("    antonio.pinto@aevendasnovas.edu.pt     (Dir. Turma TAI2ºA)");
  console.log("    sofia.morais@aevendasnovas.edu.pt      (Dir. Turma GPSI1ºA)");
  console.log("  ");
  console.log("  PROFESSORES");
  console.log("    carlos.santos@aevendasnovas.edu.pt");
  console.log("    ana.ferreira@aevendasnovas.edu.pt");
  console.log("    luis.machado@aevendasnovas.edu.pt");
  console.log("    patricia.dias@aevendasnovas.edu.pt");
  console.log("    miguel.lopes@aevendasnovas.edu.pt");
  console.log("    catarina.serra@aevendasnovas.edu.pt");
  console.log("  ");
  console.log("  ALUNOS  (exemplo — total 18)");
  console.log("    beatriz.oliveira@aluno.aevendasnovas.edu.pt   (TAI 1ºA)");
  console.log("    leonor.tavares@aluno.aevendasnovas.edu.pt     (TAI 2ºA — FCT)");
  console.log("    vasco.reis@aluno.aevendasnovas.edu.pt         (GPSI 1ºA)");
  console.log("  ");
  console.log("  ENCARREGADOS DE EDUCAÇÃO  (8)");
  console.log("    helena.oliveira@encarregado.pt        (EE da Beatriz)");
  console.log("    sandra.tavares@encarregado.pt         (EE da Leonor)");
  console.log("    marta.reis@encarregado.pt             (EE do Vasco)");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
