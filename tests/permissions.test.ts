import { describe, it, expect } from "vitest";
import { hasRole, isAdmin, isStaff } from "@/lib/permissions";
import { Role } from "@prisma/client";

describe("permissions hierarchy", () => {
  it("SUPER_ADMIN tem todos os roles abaixo", () => {
    expect(hasRole(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN)).toBe(true);
    expect(hasRole(Role.SUPER_ADMIN, Role.TEACHER)).toBe(true);
    expect(hasRole(Role.SUPER_ADMIN, Role.STUDENT)).toBe(true);
  });

  it("STUDENT não tem role de TEACHER", () => {
    expect(hasRole(Role.STUDENT, Role.TEACHER)).toBe(false);
    expect(hasRole(Role.STUDENT, Role.SCHOOL_ADMIN)).toBe(false);
  });

  it("GUARDIAN é equiparado a STUDENT, não tem TEACHER", () => {
    expect(hasRole(Role.GUARDIAN, Role.STUDENT)).toBe(true);
    expect(hasRole(Role.GUARDIAN, Role.TEACHER)).toBe(false);
  });

  it("isAdmin/isStaff funcionam", () => {
    expect(isAdmin(Role.SCHOOL_ADMIN)).toBe(true);
    expect(isAdmin(Role.TEACHER)).toBe(false);
    expect(isStaff(Role.TEACHER)).toBe(true);
    expect(isStaff(Role.STUDENT)).toBe(false);
  });
});
