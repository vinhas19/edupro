import type { NextAuthConfig } from "next-auth";
import type { Role } from "@prisma/client";

export const authConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.schoolId = (user as any).schoolId;
        token.schoolSlug = (user as any).schoolSlug;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!;
        session.user.role = token.role as Role;
        session.user.schoolId = token.schoolId as string;
        session.user.schoolSlug = token.schoolSlug as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
