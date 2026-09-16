import type { Department, Employee } from "../types";
import { ORG_IAU, ORG_PHARM, ORG_SHOP } from "./ids";
import type { Membership, Organization, OrganizationModule } from "./types";

export const ORGANIZATIONS: Organization[] = [
  {
    id: ORG_IAU,
    name: "International Agriculture University",
    slug: "iau",
    organizationType: "university",
    email: "hr@iau.uz",
    phone: "+998 71 200 00 00",
    address: "Toshkent",
    country: "UZ",
    timezone: "Asia/Tashkent",
    currency: "UZS",
    status: "active",
    primaryColor: "#0984E3",
    reportedHeadcount: 1248,
    createdAt: "2012-09-01",
    updatedAt: "2026-08-29",
  },
  {
    id: ORG_SHOP,
    name: "ABC Shop",
    slug: "abc-shop",
    organizationType: "shop",
    email: "shop@abc.uz",
    phone: "+998 90 100 20 30",
    address: "Toshkent, Chorsu",
    country: "UZ",
    timezone: "Asia/Tashkent",
    currency: "UZS",
    status: "active",
    primaryColor: "#0984E3",
    createdAt: "2024-03-01",
    updatedAt: "2026-08-29",
  },
  {
    id: ORG_PHARM,
    name: "MedFarm Pharmacy",
    slug: "medfarm",
    organizationType: "pharmacy",
    email: "farm@medfarm.uz",
    phone: "+998 71 150 00 00",
    address: "Toshkent, Yunusobod",
    country: "UZ",
    timezone: "Asia/Tashkent",
    currency: "UZS",
    status: "active",
    primaryColor: "#0984E3",
    createdAt: "2023-06-01",
    updatedAt: "2026-08-29",
  },
];

export const MEMBERSHIPS: Membership[] = [
  { id: "ms-u1-iau", userId: "u1", organizationId: ORG_IAU, role: "hr_admin", status: "active", isOwner: false, joinedAt: "2015-01-10" },
  { id: "ms-u2-plat", userId: "u2", organizationId: ORG_IAU, role: "super_admin", status: "active", isOwner: false, joinedAt: "2020-01-01" },
  { id: "ms-u3-iau", userId: "u3", organizationId: ORG_IAU, role: "rector", status: "active", isOwner: true, joinedAt: "2012-09-01" },
  { id: "ms-u4-iau", userId: "u4", organizationId: ORG_IAU, role: "hr_director", status: "active", isOwner: false, joinedAt: "2016-04-01" },
  { id: "ms-u5-iau", userId: "u5", organizationId: ORG_IAU, role: "dept_head", status: "active", isOwner: false, joinedAt: "2014-09-01" },
  { id: "ms-u6-iau", userId: "u6", organizationId: ORG_IAU, role: "employee", status: "active", isOwner: false, joinedAt: "2022-03-01" },
  { id: "ms-omad-iau", userId: "u-omad", organizationId: ORG_IAU, role: "hr_admin", status: "active", isOwner: false, joinedAt: "2024-01-15" },
  { id: "ms-omad-shop", userId: "u-omad", organizationId: ORG_SHOP, role: "manager", status: "active", isOwner: false, joinedAt: "2025-02-01" },
  { id: "ms-shop", userId: "u-shop", organizationId: ORG_SHOP, role: "manager", status: "active", isOwner: true, joinedAt: "2024-03-01" },
  { id: "ms-farm", userId: "u-farm", organizationId: ORG_PHARM, role: "manager", status: "active", isOwner: true, joinedAt: "2023-06-01" },
];

export const ORGANIZATION_MODULES: OrganizationModule[] = [
  ...(["hr", "education", "finance", "documents", "analytics"] as const).map((key) => ({
    id: `om-iau-${key}`,
    organizationId: ORG_IAU,
    moduleKey: key,
    enabled: true,
    activatedAt: "2026-01-01",
  })),
  ...(["crm", "shop", "warehouse", "finance"] as const).map((key) => ({
    id: `om-shop-${key}`,
    organizationId: ORG_SHOP,
    moduleKey: key,
    enabled: true,
    activatedAt: "2026-01-01",
  })),
  ...(["pharmacy", "warehouse", "crm", "finance"] as const).map((key) => ({
    id: `om-ph-${key}`,
    organizationId: ORG_PHARM,
    moduleKey: key,
    enabled: true,
    activatedAt: "2026-01-01",
  })),
];

const edu = (u: string, d: string, s: string, y: number) => ({ university: u, degree: d, specialty: s, year: y });

export const SHOP_DEPARTMENTS: Department[] = [
  { id: "d-shop-0", name: "ABC Shop", type: "unit", employeeCount: 3, organizationId: ORG_SHOP },
  { id: "d-shop-1", name: "Savdo zali", parentId: "d-shop-0", type: "unit", employeeCount: 2, organizationId: ORG_SHOP },
  { id: "d-shop-2", name: "Ombor", parentId: "d-shop-0", type: "unit", employeeCount: 1, organizationId: ORG_SHOP },
];

