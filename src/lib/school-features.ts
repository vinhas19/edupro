import { prisma } from "@/lib/prisma";

export interface SchoolFeatures {
  pautas: boolean;
  enrollment: boolean;
  billing: boolean;
}

const cache = new Map<string, { features: SchoolFeatures; ts: number }>();
const TTL = 30_000; // 30s — admin toggles propagam-se rapidamente

export async function getSchoolFeatures(schoolId: string): Promise<SchoolFeatures> {
  const cached = cache.get(schoolId);
  if (cached && Date.now() - cached.ts < TTL) return cached.features;

  const s = await prisma.school.findUnique({
    where: { id: schoolId },
    select: { featurePautas: true, featureEnrollment: true, featureBilling: true },
  });
  const features: SchoolFeatures = {
    pautas: s?.featurePautas ?? true,
    enrollment: s?.featureEnrollment ?? false,
    billing: s?.featureBilling ?? false,
  };
  cache.set(schoolId, { features, ts: Date.now() });
  return features;
}

export function invalidateSchoolFeatures(schoolId: string) {
  cache.delete(schoolId);
}
