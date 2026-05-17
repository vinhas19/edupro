import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Used by uptime monitors (UptimeRobot, BetterStack, Pingdom...).
// Returns 200 only if the DB is reachable.
export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = Date.now();
  let dbOk = false;
  let dbLatency = -1;

  try {
    const t0 = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatency = Date.now() - t0;
    dbOk = true;
  } catch (err) {
    console.error("[healthcheck] DB unreachable", err);
  }

  const status = dbOk ? 200 : 503;
  return NextResponse.json(
    {
      status: dbOk ? "ok" : "degraded",
      uptime: process.uptime(),
      checks: {
        db: { ok: dbOk, latencyMs: dbLatency },
      },
      version: process.env.npm_package_version ?? "0.1.0",
      timestamp: new Date().toISOString(),
      responseMs: Date.now() - startedAt,
    },
    { status, headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
