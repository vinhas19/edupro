import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { authConfig } from "@/lib/auth.config";

// Failed login attempts per (email|schoolSlug) — blocks brute force.
// Resets on success. For multi-instance prod, swap for Redis.
const failedLogins = new Map<string, { count: number; blockedUntil: number }>();
const MAX_ATTEMPTS = 6;
const LOCKOUT_MS = 5 * 60_000; // 5 minutes

function recordFailedLogin(key: string) {
  const now = Date.now();
  const cur = failedLogins.get(key) ?? { count: 0, blockedUntil: 0 };
  cur.count += 1;
  if (cur.count >= MAX_ATTEMPTS) {
    cur.blockedUntil = now + LOCKOUT_MS;
    cur.count = 0;
  }
  failedLogins.set(key, cur);
}

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

        const key = `${(credentials.email as string).toLowerCase()}|${credentials.schoolSlug}`;
        const now = Date.now();
        const entry = failedLogins.get(key);
        if (entry && entry.blockedUntil > now) {
          // Account temporarily locked — return null with a sentinel so the UI knows.
          throw new Error("ACCOUNT_LOCKED");
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

        if (!user || !user.active || !user.passwordHash) {
          recordFailedLogin(key);
          return null;
        }

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!isValid) {
          recordFailedLogin(key);
          return null;
        }

        // Success — reset counter
        failedLogins.delete(key);

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
