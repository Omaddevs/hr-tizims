import { useMemo, useState, type ReactNode } from "react";
import { Link, NavLink, Navigate, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileSpreadsheet,
  FileText,
  Filter,
  GraduationCap,
  HeartPulse,
  List,
  Pencil,
  Plane,
  Plus,
  Stethoscope,
  Users,
  X,
} from "lucide-react";
import { useApp } from "../store/AppContext";
import { Avatar, Badge, Button, Card, Field, Input, Modal, Select, StatusBadge, TableWrap, Td, Th } from "../components/ui";
import { downloadExcel } from "../lib/excel";
import { readFileAsDataUrl } from "../lib/files";
import { leaveScheduleExport, printOfficial } from "../lib/official";
import {
  calendarDaysUntil,
  cn,
  formatDate,
  formatMoney,
  leavePhase,
  leavePhaseLabel,
  leaveTypeLabel,
  parseYmd,
  returnToWorkDate,
  todayYmd,
  toYmd,
  unpaidDeduction,
  workingDays,
} from "../lib/utils";
import type { Employee, LeaveRequest, LeaveType } from "../types";

const HUB_TABS = [
  { to: "/leave/all", kind: "all", label: "Taqvim" },
  { to: "/leave/requests", kind: "requests", label: "Ta'til so'rovlari" },
  { to: "/leave/sick", kind: "sick", label: "Bolnichniy" },
  { to: "/leave/annual", kind: "annual", label: "Mehnat ta'tili" },
  { to: "/leave/unpaid", kind: "unpaid", label: "O'z hisobidan" },
  { to: "/leave/holidays", kind: "holidays", label: "Bayram kunlari" },
  { to: "/leave/reports", kind: "reports", label: "Hisobotlar" },
] as const;

const FORM_TYPES: LeaveType[] = ["sick", "annual", "unpaid", "maternity", "study", "academic"];

const MONTHS_UZ = [
  "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
  "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr",
];

const WEEKDAYS = ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"];

const PUBLIC_HOLIDAYS_2026 = [
  { date: "2026-01-01", name: "Yangi yil" },
  { date: "2026-01-02", name: "Yangi yil dam olish" },
  { date: "2026-03-08", name: "Xotin-qizlar kuni" },
  { date: "2026-03-21", name: "Navro'z" },
  { date: "2026-05-09", name: "Xotira va qadrlash kuni" },
  { date: "2026-09-01", name: "Mustaqillik kuni" },
  { date: "2026-10-01", name: "O'qituvchi va murabbiylar kuni" },
  { date: "2026-12-08", name: "Konstitutsiya kuni" },
];

const LEAVE_LIMITS = [
  { type: "annual", label: "Yillik mehnat ta'tili", limit: 24, icon: Plane, tone: "blue" as const },
  { type: "study", label: "O'quv ta'tili", limit: 10, icon: GraduationCap, tone: "violet" as const },
  { type: "sick", label: "Kasallik varaqasi", limit: 0, icon: Stethoscope, tone: "red" as const },
  { type: "unpaid", label: "O'z hisobidan", limit: 0, icon: BookOpen, tone: "amber" as const },
  { type: "maternity", label: "Homiladorlik", limit: 126, icon: HeartPulse, tone: "green" as const },
];

const EVENT_TONES = ["bg-brand-100 text-brand-800", "bg-violet-100 text-violet-800", "bg-amber-100 text-amber-800", "bg-rose-100 text-rose-800", "bg-sky-100 text-sky-800"];

function deductionOf(emp: Employee | undefined, l: LeaveRequest) {
  if (l.type !== "unpaid" || !emp) return 0;
  return l.deductionAmount ?? unpaidDeduction(emp.salary, l.startDate, l.endDate);
}

function excelRows(list: LeaveRequest[], employees: Employee[], deptName: (id: string) => string) {
  return list.map((l) => {
    const emp = employees.find((e) => e.id === l.employeeId);
    return [
      emp?.employeeId ?? "",
      emp?.fullName ?? "",
      emp?.position ?? "",
      emp ? deptName(emp.departmentId) : "",
      leaveTypeLabel[l.type] ?? l.type,
      l.startDate,
      l.endDate,
      l.days,
      l.reason,
      l.note ?? "",
      l.status,
      l.documentName ?? "",
      emp?.salary ?? 0,
      deductionOf(emp, l),
      emp?.leaveBalance ?? "",
    ];
  });
}

const HEADERS = [
  "Tabel raqami", "F.I.O.", "Lavozim", "Bo'lim", "Ta'til turi", "Boshlanish", "Tugash",
  "Ish kunlari (Du–Ju)", "Sabab", "Izoh", "Status", "Hujjat", "Oylik (so'm)", "Oylikdan minus", "Mehnat ta'tili balansi",
];

function shortName(full: string) {
  const p = full.trim().split(/\s+/);
  if (p.length < 2) return full;
  return `${p[0]} ${p[1][0]}.`;
}

function inRange(day: string, start: string, end: string) {
  return day >= start && day <= end;
}

