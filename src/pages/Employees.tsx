import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  BarChart3,
  ClipboardList,
  FileSpreadsheet,
  FileText,
  Filter,
  HeartPulse,
  Mail,
  MessageSquare,
  MoreHorizontal,
  Palmtree,
  Phone,
  Plus,
  Printer,
  Search,
  Settings2,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import { FOLDERS } from "../data/seed";
import { HireEmployeeForm } from "../components/HireEmployeeForm";
import { useApp } from "../store/AppContext";
import { Avatar, Badge, Button, Card, Field, Input, Modal, PageTitle, Select, StatusBadge, TableWrap, Td, Th } from "../components/ui";
import { downloadExcel } from "../lib/excel";
import { cn, formatCompact, formatDate, formatMoney, leavePhase } from "../lib/utils";
import { printOfficial } from "../lib/official";
import type { Department, Employee } from "../types";

const typeLabel: Record<Department["type"], string> = {
  rectorate: "Rektorat",
  faculty: "Fakultet",
  department: "Kafedra",
  unit: "Bo'lim",
};

const employmentLabel: Record<string, string> = {
  full_time: "To'liq stavka",
  part_time: "Yarim stavka",
  contract: "Shartnomali",
  hourly: "Soatbay",
};

type EmpTab = "all" | "departments" | "positions" | "contracts" | "birthdays" | "incomplete";

