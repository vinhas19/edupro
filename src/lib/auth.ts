import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { authConfig } from "@/lib/auth.config";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: Role;
      schoolId: string;
      schoolSlug: string;
      image?: string | null;
    };
  }
  interface User {
    role: Role;
    schoolId: string;
    schoolSlug: string;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        schoolSlug: { label: "School", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password || !credentials?.schoolSlug) {
          return null;
        }

        const school = await prisma.school.findUnique({
          where: { slug: credentials.schoolSlug as string },
        });

        if (!school || !school.active) return null;

        const user = await prisma.user.findUnique({
          where: {
            email_schoolId: {
              email: credentials.email as string,
              schoolId: school.id,
            },
          },
          include: { school: true },
        });

        if (!user || !user.active || !user.passwordHash) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!isValid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          schoolId: user.schoolId,
          schoolSlug: school.slug,
          image: user.image,
        };
      },
    }),
  ],
});
