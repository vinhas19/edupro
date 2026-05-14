import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { cache } from "react";

export const getSchoolFromHeaders = cache(async () => {
  const headersList = await headers();
  const slug = headersList.get("x-school-slug");
  if (!slug) return null;
  return prisma.school.findUnique({ where: { slug } });
});

export const getSchoolBySlug = cache(async (slug: string) => {
  return prisma.school.findUnique({ where: { slug } });
});