export function EmployeesPage() {
  const { employees, departments, leaves, kpis, catalog } = useApp();
  const [q, setQ] = useState("");
  const [dept, setDept] = useState("all");
  const [position, setPosition] = useState("all");
  const [status, setStatus] = useState("all");
  const [tab, setTab] = useState<EmpTab>("all");
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [menuId, setMenuId] = useState<string | null>(null);
  const nav = useNavigate();

  const sickIds = useMemo(
    () => new Set(leaves.filter((l) => l.type === "sick" && l.status === "approved" && leavePhase(l) === "active").map((l) => l.employeeId)),
    [leaves],
  );
  const leaveIds = useMemo(
    () => new Set(leaves.filter((l) => l.status === "approved" && leavePhase(l) === "active").map((l) => l.employeeId)),
    [leaves],
  );

  const positions = useMemo(() => [...new Set(employees.map((e) => e.position))].sort(), [employees]);

  const activeCount = employees.filter((e) => e.status === "active").length;
  const onLeaveCount = employees.filter((e) => e.status === "on_leave" || leaveIds.has(e.id)).length;
  const sickCount = employees.filter((e) => sickIds.has(e.id)).length;
  const newCount = kpis.newThisMonth || employees.filter((e) => e.startDate >= "2026-08-01").length;
  const leftCount = kpis.leftThisMonth ?? 0;

  const list = useMemo(() => {
    let rows = employees.filter((e) => {
      const hit = `${e.fullName} ${e.employeeId} ${e.position} ${e.email} ${e.phone}`
        .toLowerCase()
        .includes(q.toLowerCase());
      return hit && (dept === "all" || e.departmentId === dept) && (status === "all" || e.status === status) && (position === "all" || e.position === position);
    });

    if (tab === "contracts") rows = rows.filter((e) => !!e.contractEnd);
    if (tab === "birthdays") {
      const month = new Date().getMonth();
      rows = rows.filter((e) => new Date(e.dateOfBirth).getMonth() === month);
    }
    if (tab === "incomplete") rows = rows.filter((e) => e.completeness < 90);

    return rows;
  }, [employees, q, dept, status, position, tab]);

  const pageCount = Math.max(1, Math.ceil(list.length / pageSize));
  const pageRows = list.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [q, dept, status, position, tab, pageSize]);

  useEffect(() => {
    if (!selectedId && list[0]) setSelectedId(list[0].id);
    else if (selectedId && !list.some((e) => e.id === selectedId)) setSelectedId(list[0]?.id ?? null);
  }, [list, selectedId]);

  const selected = employees.find((e) => e.id === selectedId) ?? null;
  const selectedDept = selected ? departments.find((d) => d.id === selected.departmentId) : null;
  const allChecked = pageRows.length > 0 && pageRows.every((e) => checked[e.id]);

  function exportList() {
    downloadExcel(
      "tizims-uz-xodimlar",
      ["ID", "F.I.O", "Lavozim", "Bo'lim", "Status", "Telefon", "Email", "Ishga kirgan"],
      list.map((e) => [
        e.employeeId,
        e.fullName,
        e.position,
        departments.find((d) => d.id === e.departmentId)?.name ?? "",
        e.status,
        e.phone,
        e.email,
        e.startDate,
      ]),
    );
  }

  const tabs: { id: EmpTab; label: string; count?: number }[] = [
    { id: "all", label: "Barcha xodimlar", count: employees.length },
    { id: "departments", label: "Bo'limlar", count: departments.filter((d) => d.id !== "d0").length },
    { id: "positions", label: "Lavozimlar", count: catalog.positions.length },
    { id: "contracts", label: "Shartnomalar", count: employees.filter((e) => e.contractEnd).length },
    { id: "birthdays", label: "Tug'ilgan kunlar" },
    { id: "incomplete", label: "To'liq emas", count: employees.filter((e) => e.completeness < 90).length },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xs text-slate-400">
            <Link to="/" className="hover:text-brand-600">Bosh sahifa</Link>
            <span className="mx-1.5">›</span>
            <span className="text-slate-600">Xodimlar</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Xodimlar</h1>
          <p className="mt-1 text-sm text-slate-500">Digital employee profile · filtr, jadval va tezkor amallar</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" /> Yangi xodim qo'shish
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <MiniStat title="Jami xodimlar" value={formatCompact(kpis.totalEmployees || employees.length)} hint="+2.1%" tone="blue" icon={<Users className="h-4 w-4" />} />
        <MiniStat title="Faol xodimlar" value={formatCompact(activeCount || kpis.totalEmployees - onLeaveCount)} hint="89.7%" tone="green" icon={<UserCheck className="h-4 w-4" />} />
        <MiniStat title="Ta'tildagi" value={String(Math.max(onLeaveCount, kpis.onLeave))} hint="3.8%" tone="amber" icon={<Palmtree className="h-4 w-4" />} />
        <MiniStat title="Kasallikda" value={String(Math.max(sickCount, 15))} hint="-1.2%" tone="red" icon={<HeartPulse className="h-4 w-4" />} />
        <MiniStat title="Yangi (oy)" value={String(newCount)} hint="Bu oy" tone="violet" icon={<UserPlus className="h-4 w-4" />} />
        <MiniStat title="Ishdan ketgan" value={String(leftCount || 12)} hint="Bu oy" tone="slate" icon={<UserMinus className="h-4 w-4" />} />
      </div>

      <div className="flex gap-1 overflow-x-auto rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-card">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              if (t.id === "departments") {
                nav("/org");
                return;
              }
              if (t.id === "positions") {
                nav("/org/positions");
                return;
              }
              setTab(t.id);
            }}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium transition",
              tab === t.id && t.id !== "departments" && t.id !== "positions"
                ? "bg-brand-50 text-brand-700"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-800",
            )}
          >
            {t.label}
            {t.count != null && (
              <span className={cn("rounded-md px-1.5 py-0.5 text-[10px] font-semibold", tab === t.id ? "bg-white text-brand-700" : "bg-slate-100 text-slate-500")}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-4">
          <Card className="p-3 sm:p-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[200px] flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Xodim qidirish (F.I.O, ID, lavozim...)"
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none ring-brand-500/20 focus:border-brand-500 focus:ring-4"
                />
              </div>
              <Select value={dept} onChange={(e) => setDept(e.target.value)} className="h-10 w-full sm:w-44">
                <option value="all">Bo'limlar</option>
                {departments.filter((d) => d.id !== "d0").map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </Select>
              <Select value={position} onChange={(e) => setPosition(e.target.value)} className="h-10 w-full sm:w-44">
                <option value="all">Lavozimlar</option>
                {positions.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </Select>
              <Select value={status} onChange={(e) => setStatus(e.target.value)} className="h-10 w-full sm:w-40">
                <option value="all">Statuslar</option>
                <option value="active">Faol</option>
                <option value="probation">Sinov</option>
                <option value="on_leave">Ta'tilda</option>
                <option value="terminated">Ishdan ketgan</option>
              </Select>
              <button
                type="button"
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                <Filter className="h-4 w-4" /> Filtrlar
              </button>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Xodimlar ro'yxati</h3>
                <p className="text-xs text-slate-400">{list.length} ta natija</p>
              </div>
              <div className="flex items-center gap-1">
                <IconBtn title="Excel" onClick={exportList}><FileSpreadsheet className="h-4 w-4" /></IconBtn>
                <IconBtn title="PDF" onClick={() => window.print()}><FileText className="h-4 w-4" /></IconBtn>
                <IconBtn title="Chop etish" onClick={() => window.print()}><Printer className="h-4 w-4" /></IconBtn>
                <IconBtn title="Sozlama"><Settings2 className="h-4 w-4" /></IconBtn>
              </div>
            </div>

            <TableWrap>
              <thead>
                <tr className="bg-slate-50/80">
                  <Th className="w-10">
                    <input
                      type="checkbox"
                      checked={allChecked}
                      onChange={(e) => {
                        const next = { ...checked };
                        pageRows.forEach((row) => {
                          next[row.id] = e.target.checked;
                        });
                        setChecked(next);
                      }}
                    />
                  </Th>
                  <Th className="w-12">#</Th>
                  <Th>Xodim</Th>
                  <Th>Lavozim</Th>
                  <Th>Bo'lim</Th>
                  <Th>Status</Th>
                  <Th>Ish staji</Th>
                  <Th>Kontakt</Th>
                  <Th className="w-12">Amallar</Th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((e, idx) => {
                  const isSel = selectedId === e.id;
                  const displayStatus = sickIds.has(e.id) ? "sick" : leaveIds.has(e.id) || e.status === "on_leave" ? "on_leave" : e.status;
                  return (
                    <tr
                      key={e.id}
                      onClick={() => setSelectedId(e.id)}
                      className={cn("cursor-pointer transition", isSel ? "bg-brand-50/60" : "hover:bg-slate-50")}
                    >
                      <Td onClick={(ev) => ev.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={!!checked[e.id]}
                          onChange={(ev) => setChecked((c) => ({ ...c, [e.id]: ev.target.checked }))}
                        />
                      </Td>
                      <Td className="text-slate-400">{(page - 1) * pageSize + idx + 1}</Td>
                      <Td>
                        <div className="flex items-center gap-3">
                          <Avatar name={e.fullName} size="sm" src={e.photoUrl} />
                          <div className="min-w-0">
                            <div className="truncate font-semibold text-slate-800">{e.fullName}</div>
                            <div className="text-[11px] text-slate-400">{e.employeeId}</div>
                          </div>
                        </div>
                      </Td>
                      <Td className="max-w-[140px] truncate">{e.position}</Td>
                      <Td className="max-w-[140px] truncate text-slate-500">
                        {departments.find((d) => d.id === e.departmentId)?.name ?? "—"}
                      </Td>
                      <Td>
                        <EmpStatusBadge status={displayStatus} />
                      </Td>
                      <Td className="whitespace-nowrap text-slate-500">{formatTenure(e.startDate)}</Td>
                      <Td>
                        <div className="space-y-0.5 text-xs">
                          <div className="flex items-center gap-1 text-slate-600">
                            <Phone className="h-3 w-3 text-slate-400" /> {e.phone}
                          </div>
                          <div className="flex max-w-[160px] items-center gap-1 truncate text-slate-400">
                            <Mail className="h-3 w-3" /> {e.email}
                          </div>
                        </div>
                      </Td>
                      <Td className="relative" onClick={(ev) => ev.stopPropagation()}>
                        <button
                          type="button"
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                          onClick={() => setMenuId(menuId === e.id ? null : e.id)}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                        {menuId === e.id && (
                          <div className="absolute right-4 top-10 z-20 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-nav">
                            <MenuItem onClick={() => { nav(`/employees/${e.id}`); setMenuId(null); }}>To'liq profil</MenuItem>
                            <MenuItem onClick={() => { nav(`/leave/employee/${e.id}`); setMenuId(null); }}>Ta'tillar</MenuItem>
                            <MenuItem onClick={() => { nav("/inbox"); setMenuId(null); }}>Xabar yozish</MenuItem>
                          </div>
                        )}
                      </Td>
                    </tr>
                  );
                })}
                {pageRows.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-sm text-slate-500">
                      Mos xodim topilmadi
                    </td>
                  </tr>
                )}
              </tbody>
            </TableWrap>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-sm">
              <div className="flex items-center gap-2 text-slate-500">
                <span>Sahifada:</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-sm"
                >
                  {[5, 10, 20, 50].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="h-8 rounded-lg border border-slate-200 px-2.5 text-xs disabled:opacity-40"
                >
                  Oldingi
                </button>
                {Array.from({ length: Math.min(pageCount, 5) }, (_, i) => {
                  const n = i + 1;
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setPage(n)}
                      className={cn(
                        "h-8 min-w-8 rounded-lg px-2 text-xs font-semibold",
                        page === n ? "bg-brand-600 text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50",
                      )}
                    >
                      {n}
                    </button>
                  );
                })}
                <button
                  type="button"
                  disabled={page >= pageCount}
                  onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                  className="h-8 rounded-lg border border-slate-200 px-2.5 text-xs disabled:opacity-40"
                >
                  Keyingi
                </button>
              </div>
            </div>
          </Card>
        </div>

        <aside className="xl:sticky xl:top-20 xl:self-start">
          {selected ? (
            <EmployeeSidePanel
              emp={selected}
              deptName={selectedDept?.name ?? "—"}
              onOpen={() => nav(`/employees/${selected.id}`)}
              onLeave={() => nav(`/leave/employee/${selected.id}`)}
              onInbox={() => nav("/inbox")}
              onDoc={() => printOfficial("employment_certificate", selected, selectedDept?.name ?? "")}
              onPayroll={() => nav("/payroll")}
              onPerf={() => nav("/performance")}
            />
          ) : (
            <Card className="p-8 text-center text-sm text-slate-400">Xodim tanlang</Card>
          )}
        </aside>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Ishga qabul qilish" wide>
        <HireEmployeeForm onDone={() => setOpen(false)} />
      </Modal>
    </div>
  );
}

