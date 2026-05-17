import { NextResponse } from "next/server";

/**
 * In-memory rate limiter (sliding window). Suitable for single-instance dev/staging.
 *
 * For production multi-instance deploys, swap the backing store for Redis/Upstash
 * (the public interface here stays the same).
 *
 *   const rl = await rateLimit(req, { key: "auth:login", limit: 5, windowMs: 60_000 });
 *   if (!rl.ok) return rl.response;
 */

interface Bucket {
  hits: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

// Periodic cleanup so the map doesn't grow forever in long-running processes.
let lastCleanup = Date.now();
function maybeCleanup() {
  const now = Date.now();
  if (now - lastCleanup < 60_000) return;
  lastCleanup = now;
  for (const [k, v] of buckets) {
    if (v.resetAt <= now) buckets.delete(k);
  }
}

function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  const cf = req.headers.get("cf-connecting-ip");
  if (cf) return cf;
  return "unknown";
}

interface RateLimitOptions {
  /** Identifier for the bucket family (e.g. "auth:login", "upload:presign"). */
  key: string;
  /** Max hits allowed inside the window. */
  limit: number;
  /** Window size in ms. */
  windowMs: number;
  /** Optional override for the per-client identifier (defaults to IP). */
  clientId?: string;
}

interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetAt: number;
  response: NextResponse | null;
}

export function rateLimit(req: Request, opts: RateLimitOptions): RateLimitResult {
  maybeCleanup();
  const id = opts.clientId ?? getClientIp(req);
  const bucketKey = `${opts.key}:${id}`;
  const now = Date.now();

  let bucket = buckets.get(bucketKey);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { hits: 0, resetAt: now + opts.windowMs };
    buckets.set(bucketKey, bucket);
  }
  bucket.hits++;

  const remaining = Math.max(0, opts.limit - bucket.hits);
  const ok = bucket.hits <= opts.limit;

  const headers = {
    "X-RateLimit-Limit": String(opts.limit),
    "X-RateLimit-Remaining": String(remaining),
    "X-RateLimit-Reset": String(Math.ceil(bucket.resetAt / 1000)),
  };

  if (ok) return { ok: true, remaining, resetAt: bucket.resetAt, response: null };

  const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
  return {
    ok: false,
    remaining: 0,
    resetAt: bucket.resetAt,
    response: NextResponse.json(
      { error: "Demasiados pedidos. Aguarda alguns segundos e tenta de novo." },
      {
        status: 429,
        headers: { ...headers, "Retry-After": String(retryAfter) },
      },
    ),
  };
}

/**
 * Convenience wrapper for the common case where you just want to fail-fast.
 *   const blocked = enforceRateLimit(req, { ... });
 *   if (blocked) return blocked;
 */
export function enforceRateLimit(req: Request, opts: RateLimitOptions): NextResponse | null {
  return rateLimit(req, opts).response;
}
