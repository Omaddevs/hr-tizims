import { describe, expect, it } from "vitest";
import { EMPLOYEES } from "../data/seed";
import { getEmployee, listEmployees, createEmployee } from "./api";
import { permissionsFor } from "./catalog";
import { ORG_IAU, ORG_SHOP } from "./ids";
import { SHOP_EMPLOYEES } from "./seed";
import { ignoreClientOrganizationId } from "./tenant";
import type { TenantContext } from "./types";

const all = [...EMPLOYEES, ...SHOP_EMPLOYEES];

function ctx(organizationId: string, role: TenantContext["role"] = "hr_admin"): TenantContext {
  return { userId: "u-test", organizationId, role, permissions: permissionsFor(role) };
}

describe("tenant isolation", () => {
  it("university admin sees IAU employees, not shop staff", () => {
    const res = listEmployees(ctx(ORG_IAU), all);
    expect(res.success).toBe(true);
    if (!res.success) return;
    expect(res.data.some((e) => e.id === "e1")).toBe(true);
    expect(res.data.some((e) => e.id === "e-shop-1")).toBe(false);
    expect(res.data.some((e) => e.fullName === "Karimova Laylo")).toBe(false);
  });

  it("shop manager does not see university employees", () => {
    const res = listEmployees(ctx(ORG_SHOP, "manager"), all);
    expect(res.success).toBe(true);
    if (!res.success) return;
    expect(res.data.every((e) => e.organizationId === ORG_SHOP)).toBe(true);
    expect(res.data.some((e) => e.id === "e1")).toBe(false);
  });

  it("shop cannot fetch a university employee by id", () => {
    const res = getEmployee(ctx(ORG_SHOP, "manager"), all, "e1");
    expect(res.success).toBe(false);
    if (!res.success) expect(res.error.code).toBe("RESOURCE_NOT_FOUND");
  });

  it("client-supplied organization_id is ignored (shop cannot impersonate university)", () => {
    const stamped = ignoreClientOrganizationId({ firstName: "Ali", organizationId: ORG_IAU }, ORG_SHOP);
    expect(stamped.organizationId).toBe(ORG_SHOP);
    const created = createEmployee(ctx(ORG_SHOP, "owner"), all, { firstName: "Ali", organizationId: ORG_IAU });
    expect(created.success).toBe(true);
    if (created.success) expect(created.data.organizationId).toBe(ORG_SHOP);
  });

  it("same user in two orgs does not mix HR data", () => {
    const uni = listEmployees(ctx(ORG_IAU), all);
    const shop = listEmployees(ctx(ORG_SHOP, "manager"), all);
    expect(uni.success && shop.success).toBe(true);
    if (!uni.success || !shop.success) return;
    const uniIds = new Set(uni.data.map((e) => e.id));
    expect(shop.data.some((e) => uniIds.has(e.id))).toBe(false);
  });

  it("no tenant means no business data", () => {
    const res = listEmployees(null, all);
    expect(res.success).toBe(false);
    if (!res.success) expect(res.error.code).toBe("NO_TENANT");
  });
});
