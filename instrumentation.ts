export async function register() {
  if (!process.env.SENTRY_DSN) return;
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export async function onRequestError(
  err: unknown,
  request: { path?: string; method?: string; headers?: Record<string, string> },
  context: { routerKind: string; routePath: string; routeType: string },
) {
  if (!process.env.SENTRY_DSN) {
    console.error("[onRequestError]", err);
    return;
  }
  const Sentry = await import("@sentry/nextjs");
  Sentry.captureRequestError(
    err,
    request as Parameters<typeof Sentry.captureRequestError>[1],
    context as Parameters<typeof Sentry.captureRequestError>[2],
  );
}
