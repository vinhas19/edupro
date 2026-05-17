import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ApplicationForm } from "@/components/applications/application-form";
import { GraduationCap } from "lucide-react";

export default async function ApplicationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const school = await prisma.school.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      active: true,
      featureEnrollment: true,
      address: true,
      email: true,
      phone: true,
    },
  });
  if (!school || !school.active || !school.featureEnrollment) notFound();

  const [courses, academicYears] = await Promise.all([
    prisma.course.findMany({
      where: { schoolId: school.id, active: true },
      select: { id: true, name: true, code: true },
      orderBy: { name: "asc" },
    }),
    prisma.academicYear.findMany({
      where: {
        schoolId: school.id,
        endDate: { gte: new Date() },
      },
      select: { id: true, label: true, startDate: true, active: true },
      orderBy: { startDate: "desc" },
    }),
  ]);

  return (
    <div className="min-h-screen bg-[var(--background)] py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div
            className="h-14 w-14 mx-auto rounded-full flex items-center justify-center text-white"
            style={{ background: "var(--tint-blue)" }}
          >
            <GraduationCap className="h-7 w-7" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--tint-blue)]">
              Inscrição online
            </p>
            <h1 className="text-2xl sm:text-[28px] font-bold tracking-[-0.022em]">{school.name}</h1>
            {school.address && (
              <p className="text-[13px] text-[var(--muted-foreground)]">{school.address}</p>
            )}
          </div>
        </div>

        <ApplicationForm
          schoolSlug={school.slug}
          courses={courses}
          academicYears={academicYears}
        />

        <p className="text-center text-[11px] text-[var(--muted-foreground)]">
          Ao submeter, autorizas o tratamento dos teus dados ao abrigo do RGPD para efeitos de processo de candidatura.
        </p>
      </div>
    </div>
  );
}
