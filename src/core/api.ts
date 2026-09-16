import type { Employee } from "../types";
import { can, filterTenant, ignoreClientOrganizationId, requireTenant } from "./tenant";
import { apiError, type ApiResult, type TenantContext } from "./types";

/**
 * Application-layer HR API. Frontend-supplied organization_id is ignored.
 * Future FastAPI handlers must follow the same contract.
 */
export function listEmployees(ctx: TenantContext | null, all: Employee[]): ApiResult<Employee[]> {
  const gate = requireTenant(ctx);
  if (!gate.success) return gate;
  if (!can(gate.data, "hr.employees.view") && gate.data.role !== "employee") {
    return apiError("FORBIDDEN", "You do not have permission to perform this action.");
  }
  return { success: true, data: filterTenant(all, gate.data.organizationId) };
}

export function getEmployee(ctx: TenantContext | null, all: Employee[], id: string): ApiResult<Employee> {
  const gate = requireTenant(ctx);
  if (!gate.success) return gate;
  const row = filterTenant(all, gate.data.organizationId).find((e) => e.id === id);
  if (!row) return apiError("RESOURCE_NOT_FOUND", "Resource not found.");
  return { success: true, data: row };
}

export function createEmployee(
  ctx: TenantContext | null,
  all: Employee[],
  body: Partial<Employee> & { organizationId?: string },
): ApiResult<Partial<Employee>> {
  const gate = requireTenant(ctx);
  if (!gate.success) return gate;
  if (!can(gate.data, "hr.employees.create")) {
    return apiError("FORBIDDEN", "You do not have permission to perform this action.");
  }
  const stamped = ignoreClientOrganizationId(body, gate.data.organizationId);
  if (stamped.organizationId !== gate.data.organizationId) {
    return apiError("FORBIDDEN", "You do not have permission to perform this action.");
  }
  if (all.some((e) => e.id === stamped.id && e.organizationId && e.organizationId !== gate.data.organizationId)) {
    return apiError("FORBIDDEN", "You do not have permission to perform this action.");
  }
  return { success: true, data: stamped };
}