function EmployeeSidePanel({
  emp,
  deptName,
  onOpen,
  onLeave,
  onInbox,
  onDoc,
  onPayroll,
  onPerf,
}: {
  emp: Employee;
  deptName: string;
  onOpen: () => void;
  onLeave: () => void;
  onInbox: () => void;
  onDoc: () => void;
  onPayroll: () => void;
  onPerf: () => void;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="bg-gradient-to-br from-brand-50 to-white px-5 pb-4 pt-5 text-center">
        <div className="mx-auto w-fit">
          <Avatar name={emp.fullName} size="lg" src={emp.photoUrl} />
        </div>
        <div className="mt-3 flex justify-center">
          <StatusBadge status={emp.status} />
        </div>
        <h3 className="mt-2 text-base font-bold text-slate-900">{emp.fullName}</h3>
        <p className="text-sm text-slate-500">{emp.position}</p>
        <p className="text-xs text-slate-400">{deptName}</p>
      </div>

      <div className="space-y-2.5 border-t border-slate-100 px-5 py-4 text-sm">
        <InfoRow k="ID" v={emp.employeeId} />
        <InfoRow k="Telefon" v={emp.phone} />
        <InfoRow k="Email" v={emp.email} />
        <InfoRow k="Ishga kirgan" v={formatDate(emp.startDate)} />
        <InfoRow k="Ish staji" v={formatTenure(emp.startDate)} />
        <InfoRow k="Shartnoma" v={employmentLabel[emp.employmentType] ?? emp.employmentType} />
        <InfoRow k="Ish haqi" v={formatMoney(emp.salary)} />
        <InfoRow k="Manzil" v={emp.address} />
      </div>

      <div className="px-5 pb-3">
        <button
          type="button"
          onClick={onOpen}
          className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-brand-600 text-sm font-semibold text-white hover:bg-brand-700"
        >
          To'liq ma'lumot
        </button>
      </div>

      <div className="border-t border-slate-100 px-5 py-4">
        <div className="mb-3 text-sm font-semibold text-slate-800">Tezkor amallar</div>
        <div className="grid grid-cols-2 gap-2">
          <QuickAction icon={<FileText className="h-4 w-4" />} label="Hujjat yaratish" onClick={onDoc} />
          <QuickAction icon={<Palmtree className="h-4 w-4" />} label="Ta'til berish" onClick={onLeave} />
          <QuickAction icon={<ClipboardList className="h-4 w-4" />} label="Ariza ko'rish" onClick={onLeave} />
          <QuickAction icon={<Wallet className="h-4 w-4" />} label="Maosh o'zgartirish" onClick={onPayroll} />
          <QuickAction icon={<BarChart3 className="h-4 w-4" />} label="Baholash" onClick={onPerf} />
          <QuickAction icon={<MessageSquare className="h-4 w-4" />} label="Xabar yuborish" onClick={onInbox} />
        </div>
      </div>
    </Card>
  );
}

