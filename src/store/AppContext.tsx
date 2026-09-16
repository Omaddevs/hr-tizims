import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type {
  ApprovalStatus,
  Assignment,
  AssignmentCategory,
  AssignmentStatus,
  AuditEntry,
  Candidate,
  ChatMessage,
  Department,
  Employee,
  HrRequest,
  HrTask,
  LeaveRequest,
  LeaveType,
  NotificationItem,
  RecruitmentStage,
  Ticket,
  User,
} from "../types";
import {
  ACTIVITIES,
  ASSIGNMENTS,
  ATTENDANCE_ISSUES,
  AUDIT,
  CANDIDATES,
  CONTRACTS,
  DEPARTMENTS,
  DOCUMENTS,
  EMPLOYEES,
  KNOWLEDGE,
  LEAVES,
  NOTIFICATIONS,
  ONBOARDING,
  PERFORMANCE,
  POSITIONS,
  REQUESTS,
  TASKS,
  TEMPLATES,
  TICKETS,
  TRAININGS,
  USERS,
  VACANCIES,
  WORKFLOWS,
} from "../data/seed";
import { unpaidDeduction, workingDays } from "../lib/utils";
import { permissionsFor } from "../core/catalog";
import { hashPassword, verifyPassword } from "../core/crypto";
import { LEGACY_SESSION_KEY, ORG_IAU, SESSION_KEY } from "../core/ids";
import {
  MEMBERSHIPS,
  ORGANIZATION_MODULES,
  ORGANIZATIONS,
  PHARM_DEPARTMENTS,
  PHARM_EMPLOYEES,
  SHOP_DEPARTMENTS,
  SHOP_EMPLOYEES,
} from "../core/seed";
import { filterTenant, inTenant, orgOf } from "../core/tenant";
import type { Membership, ModuleKey, Organization, SessionPayload, TenantContext } from "../core/types";

interface Catalog {
  contracts: typeof CONTRACTS;
  positions: typeof POSITIONS;
  attendance: typeof ATTENDANCE_ISSUES;
  activities: typeof ACTIVITIES;
  vacancies: typeof VACANCIES;
  onboarding: typeof ONBOARDING;
  documents: typeof DOCUMENTS;
  trainings: typeof TRAININGS;
  performance: typeof PERFORMANCE;
  templates: typeof TEMPLATES;
  workflows: typeof WORKFLOWS;
  knowledge: typeof KNOWLEDGE;
}

interface Kpis {
  totalEmployees: number;
  newThisMonth: number;
  onLeave: number;
  payroll: number;
  academic: number;
  administrative: number;
  leftThisMonth: number;
  vacancies: number;
  contractsExpiring: number;
  attendanceIssues: number;
  pendingApprovals: number;
  pendingRequests: number;
}

interface AppState {
  user: User | null;
  employees: Employee[];
  departments: Department[];
  leaves: LeaveRequest[];
  requests: HrRequest[];
  tasks: HrTask[];
  notifications: NotificationItem[];
  candidates: Candidate[];
  tickets: Ticket[];
  audit: AuditEntry[];
  chat: ChatMessage[];
  assignments: Assignment[];
  organization: Organization | null;
  organizations: Organization[];
  memberships: Membership[];
  catalog: Catalog;
  kpis: Kpis;
  enabledModules: ModuleKey[];
}

interface AppContextValue extends AppState {
  login: (email: string, password: string) => string | null;
  logout: () => void;
  markTask: (id: string, done: boolean) => void;
  markNotificationRead: (id: string) => void;
  markAllRead: () => void;
  approveLeave: (id: string, status: ApprovalStatus, comment?: string) => void;
  createLeave: (
    employeeId: string,
    type: LeaveType,
    start: string,
    end: string,
    reason: string,
    extra?: { note?: string; documentName?: string; documentUrl?: string },
  ) => string | null;
  updateLeave: (
    id: string,
    patch: Partial<Pick<LeaveRequest, "type" | "startDate" | "endDate" | "reason" | "note" | "documentName" | "documentUrl">>,
  ) => string | null;
  approveRequest: (id: string, status: ApprovalStatus) => void;
  createCertificate: (employeeId: string, type: string) => void;
  moveCandidate: (id: string, stage: RecruitmentStage) => void;
  hireCandidate: (id: string) => void;
  addEmployee: (partial: Partial<Employee>) => string;
  addDepartment: (input: { name: string; type: Department["type"]; parentId?: string }) => string;
  updateEmployee: (id: string, patch: Partial<Employee>) => void;
  sendChat: (text: string) => void;
  createTicket: (employeeId: string, subject: string, category: string) => void;
  createAssignment: (input: {
    toUserId: string;
    title: string;
    body: string;
    category: AssignmentCategory;
    relatedEmployeeId?: string;
    fileName?: string;
    fileUrl?: string;
  }) => string | null;
  replyAssignment: (id: string, text: string, file?: { fileName: string; fileUrl: string }) => string | null;
  setAssignmentStatus: (id: string, status: AssignmentStatus) => void;
  markAssignmentRead: (id: string) => void;
  switchOrganization: (organizationId: string) => string | null;
  can: (permission: string) => boolean;
  hasModule: (key: ModuleKey) => boolean;
  directoryUsers: User[];
}

