import { ORG_IAU } from "./ids";
import { apiError, type ApiResult, type TenantContext } from "./types";

export function orgOf(row: { organizationId?: string } | null | undefined): string {
  return row?.organizationId ?? ORG_IAU;
}

export function inTenant(row: { organizationId?: string } | null | undefined, organizationId: string): boolean {
  return orgOf(row) === organizationId;
}

export function filterTenant<T>(rows: T[], organizationId: string): T[] {
  if (!organizationId) return [];
  return rows.filter((r) => inTenant(r as { organizationId?: string }, organizationId));
}

export function requireTenant(ctx: TenantContext | null): ApiResult<TenantContext> {
  if (!ctx?.userId || !ctx.organizationId) {
    return apiError("NO_TENANT", "Valid user, membership and organization are required.");
  }
  return { success: true, data: ctx };
}

export function assertSameTenant<T extends { organizationId?: string; id: string }>(
  ctx: TenantContext,
  row: T | undefined,
): ApiResult<T> {
  if (!row || !inTenant(row, ctx.organizationId)) {
    return apiError("RESOURCE_NOT_FOUND", "Resource not found.");
  }
  return { success: true, data: row };
}

export function ignoreClientOrganizationId<T extends { organizationId?: string }>(body: T, organizationId: string): T {
  const { organizationId: _ignored, ...rest } = body as T & { organizationId?: string };
  return { ...(rest as T), organizationId } as T;
}

export function can(ctx: TenantContext, permission: string): boolean {
  return ctx.permissions.includes(permission) || ctx.permissions.includes("platform.admin");
}