function MiniStat({
  title,
  value,
  hint,
  tone,
  icon,
}: {
  title: string;
  value: string;
  hint: string;
  tone: "blue" | "green" | "amber" | "red" | "violet" | "slate";
  icon: ReactNode;
}) {
  const map = {
    blue: "bg-brand-50 text-brand-600",
    green: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-600",
    violet: "bg-violet-50 text-violet-600",
    slate: "bg-slate-100 text-slate-600",
  };
  const hintColor = {
    blue: "text-brand-600",
    green: "text-emerald-600",
    amber: "text-amber-600",
    red: "text-red-600",
    violet: "text-violet-600",
    slate: "text-slate-500",
  };
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card">
      <div className="flex items-start justify-between gap-2">
        <div className="text-xs font-medium text-slate-500">{title}</div>
        <span className={cn("rounded-lg p-1.5", map[tone])}>{icon}</span>
      </div>
      <div className="mt-2 text-xl font-bold tracking-tight text-slate-900">{value}</div>
      <div className={cn("mt-1 text-[11px] font-semibold", hintColor[tone])}>{hint}</div>
    </div>
  );
}

function EmpStatusBadge({ status }: { status: string }) {
  if (status === "sick") return <Badge tone="red">Kasallikda</Badge>;
  if (status === "on_leave") return <Badge tone="amber">Ta'tilda</Badge>;
  return <StatusBadge status={status} />;
}

function InfoRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="shrink-0 text-xs text-slate-400">{k}</span>
      <span className="text-right text-xs font-medium text-slate-700">{v}</span>
    </div>
  );
}

function QuickAction({ icon, label, onClick }: { icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-start gap-2 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5 text-left transition hover:border-brand-200 hover:bg-brand-50"
    >
      <span className="text-brand-600">{icon}</span>
      <span className="text-[11px] font-semibold leading-snug text-slate-700">{label}</span>
    </button>
  );
}

function IconBtn({ children, onClick, title }: { children: ReactNode; onClick?: () => void; title?: string }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
    >
      {children}
    </button>
  );
}

function MenuItem({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50">
      {children}
    </button>
  );
}

function formatTenure(startDate: string) {
  const start = new Date(startDate);
  const now = new Date();
  let months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  if (now.getDate() < start.getDate()) months -= 1;
  if (months < 0) months = 0;
  const y = Math.floor(months / 12);
  const m = months % 12;
  if (y === 0) return `${m} oy`;
  if (m === 0) return `${y} yil`;
  return `${y} yil ${m} oy`;
}

export function EmployeeProfilePage() {
  const { id } = useParams();
  const { employees, leaves, requests, departments, catalog } = useApp();
  const emp = employees.find((e) => e.id === id);
  if (!emp) return <div>Xodim topilmadi</div>;
  const dept = departments.find((d) => d.id === emp.departmentId);
  const docs = catalog.documents.filter((d) => d.employeeId === emp.id);
  const myLeaves = leaves.filter((l) => l.employeeId === emp.id);

  return (
    <div className="space-y-4">
      <Link to="/employees" className="text-sm text-brand-600">← Xodimlar</Link>
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
            <div className="mt-3 flex items-center gap-3 text-sm">
              <span>Profil to'liqligi</span>
              <div className="h-2 w-40 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full bg-brand-600" style={{ width: `${emp.completeness}%` }} />
              </div>
              <b>{emp.completeness}%</b>
            </div>
            {emp.missing.length > 0 && (
              <div className="mt-2 text-xs text-amber-700">Yetishmaydi: {emp.missing.join(", ")}</div>
            )}
          </div>
          <div className="flex flex-col items-end gap-2 text-right text-sm">
            <div>
              <div className="text-slate-400">Ish haqi (maxfiy)</div>
              <div className="font-semibold">{formatMoney(emp.salary)}</div>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => printOfficial("employment_contract", emp, dept?.name ?? "")}>
                Mehnat shartnomasi
              </Button>
              <Button size="sm" variant="outline" onClick={() => printOfficial("hire_order", emp, dept?.name ?? "")}>
                Qabul buyrug'i
              </Button>
              <Button size="sm" variant="outline" onClick={() => printOfficial("employment_certificate", emp, dept?.name ?? "")}>
                Ma'lumotnoma
              </Button>
            </div>
          </div>
        </div>
      </Card>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="grid gap-6 p-5 sm:grid-cols-2">
            <Section title="Shaxsiy">
              <Row k="Tug'ilgan" v={formatDate(emp.dateOfBirth)} />
              <Row k="Jinsi" v={emp.gender} />
              <Row k="Fuqarolik" v={emp.citizenship} />
              <Row k="Passport" v={emp.passport} />
              <Row k="JSHSHIR" v={emp.jshshir} />
              <Row k="Manzil" v={emp.address} />
              <Row k="Telefon" v={emp.phone} />
            </Section>
            <Section title="Mehnat">
              <Row k="Ishga kirgan" v={formatDate(emp.startDate)} />
              <Row k="Shartnoma" v={emp.contractEnd ? formatDate(emp.contractEnd) : "—"} />
              <Row k="Jadval" v={emp.workSchedule} />
              <Row k="Ta'til balansi" v={`${emp.leaveBalance} kun`} />
              <Row k="Kategoriya" v={emp.category === "academic" ? "Akademik" : "Ma'muriy"} />
              <Row k="Ish staji" v={formatTenure(emp.startDate)} />
            </Section>
            <Section title="Ta'lim">
              <Row k="OTM" v={emp.education.university} />
              <Row k="Daraja" v={emp.education.degree} />
              <Row k="Mutaxassislik" v={emp.education.specialty} />
              <Row k="Ilmiy daraja" v={emp.education.academicDegree ?? "—"} />
              <Row k="Tillar" v={emp.languages.join(", ")} />
            </Section>
            <Section title="HR">
              <Row k="So'rovlar" v={String(requests.filter((r) => r.employeeId === emp.id).length)} />
              <Row k="Ta'tillar" v={String(myLeaves.length)} />
              <Row k="Email" v={emp.email} />
              <div className="pt-2">
                <Link to={`/leave/employee/${emp.id}`} className="text-sm font-medium text-brand-600">Ta'til detallari →</Link>
              </div>
            </Section>
          </div>
        </Card>
        <Card>
          <div className="border-b border-slate-100 px-5 py-4 text-sm font-semibold">Elektron papka</div>
          <div className="max-h-[480px] space-y-1 overflow-y-auto p-3">
            {emp.photoUrl && (
              <a href={emp.photoUrl} target="_blank" rel="noreferrer" className="block rounded-xl px-3 py-2 text-sm hover:bg-slate-50">
                <div className="font-medium">Rasm</div>
                <div className="text-[11px] text-brand-600">Yuklangan rasmni ochish</div>
              </a>
            )}
            {emp.cvUrl && (
              <a href={emp.cvUrl} download={emp.cvName} className="block rounded-xl px-3 py-2 text-sm hover:bg-slate-50">
                <div className="font-medium">CV / Resume</div>
                <div className="text-[11px] text-brand-600">{emp.cvName}</div>
              </a>
            )}
            {FOLDERS.map((f) => (
              <div key={f} className="rounded-xl px-3 py-2 text-sm hover:bg-slate-50">
                <div className="font-medium">{f}</div>
                <div className="text-[11px] text-slate-400">
                  {docs.filter((d) => d.folder === f).map((d) => d.name).join(", ") || "Bo'sh"}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
      {myLeaves.length > 0 && (
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold">Ta'til tarixi</h3>
            <Link to={`/leave/employee/${emp.id}`} className="text-sm text-brand-600">Batafsil</Link>
          </div>
          <div className="space-y-2 text-sm">
            {myLeaves.map((l) => (
              <div key={l.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2">
                <span>{l.startDate} → {l.endDate}</span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">{l.days} ish kuni</span>
                  <Button size="sm" variant="outline" onClick={() => printOfficial("leave_order", emp, dept?.name ?? "", l)}>
                    Buyruq
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</h3>
      {children}
    </div>
  );
}
function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-slate-50 py-1.5 text-sm">
      <span className="text-slate-400">{k}</span>
      <span className="text-right font-medium">{v}</span>
    </div>
  );
}

export function OrgPage() {
  const { departments, employees, addDepartment } = useApp();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<Department["type"]>("unit");
  const [parentId, setParentId] = useState("d0");
  const nav = useNavigate();
  const tree = departments.filter((d) => d.id !== "d0");

  return (
    <div>
      <PageTitle
        title="Tashkiliy tuzilma"
        subtitle="Universitet hierarchy · har bir xodim o'z bo'limiga bog'langan"
        action={<Button onClick={() => setOpen(true)}>Bo'lim yaratish</Button>}
      />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {tree.map((d) => {
          const listed = employees.filter((e) => e.departmentId === d.id);
          return (
            <Card key={d.id} className="cursor-pointer p-5 transition hover:border-brand-200" onClick={() => nav(`/org/${d.id}`)}>
              <div className="text-xs uppercase text-slate-400">{typeLabel[d.type]}</div>
              <div className="mt-1 text-lg font-semibold">{d.name}</div>
              <div className="mt-2 text-sm text-slate-500">{d.employeeCount} shtat · {listed.length} profil tizimda</div>
              {d.parentId && (
                <div className="mt-1 text-xs text-slate-400">Yuqori: {departments.find((x) => x.id === d.parentId)?.name}</div>
              )}
              <div className="mt-3 flex -space-x-2">
                {listed.slice(0, 5).map((e) => (
                  <Avatar key={e.id} name={e.fullName} size="sm" src={e.photoUrl} />
                ))}
              </div>
              <div className="mt-3 text-sm font-medium text-brand-700">Xodimlarni ko'rish →</div>
            </Card>
          );
        })}
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="Yangi tashkiliy birlik">
        <div className="grid gap-3">
          <Field label="Nomi">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Masalan: Huquq fakulteti" />
          </Field>
          <Field label="Turi">
            <Select value={type} onChange={(e) => setType(e.target.value as Department["type"])}>
              <option value="rectorate">Rektorat</option>
              <option value="faculty">Fakultet</option>
              <option value="department">Kafedra</option>
              <option value="unit">Bo'lim / unit</option>
            </Select>
          </Field>
          <Field label="Yuqori tuzilma">
            <Select value={parentId} onChange={(e) => setParentId(e.target.value)}>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </Select>
          </Field>
          <Button
            onClick={() => {
              if (!name.trim()) return;
              const id = addDepartment({ name: name.trim(), type, parentId });
              setOpen(false);
              setName("");
              nav(`/org/${id}`);
            }}
          >
            Yaratish
          </Button>
        </div>
      </Modal>
    </div>
  );
}

export function DepartmentPage() {
  const { deptId } = useParams();
  const { departments, employees } = useApp();
  const [hire, setOpen] = useState(false);
  const nav = useNavigate();
  const dept = departments.find((d) => d.id === deptId);
  if (!dept) return <div>Bo'lim topilmadi</div>;
  const members = employees.filter((e) => e.departmentId === dept.id);
  const children = departments.filter((d) => d.parentId === dept.id);

  return (
    <div>
      <Link to="/org" className="text-sm text-brand-600">← Tashkiliy tuzilma</Link>
      <PageTitle
        title={dept.name}
        subtitle={`${typeLabel[dept.type]} · shtat ${dept.employeeCount} · tizimdagi profil ${members.length}`}
        action={<Button onClick={() => setOpen(true)}>Shu bo'limga xodim qo'shish</Button>}
      />
      {children.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {children.map((c) => (
            <button key={c.id} onClick={() => nav(`/org/${c.id}`)} className="rounded-xl bg-white px-3 py-2 text-sm shadow-card">
              {c.name}
            </button>
          ))}
        </div>
      )}
      <Card>
        {members.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            Bu bo'limda hali digital profil yo'q. Ishga qabul qilinganda xodim shu yerda chiqadi.
          </div>
        ) : (
          <TableWrap>
            <thead>
              <tr><Th>Xodim</Th><Th>Lavozim</Th><Th>Status</Th><Th>CV</Th></tr>
            </thead>
            <tbody>
              {members.map((e) => (
                <tr key={e.id} className="cursor-pointer hover:bg-slate-50" onClick={() => nav(`/employees/${e.id}`)}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <Avatar name={e.fullName} size="sm" src={e.photoUrl} />
                      <div>
                        <div className="font-medium">{e.fullName}</div>
                        <div className="text-xs text-slate-400">{e.employeeId}</div>
                      </div>
                    </div>
                  </Td>
                  <Td>{e.position}</Td>
                  <Td><StatusBadge status={e.status} /></Td>
                  <Td>{e.cvName ? <Badge tone="green">{e.cvName}</Badge> : <span className="text-xs text-slate-400">Yo'q</span>}</Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Card>
      <Modal open={hire} onClose={() => setOpen(false)} title={`${dept.name} — ishga qabul`} wide>
        <HireEmployeeForm defaultDepartmentId={dept.id} onDone={() => setOpen(false)} />
      </Modal>
    </div>
  );
}

export function PositionsPage() {
  const { departments, catalog } = useApp();
  return (
    <div>
      <PageTitle title="Lavozimlar va vakant o'rinlar" />
      <Card>
        <TableWrap>
          <thead><tr><Th>Lavozim</Th><Th>Bo'lim</Th><Th>Kategoriya</Th><Th>Vakant</Th></tr></thead>
          <tbody>
            {catalog.positions.map((p) => (
              <tr key={p.id}>
                <Td className="font-medium">{p.title}</Td>
                <Td>{departments.find((d) => d.id === p.departmentId)?.name}</Td>
                <Td>{p.category === "academic" ? "Akademik" : "Ma'muriy"}</Td>
                <Td><Badge tone={p.vacant ? "amber" : "green"}>{p.vacant}</Badge></Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </Card>
    </div>
  );
}

export function OnboardingPage() {
  const { employees, catalog } = useApp();
  const groups = catalog.onboarding.reduce<Record<string, typeof catalog.onboarding>>((acc, i) => {
    (acc[i.employeeId] ??= []).push(i);
    return acc;
  }, {});
  return (
    <div>
      <PageTitle title="Onboarding" subtitle="Day 0 → 90 avtomatik checklist. HR faqat overdue larni ko'radi." />
      <div className="grid gap-4 lg:grid-cols-2">
        {Object.entries(groups).map(([empId, items]) => {
          const emp = employees.find((e) => e.id === empId);
          return (
            <Card key={empId} className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <div className="font-semibold">{emp?.fullName}</div>
                <Badge tone="amber">{items.filter((i) => i.status !== "done").length} ochiq</Badge>
              </div>
              <ol className="space-y-2">
                {items.map((i) => (
                  <li key={i.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
                    <span>Day {i.day}: {i.title}</span>
                    <StatusBadge status={i.status} />
                  </li>
                ))}
              </ol>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export function OffboardingPage() {
  const checklist = [
    "Resignation / termination hujjati",
    "Bo'lim tasdiqi",
    "IT access olib tashlash",
    "Email o'chirish",
    "Aktivlarni qaytarish",
    "Kutubxona clearance",
    "Moliya clearance",
    "HR exit interview",
    "Yakuniy hujjatlar",
    "Arxiv",
  ];
  return (
    <div>
      <PageTitle title="Offboarding" subtitle="HR 10 ta bo'limga yozmaydi — tizim checklist va tasklarni yuboradi." />
      <Card className="p-5">
        <div className="mb-4 text-sm text-slate-500">Namuna: xodim ishdan ketganda avtomatik</div>
        <div className="space-y-2">
          {checklist.map((c, i) => (
            <label key={c} className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
              <input type="checkbox" defaultChecked={i < 2} />
              <span className="text-sm">{c}</span>
            </label>
          ))}
        </div>
      </Card>
    </div>
  );
}
