import { PrismaClient, Role, FormationComponent, ModuleStatus, FctStatus, PapStatus, PapPhaseType, PhaseStatus, JuryRole, NotificationType, RecipientType, AttendanceStatus, DocumentCategory, DocumentAccess, RoomType } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";
dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  console.log("🌱 Seeding database...");

  // ── School ────────────────────────────────────────────────────────────────
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
    },
  });
  console.log("✅ School:", school.slug);

  // ── Academic Year ─────────────────────────────────────────────────────────
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

  // ── Password hash ─────────────────────────────────────────────────────────
  const hash = await bcrypt.hash("password123", 12);

  // ── Users ─────────────────────────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { email_schoolId: { email: "admin@aevendasnovas.edu.pt", schoolId: school.id } },
    update: {},
    create: {
      name: "Adélia Bentes",
      email: "admin@aevendasnovas.edu.pt",
      passwordHash: hash,
      role: Role.SCHOOL_ADMIN,
      schoolId: school.id,
    },
  });

  const courseDirector = await prisma.user.upsert({
    where: { email_schoolId: { email: "joao.silva@aevendasnovas.edu.pt", schoolId: school.id } },
    update: {},
    create: {
      name: "João Silva",
      email: "joao.silva@aevendasnovas.edu.pt",
      passwordHash: hash,
      role: Role.COURSE_DIRECTOR,
      schoolId: school.id,
    },
  });

  const classDirector = await prisma.user.upsert({
    where: { email_schoolId: { email: "maria.costa@aevendasnovas.edu.pt", schoolId: school.id } },
    update: {},
    create: {
      name: "Maria Costa",
      email: "maria.costa@aevendasnovas.edu.pt",
      passwordHash: hash,
      role: Role.CLASS_DIRECTOR,
      schoolId: school.id,
    },
  });

  const teacher1 = await prisma.user.upsert({
    where: { email_schoolId: { email: "carlos.santos@aevendasnovas.edu.pt", schoolId: school.id } },
    update: {},
    create: {
      name: "Carlos Santos",
      email: "carlos.santos@aevendasnovas.edu.pt",
      passwordHash: hash,
      role: Role.TEACHER,
      schoolId: school.id,
    },
  });

  const teacher2 = await prisma.user.upsert({
    where: { email_schoolId: { email: "ana.ferreira@aevendasnovas.edu.pt", schoolId: school.id } },
    update: {},
    create: {
      name: "Ana Ferreira",
      email: "ana.ferreira@aevendasnovas.edu.pt",
      passwordHash: hash,
      role: Role.TEACHER,
      schoolId: school.id,
    },
  });

  const students = await Promise.all([
    "Beatriz Oliveira", "Diogo Mendes", "Filipa Rodrigues",
    "Gonçalo Pereira", "Inês Martins", "João Figueiredo",
  ].map(async (name, i) => {
    const email = `${name.toLowerCase().replace(/ /g, ".")}@aluno.aevendasnovas.edu.pt`;
    return prisma.user.upsert({
      where: { email_schoolId: { email, schoolId: school.id } },
      update: {},
      create: { name, email, passwordHash: hash, role: Role.STUDENT, schoolId: school.id },
    });
  }));

  console.log("✅ Users created:", 4 + students.length);

  // ── Course ────────────────────────────────────────────────────────────────
  const course = await prisma.course.upsert({
    where: { code_schoolId: { code: "TAI", schoolId: school.id } },
    update: {},
    create: {
      name: "Técnico de Análise Laboratorial",
      code: "TAI",
      formationArea: "Química",
      level: 4,
      totalHours: 3250,
      schoolId: school.id,
      directorId: courseDirector.id,
    },
  });

  // ── Subjects ──────────────────────────────────────────────────────────────
  const [portugues, matematica, ingles, bioquimica, tecLab, tecAnalisesA] = await Promise.all([
    prisma.subject.create({ data: { courseId: course.id, name: "Português", component: FormationComponent.SOCIOCULTURAL, totalHours: 320, order: 1 } }),
    prisma.subject.create({ data: { courseId: course.id, name: "Matemática", component: FormationComponent.SCIENTIFIC, totalHours: 250, order: 2 } }),
    prisma.subject.create({ data: { courseId: course.id, name: "Inglês", component: FormationComponent.SOCIOCULTURAL, totalHours: 220, order: 3 } }),
    prisma.subject.create({ data: { courseId: course.id, name: "Bioquímica", component: FormationComponent.SCIENTIFIC, totalHours: 250, order: 4 } }),
    prisma.subject.create({ data: { courseId: course.id, name: "Técnicas Laboratoriais", component: FormationComponent.TECHNICAL, totalHours: 400, order: 5 } }),
    prisma.subject.create({ data: { courseId: course.id, name: "Técnicas de Análises Alimentares", component: FormationComponent.TECHNICAL, totalHours: 300, order: 6 } }),
  ]);

  // ── Modules ───────────────────────────────────────────────────────────────
  const modulesPort = await Promise.all([
    { n: 1, name: "Textos dos Média", h: 24 },
    { n: 2, name: "Literatura Portuguesa", h: 30 },
    { n: 3, name: "Leitura e Escrita", h: 26 },
  ].map(({ n, name, h }) =>
    prisma.module.create({ data: { subjectId: portugues.id, name, number: n, hours: h, order: n } })
  ));

  const modulesLab = await Promise.all([
    { n: 1, name: "Segurança no Laboratório", h: 25 },
    { n: 2, name: "Técnicas Básicas", h: 35 },
    { n: 3, name: "Análises Físico-Químicas", h: 40 },
    { n: 4, name: "Análises Microbiológicas", h: 45 },
  ].map(({ n, name, h }) =>
    prisma.module.create({ data: { subjectId: tecLab.id, name, number: n, hours: h, order: n } })
  ));

  // ── Class ─────────────────────────────────────────────────────────────────
  const classObj = await prisma.class.create({
    data: {
      courseId: course.id,
      academicYearId: academicYear.id,
      name: "TAI 1ºA",
      year: 1,
      classDirectorId: classDirector.id,
    },
  });

  // ── Enrollments ───────────────────────────────────────────────────────────
  await Promise.all(students.map((s) =>
    prisma.enrollment.upsert({
      where: { studentId_classId: { studentId: s.id, classId: classObj.id } },
      update: {},
      create: { studentId: s.id, classId: classObj.id },
    })
  ));

  // ── Subject Assignments ────────────────────────────────────────────────────
  await Promise.all([
    prisma.subjectAssignment.upsert({
      where: { teacherId_subjectId_classId: { teacherId: classDirector.id, subjectId: portugues.id, classId: classObj.id } },
      update: {},
      create: { teacherId: classDirector.id, subjectId: portugues.id, classId: classObj.id },
    }),
    prisma.subjectAssignment.upsert({
      where: { teacherId_subjectId_classId: { teacherId: teacher1.id, subjectId: tecLab.id, classId: classObj.id } },
      update: {},
      create: { teacherId: teacher1.id, subjectId: tecLab.id, classId: classObj.id },
    }),
    prisma.subjectAssignment.upsert({
      where: { teacherId_subjectId_classId: { teacherId: teacher2.id, subjectId: bioquimica.id, classId: classObj.id } },
      update: {},
      create: { teacherId: teacher2.id, subjectId: bioquimica.id, classId: classObj.id },
    }),
  ]);

  // ── Rooms ─────────────────────────────────────────────────────────────────
  const [sala1, lab1] = await Promise.all([
    prisma.room.create({ data: { schoolId: school.id, name: "Sala 1.1", capacity: 30, type: RoomType.CLASSROOM } }),
    prisma.room.create({ data: { schoolId: school.id, name: "Laboratório A", capacity: 20, type: RoomType.LAB } }),
  ]);

  // ── Schedule ──────────────────────────────────────────────────────────────
  await Promise.all([
    prisma.scheduleBlock.create({ data: { classId: classObj.id, teacherId: classDirector.id, subjectId: portugues.id, roomId: sala1.id, dayOfWeek: 1, startTime: "08:00", endTime: "08:50" } }),
    prisma.scheduleBlock.create({ data: { classId: classObj.id, teacherId: classDirector.id, subjectId: portugues.id, roomId: sala1.id, dayOfWeek: 1, startTime: "08:50", endTime: "09:40" } }),
    prisma.scheduleBlock.create({ data: { classId: classObj.id, teacherId: teacher1.id, subjectId: tecLab.id, roomId: lab1.id, dayOfWeek: 2, startTime: "08:00", endTime: "08:50" } }),
    prisma.scheduleBlock.create({ data: { classId: classObj.id, teacherId: teacher1.id, subjectId: tecLab.id, roomId: lab1.id, dayOfWeek: 2, startTime: "08:50", endTime: "09:40" } }),
    prisma.scheduleBlock.create({ data: { classId: classObj.id, teacherId: teacher2.id, subjectId: bioquimica.id, roomId: sala1.id, dayOfWeek: 3, startTime: "10:40", endTime: "11:30" } }),
    prisma.scheduleBlock.create({ data: { classId: classObj.id, teacherId: teacher2.id, subjectId: bioquimica.id, roomId: sala1.id, dayOfWeek: 4, startTime: "10:40", endTime: "11:30" } }),
  ]);

  // ── Lessons ───────────────────────────────────────────────────────────────
  const lesson1 = await prisma.lesson.create({
    data: {
      classId: classObj.id,
      teacherId: teacher1.id,
      subjectId: tecLab.id,
      date: new Date("2025-05-12"),
      startTime: "08:00",
      endTime: "09:40",
      summary: "Apresentação das normas de segurança em laboratório. Equipamentos de proteção individual.",
      lessonNumber: 15,
    },
  });

  // ── Attendance ────────────────────────────────────────────────────────────
  await Promise.all(students.map((s, i) =>
    prisma.attendanceRecord.create({
      data: {
        lessonId: lesson1.id,
        studentId: s.id,
        status: i === 2 ? AttendanceStatus.ABSENT : AttendanceStatus.PRESENT,
      },
    })
  ));

  // ── Module Progress ────────────────────────────────────────────────────────
  await Promise.all(students.slice(0, 3).map((s) =>
    prisma.studentModuleProgress.create({
      data: {
        studentId: s.id,
        moduleId: modulesLab[0].id,
        status: ModuleStatus.APPROVED,
        grade: 14 + Math.random() * 4,
        completedAt: new Date("2025-02-28"),
      },
    })
  ));
  await Promise.all(students.map((s) =>
    prisma.studentModuleProgress.create({
      data: {
        studentId: s.id,
        moduleId: modulesLab[1].id,
        status: ModuleStatus.IN_PROGRESS,
      },
    })
  ));

  // ── FCT Records ───────────────────────────────────────────────────────────
  await prisma.fctRecord.create({
    data: {
      studentId: students[0].id,
      classId: classObj.id,
      companyName: "Laboratório Cervejas do Alentejo, Lda.",
      supervisorName: "Eng. Pedro Alves",
      supervisorEmail: "pedro.alves@cervejas-alentejo.pt",
      startDate: new Date("2025-02-03"),
      endDate: new Date("2025-05-30"),
      requiredHours: 420,
      completedHours: 180,
      status: FctStatus.ONGOING,
    },
  });

  // ── PAP Records ───────────────────────────────────────────────────────────
  const pap = await prisma.papRecord.create({
    data: {
      studentId: students[0].id,
      classId: classObj.id,
      advisorId: teacher1.id,
      title: "Controlo de Qualidade em Cervejas Artesanais",
      description: "Implementação de um sistema de controlo de qualidade microbiológico e físico-químico para cervejas artesanais.",
      status: PapStatus.DEVELOPMENT,
    },
  });

  await Promise.all([
    prisma.papPhase.create({ data: { papId: pap.id, phase: PapPhaseType.PROPOSAL, dueDate: new Date("2025-02-28"), submittedAt: new Date("2025-02-20"), status: PhaseStatus.APPROVED } }),
    prisma.papPhase.create({ data: { papId: pap.id, phase: PapPhaseType.DEVELOPMENT, dueDate: new Date("2025-05-15"), status: PhaseStatus.IN_PROGRESS } }),
    prisma.papPhase.create({ data: { papId: pap.id, phase: PapPhaseType.SUBMISSION, dueDate: new Date("2025-06-15"), status: PhaseStatus.PENDING } }),
    prisma.papPhase.create({ data: { papId: pap.id, phase: PapPhaseType.PRESENTATION, dueDate: new Date("2025-06-25"), status: PhaseStatus.PENDING } }),
  ]);

  await prisma.papJuryMember.create({ data: { papId: pap.id, userId: admin.id, role: JuryRole.PRESIDENT } });
  await prisma.papJuryMember.create({ data: { papId: pap.id, userId: teacher1.id, role: JuryRole.ADVISOR } });

  // ── Documents ─────────────────────────────────────────────────────────────
  await prisma.document.create({
    data: {
      schoolId: school.id,
      uploaderId: admin.id,
      category: DocumentCategory.REGULATIONS,
      title: "Regulamento dos Cursos Profissionais 2023/2024",
      description: "Regulamento interno dos cursos profissionais do agrupamento",
      fileUrl: "https://example.com/regulamento-cp.pdf",
      accessLevel: DocumentAccess.STUDENT,
    },
  });

  // ── Notifications ─────────────────────────────────────────────────────────
  const notification = await prisma.notification.create({
    data: {
      schoolId: school.id,
      senderId: admin.id,
      title: "Início das épocas especiais de avaliação",
      content: "Informamos que as épocas especiais de avaliação para recuperação de módulos decorrerão entre 23 e 27 de junho de 2025.",
      type: NotificationType.DEADLINE,
      recipientType: RecipientType.ALL_SCHOOL,
    },
  });

  await Promise.all(students.map((s) =>
    prisma.notificationRecipient.create({
      data: { notificationId: notification.id, recipientId: s.id },
    })
  ));

  console.log("✅ Seed complete!");
  console.log("\n📋 Login credentials (all use password: password123):");
  console.log("  School slug: vendas-novas");
  console.log("  Admin:          admin@aevendasnovas.edu.pt");
  console.log("  Diretor Curso:  joao.silva@aevendasnovas.edu.pt");
  console.log("  Diretor Turma:  maria.costa@aevendasnovas.edu.pt");
  console.log("  Professor:      carlos.santos@aevendasnovas.edu.pt");
  console.log("  Aluno:          beatriz.oliveira@aluno.aevendasnovas.edu.pt");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