export const SHOP_EMPLOYEES: Employee[] = [
  {
    id: "e-shop-1", employeeId: "SH-01", fullName: "Karimova Laylo", firstName: "Laylo", lastName: "Karimova",
    dateOfBirth: "1992-05-12", gender: "ayol", citizenship: "O'zbekiston", passport: "AA 7000001",
    jshshir: "41205920100001", address: "Toshkent", phone: "+998 90 100 20 31",
    email: "shop@abc.uz", departmentId: "d-shop-1", position: "Do'kon menejeri", employmentType: "full_time",
    startDate: "2024-03-01", workSchedule: "09:00–20:00", salary: 8500000, status: "active",
    category: "administrative", education: edu("TDIU", "Bakalavr", "Menejment", 2014),
    languages: ["O'zbek", "Rus"], leaveBalance: 12, completeness: 90, missing: [], organizationId: ORG_SHOP,
  },
  {
    id: "e-shop-2", employeeId: "SH-02", fullName: "Aliyev Javohir", firstName: "Javohir", lastName: "Aliyev",
    dateOfBirth: "1998-11-02", gender: "erkak", citizenship: "O'zbekiston", passport: "AA 7000002",
    jshshir: "30211980100002", address: "Toshkent", phone: "+998 90 100 20 32",
    email: "j.aliyev@abc.uz", departmentId: "d-shop-1", position: "Sotuvchi", employmentType: "full_time",
    startDate: "2025-01-10", workSchedule: "09:00–20:00", salary: 4500000, status: "active",
    category: "administrative", education: edu("Kollej", "O'rta maxsus", "Savdo", 2018),
    languages: ["O'zbek"], leaveBalance: 10, completeness: 80, missing: ["Rasm"], organizationId: ORG_SHOP,
  },
  {
    id: "e-shop-3", employeeId: "SH-03", fullName: "Toshmatova Nilufar", firstName: "Nilufar", lastName: "Toshmatova",
    dateOfBirth: "2001-07-21", gender: "ayol", citizenship: "O'zbekiston", passport: "AA 7000003",
    jshshir: "42107010100003", address: "Toshkent", phone: "+998 90 100 20 33",
    email: "n.toshmatova@abc.uz", departmentId: "d-shop-2", position: "Kassir", employmentType: "full_time",
    startDate: "2025-06-01", workSchedule: "09:00–20:00", salary: 4200000, status: "active",
    category: "administrative", education: edu("Maktab", "O'rta", "—", 2019),
    languages: ["O'zbek"], leaveBalance: 8, completeness: 72, missing: ["CV / resume"], organizationId: ORG_SHOP,
  },
];

export const PHARM_DEPARTMENTS: Department[] = [
  { id: "d-ph-0", name: "MedFarm", type: "unit", employeeCount: 2, organizationId: ORG_PHARM },
];

export const PHARM_EMPLOYEES: Employee[] = [
  {
    id: "e-ph-1", employeeId: "MF-01", fullName: "Rahimov Aziz", firstName: "Aziz", lastName: "Rahimov",
    dateOfBirth: "1988-01-20", gender: "erkak", citizenship: "O'zbekiston", passport: "AA 8000001",
    jshshir: "32001880100001", address: "Toshkent", phone: "+998 71 150 00 01",
    email: "farm@medfarm.uz", departmentId: "d-ph-0", position: "Farmatsevt", employmentType: "full_time",
    startDate: "2023-06-01", workSchedule: "08:00–18:00", salary: 11000000, status: "active",
    category: "administrative", education: edu("ToshFarmI", "Magistr", "Farmatsiya", 2012),
    languages: ["O'zbek", "Rus"], leaveBalance: 15, completeness: 95, missing: [], organizationId: ORG_PHARM,
  },
  {
    id: "e-ph-2", employeeId: "MF-02", fullName: "Saidova Madina", firstName: "Madina", lastName: "Saidova",
    dateOfBirth: "1996-09-03", gender: "ayol", citizenship: "O'zbekiston", passport: "AA 8000002",
    jshshir: "40309960100002", address: "Toshkent", phone: "+998 71 150 00 02",
    email: "m.saidova@medfarm.uz", departmentId: "d-ph-0", position: "Kassir", employmentType: "full_time",
    startDate: "2024-02-01", workSchedule: "08:00–18:00", salary: 5000000, status: "active",
    category: "administrative", education: edu("Kollej", "O'rta maxsus", "Farmatsiya", 2016),
    languages: ["O'zbek", "Rus"], leaveBalance: 11, completeness: 88, missing: [], organizationId: ORG_PHARM,
  },
];