const AppContext = createContext<AppContextValue | null>(null);

function stamp<T>(rows: T[], org = ORG_IAU): T[] {
  return rows.map((r) => ({ ...r, organizationId: orgOf(r as { organizationId?: string }) || org })) as T[];
}

function publicUser(u: User, role: User["role"]): User {
  return { ...u, role, password: "", passwordHash: undefined };
}

function loadSession(): SessionPayload | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) return JSON.parse(raw) as SessionPayload;
    const legacy = localStorage.getItem(LEGACY_SESSION_KEY);
    if (!legacy) return null;
    const email = JSON.parse(legacy) as string;
    return { email, organizationId: ORG_IAU };
  } catch {
    return null;
  }
}

function persistSession(session: SessionPayload | null) {
  if (!session) {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(LEGACY_SESSION_KEY);
    return;
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

const ASSIGN_KEY = "iau-hr-assignments-v1";

function membershipsOf(userId: string) {
  return MEMBERSHIPS.filter((m) => m.userId === userId && m.status === "active");
}

function applyMembership(user: User, membership: Membership): User {
  return publicUser(user, membership.role);
}

function loadAssignments(): Assignment[] {
  try {
    const raw = localStorage.getItem(ASSIGN_KEY);
    if (!raw) return ASSIGNMENTS;
    const parsed = JSON.parse(raw) as Assignment[];
    if (!Array.isArray(parsed) || parsed.length === 0) return ASSIGNMENTS;
    return parsed;
  } catch {
    return ASSIGNMENTS;
  }
}

function persistAssignments(list: Assignment[]) {
  try {
    localStorage.setItem(ASSIGN_KEY, JSON.stringify(list));
  } catch {
    /* quota / private mode */
  }
}

function bootstrapAuth(): { user: User | null; organizationId: string | null } {
  const session = loadSession();
  if (!session?.email) return { user: null, organizationId: null };
  const found = USERS.find((u) => u.email === session.email);
  if (!found) return { user: null, organizationId: null };
  const mines = membershipsOf(found.id);
  const orgId = session.organizationId && mines.some((m) => m.organizationId === session.organizationId)
    ? session.organizationId
    : mines.length === 1
      ? mines[0].organizationId
      : session.organizationId;
  const membership = mines.find((m) => m.organizationId === orgId);
  return { user: membership ? applyMembership(found, membership) : publicUser(found, found.role), organizationId: orgId ?? null };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const boot = useMemo(() => bootstrapAuth(), []);
  const [user, setUser] = useState<User | null>(boot.user);
  const [organizationId, setOrganizationId] = useState<string | null>(boot.organizationId);
  const [employees, setEmployees] = useState<Employee[]>(() => stamp([...EMPLOYEES, ...SHOP_EMPLOYEES, ...PHARM_EMPLOYEES]));
  const [departments, setDepartments] = useState<Department[]>(() => stamp([...DEPARTMENTS, ...SHOP_DEPARTMENTS, ...PHARM_DEPARTMENTS]));
  const [leaves, setLeaves] = useState<LeaveRequest[]>(() => stamp(LEAVES));
  const [requests, setRequests] = useState<HrRequest[]>(() => stamp(REQUESTS));
  const [tasks, setTasks] = useState<HrTask[]>(() => stamp(TASKS));
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => stamp(NOTIFICATIONS));
  const [candidates, setCandidates] = useState<Candidate[]>(() => stamp(CANDIDATES));
  const [tickets, setTickets] = useState<Ticket[]>(() => stamp(TICKETS));
  const [assignments, setAssignments] = useState<Assignment[]>(() => stamp(loadAssignments()));
  const [audit, setAudit] = useState<AuditEntry[]>(() => stamp(AUDIT));
  const [chat, setChat] = useState<ChatMessage[]>([
    {
      id: "m0",
      role: "assistant",
      text: "Salom. Men IAU HR Copilotman. Shartnomalar, ta'til, onboarding, hisobot va risklar bo'yicha so'rang. Yakuniy kadr qarorlari inson tomonidan tasdiqlanadi.",
    },
  ]);

  const pushAudit = useCallback((entry: Omit<AuditEntry, "id">) => {
    setAudit((a) => [{ id: `au-${Date.now()}`, ...entry }, ...a]);
  }, []);

  const login = useCallback((email: string, password: string) => {
    const found = USERS.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!found) return "Email yoki parol noto'g'ri.";
    const hash = found.passwordHash ?? hashPassword(found.password);
    const ok = found.passwordHash ? verifyPassword(password, found.passwordHash) : password === found.password || verifyPassword(password, hash);
    if (!ok) return "Email yoki parol noto'g'ri.";
    const mines = membershipsOf(found.id);
    if (mines.length === 0) return "Tashkilotga a'zolik topilmadi.";
    const orgId = mines.length === 1 ? mines[0].organizationId : null;
    const membership = orgId ? mines.find((m) => m.organizationId === orgId) : undefined;
    setUser(membership ? applyMembership(found, membership) : publicUser(found, found.role));
    setOrganizationId(orgId);
    persistSession({ email: found.email, organizationId: orgId });
    if (orgId) {
      pushAudit({
        user: found.name,
        action: "LOGIN",
        object: "Session",
        objectId: found.id,
        date: new Date().toISOString().replace("T", " ").slice(0, 16),
        ip: "192.168.1.14",
        organizationId: orgId,
      });
    }
    return null;
  }, [pushAudit]);

  const logout = useCallback(() => {
    pushAudit({
      user: user?.name ?? "Tizim",
      action: "LOGOUT",
      object: "Session",
      objectId: user?.id ?? "",
      date: new Date().toISOString().replace("T", " ").slice(0, 16),
      ip: "192.168.1.14",
      organizationId: organizationId ?? undefined,
    });
    setUser(null);
    setOrganizationId(null);
    persistSession(null);
  }, [organizationId, pushAudit, user]);

  const switchOrganization = useCallback(
    (nextId: string) => {
      if (!user) return "Avval tizimga kiring.";
      const raw = USERS.find((u) => u.id === user.id);
      if (!raw) return "Foydalanuvchi topilmadi.";
      const ms = membershipsOf(raw.id).find((m) => m.organizationId === nextId);
      if (!ms) return "Bu tashkilotga kirish taqiqlangan.";
      setUser(applyMembership(raw, ms));
      setOrganizationId(nextId);
      persistSession({ email: raw.email, organizationId: nextId });
      setChat([
        {
          id: "m0",
          role: "assistant",
          text: "Tenant yangilandi. Ma'lumotlar faqat joriy tashkilot bo'yicha ko'rsatiladi.",
        },
      ]);
      return null;
    },
    [user],
  );

  const markTask = useCallback((id: string, done: boolean) => {
    setTasks((t) => t.map((x) => (x.id === id ? { ...x, done } : x)));
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((n) => n.map((x) => (x.id === id ? { ...x, read: true } : x)));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((n) => n.map((x) => ({ ...x, read: true })));
  }, []);

  const approveLeave = useCallback(
    (id: string, status: ApprovalStatus, comment?: string) => {
      const current = leaves.find((x) => x.id === id);
      if (!organizationId || !current) return;
      const empRow = employees.find((e) => e.id === current.employeeId);
      if (!empRow || !inTenant(empRow, organizationId)) return;
      setLeaves((list) =>
        list.map((l) => {
          if (l.id !== id) return l;
          const steps = l.steps.map((s, i) => {
            if (s.status === "pending") {
              return { ...s, status, at: new Date().toISOString().slice(0, 10), comment };
            }
            if (i === l.steps.length - 1 && status === "approved" && s.role === "HR") {
              return { ...s, status, at: new Date().toISOString().slice(0, 10) };
            }
            return s;
          });
          const allApproved = steps.every((s) => s.status === "approved");
          const nextStatus: ApprovalStatus = status === "rejected" ? "rejected" : allApproved ? "approved" : "pending";
          const emp = employees.find((e) => e.id === l.employeeId);
          const deduction =
            nextStatus === "approved" && l.type === "unpaid" && emp
              ? unpaidDeduction(emp.salary, l.startDate, l.endDate)
              : l.deductionAmount;
          return { ...l, status: nextStatus, steps, deductionAmount: deduction };
        }),
      );
      if (status === "approved" && current?.type === "annual") {
        setEmployees((emps) =>
          emps.map((e) =>
            e.id === current.employeeId ? { ...e, leaveBalance: Math.max(0, e.leaveBalance - current.days) } : e,
          ),
        );
      }
      pushAudit({
        user: user?.name ?? "Tizim",
        action: status === "approved" ? "APPROVE" : "REJECT",
        object: "Leave",
        objectId: id,
        newValue: status,
        date: new Date().toISOString().replace("T", " ").slice(0, 16),
        ip: "192.168.1.14",
        organizationId,
      });
    },
    [employees, leaves, organizationId, pushAudit, user],
  );

  const createLeave = useCallback(
    (
      employeeId: string,
      type: LeaveType,
      start: string,
      end: string,
      reason: string,
      extra?: { note?: string; documentName?: string; documentUrl?: string },
    ) => {
      const emp = employees.find((e) => e.id === employeeId);
      if (!emp || !organizationId || !inTenant(emp, organizationId)) return "Xodim topilmadi.";
      const days = workingDays(start, end);
      if (days <= 0) return "Sana oralig'i noto'g'ri. Ish haftasi dushanba–juma.";
      if (type === "annual" && days > emp.leaveBalance) return `Mehnat ta'tili balansi yetarli emas. Mavjud: ${emp.leaveBalance} kun.`;
      const overlap = leaves.some(
        (l) =>
          l.employeeId === employeeId &&
          l.status !== "rejected" &&
          l.status !== "cancelled" &&
          !(end < l.startDate || start > l.endDate),
      );
      if (overlap) return "Bu davrda boshqa ta'til so'rovi mavjud.";
      const req: LeaveRequest = {
        id: `l-${Date.now()}`,
        employeeId,
        type,
        startDate: start,
        endDate: end,
        days,
        reason,
        note: extra?.note,
        documentName: extra?.documentName,
        documentUrl: extra?.documentUrl,
        deductionAmount: type === "unpaid" ? unpaidDeduction(emp.salary, start, end) : undefined,
        status: "pending",
        createdAt: new Date().toISOString(),
        organizationId: organizationId,
        steps: [
          { role: "Bo'lim rahbari", name: "Rahbar", status: "pending" },
          { role: "HR", name: "HR Admin", status: "pending" },
        ],
      };
      setLeaves((l) => [req, ...l]);
      setNotifications((n) => [
        {
          id: `n-${Date.now()}`,
          title: "Yangi ta'til so'rovi",
          body: `${emp.fullName} — ${days} ish kuni (${type === "unpaid" ? "o'z hisobidan" : type === "sick" ? "bolnichniy" : "ta'til"}).`,
          time: "hozir",
          read: false,
          channel: "inapp",
          organizationId,
        },
        ...n,
      ]);
      return null;
    },
    [employees, leaves, organizationId],
  );

  const updateLeave = useCallback(
    (
      id: string,
      patch: Partial<Pick<LeaveRequest, "type" | "startDate" | "endDate" | "reason" | "note" | "documentName" | "documentUrl">>,
    ) => {
      const current = leaves.find((x) => x.id === id);
      if (!current) return "Yozuv topilmadi.";
      const emp = employees.find((e) => e.id === current.employeeId);
      if (!emp) return "Xodim topilmadi.";
      const start = patch.startDate ?? current.startDate;
      const end = patch.endDate ?? current.endDate;
      const type = patch.type ?? current.type;
      const days = workingDays(start, end);
      if (days <= 0) return "Sana oralig'i noto'g'ri. Ish haftasi dushanba–juma.";
      const overlap = leaves.some(
        (l) =>
          l.id !== id &&
          l.employeeId === current.employeeId &&
          l.status !== "rejected" &&
          l.status !== "cancelled" &&
          !(end < l.startDate || start > l.endDate),
      );
      if (overlap) return "Bu davrda boshqa ta'til so'rovi mavjud.";
      setLeaves((list) =>
        list.map((l) =>
          l.id === id
            ? {
                ...l,
                ...patch,
                days,
                deductionAmount: type === "unpaid" ? unpaidDeduction(emp.salary, start, end) : undefined,
                updatedAt: new Date().toISOString(),
              }
            : l,
        ),
      );
      return null;
    },
    [employees, leaves],
  );

  const approveRequest = useCallback((id: string, status: ApprovalStatus) => {
    setRequests((r) => r.map((x) => (x.id === id ? { ...x, status, documentReady: status === "approved" } : x)));
  }, []);

  const createCertificate = useCallback((employeeId: string, type: string) => {
    if (!organizationId) return;
    const emp = employees.find((e) => e.id === employeeId);
    setRequests((r) => [
      {
        id: `r-${Date.now()}`,
        employeeId,
        type,
        title: type,
        status: "approved",
        slaHours: 8,
        dueAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        documentReady: true,
        organizationId,
      },
      ...r,
    ]);
    setNotifications((n) => [
      {
        id: `n-${Date.now()}`,
        title: "Ma'lumotnoma tayyor",
        body: `${emp?.fullName ?? "Xodim"} uchun ${type} avtomatik yaratildi.`,
        time: "hozir",
        read: false,
        channel: "inapp",
        organizationId,
      },
      ...n,
    ]);
  }, [employees, organizationId]);

  const moveCandidate = useCallback((id: string, stage: RecruitmentStage) => {
    setCandidates((c) => c.map((x) => (x.id === id ? { ...x, stage } : x)));
  }, []);

  const hireCandidate = useCallback(
    (id: string) => {
      if (!organizationId) return;
      const cand = candidates.find((c) => c.id === id);
      if (!cand) return;
      const vac = VACANCIES.find((v) => v.id === cand.vacancyId);
      const emp: Employee = {
        id: `e-${Date.now()}`,
        employeeId: `EMP-${1100 + employees.length}`,
        fullName: cand.fullName,
        firstName: cand.fullName.split(" ")[1] ?? cand.fullName,
        lastName: cand.fullName.split(" ")[0],
        dateOfBirth: "1995-01-01",
        gender: "erkak",
        citizenship: "O'zbekiston",
        passport: "—",
        jshshir: "—",
        address: "Toshkent",
        phone: cand.phone,
        email: cand.email,
        departmentId: vac?.departmentId ?? "d2",
        position: vac?.position ?? "Xodim",
        employmentType: "full_time",
        startDate: new Date().toISOString().slice(0, 10),
        contractEnd: "2027-09-01",
        workSchedule: "09:00–18:00",
        salary: 7000000,
        status: "probation",
        category: "academic",
        education: { university: cand.education, degree: "—", specialty: "—", year: 2020 },
        languages: cand.skills,
        leaveBalance: 21,
        completeness: 42,
        missing: ["Passport", "Diplom", "Tibbiy ma'lumotnoma"],
        organizationId,
      };
      setEmployees((e) => [emp, ...e]);
      setDepartments((ds) =>
        ds.map((d) => (d.id === emp.departmentId ? { ...d, employeeCount: d.employeeCount + 1 } : d)),
      );
      setCandidates((c) => c.map((x) => (x.id === id ? { ...x, stage: "hired" } : x)));
      setTasks((t) => [
        {
          id: `t-${Date.now()}`,
          title: `Onboarding: ${cand.fullName}`,
          due: new Date().toISOString().slice(0, 10),
          dueLabel: "Bugun",
          priority: "high",
          done: false,
          category: "Onboarding",
          organizationId,
        },
        ...t,
      ]);
    },
    [candidates, employees.length, organizationId],
  );

  const addEmployee = useCallback((partial: Partial<Employee>) => {
    if (!organizationId) return "";
    const id = `e-${Date.now()}`;
    const names = (partial.fullName ?? "Yangi xodim").trim().split(" ");
    const missing: string[] = [];
    if (!partial.photoUrl) missing.push("Rasm");
    if (!partial.cvUrl) missing.push("CV / resume");
    if (!partial.passport) missing.push("Passport");
    const filled = [
      partial.fullName, partial.phone, partial.email, partial.position, partial.departmentId,
      partial.passport, partial.jshshir, partial.photoUrl, partial.cvUrl, partial.address,
    ].filter(Boolean).length;
    const emp: Employee = {
      id,
      employeeId: `EMP-${1200 + employees.length}`,
      fullName: partial.fullName ?? "Yangi xodim",
      firstName: names[1] ?? names[0],
      lastName: names[0],
      dateOfBirth: partial.dateOfBirth ?? "1990-01-01",
      gender: partial.gender ?? "erkak",
      citizenship: partial.citizenship ?? "O'zbekiston",
      passport: partial.passport ?? "",
      jshshir: partial.jshshir ?? "",
      address: partial.address ?? "",
      phone: partial.phone ?? "",
      email: partial.email ?? "",
      departmentId: partial.departmentId ?? "d2",
      position: partial.position ?? "Xodim",
      employmentType: partial.employmentType ?? "full_time",
      startDate: partial.startDate ?? new Date().toISOString().slice(0, 10),
      contractEnd: partial.contractEnd,
      workSchedule: partial.workSchedule ?? "09:00–18:00",
      salary: partial.salary ?? 0,
      status: "probation",
      category: partial.category ?? "administrative",
      education: partial.education ?? { university: "", degree: "", specialty: "", year: 2020 },
      languages: partial.languages ?? [],
      leaveBalance: 21,
      completeness: Math.min(100, Math.round((filled / 10) * 100)),
      missing,
      emergencyContact: partial.emergencyContact,
      photoUrl: partial.photoUrl,
      cvName: partial.cvName,
      cvUrl: partial.cvUrl,
      cvType: partial.cvType,
      organizationId: organizationId ?? ORG_IAU,
    };
    setEmployees((e) => [emp, ...e]);
    setDepartments((ds) =>
      ds.map((d) => (d.id === emp.departmentId ? { ...d, employeeCount: d.employeeCount + 1 } : d)),
    );
    setTasks((t) => [
      {
        id: `t-${Date.now()}`,
        title: `Onboarding: ${emp.fullName}`,
        due: new Date().toISOString().slice(0, 10),
        dueLabel: "Bugun",
        priority: "high",
        done: false,
        category: "Onboarding",
        relatedId: id,
        organizationId: organizationId ?? ORG_IAU,
      },
      ...t,
    ]);
    return id;
  }, [employees.length, organizationId]);

  const addDepartment = useCallback((input: { name: string; type: Department["type"]; parentId?: string }) => {
    const id = `d-${Date.now()}`;
    setDepartments((ds) => [
      ...ds,
      {
        id,
        name: input.name,
        type: input.type,
        parentId: input.parentId || "d0",
        employeeCount: 0,
        organizationId: organizationId ?? ORG_IAU,
      },
    ]);
    return id;
  }, [organizationId]);

  const updateEmployee = useCallback((id: string, patch: Partial<Employee>) => {
    if (!organizationId) return;
    setEmployees((e) =>
      e.map((x) => {
        if (x.id !== id) return x;
        if (!inTenant(x, organizationId)) return x;
        const { organizationId: _drop, ...rest } = patch;
        return { ...x, ...rest };
      }),
    );
  }, [organizationId]);

  const sendChat = useCallback(
    (text: string) => {
      const q = text.toLowerCase();
      let reply: ChatMessage = { id: `m-${Date.now()}`, role: "assistant", text: "" };

      if (q.includes("shartnoma") || q.includes("tugay")) {
        const rows = CONTRACTS.filter((c) => c.daysLeft <= 45 && c.daysLeft > 0).map((c) => {
          const emp = employees.find((e) => e.id === c.employeeId);
          return [emp?.fullName ?? "", emp?.employeeId ?? "", `${c.daysLeft} kun`, c.endDate];
        });
        reply = {
          id: `m-${Date.now()}`,
          role: "assistant",
          text: `${rows.length} ta shartnoma 45 kun ichida tugaydi. HR vazifasi avtomatik yaratilgan. Yakuniy yangilash qarori sizniki.`,
          table: [["Xodim", "ID", "Qolgan", "Tugash"], ...rows],
        };
      } else if (q.includes("onboarding") || q.includes("qolib")) {
        reply = {
          id: `m-${Date.now()}`,
          role: "assistant",
          text: "Onboardingda qolib ketganlar: Normatov Jasur (IT akkaunt — overdue), Qodirova Sevara (bo'lim tanishtiruvi va IT — overdue). 4 ta issue HR Control Centerda turibdi.",
        };
      } else if (q.includes("task") || q.includes("vazifa") || q.includes("bugun")) {
        const open = tasks.filter((t) => !t.done);
        reply = {
          id: `m-${Date.now()}`,
          role: "assistant",
          text: `Bugun bajarilishi kerak: ${open.filter((t) => t.dueLabel === "Bugun").length} ta. Ustuvorlik: Kritik ${open.filter((t) => t.priority === "critical").length}, Yuqori ${open.filter((t) => t.priority === "high" || t.priority === "urgent").length}.`,
          table: [["Vazifa", "Ustuvorlik", "Muddat"], ...open.slice(0, 7).map((t) => [t.title, t.priority, t.dueLabel])],
        };
      } else if (q.includes("turnover") || q.includes("hisobot") || q.includes("report")) {
        reply = {
          id: `m-${Date.now()}`,
          role: "assistant",
          text: "Oylik HR qisqacha: Headcount 1 248 (↑12). Yangi 32, ketgan 9. Turnover ≈ 0.72%. Recruitment: 5 nomzod, 3 vakansiya. Rektor dashboardi va Hisobotlar modulidan PDF yuklab olishingiz mumkin.",
        };
      } else if (q.includes("ta'til") || q.includes("tatil") || q.includes("leave")) {
        const emp = employees.find((e) => e.id === user?.employeeId) ?? employees.find((e) => e.id === "e2");
        reply = {
          id: `m-${Date.now()}`,
          role: "assistant",
          text: `${emp?.fullName} leave balansi: ${emp?.leaveBalance} kun. Mehnat ta'tili 21 kalendar kun asosida. So'rov 7 kun oldin yuboriladi. SLA: 1 ish kuni.`,
        };
      } else if (q.includes("davomat") || q.includes("attendance")) {
        reply = {
          id: `m-${Date.now()}`,
          role: "assistant",
          text: "HR barcha davomatni ko'rmaydi. Faqat Action Required: Aliyev S. — 5 kechikish (medium), Ergashev J. — missing attendance (high), Qodirova S. — 2 yo'qlik (high).",
        };
      } else {
        reply = {
          id: `m-${Date.now()}`,
          role: "assistant",
          text: "Qidiruv ruxsatlar doirasida bajarildi. Aniqroq so'rang: masalan «30 kun ichida shartnomasi tugaydiganlar», «onboardingda qolganlar», «bugungi tasklar», «oylik hisobot».",
        };
      }

      setChat((c) => [...c, { id: `u-${Date.now()}`, role: "user", text }, reply]);
    },
    [employees, tasks, user],
  );

  const createTicket = useCallback((employeeId: string, subject: string, category: string) => {
    if (!organizationId) return;
    const faq = /necha kun|ta'til|balans|soat|reglament|ma'lumotnoma/i.test(subject);
    setTickets((t) => [
      {
        id: `HR-${1028 + t.length}`,
        employeeId,
        category,
        priority: "medium",
        status: faq ? "ai_resolved" : "open",
        subject,
        aiAnswer: faq
          ? "Knowledge Base asosida: savolingiz reglamentga mos. Agar balansa oid bo'lsa, portalidagi Leave bo'limini tekshiring. HRga yuborilmadi."
          : undefined,
        createdAt: new Date().toISOString(),
        organizationId,
      },
      ...t,
    ]);
  }, [organizationId]);

  const patchAssignments = useCallback((updater: (prev: Assignment[]) => Assignment[]) => {
    setAssignments((prev) => {
      const next = updater(prev);
      persistAssignments(next);
      return next;
    });
  }, []);

  const createAssignment = useCallback(
    (input: {
      toUserId: string;
      title: string;
      body: string;
      category: AssignmentCategory;
      relatedEmployeeId?: string;
      fileName?: string;
      fileUrl?: string;
    }) => {
      if (!user) return "Avval tizimga kiring.";
      if (!organizationId) return "Tashkilot tanlanmagan.";
      if (!input.toUserId) return "Qabul qiluvchini tanlang.";
      if (!input.title.trim() || !input.body.trim()) return "Mavzu va matnni to'ldiring.";
      const now = new Date().toISOString();
      const id = `as-${Date.now()}`;
      const toUser = USERS.find((u) => u.id === input.toUserId);
      patchAssignments((prev) => [
        {
          id,
          fromUserId: user.id,
          toUserId: input.toUserId,
          title: input.title.trim(),
          body: input.body.trim(),
          relatedEmployeeId: input.relatedEmployeeId || undefined,
          category: input.category,
          status: "open",
          createdAt: now,
          organizationId,
          readBy: [user.id],
          messages: [
            {
              id: `am-${Date.now()}`,
              authorId: user.id,
              text: input.body.trim(),
              createdAt: now,
              fileName: input.fileName,
              fileUrl: input.fileUrl,
            },
          ],
        },
        ...prev,
      ]);
      setNotifications((n) => [
        {
          id: `n-as-${Date.now()}`,
          title: "Yangi topshiriq",
          body: `${user.name}: ${input.title.trim()}`,
          time: "Hozir",
          read: false,
          channel: "inapp",
          forUserId: input.toUserId,
          link: toUser?.role === "employee" ? "/portal/inbox" : "/inbox",
          organizationId,
        },
        ...n,
      ]);
      pushAudit({
        user: user.name,
        action: "CREATE",
        object: "Assignment",
        objectId: id,
        newValue: toUser?.name ?? input.toUserId,
        date: now.replace("T", " ").slice(0, 16),
        ip: "192.168.1.14",
        organizationId,
      });
      return null;
    },
    [organizationId, patchAssignments, pushAudit, user],
  );

  const replyAssignment = useCallback(
    (id: string, text: string, file?: { fileName: string; fileUrl: string }) => {
      if (!user) return "Avval tizimga kiring.";
      if (!text.trim() && !file) return "Javob matni yoki fayl kerak.";
      const now = new Date().toISOString();
      let recipientId: string | undefined;
      let title = "";
      patchAssignments((prev) =>
        prev.map((a) => {
          if (a.id !== id) return a;
          recipientId = a.fromUserId === user.id ? a.toUserId : a.fromUserId;
          title = a.title;
          return {
            ...a,
            status: a.status === "open" ? "in_progress" : a.status,
            readBy: [user.id],
            messages: [
              ...a.messages,
              {
                id: `am-${Date.now()}`,
                authorId: user.id,
                text: text.trim() || (file ? `Fayl: ${file.fileName}` : ""),
                createdAt: now,
                fileName: file?.fileName,
                fileUrl: file?.fileUrl,
              },
            ],
          };
        }),
      );
      if (recipientId) {
        setNotifications((n) => [
          {
            id: `n-as-${Date.now()}`,
            title: "Yangi javob",
            body: `${user.name}: ${title}`,
            time: "Hozir",
            read: false,
            channel: "inapp",
            forUserId: recipientId,
            link: USERS.find((u) => u.id === recipientId)?.role === "employee" ? "/portal/inbox" : "/inbox",
            organizationId: organizationId ?? undefined,
          },
          ...n,
        ]);
      }
      return null;
    },
    [organizationId, patchAssignments, user],
  );

  const setAssignmentStatus = useCallback(
    (id: string, status: AssignmentStatus) => {
      if (!user) return;
      patchAssignments((prev) => prev.map((a) => (a.id === id ? { ...a, status, readBy: [user.id] } : a)));
      pushAudit({
        user: user.name,
        action: "UPDATE",
        object: "Assignment",
        objectId: id,
        newValue: status,
        date: new Date().toISOString().replace("T", " ").slice(0, 16),
        ip: "192.168.1.14",
        organizationId: organizationId ?? undefined,
      });
    },
    [organizationId, patchAssignments, pushAudit, user],
  );

  const markAssignmentRead = useCallback(
    (id: string) => {
      if (!user) return;
      patchAssignments((prev) =>
        prev.map((a) => (a.id === id && !a.readBy.includes(user.id) ? { ...a, readBy: [...a.readBy, user.id] } : a)),
      );
    },
    [patchAssignments, user],
  );

  const orgId = organizationId ?? "";
  const organization = ORGANIZATIONS.find((o) => o.id === orgId) ?? null;
  const userMemberships = user ? membershipsOf(user.id) : [];
  const enabledModules = ORGANIZATION_MODULES.filter((m) => m.organizationId === orgId && m.enabled).map((m) => m.moduleKey);
  const tenant: TenantContext | null =
    user && orgId
      ? { userId: user.id, organizationId: orgId, role: user.role, permissions: permissionsFor(user.role) }
      : null;

  const scopedEmployees = useMemo(() => (orgId ? filterTenant(employees, orgId) : []), [employees, orgId]);
  const scopedDepartments = useMemo(() => (orgId ? filterTenant(departments, orgId) : []), [departments, orgId]);
  const scopedLeaves = useMemo(() => {
    if (!orgId) return [];
    const ids = new Set(scopedEmployees.map((e) => e.id));
    return leaves.filter((l) => orgOf(l) === orgId || ids.has(l.employeeId));
  }, [leaves, orgId, scopedEmployees]);
  const scopedRequests = useMemo(() => {
    if (!orgId) return [];
    const ids = new Set(scopedEmployees.map((e) => e.id));
    return requests.filter((r) => orgOf(r) === orgId || ids.has(r.employeeId));
  }, [orgId, requests, scopedEmployees]);
  const scopedTasks = useMemo(() => (orgId ? filterTenant(tasks, orgId) : []), [orgId, tasks]);
  const scopedNotes = useMemo(() => (orgId ? filterTenant(notifications, orgId) : []), [notifications, orgId]);
  const scopedCandidates = useMemo(() => (orgId ? filterTenant(candidates, orgId) : []), [candidates, orgId]);
  const scopedTickets = useMemo(() => {
    if (!orgId) return [];
    const ids = new Set(scopedEmployees.map((e) => e.id));
    return tickets.filter((t) => orgOf(t) === orgId || ids.has(t.employeeId));
  }, [orgId, scopedEmployees, tickets]);
  const scopedAudit = useMemo(() => (orgId ? filterTenant(audit, orgId) : []), [audit, orgId]);
  const scopedAssignments = useMemo(() => (orgId ? filterTenant(assignments, orgId) : []), [assignments, orgId]);

  const catalog = useMemo(
    () => ({
      contracts: stamp(CONTRACTS).filter((c) => orgOf(c) === orgId && scopedEmployees.some((e) => e.id === c.employeeId)),
      positions: stamp(POSITIONS).filter((p) => orgOf(p) === orgId),
      attendance: stamp(ATTENDANCE_ISSUES).filter((a) => orgOf(a) === orgId && scopedEmployees.some((e) => e.id === a.employeeId)),
      activities: orgId === ORG_IAU ? ACTIVITIES : [],
      vacancies: stamp(VACANCIES).filter((v) => orgOf(v) === orgId),
      onboarding: stamp(ONBOARDING).filter((o) => orgOf(o) === orgId && scopedEmployees.some((e) => e.id === o.employeeId)),
      documents: stamp(DOCUMENTS).filter((d) => orgOf(d) === orgId && scopedEmployees.some((e) => e.id === d.employeeId)),
      trainings: orgId === ORG_IAU ? TRAININGS : [],
      performance: stamp(PERFORMANCE).filter((p) => orgOf(p) === orgId && scopedEmployees.some((e) => e.id === p.employeeId)),
      templates: orgId === ORG_IAU ? TEMPLATES : [],
      workflows: orgId === ORG_IAU ? WORKFLOWS : [],
      knowledge: orgId === ORG_IAU ? KNOWLEDGE : [],
    }),
    [orgId, scopedEmployees],
  );

  const kpis = useMemo(() => {
    const onLeave = scopedLeaves.filter((l) => l.status === "approved").length;
    const payroll = scopedEmployees.reduce((s, e) => s + e.salary, 0);
    return {
      totalEmployees: organization?.reportedHeadcount ?? scopedEmployees.length,
      newThisMonth: scopedEmployees.filter((e) => e.startDate >= "2026-08-01").length,
      onLeave,
      payroll,
      academic: scopedEmployees.filter((e) => e.category === "academic").length,
      administrative: scopedEmployees.filter((e) => e.category === "administrative").length,
      leftThisMonth: 0,
      vacancies: catalog.vacancies.reduce((s, v) => s + v.openings, 0),
      contractsExpiring: catalog.contracts.filter((c) => c.status === "expiring" || c.daysLeft <= 45).length,
      attendanceIssues: catalog.attendance.length,
      pendingApprovals: scopedLeaves.filter((l) => l.status === "pending").length,
      pendingRequests: scopedRequests.filter((r) => r.status === "pending").length,
    };
  }, [catalog, organization, scopedEmployees, scopedLeaves, scopedRequests]);

  const can = useCallback(
    (permission: string) => (tenant ? tenant.permissions.includes(permission) : false),
    [tenant],
  );
  const hasModule = useCallback((key: ModuleKey) => enabledModules.includes(key), [enabledModules]);
  const directoryUsers = useMemo(() => {
    const orgMembers = MEMBERSHIPS.filter((m) => m.organizationId === orgId).map((m) => m.userId);
    return USERS.filter((u) => orgMembers.includes(u.id)).map((u) => publicUser(u, u.role));
  }, [orgId]);

  const value = useMemo(
    () => ({
      user,
      employees: scopedEmployees,
      departments: scopedDepartments,
      leaves: scopedLeaves,
      requests: scopedRequests,
      tasks: scopedTasks,
      notifications: scopedNotes,
      candidates: scopedCandidates,
      tickets: scopedTickets,
      audit: scopedAudit,
      chat,
      assignments: scopedAssignments,
      organization,
      organizations: user ? ORGANIZATIONS.filter((o) => userMemberships.some((m) => m.organizationId === o.id)) : [],
      memberships: userMemberships,
      catalog,
      kpis,
      enabledModules,
      login,
      logout,
      markTask,
      markNotificationRead,
      markAllRead,
      approveLeave,
      createLeave,
      updateLeave,
      approveRequest,
      createCertificate,
      moveCandidate,
      hireCandidate,
      addEmployee,
      addDepartment,
      updateEmployee,
      sendChat,
      createTicket,
      createAssignment,
      replyAssignment,
      setAssignmentStatus,
      markAssignmentRead,
      switchOrganization,
      can,
      hasModule,
      directoryUsers,
    }),
    [
      user, scopedEmployees, scopedDepartments, scopedLeaves, scopedRequests, scopedTasks, scopedNotes,
      scopedCandidates, scopedTickets, scopedAudit, chat, scopedAssignments, organization, userMemberships,
      catalog, kpis, enabledModules, login, logout, markTask, markNotificationRead, markAllRead, approveLeave,
      createLeave, updateLeave, approveRequest, createCertificate, moveCandidate, hireCandidate, addEmployee,
      addDepartment, updateEmployee, sendChat, createTicket, createAssignment, replyAssignment, setAssignmentStatus,
      markAssignmentRead, switchOrganization, can, hasModule, directoryUsers,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

export function useStaticData() {
  return useApp().catalog;
}

/** @deprecated Use useStaticData() — unfiltered catalog leaks tenants. Kept as IAU snapshot for charts. */
export const staticData = {
  departments: DEPARTMENTS,
  positions: POSITIONS,
  contracts: CONTRACTS,
  attendance: ATTENDANCE_ISSUES,
  activities: ACTIVITIES,
  vacancies: VACANCIES,
  onboarding: ONBOARDING,
  documents: DOCUMENTS,
  trainings: TRAININGS,
  performance: PERFORMANCE,
  templates: TEMPLATES,
  workflows: WORKFLOWS,
  knowledge: KNOWLEDGE,
  users: USERS,
};
