import type { Role } from "../types";

export type OrganizationType =
  | "university"
  | "company"
  | "school"
  | "shop"
  | "pharmacy"
  | "clinic"
  | "restaurant"
  | "agency"
  | "other";

export type OrganizationStatus = "active" | "suspended" | "trial";
export type MembershipStatus = "active" | "invited" | "suspended";
export type ModuleKey =
  | "hr"
  | "crm"
  | "shop"
  | "pharmacy"
  | "finance"
  | "education"
  | "warehouse"
  | "documents"
  | "analytics";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  organizationType: OrganizationType;
  logo?: string;
  email?: string;
  phone?: string;
  address?: string;
  country: string;
  timezone: string;
  currency: string;
  status: OrganizationStatus;
  primaryColor: string;
  reportedHeadcount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Membership {
  id: string;
  userId: string;
  organizationId: string;
  role: Role;
  status: MembershipStatus;
  isOwner: boolean;
  joinedAt: string;
}

export interface AppModule {
  id: string;
  key: ModuleKey;
  name: string;
  description: string;
  icon: string;
  version: string;
  status: "active" | "beta" | "disabled";
}

export interface OrganizationModule {
  id: string;
  organizationId: string;
  moduleKey: ModuleKey;
  enabled: boolean;
  activatedAt: string;
}

export interface Permission {
  key: string;
  name: string;
  module: ModuleKey | "core";
}

export interface SessionPayload {
  email: string;
  organizationId: string | null;
}

export interface TenantContext {
  userId: string;
  organizationId: string;
  role: Role;
  permissions: string[];
}

export type ApiErrorCode = "FORBIDDEN" | "RESOURCE_NOT_FOUND" | "UNAUTHORIZED" | "VALIDATION_ERROR" | "NO_TENANT";

export interface ApiError {
  success: false;
  error: { code: ApiErrorCode; message: string };
}

export interface ApiOk<T> {
  success: true;
  data: T;
}

export type ApiResult<T> = ApiOk<T> | ApiError;

export function apiError(code: ApiErrorCode, message: string): ApiError {
  return { success: false, error: { code, message } };
}

export function apiOk<T>(data: T): ApiOk<T> {
  return { success: true, data };
}