export function LeavePage() {
  const { kind = "all" } = useParams();
  const { leaves, employees, departments, approveLeave, createLeave, updateLeave, user, kpis } = useApp();
  const canEdit = !!(user && ["hr_admin", "hr_director", "dept_head", "super_admin", "rector"].includes(user.role));
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<LeaveRequest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reqTab, setReqTab] = useState<"pending" | "approved" | "rejected">("pending");
  const [calView, setCalView] = useState<"month" | "week" | "list">("month");
  const [cursor, setCursor] = useState(() => {
    const t = parseYmd(todayYmd());
    return new Date(t.getFullYear(), t.getMonth(), 1);
  });

  const [employeeId, setEmployeeId] = useState(employees[0]?.id ?? "");
  const [type, setType] = useState<LeaveType>("annual");
  const [start, setStart] = useState("2026-09-14");
  const [end, setEnd] = useState("2026-09-18");
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [docName, setDocName] = useState("");
  const [docUrl, setDocUrl] = useState("");

  const filtered = useMemo(() => {
    if (kind === "sick") return leaves.filter((l) => l.type === "sick");
    if (kind === "annual") return leaves.filter((l) => l.type === "annual");
    if (kind === "unpaid") return leaves.filter((l) => l.type === "unpaid");
    if (kind === "requests") return leaves.filter((l) => l.status === "pending");
    return leaves;
  }, [kind, leaves]);

  const emp = employees.find((e) => e.id === employeeId);
  const days = start && end ? workingDays(start, end) : 0;
  const minus = emp && type === "unpaid" && days > 0 ? unpaidDeduction(emp.salary, start, end) : 0;
  const daily = emp && days > 0 && type === "unpaid" ? Math.round(minus / days) : 0;

  function deptName(id: string) {
    return departments.find((d) => d.id === id)?.name ?? "";
  }

  function resetForm(nextType?: LeaveType) {
    setEditing(null);
    setError(null);
    setEmployeeId(employees[0]?.id ?? "");
    setType(nextType ?? "annual");
    setStart("2026-09-14");
    setEnd("2026-09-18");
    setReason("");
    setNote("");
    setDocName("");
    setDocUrl("");
  }

  function openCreate() {
    resetForm(kind === "sick" || kind === "annual" || kind === "unpaid" ? kind : "annual");
    setOpen(true);
  }

  function openEdit(row: LeaveRequest) {
    setEditing(row);
    setError(null);
    setEmployeeId(row.employeeId);
    setType(row.type);
    setStart(row.startDate);
    setEnd(row.endDate);
    setReason(row.reason);
    setNote(row.note ?? "");
    setDocName(row.documentName ?? "");
    setDocUrl(row.documentUrl ?? "");
    setOpen(true);
  }

  function save() {
    const extra = { note, documentName: docName || undefined, documentUrl: docUrl || undefined };
    const err = editing
      ? updateLeave(editing.id, { type, startDate: start, endDate: end, reason: reason || "Ta'til", ...extra })
      : createLeave(employeeId, type, start, end, reason || "Ta'til", extra);
    if (err) {
      setError(err);
      return;
    }
    setOpen(false);
  }

  function exportList() {
    const name =
      kind === "sick" ? "bolnichniy" : kind === "annual" ? "mehnat-tatili" : kind === "unpaid" ? "oz-hisobidan" : "tatillar";
    downloadExcel(`tizims-uz-${name}`, HEADERS, excelRows(filtered, employees, deptName));
  }

  function exportSchedule() {
    const { headers, rows } = leaveScheduleExport(employees, departments, leaves);
    downloadExcel("mehnat-tatili-jadvali", headers, rows, "Mehnat tatili jadvali");
  }

  const avgBalance = employees.length
    ? Math.round(employees.reduce((s, e) => s + e.leaveBalance, 0) / employees.length)
    : 24;
  const usedAnnual = leaves.filter((l) => l.type === "annual" && l.status === "approved").reduce((s, l) => s + l.days, 0);
  const limit = 24;
  const usedSample = Math.min(limit, Math.round(usedAnnual / Math.max(1, employees.length)) || 8);
  const remaining = Math.max(0, limit - usedSample);
  const onLeaveNow = leaves.filter((l) => l.status === "approved" && leavePhase(l) === "active");
  const upcoming = leaves
    .filter((l) => l.status !== "rejected" && l.status !== "cancelled" && leavePhase(l) === "upcoming")
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
  const pending = leaves.filter((l) => l.status === "pending");
  const approved = leaves.filter((l) => l.status === "approved");
  const rejected = leaves.filter((l) => l.status === "rejected");

  const nextHoliday = PUBLIC_HOLIDAYS_2026.find((h) => h.date >= todayYmd()) ?? PUBLIC_HOLIDAYS_2026[PUBLIC_HOLIDAYS_2026.length - 1];
  const daysToHoliday = calendarDaysUntil(todayYmd(), nextHoliday.date);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const calendarCells = useMemo(() => buildMonthCells(year, month), [year, month]);

  const showHub = kind === "all" || kind === "requests" || kind === "holidays" || kind === "reports";
  const showList = kind === "sick" || kind === "annual" || kind === "unpaid" || kind === "requests";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xs text-slate-400">
            <Link to="/" className="hover:text-brand-600">Bosh sahifa</Link>
            <span className="mx-1.5">›</span>
            <span className="text-slate-600">Ta'tillar va taqvim</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Ta'tillar va taqvim</h1>
          <p className="mt-1 text-sm text-slate-500">
            Xodimlar ta'til rejalari, bayramlar va ish jadvalini boshqaring
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={exportSchedule}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <FileSpreadsheet className="h-4 w-4" /> Jadval
          </button>
          {canEdit && (
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
            >
              <Plus className="h-4 w-4" /> Yangi ta'til so'rovi
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-card">
        {HUB_TABS.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            className={({ isActive }) =>
              cn(
                "inline-flex shrink-0 items-center rounded-xl px-3.5 py-2 text-sm font-medium transition",
                isActive ? "bg-brand-50 text-brand-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800",
              )
            }
          >
            {t.label}
            {t.kind === "requests" && pending.length > 0 && (
              <span className="ml-1.5 rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                {pending.length}
              </span>
            )}
          </NavLink>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <Kpi title="Yillik ta'til limiti" value={`${limit} kun`} hint="Standart stavka" tone="blue" icon={<Plane className="h-4 w-4" />} />
        <Kpi title="Foydalanilgan" value={`${usedSample} kun`} hint={`${Math.round((usedSample / limit) * 100)}%`} tone="green" icon={<Check className="h-4 w-4" />} />
        <Kpi title="Qolgan kunlar" value={`${remaining} kun`} hint={`${Math.round((remaining / limit) * 100)}%`} tone="sky" icon={<Clock3 className="h-4 w-4" />} />
        <Kpi title="Ta'tilda hozir" value={`${Math.max(onLeaveNow.length, kpis.onLeave)} xodim`} hint="Faol" tone="violet" icon={<Users className="h-4 w-4" />} />
        <Kpi title="Keyingi bayram" value={formatHolidayShort(nextHoliday.date)} hint={`${daysToHoliday} kun qoldi`} tone="red" icon={<CalendarDays className="h-4 w-4" />} />
      </div>

      {(kind === "all" || kind === "requests") && (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <Card className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
              <div className="flex items-center gap-2">
                <button type="button" className="rounded-lg p-1.5 hover:bg-slate-100" onClick={() => setCursor(new Date(year, month - 1, 1))}>
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="min-w-[140px] text-center text-sm font-semibold text-slate-900">
                  {MONTHS_UZ[month]} {year}
                </div>
                <button type="button" className="rounded-lg p-1.5 hover:bg-slate-100" onClick={() => setCursor(new Date(year, month + 1, 1))}>
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="ml-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                  onClick={() => {
                    const t = parseYmd(todayYmd());
                    setCursor(new Date(t.getFullYear(), t.getMonth(), 1));
                  }}
                >
                  Bugun
                </button>
              </div>
              <div className="flex items-center gap-1">
                <button type="button" className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-2.5 text-xs text-slate-600">
                  <Filter className="h-3.5 w-3.5" /> Filtr
                </button>
                {(["month", "week", "list"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setCalView(v)}
                    className={cn(
                      "h-8 rounded-lg px-2.5 text-xs font-semibold",
                      calView === v ? "bg-brand-600 text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50",
                    )}
                  >
                    {v === "month" ? "Oy" : v === "week" ? "Hafta" : "Ro'yxat"}
                  </button>
                ))}
              </div>
            </div>

            {calView === "list" ? (
              <div className="divide-y divide-slate-100">
                {leaves
                  .filter((l) => l.status !== "rejected" && l.status !== "cancelled")
                  .slice(0, 12)
                  .map((l) => {
                    const e = employees.find((x) => x.id === l.employeeId);
                    return (
                      <div key={l.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                        <div className="min-w-0">
                          <div className="font-medium text-slate-800">{e?.fullName}</div>
                          <div className="text-xs text-slate-400">{leaveTypeLabel[l.type]} · {l.days} kun</div>
                        </div>
                        <div className="text-right text-xs text-slate-500">
                          {formatDate(l.startDate)} – {formatDate(l.endDate)}
                          <div className="mt-0.5"><StatusBadge status={l.status} /></div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="p-3 sm:p-4">
                <div className="mb-2 grid grid-cols-7 gap-1">
                  {WEEKDAYS.map((d) => (
                    <div key={d} className="py-1 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      {d}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {calendarCells.map((cell, idx) => {
                    if (!cell) return <div key={`e-${idx}`} className="min-h-[88px] rounded-xl bg-slate-50/40" />;
                    const ymd = cell;
                    const dayNum = Number(ymd.slice(8));
                    const isToday = ymd === todayYmd();
                    const holiday = PUBLIC_HOLIDAYS_2026.find((h) => h.date === ymd);
                    const dayLeaves = leaves.filter(
                      (l) => (l.status === "approved" || l.status === "pending") && inRange(ymd, l.startDate, l.endDate),
                    );
                    return (
                      <div
                        key={ymd}
                        className={cn(
                          "min-h-[88px] rounded-xl border p-1.5",
                          isToday ? "border-brand-300 bg-brand-50/40" : "border-slate-100 bg-white",
                          holiday && "bg-emerald-50/50",
                        )}
                      >
                        <div className={cn("mb-1 text-xs font-semibold", isToday ? "text-brand-700" : "text-slate-600")}>
                          {dayNum}
                        </div>
                        <div className="space-y-0.5">
                          {holiday && (
                            <div className="truncate rounded-md bg-emerald-100 px-1 py-0.5 text-[9px] font-semibold text-emerald-800">
                              {holiday.name}
                            </div>
                          )}
                          {dayLeaves.slice(0, 2).map((l, i) => {
                            const e = employees.find((x) => x.id === l.employeeId);
                            return (
                              <div
                                key={l.id}
                                className={cn("truncate rounded-md px-1 py-0.5 text-[9px] font-medium", EVENT_TONES[i % EVENT_TONES.length])}
                                title={`${e?.fullName} — ${leaveTypeLabel[l.type]}`}
                              >
                                {e ? shortName(e.fullName) : "—"}
                              </div>
                            );
                          })}
                          {dayLeaves.length > 2 && (
                            <div className="text-[9px] font-medium text-slate-400">+{dayLeaves.length - 2}</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>

          <Card className="overflow-hidden xl:sticky xl:top-20 xl:self-start">
            <div className="border-b border-slate-100 px-4 py-3">
              <h3 className="text-sm font-semibold text-slate-900">Ta'til so'rovlari</h3>
              <div className="mt-2 flex gap-1 rounded-xl bg-slate-50 p-1">
                {(
                  [
                    { id: "pending", label: "Kutilmoqda", n: pending.length },
                    { id: "approved", label: "Tasdiq", n: approved.length },
                    { id: "rejected", label: "Rad", n: rejected.length },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setReqTab(t.id)}
                    className={cn(
                      "flex-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold",
                      reqTab === t.id ? "bg-white text-brand-700 shadow-sm" : "text-slate-500",
                    )}
                  >
                    {t.label} {t.n}
                  </button>
                ))}
              </div>
            </div>
            <div className="max-h-[520px] divide-y divide-slate-100 overflow-y-auto">
              {(reqTab === "pending" ? pending : reqTab === "approved" ? approved : rejected).slice(0, 8).map((l) => {
                const e = employees.find((x) => x.id === l.employeeId);
                return (
                  <div key={l.id} className="px-4 py-3">
                    <div className="flex items-start gap-3">
                      <Avatar name={e?.fullName ?? "?"} size="sm" src={e?.photoUrl} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-slate-800">{e?.fullName}</div>
                        <div className="truncate text-[11px] text-slate-400">
                          {e ? deptName(e.departmentId) : "—"} · {leaveTypeLabel[l.type]}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {formatDate(l.startDate)} – {formatDate(l.endDate)} · <b>{l.days} kun</b>
                        </div>
                        {canEdit && reqTab === "pending" && (
                          <div className="mt-2 flex gap-1.5">
                            <button
                              type="button"
                              onClick={() => approveLeave(l.id, "approved")}
                              className="inline-flex h-8 flex-1 items-center justify-center gap-1 rounded-lg bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-700"
                            >
                              <Check className="h-3.5 w-3.5" /> Tasdiqlash
                            </button>
                            <button
                              type="button"
                              onClick={() => approveLeave(l.id, "rejected")}
                              className="inline-flex h-8 flex-1 items-center justify-center gap-1 rounded-lg bg-red-50 text-xs font-semibold text-red-600 hover:bg-red-100"
                            >
                              <X className="h-3.5 w-3.5" /> Rad etish
                            </button>
                          </div>
                        )}
                        {reqTab !== "pending" && (
                          <div className="mt-1.5"><StatusBadge status={l.status} /></div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {(reqTab === "pending" ? pending : reqTab === "approved" ? approved : rejected).length === 0 && (
                <div className="px-4 py-10 text-center text-sm text-slate-400">Ro'yxat bo'sh</div>
              )}
            </div>
          </Card>
        </div>
      )}

      {kind === "all" && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="overflow-hidden lg:col-span-1">
            <div className="border-b border-slate-100 px-4 py-3">
              <h3 className="text-sm font-semibold">Yaqinlashib kelayotgan ta'tillar</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {upcoming.slice(0, 5).map((l) => {
                const e = employees.find((x) => x.id === l.employeeId);
                return (
                  <Link
                    key={l.id}
                    to={e ? `/leave/employee/${e.id}` : "/leave/all"}
                    className="flex items-start justify-between gap-2 px-4 py-3 hover:bg-slate-50"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-slate-800">{e?.fullName}</div>
                      <div className="text-[11px] text-slate-400">{e ? deptName(e.departmentId) : ""}</div>
                      <Badge tone={l.type === "sick" ? "red" : l.type === "unpaid" ? "amber" : "green"} className="mt-1">
                        {leaveTypeLabel[l.type]}
                      </Badge>
                    </div>
                    <div className="text-right text-xs text-slate-500">
                      <div>{formatDate(l.startDate)}</div>
                      <div className="font-semibold text-slate-700">{l.days} kun</div>
                    </div>
                  </Link>
                );
              })}
              {upcoming.length === 0 && <div className="px-4 py-8 text-center text-sm text-slate-400">Yaqin ta'til yo'q</div>}
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="border-b border-slate-100 px-4 py-3">
              <h3 className="text-sm font-semibold">Ta'til turlari va limitlari</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {LEAVE_LIMITS.map((item) => {
                const used = leaves.filter((l) => l.type === item.type && l.status === "approved").reduce((s, l) => s + l.days, 0);
                const Icon = item.icon;
                return (
                  <div key={item.type} className="flex items-center gap-3 px-4 py-3">
                    <span
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-xl",
                        item.tone === "blue" && "bg-brand-50 text-brand-600",
                        item.tone === "violet" && "bg-violet-50 text-violet-600",
                        item.tone === "red" && "bg-red-50 text-red-600",
                        item.tone === "amber" && "bg-amber-50 text-amber-600",
                        item.tone === "green" && "bg-emerald-50 text-emerald-600",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-slate-800">{item.label}</div>
                      <div className="text-[11px] text-slate-400">
                        Limit: {item.limit || "—"} · Foydalanilgan: {used}
                        {item.limit > 0 ? ` · Qoldi: ${Math.max(0, item.limit - usedSample)}` : ""}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="border-b border-slate-100 px-4 py-3">
              <h3 className="text-sm font-semibold">Davlat bayram kunlari (2026)</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {PUBLIC_HOLIDAYS_2026.map((h) => (
                <div key={h.date} className="flex items-center justify-between gap-2 px-4 py-3">
                  <div>
                    <div className="text-sm font-medium text-slate-800">{h.name}</div>
                    <div className="text-[11px] text-slate-400">{formatDate(h.date)}</div>
                  </div>
                  <Badge tone="red">Dam olish</Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {kind === "holidays" && (
        <Card className="overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-4">
            <h3 className="font-semibold">Davlat bayram kunlari — 2026</h3>
            <p className="text-sm text-slate-500">Rasmiy dam olish kunlari taqvimga avtomatik tushadi</p>
          </div>
          <TableWrap>
            <thead>
              <tr>
                <Th>Sana</Th>
                <Th>Bayram</Th>
                <Th>Holat</Th>
                <Th>Qolgan kun</Th>
              </tr>
            </thead>
            <tbody>
              {PUBLIC_HOLIDAYS_2026.map((h) => (
                <tr key={h.date}>
                  <Td className="font-medium">{formatDate(h.date)}</Td>
                  <Td>{h.name}</Td>
                  <Td><Badge tone="red">Dam olish</Badge></Td>
                  <Td className="text-slate-500">
                    {h.date >= todayYmd() ? `${calendarDaysUntil(todayYmd(), h.date)} kun` : "O'tgan"}
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </Card>
      )}

      {kind === "reports" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="p-5">
            <h3 className="font-semibold">Tezkor hisobotlar</h3>
            <p className="mt-1 text-sm text-slate-500">Excel eksport va rasmiy buyruqlar</p>
            <div className="mt-4 grid gap-2">
              <Button variant="outline" onClick={exportList}><FileSpreadsheet className="h-4 w-4" /> Barcha ta'tillar Excel</Button>
              <Button variant="outline" onClick={exportSchedule}><List className="h-4 w-4" /> Mehnat ta'tili jadvali</Button>
              <Button variant="outline" onClick={() => downloadExcel("tizims-uz-bayramlar", ["Sana", "Bayram"], PUBLIC_HOLIDAYS_2026.map((h) => [h.date, h.name]))}>
                <CalendarDays className="h-4 w-4" /> Bayramlar Excel
              </Button>
            </div>
          </Card>
          <Card className="p-5">
            <h3 className="font-semibold">Statistika</h3>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Jami so'rovlar</span><b>{leaves.length}</b></div>
              <div className="flex justify-between"><span className="text-slate-500">Kutilmoqda</span><b>{pending.length}</b></div>
              <div className="flex justify-between"><span className="text-slate-500">Tasdiqlangan</span><b>{approved.length}</b></div>
              <div className="flex justify-between"><span className="text-slate-500">O'rtacha balans</span><b>{avgBalance} kun</b></div>
              <div className="flex justify-between"><span className="text-slate-500">Hozir ta'tilda</span><b>{onLeaveNow.length}</b></div>
            </div>
          </Card>
        </div>
      )}

      {showList && (
        <>
          {kind === "unpaid" && (
            <Card className="border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              O'z hisobidan ta'til: oylik ÷ shu oydagi ish kunlari = kunlik stavka. Har bir dushanba–juma kuni shu stavkada oylikdan minus qilinadi.
            </Card>
          )}
          {kind === "sick" && (
            <Card className="border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
              Bolnichniy: kasallik varaqasi (PDF/rasm) yuklanadi va xodim bo'yicha Excelga chiqariladi.
            </Card>
          )}
          {kind === "annual" && (
            <Card className="border-brand-100 bg-brand-50 p-4 text-sm text-brand-900">
              Mehnat ta'tili: balansdan ish kunlari yechiladi. Tasdiqlangandan keyin balans kamayadi.
            </Card>
          )}

          <Card className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
              <div>
                <h3 className="text-sm font-semibold">
                  {kind === "requests" ? "Ta'til so'rovlari" : kind === "sick" ? "Bolnichniy ro'yxati" : kind === "annual" ? "Mehnat ta'tili" : "O'z hisobidan"}
                </h3>
                <p className="text-xs text-slate-400">{filtered.length} ta yozuv</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={exportList}><FileSpreadsheet className="h-4 w-4" /> Excel</Button>
                {canEdit && <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4" /> Qo'shish</Button>}
              </div>
            </div>
            <TableWrap>
              <thead>
                <tr className="bg-slate-50/80">
                  <Th>Xodim</Th>
                  <Th>Tur</Th>
                  <Th>Davr / qaytish</Th>
                  <Th>Ish kuni</Th>
                  <Th>Hujjat</Th>
                  <Th>Oylik minus</Th>
                  <Th>Status</Th>
                  <Th></Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((l) => {
                  const e = employees.find((x) => x.id === l.employeeId);
                  const cut = deductionOf(e, l);
                  return (
                    <tr key={l.id} className="hover:bg-slate-50">
                      <Td>
                        {e ? (
                          <Link to={`/leave/employee/${e.id}`} className="block hover:text-brand-700">
                            <div className="flex items-center gap-2">
                              <Avatar name={e.fullName} size="sm" src={e.photoUrl} />
                              <div>
                                <div className="font-medium">{e.fullName}</div>
                                <div className="text-[11px] text-slate-400">{e.employeeId} · {deptName(e.departmentId)}</div>
                              </div>
                            </div>
                          </Link>
                        ) : "—"}
                      </Td>
                      <Td>
                        <Badge tone={l.type === "sick" ? "red" : l.type === "unpaid" ? "amber" : "blue"}>
                          {leaveTypeLabel[l.type] ?? l.type}
                        </Badge>
                        <div className="mt-1 text-[11px] text-slate-400">{leavePhaseLabel[leavePhase(l)]}</div>
                      </Td>
                      <Td className="text-xs">
                        <div>Chiqgan: {formatDate(l.startDate)}</div>
                        <div>Tugashi: {formatDate(l.endDate)}</div>
                        <div className="font-medium text-slate-700">Qaytish: {formatDate(returnToWorkDate(l.endDate))}</div>
                      </Td>
                      <Td>{l.days}</Td>
                      <Td>
                        {l.documentUrl ? (
                          <a href={l.documentUrl} download={l.documentName} className="text-xs text-brand-700 hover:underline">{l.documentName}</a>
                        ) : (
                          <span className="text-xs text-slate-400">{l.documentName ?? "—"}</span>
                        )}
                      </Td>
                      <Td className="text-xs">{l.type === "unpaid" ? formatMoney(cut) : "—"}</Td>
                      <Td><StatusBadge status={l.status} /></Td>
                      <Td>
                        <div className="flex flex-wrap gap-1">
                          {canEdit && (
                            <Button size="sm" variant="outline" onClick={() => openEdit(l)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {canEdit && l.status === "pending" && (
                            <>
                              <Button size="sm" onClick={() => approveLeave(l.id, "approved")}>Tasdiq</Button>
                              <Button size="sm" variant="danger" onClick={() => approveLeave(l.id, "rejected")}>Rad</Button>
                            </>
                          )}
                          {e && (
                            <Button size="sm" variant="outline" onClick={() => printOfficial("leave_order", e, deptName(e.departmentId), l)}>
                              <FileText className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </TableWrap>
          </Card>
        </>
      )}

      {!showHub && !showList && <Navigate to="/leave/all" replace />}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Ta'tilni tahrirlash" : "Yangi ta'til so'rovi"} wide>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Xodim">
            <Select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} disabled={!!editing}>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>{e.fullName}</option>
              ))}
            </Select>
          </Field>
          <Field label="Tur">
            <Select value={type} onChange={(e) => setType(e.target.value as LeaveType)}>
              {FORM_TYPES.map((t) => (
                <option key={t} value={t}>{leaveTypeLabel[t]}</option>
              ))}
            </Select>
          </Field>
          <Field label="Boshlanish"><Input type="date" value={start} onChange={(e) => setStart(e.target.value)} /></Field>
          <Field label="Tugash"><Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} /></Field>
          <Field label="Sabab">
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Qisqa sabab" />
          </Field>
          <Field label="Izoh">
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Bolnichniy raqami, buyruq..." />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Hujjat (PDF, rasm)">
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                className="block w-full text-sm"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setDocName(file.name);
                  setDocUrl(await readFileAsDataUrl(file));
                }}
              />
              {docName && <div className="mt-1 text-xs text-slate-500">{docName}</div>}
            </Field>
          </div>
        </div>
        <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm">
          <div>Ish kunlari (Du–Ju): <b>{days}</b></div>
          {type === "annual" && emp && <div>Mehnat ta'tili balansi: <b>{emp.leaveBalance} kun</b></div>}
          {type === "unpaid" && emp && (
            <div className="text-amber-800">
              Kunlik minus ≈ {formatMoney(daily)} · Jami oylikdan: <b>{formatMoney(minus)}</b>
            </div>
          )}
        </div>
        {error && <div className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>Bekor</Button>
          <Button onClick={save}>{editing ? "Saqlash" : "Yuborish"}</Button>
        </div>
      </Modal>
    </div>
  );
}

function buildMonthCells(year: number, month: number) {
  const first = new Date(year, month, 1);
  const startPad = (first.getDay() + 6) % 7; // Monday-first
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(toYmd(new Date(year, month, d)));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function formatHolidayShort(iso: string) {
  const d = parseYmd(iso);
  return `${d.getDate()} ${MONTHS_UZ[d.getMonth()]}`;
}

function Kpi({
  title,
  value,
  hint,
  tone,
  icon,
}: {
  title: string;
  value: string;
  hint: string;
  tone: "blue" | "green" | "sky" | "violet" | "red";
  icon: ReactNode;
}) {
  const map = {
    blue: "bg-brand-50 text-brand-600",
    green: "bg-emerald-50 text-emerald-600",
    sky: "bg-sky-50 text-sky-600",
    violet: "bg-violet-50 text-violet-600",
    red: "bg-red-50 text-red-600",
  };
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card">
      <div className="flex items-start justify-between gap-2">
        <div className="text-xs font-medium text-slate-500">{title}</div>
        <span className={cn("rounded-lg p-1.5", map[tone])}>{icon}</span>
      </div>
      <div className="mt-2 text-xl font-bold tracking-tight text-slate-900">{value}</div>
      <div className="mt-1 text-[11px] font-semibold text-slate-400">{hint}</div>
    </div>
  );
}

function featuredLeave(list: LeaveRequest[]) {
  const live = list.filter((l) => l.status !== "rejected" && l.status !== "cancelled");
  const active = live.find((l) => leavePhase(l) === "active");
  if (active) return active;
  const upcoming = live.filter((l) => leavePhase(l) === "upcoming").sort((a, b) => a.startDate.localeCompare(b.startDate));
  if (upcoming[0]) return upcoming[0];
  return [...live].sort((a, b) => b.endDate.localeCompare(a.endDate))[0];
}

function phaseTone(phase: ReturnType<typeof leavePhase>): "blue" | "green" | "amber" | "red" {
  if (phase === "active") return "blue";
  if (phase === "upcoming") return "amber";
  if (phase === "completed") return "green";
  return "red";
}

export function LeaveEmployeePage() {
  const { id } = useParams();
  const nav = useNavigate();
  const { employees, leaves, departments } = useApp();
  const emp = employees.find((e) => e.id === id);
  const mine = leaves.filter((l) => l.employeeId === id).sort((a, b) => b.startDate.localeCompare(a.startDate));
  const today = todayYmd();

  if (!emp) {
    return (
      <div>
        <Link to="/leave/all" className="text-sm text-brand-600">← Ta'tillar</Link>
        <div className="mt-4">Xodim topilmadi.</div>
      </div>
    );
  }

  const dept = departments.find((d) => d.id === emp.departmentId);
  const focus = featuredLeave(mine);
  const returnDate = focus ? returnToWorkDate(focus.endDate) : null;
  const phase = focus ? leavePhase(focus) : null;
  const unpaidTotal = mine
    .filter((l) => l.type === "unpaid" && l.status === "approved")
    .reduce((s, l) => s + deductionOf(emp, l), 0);

  function remainingText() {
    if (!focus || !phase || !returnDate) return "";
    if (phase === "active") {
      const left = workingDays(today, focus.endDate);
      return `Ta'tilda. Oxirgi kun: ${formatDate(focus.endDate)}. Ishga qaytishi kerak: ${formatDate(returnDate)} (${left} ish kuni qoldi).`;
    }
    if (phase === "upcoming") {
      const until = calendarDaysUntil(today, focus.startDate);
      return `${until} kundan keyin chiqadi (${formatDate(focus.startDate)}). Qaytish: ${formatDate(returnDate)}.`;
    }
    if (phase === "completed") {
      return `Qaytgan. Chiqqan: ${formatDate(focus.startDate)}, qaytish sanasi: ${formatDate(returnDate)}.`;
    }
    return "Bu yozuv rad etilgan yoki bekor qilingan.";
  }

  return (
    <div className="space-y-4">
      <button type="button" className="inline-flex items-center gap-1 text-sm text-brand-600" onClick={() => nav(-1)}>
        <ArrowLeft className="h-4 w-4" /> Ta'tillar
      </button>

      <Card className="p-6">
        <div className="flex flex-wrap items-start gap-5">
          <Avatar name={emp.fullName} size="lg" src={emp.photoUrl} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold">{emp.fullName}</h1>
              <StatusBadge status={emp.status} />
              <Badge>{emp.employeeId}</Badge>
            </div>
            <p className="mt-1 text-sm text-slate-500">{emp.position} · {dept?.name}</p>
            <p className="mt-1 text-xs text-slate-400">{emp.email} · {emp.phone}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link to={`/employees/${emp.id}`} className="text-sm font-medium text-brand-600">To'liq profil →</Link>
              <Button size="sm" variant="outline" onClick={() => downloadExcel(`tizims-uz-${emp.employeeId}-tatil`, HEADERS, excelRows(mine, employees, (did) => departments.find((d) => d.id === did)?.name ?? ""))}>
                <FileSpreadsheet className="h-4 w-4" /> Excel
              </Button>
              {focus && (
                <Button size="sm" variant="outline" onClick={() => printOfficial("leave_order", emp, dept?.name ?? "", focus)}>
                  <FileText className="h-4 w-4" /> Buyruq
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <div className="text-xs text-slate-400">Mehnat ta'tili balansi</div>
          <div className="text-2xl font-bold">{emp.leaveBalance} kun</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-slate-400">Ta'til yozuvlari</div>
          <div className="text-2xl font-bold">{mine.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-slate-400">O'z hisobidan minus</div>
          <div className="text-2xl font-bold text-amber-700">{unpaidTotal ? formatMoney(unpaidTotal) : "—"}</div>
        </Card>
      </div>

      {focus && phase && returnDate && (
        <Card className="border-brand-100 bg-brand-50/40 p-5">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <CalendarDays className="h-5 w-5 text-brand-600" />
            <h2 className="font-semibold">Asosiy ta'til holati</h2>
            <Badge tone={phaseTone(phase)}>{leavePhaseLabel[phase]}</Badge>
            <Badge tone={focus.type === "sick" ? "red" : focus.type === "unpaid" ? "amber" : "blue"}>
              {leaveTypeLabel[focus.type]}
            </Badge>
          </div>
          <p className="mb-4 text-sm text-slate-700">{remainingText()}</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Info k="Qachon chiqqan" v={formatDate(focus.startDate)} />
            <Info k="Ta'til oxirgi kuni" v={formatDate(focus.endDate)} />
            <Info k="Ishga qaytishi kerak" v={formatDate(returnDate)} accent />
            <Info k="Ish kunlari" v={`${focus.days} kun (Du–Ju)`} />
          </div>
          {focus.reason && <div className="mt-3 text-sm text-slate-600">Sabab: {focus.reason}</div>}
          {focus.note && <div className="text-sm text-slate-500">Izoh: {focus.note}</div>}
        </Card>
      )}

      <Card>
        <div className="border-b border-slate-100 px-5 py-4 font-semibold">Barcha ta'til yozuvlari</div>
        <div className="divide-y divide-slate-100">
          {mine.length === 0 && <div className="px-5 py-8 text-center text-sm text-slate-500">Hali yozuv yo'q.</div>}
          {mine.map((l) => {
            const p = leavePhase(l);
            const back = returnToWorkDate(l.endDate);
            return (
              <div key={l.id} className="px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={l.type === "sick" ? "red" : l.type === "unpaid" ? "amber" : "blue"}>
                        {leaveTypeLabel[l.type]}
                      </Badge>
                      <Badge tone={phaseTone(p)}>{leavePhaseLabel[p]}</Badge>
                      <StatusBadge status={l.status} />
                    </div>
                    <div className="mt-2 grid gap-1 text-sm text-slate-700 sm:grid-cols-3">
                      <div><span className="text-slate-400">Chiqgan: </span>{formatDate(l.startDate)}</div>
                      <div><span className="text-slate-400">Tugashi: </span>{formatDate(l.endDate)}</div>
                      <div><span className="font-medium">Qaytish: {formatDate(back)}</span></div>
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {l.days} ish kuni · {l.reason}
                      {l.type === "unpaid" ? ` · minus ${formatMoney(deductionOf(emp, l))}` : ""}
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => printOfficial("leave_order", emp, dept?.name ?? "", l)}>
                    <FileText className="h-3.5 w-3.5" /> Buyruq
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function Info({ k, v, accent }: { k: string; v: string; accent?: boolean }) {
  return (
    <div className="rounded-xl bg-white p-3 shadow-card">
      <div className="text-[11px] uppercase tracking-wide text-slate-400">{k}</div>
      <div className={accent ? "text-base font-bold text-brand-700" : "text-base font-semibold"}>{v}</div>
    </div>
  );
}
