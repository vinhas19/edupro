import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

const PUBLIC_PATHS = ["/login", "/api/auth", "/_next", "/favicon.ico", "/images"];

export default auth(async function middleware(req) {
  const { pathname, hostname } = req.nextUrl;

  // Skip public assets
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Extract school slug from subdomain
  // e.g. vendas-novas.edupro.pt → "vendas-novas"
  // e.g. vendas-novas.localhost:3000 → "vendas-novas"
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || "localhost:3000";
  let schoolSlug: string | null = null;

  if (hostname !== appDomain && hostname !== "localhost") {
    const parts = hostname.split(".");
    if (parts.length > 1) {
      schoolSlug = parts[0];
    }
  }

  // In dev, allow ?school=slug query param as fallback
  const schoolFromQuery = req.nextUrl.searchParams.get("school");
  if (!schoolSlug && schoolFromQuery) {
    schoolSlug = schoolFromQuery;
  }

  // Inject school slug into headers for Server Components
  const requestHeaders = new Headers(req.headers);
  if (schoolSlug) {
    requestHeaders.set("x-school-slug", schoolSlug);
  }

  const session = req.auth;

  // Unauthenticated → redirect to login
  if (!session) {
    const loginUrl = new URL("/login", req.url);
    if (schoolSlug) loginUrl.searchParams.set("school", schoolSlug);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated but wrong school → redirect
  if (schoolSlug && session.user.schoolSlug !== schoolSlug) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
