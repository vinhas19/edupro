import { describe, it, expect } from "vitest";
import { rateLimit } from "@/lib/rate-limit";

function req(ip = "1.2.3.4"): Request {
  return new Request("http://test/api", { headers: { "x-forwarded-for": ip } });
}

describe("rate-limit", () => {
  it("permite até ao limite e depois bloqueia", () => {
    const key = `t-${Math.random()}`;
    for (let i = 0; i < 3; i++) {
      const r = rateLimit(req(), { key, limit: 3, windowMs: 1000 });
      expect(r.ok).toBe(true);
    }
    const blocked = rateLimit(req(), { key, limit: 3, windowMs: 1000 });
    expect(blocked.ok).toBe(false);
    expect(blocked.response?.status).toBe(429);
  });

  it("isola por IP", () => {
    const key = `t-${Math.random()}`;
    rateLimit(req("1.1.1.1"), { key, limit: 1, windowMs: 1000 });
    rateLimit(req("1.1.1.1"), { key, limit: 1, windowMs: 1000 });
    const otherIp = rateLimit(req("2.2.2.2"), { key, limit: 1, windowMs: 1000 });
    expect(otherIp.ok).toBe(true);
  });

  it("respeita clientId override", () => {
    const key = `t-${Math.random()}`;
    rateLimit(req(), { key, limit: 1, windowMs: 1000, clientId: "user-a" });
    const second = rateLimit(req(), { key, limit: 1, windowMs: 1000, clientId: "user-a" });
    expect(second.ok).toBe(false);
    const other = rateLimit(req(), { key, limit: 1, windowMs: 1000, clientId: "user-b" });
    expect(other.ok).toBe(true);
  });
});
