import type { Role } from "../types";
import type { AppModule, Permission } from "./types";

export const MODULES: AppModule[] = [
  { id: "m-hr", key: "hr", name: "HR", description: "Xodimlar, ta'til, davomat, qabul", icon: "Users", version: "1.0.0", status: "active" },
  { id: "m-crm", key: "crm", name: "CRM", description: "Lidlar, mijozlar, bitimlar", icon: "Contact", version: "0.1.0", status: "beta" },
  { id: "m-shop", key: "shop", name: "Do'kon", description: "Mahsulot, buyurtma, ombor", icon: "Store", version: "0.1.0", status: "beta" },
  { id: "m-pharmacy", key: "pharmacy", name: "Apteka", description: "Dori, partiya, muddat", icon: "Pill", version: "0.1.0", status: "beta" },
  { id: "m-finance", key: "finance", name: "Moliya", description: "Tranzaksiya va hisobot", icon: "Wallet", version: "0.1.0", status: "beta" },
  { id: "m-education", key: "education", name: "Ta'lim", description: "Guruh, dars, baho", icon: "GraduationCap", version: "0.1.0", status: "beta" },
  { id: "m-warehouse", key: "warehouse", name: "Ombor", description: "Qoldiq va harakat", icon: "Warehouse", version: "0.1.0", status: "beta" },
  { id: "m-documents", key: "documents", name: "Hujjatlar", description: "Shablon va arxiv", icon: "FolderOpen", version: "1.0.0", status: "active" },
  { id: "m-analytics", key: "analytics", name: "Analitika", description: "KPI va hisobotlar", icon: "FileBarChart", version: "1.0.0", status: "active" },
];

export const PERMISSIONS: Permission[] = [
  { key: "hr.employees.view", name: "Xodimlarni ko'rish", module: "hr" },
  { key: "hr.employees.create", name: "Xodim qo'shish", module: "hr" },
  { key: "hr.employees.update", name: "Xodim tahrirlash", module: "hr" },
  { key: "hr.employees.delete", name: "Xodim o'chirish", module: "hr" },
  { key: "hr.contracts.view", name: "Shartnomalarni ko'rish", module: "hr" },
  { key: "hr.contracts.create", name: "Shartnoma yaratish", module: "hr" },
  { key: "hr.contracts.update", name: "Shartnoma yangilash", module: "hr" },
  { key: "hr.leave.view", name: "Ta'tilni ko'rish", module: "hr" },
  { key: "hr.leave.create", name: "Ta'til so'rash", module: "hr" },
  { key: "hr.leave.approve", name: "Ta'til tasdiqlash", module: "hr" },
  { key: "hr.attendance.view", name: "Davomatni ko'rish", module: "hr" },
  { key: "hr.attendance.manage", name: "Davomatni boshqarish", module: "hr" },
  { key: "hr.reports.view", name: "HR hisobotlar", module: "hr" },
  { key: "core.org.manage", name: "Tashkilot sozlamalari", module: "core" },
  { key: "core.users.manage", name: "Foydalanuvchilar", module: "core" },
  { key: "core.modules.manage", name: "Modullarni yoqish", module: "core" },
  { key: "platform.admin", name: "Platforma admin", module: "core" },
];

const ALL_HR = PERMISSIONS.filter((p) => p.module === "hr" || p.key.startsWith("core.org")).map((p) => p.key);

export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  super_admin: [...PERMISSIONS.map((p) => p.key)],
  hr_admin: ALL_HR,
  hr_director: ALL_HR,
  rector: ["hr.employees.view", "hr.contracts.view", "hr.leave.view", "hr.leave.approve", "hr.reports.view", "hr.attendance.view"],
  dept_head: ["hr.employees.view", "hr.leave.view", "hr.leave.approve", "hr.attendance.view", "hr.leave.create"],
  employee: ["hr.leave.create", "hr.leave.view", "hr.attendance.view"],
  owner: [...ALL_HR, "core.org.manage", "core.users.manage", "core.modules.manage"],
  manager: ["hr.employees.view", "hr.leave.view", "hr.attendance.view"],
};

export function permissionsFor(role: Role): string[] {
  return ROLE_PERMISSIONS[role] ?? [];
}
