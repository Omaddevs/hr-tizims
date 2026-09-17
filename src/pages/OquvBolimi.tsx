import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BookOpen,
  Building2,
  ChevronDown,
  ClipboardList,
  Download,
  FileBarChart,
  Filter,
  GraduationCap,
  MoreHorizontal,
  Network,
  Phone,
  Plus,
  Search,
  Upload,
  UserPlus,
  Users,
  Clock,
  Award,
  Newspaper,
} from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { useApp } from "../store/AppContext";
import { Avatar, Badge, Card, Modal, Select, TableWrap, Td, Th } from "../components/ui";
import { HireEmployeeForm } from "../components/HireEmployeeForm";
import { downloadExcel } from "../lib/excel";
import { cn } from "../lib/utils";
import type { Employee } from "../types";

type TeachTab = "all" | "professor" | "dotsent" | "senior" | "teacher" | "hourly";

const SUBJECTS: Record<string, string> = {
  "e-t1": "Makroiqtisodiyot, Mikro",
  "e-t2": "Agrobiznes asoslari",
  "e-t3": "O'simlikshunoslik",
  "e-t4": "Ingliz tili (B2)",
  "e-t5": "Dasturlash asoslari",
  "e-t6": "Academic Writing",
  "e-t7": "Iqtisodiyot nazariyasi",
  "e-t8": "Agrotexnika",
  e2: "Mikro iqtisodiyot",
  e7: "Ingliz tili amaliyoti",
};

const DEMO = {
  all: 482,
  professor: 68,
  dotsent: 124,
  senior: 186,
  teacher: 94,
  hourly: 40,
};

const NEWS = [
  { title: "Bahorgi semestr jadvali e'lon qilindi", time: "2 soat oldin", tone: "blue" as const },
  { title: "3 ta yangi dotsent ishga qabul qilindi", time: "Kecha", tone: "green" as const },
  { title: "Professorlik unvoni bo'yicha tanlov ochildi", time: "2 kun oldin", tone: "violet" as const },
  { title: "Soatbay yuklama yangilandi", time: "3 kun oldin", tone: "amber" as const },
];

function teachRank(e: Employee): TeachTab {
  const p = e.position.toLowerCase();
  if (e.employmentType === "hourly" || p.includes("soatbay")) return "hourly";
  if (p.includes("professor")) return "professor";
  if (p.includes("dotsent")) return "dotsent";
  if (p.includes("katta")) return "senior";
  if (p.includes("o'qituvchi") || p.includes("oqituvchi")) return "teacher";
  return "teacher";
}

function isTeacher(e: Employee) {
  if (e.category !== "academic") return false;
  const p = e.position.toLowerCase();
  if (/^rektor$|prorektor|birinchi prorektor|^dekan$/.test(p)) return false;
  return (
    /professor|dotsent|o'qituvchi|oqituvchi|soatbay|kafedra mudiri/.test(p) ||
    e.employmentType === "hourly"
  );
}

function statusLabel(status: string) {
  if (status === "active") return { text: "Faol", tone: "green" as const };
  if (status === "on_leave") return { text: "Ta'tilda", tone: "amber" as const };
  if (status === "probation") return { text: "Sinov", tone: "violet" as const };
  return { text: status, tone: "slate" as const };
}

function subjectsOf(e: Employee) {
  return SUBJECTS[e.id] ?? e.education.specialty ?? "—";
}

export function OquvBolimiPage() {
  const { employees, departments } = useApp();
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<TeachTab>("all");
  const [faculty, setFaculty] = useState("all");
  const [kafedra, setKafedra] = useState("all");
  const [position, setPosition] = useState("all");
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const [menuId, setMenuId] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [hireOpen, setHireOpen] = useState(false);

  const teachers = useMemo(() => employees.filter(isTeacher), [employees]);

  const faculties = useMemo(
    () => departments.filter((d) => d.type === "faculty" && d.id !== "d0"),
    [departments],
  );
  const kafedras = useMemo(() => {
    const rows = departments.filter((d) => d.type === "department");
    if (faculty === "all") return rows;
    return rows.filter((d) => d.parentId === faculty);
  }, [departments, faculty]);

  const positions = useMemo(() => [...new Set(teachers.map((e) => e.position))].sort(), [teachers]);

  const list = useMemo(() => {
    return teachers.filter((e) => {
      const dept = departments.find((d) => d.id === e.departmentId);
      const hit = `${e.fullName} ${e.employeeId} ${e.phone} ${e.position} ${subjectsOf(e)}`
        .toLowerCase()
        .includes(q.toLowerCase());
      if (!hit) return false;
      if (tab !== "all" && teachRank(e) !== tab) return false;
      if (position !== "all" && e.position !== position) return false;
      if (kafedra !== "all" && e.departmentId !== kafedra) return false;
      if (faculty !== "all") {
        const ok = e.departmentId === faculty || dept?.parentId === faculty;
        if (!ok) return false;
      }
      return true;
    });
  }, [teachers, departments, q, tab, position, kafedra, faculty]);

  const pageCount = Math.max(1, Math.ceil(Math.max(list.length, DEMO.all) / pageSize));
  const pageRows = list.slice((page - 1) * pageSize, page * pageSize);
  const allChecked = pageRows.length > 0 && pageRows.every((e) => checked[e.id]);
  const from = list.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, list.length);

  useEffect(() => {
    setPage(1);
  }, [q, tab, position, kafedra, faculty]);

  useEffect(() => {
    setKafedra("all");
  }, [faculty]);

  const chartData = [
    { name: "Professorlar", value: 14, color: "#2563eb", count: DEMO.professor },
    { name: "Dotsentlar", value: 26, color: "#7c3aed", count: DEMO.dotsent },
    { name: "Katta o'qituvchi", value: 39, color: "#0d9488", count: DEMO.senior },
    { name: "O'qituvchilar", value: 13, color: "#f59e0b", count: DEMO.teacher },
    { name: "Soatbay", value: 8, color: "#94a3b8", count: DEMO.hourly },
  ];

  const tabs: { id: TeachTab; label: string; count: number; icon: ReactNode }[] = [
    { id: "all", label: "Barcha o'qituvchilar", count: DEMO.all, icon: <Users className="h-3.5 w-3.5" /> },
    { id: "professor", label: "Professorlar", count: DEMO.professor, icon: <Award className="h-3.5 w-3.5" /> },
    { id: "dotsent", label: "Dotsentlar", count: DEMO.dotsent, icon: <GraduationCap className="h-3.5 w-3.5" /> },
    { id: "senior", label: "Katta o'qituvchilar", count: DEMO.senior, icon: <BookOpen className="h-3.5 w-3.5" /> },
    { id: "teacher", label: "O'qituvchilar", count: DEMO.teacher, icon: <Users className="h-3.5 w-3.5" /> },
    { id: "hourly", label: "Soatbay", count: DEMO.hourly, icon: <Clock className="h-3.5 w-3.5" /> },
  ];

  const stats = [
    { title: "Jami o'qituvchilar", value: DEMO.all, delta: "+12", spark: [40, 42, 45, 48, 50, 52, 55], tone: "blue" as const },
    { title: "Professorlar", value: DEMO.professor, delta: "+5", spark: [20, 22, 24, 26, 28, 30, 32], tone: "violet" as const },
    { title: "Dotsentlar", value: DEMO.dotsent, delta: "+8", spark: [30, 32, 35, 38, 40, 42, 45], tone: "teal" as const },
    { title: "Katta o'qituvchilar", value: DEMO.senior, delta: "-3", spark: [50, 52, 51, 49, 48, 47, 46], tone: "amber" as const },
    { title: "O'qituvchilar", value: DEMO.teacher, delta: "+4", spark: [18, 20, 22, 24, 25, 27, 28], tone: "green" as const },
    { title: "Soatbay o'qituvchilar", value: DEMO.hourly, delta: "0", spark: [12, 12, 13, 12, 12, 12, 12], tone: "slate" as const },
  ];

  function exportList() {
    downloadExcel(
      "tizims-uz-oquv-bolimi",
      ["#", "ID", "F.I.Sh.", "Lavozim", "Kafedra", "Fan(lar)", "Telefon", "Status"],
      list.map((e, i) => [
        i + 1,
        e.employeeId,
        e.fullName,
        e.position,
        departments.find((d) => d.id === e.departmentId)?.name ?? "",
        subjectsOf(e),
        e.phone,
        statusLabel(e.status).text,
      ]),
    );
    setExportOpen(false);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xs text-slate-400">
            <Link to="/" className="hover:text-brand-600">
              Bosh sahifa
            </Link>
            <span className="mx-1.5">›</span>
            <Link to="/employees" className="hover:text-brand-600">
              Xodimlar
            </Link>
            <span className="mx-1.5">›</span>
            <span className="text-slate-600">O'quv bo'limi</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">O'quv bo'limi</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => nav("/reports")}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <FileBarChart className="h-4 w-4 text-slate-500" />
            Hisobot olish
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => setExportOpen((v) => !v)}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Download className="h-4 w-4 text-slate-500" />
              Eksport
              <ChevronDown className="h-4 w-4 opacity-70" />
            </button>
            {exportOpen && (
              <div className="absolute right-0 top-12 z-20 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-nav">
                <MenuItem onClick={exportList}>Excel (.xlsx)</MenuItem>
                <MenuItem
                  onClick={() => {
                    window.print();
                    setExportOpen(false);
                  }}
                >
                  PDF / Chop etish
                </MenuItem>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setHireOpen(true)}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" />
            Yangi o'qituvchi
          </button>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#1e3a8a] via-[#1d4ed8] to-[#3b82f6] shadow-card">
        <div
          className="pointer-events-none absolute inset-0 opacity-35"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1400&q=60)",
            backgroundSize: "cover",
            backgroundPosition: "center right",
          }}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#1e3a8a]/95 via-[#1d4ed8]/80 to-transparent" />
        <div className="relative flex min-h-[132px] items-center px-6 py-7 sm:px-8">
          <div className="max-w-xl text-white">
            <h2 className="text-2xl font-bold tracking-tight sm:text-[26px]">Sifatli ta'lim – kuchli kelajak!</h2>
            <p className="mt-2 text-sm text-blue-100">O'qituvchilar, kafedralar va o'quv yuklamasi — bitta joyda.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((s) => (
          <StatCard key={s.title} {...s} />
        ))}
      </div>

      <div className="flex gap-1 overflow-x-auto rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-card">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium transition",
              tab === t.id ? "bg-brand-50 text-brand-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800",
            )}
          >
            {t.icon}
            {t.label}
            <span
              className={cn(
                "rounded-md px-1.5 py-0.5 text-[10px] font-semibold",
                tab === t.id ? "bg-white text-brand-700" : "bg-slate-100 text-slate-500",
              )}
            >
              {t.count}
            </span>
          </button>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-4">
          <Card className="p-3 sm:p-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[220px] flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="O'qituvchi qidirish (F.I.Sh, telefon, fan...)"
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none ring-brand-500/20 focus:border-brand-500 focus:ring-4"
                />
              </div>
              <Select value={faculty} onChange={(e) => setFaculty(e.target.value)} className="h-10 w-full sm:w-44">
                <option value="all">Barcha fakultetlar</option>
                {faculties.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </Select>
              <Select value={kafedra} onChange={(e) => setKafedra(e.target.value)} className="h-10 w-full sm:w-44">
                <option value="all">Barcha kafedralar</option>
                {kafedras.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </Select>
              <Select value={position} onChange={(e) => setPosition(e.target.value)} className="h-10 w-full sm:w-44">
                <option value="all">Barcha lavozimlar</option>
                {positions.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
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
                  <Th>F.I.Sh.</Th>
                  <Th>Lavozim</Th>
                  <Th>Kafedra</Th>
                  <Th>Fan(lar)</Th>
                  <Th>Telefon</Th>
                  <Th>Status</Th>
                  <Th className="w-12">Amallar</Th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((e, idx) => {
                  const st = statusLabel(e.status);
                  const kaf = departments.find((d) => d.id === e.departmentId)?.name ?? "—";
                  return (
                    <tr key={e.id} className="transition hover:bg-slate-50">
                      <Td>
                        <input
                          type="checkbox"
                          checked={!!checked[e.id]}
                          onChange={(ev) => setChecked((c) => ({ ...c, [e.id]: ev.target.checked }))}
                        />
                      </Td>
                      <Td className="text-slate-400">{(page - 1) * pageSize + idx + 1}</Td>
                      <Td>
                        <button
                          type="button"
                          onClick={() => nav(`/employees/${e.id}`)}
                          className="flex items-center gap-3 text-left"
                        >
                          <Avatar name={e.fullName} size="sm" src={e.photoUrl} />
                          <span className="min-w-0">
                            <span className="block truncate font-semibold text-slate-800 hover:text-brand-700">
                              {e.fullName}
                            </span>
                            <span className="text-[11px] text-slate-400">{e.employeeId}</span>
                          </span>
                        </button>
                      </Td>
                      <Td className="text-slate-600">{e.position}</Td>
                      <Td className="max-w-[140px] truncate text-slate-500">{kaf}</Td>
                      <Td className="max-w-[150px] truncate text-slate-500">{subjectsOf(e)}</Td>
                      <Td>
                        <div className="flex items-center gap-1.5 text-xs text-slate-600">
                          <Phone className="h-3 w-3 text-slate-400" />
                          {e.phone}
                        </div>
                      </Td>
                      <Td>
                        <Badge tone={st.tone}>{st.text}</Badge>
                      </Td>
                      <Td className="relative">
                        <button
                          type="button"
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                          onClick={() => setMenuId(menuId === e.id ? null : e.id)}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                        {menuId === e.id && (
                          <div className="absolute right-4 top-10 z-20 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-nav">
                            <MenuItem
                              onClick={() => {
                                nav(`/employees/${e.id}`);
                                setMenuId(null);
                              }}
                            >
                              To'liq profil
                            </MenuItem>
                            <MenuItem
                              onClick={() => {
                                nav("/inbox");
                                setMenuId(null);
                              }}
                            >
                              Xabar yozish
                            </MenuItem>
                            <MenuItem
                              onClick={() => {
                                nav("/leave/employee/" + e.id);
                                setMenuId(null);
                              }}
                            >
                              Ta'tillar
                            </MenuItem>
                          </div>
                        )}
                      </Td>
                    </tr>
                  );
                })}
                {pageRows.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-sm text-slate-500">
                      Mos o'qituvchi topilmadi
                    </td>
                  </tr>
                )}
              </tbody>
            </TableWrap>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-sm">
              <div className="text-slate-500">
                {from}–{to} dan {DEMO.all} ta o'qituvchi
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
                {[1, 2, 3].map((n) => (
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
                ))}
                <span className="px-1 text-slate-400">…</span>
                <button
                  type="button"
                  onClick={() => setPage(Math.min(pageCount, 49))}
                  className="h-8 min-w-8 rounded-lg border border-slate-200 px-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  49
                </button>
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

        <aside className="space-y-4 xl:sticky xl:top-20 xl:self-start">
          <Card className="overflow-hidden">
            <div className="border-b border-slate-100 px-4 py-3">
              <h3 className="text-sm font-semibold text-slate-900">Tezkor amallar</h3>
            </div>
            <div className="space-y-1 p-2">
              <QuickRow icon={<UserPlus className="h-4 w-4" />} label="Yangi o'qituvchi qo'shish" onClick={() => setHireOpen(true)} />
              <QuickRow icon={<Upload className="h-4 w-4" />} label="Excel'dan import" onClick={exportList} />
              <QuickRow icon={<ClipboardList className="h-4 w-4" />} label="Yuklama taqsimlash" onClick={() => nav("/training")} />
              <QuickRow icon={<Network className="h-4 w-4" />} label="Kafedralarni boshqarish" onClick={() => nav("/org")} />
              <QuickRow icon={<Download className="h-4 w-4" />} label="Ro'yxatni yuklab olish" onClick={exportList} />
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="border-b border-slate-100 px-4 py-3">
              <h3 className="text-sm font-semibold text-slate-900">O'qituvchilar bo'yicha taqsimot</h3>
              <p className="mt-0.5 text-xs text-slate-400">Jami {DEMO.all} ta</p>
            </div>
            <div className="flex flex-col items-center gap-3 px-4 py-4">
              <div className="relative h-40 w-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartData} dataKey="value" innerRadius={48} outerRadius={70} paddingAngle={2} strokeWidth={0}>
                      {chartData.map((d) => (
                        <Cell key={d.name} fill={d.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-lg font-bold text-slate-900">{DEMO.all}</div>
                  <div className="text-[10px] text-slate-400">jami</div>
                </div>
              </div>
              <div className="w-full space-y-2">
                {chartData.map((d) => (
                  <div key={d.name} className="flex items-center justify-between gap-2 text-xs">
                    <span className="flex min-w-0 items-center gap-2 text-slate-600">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: d.color }} />
                      <span className="truncate">{d.name}</span>
                    </span>
                    <span className="font-semibold text-slate-800">{d.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
              <Newspaper className="h-4 w-4 text-brand-600" />
              <h3 className="text-sm font-semibold text-slate-900">So'nggi yangiliklar</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {NEWS.map((n) => (
                <div key={n.title} className="flex gap-3 px-4 py-3">
                  <span
                    className={cn(
                      "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl",
                      n.tone === "blue" && "bg-brand-50 text-brand-600",
                      n.tone === "green" && "bg-emerald-50 text-emerald-600",
                      n.tone === "violet" && "bg-violet-50 text-violet-600",
                      n.tone === "amber" && "bg-amber-50 text-amber-600",
                    )}
                  >
                    <Building2 className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-medium leading-snug text-slate-800">{n.title}</div>
                    <div className="mt-0.5 text-[11px] text-slate-400">{n.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </aside>
      </div>

      <Modal open={hireOpen} onClose={() => setHireOpen(false)} title="Yangi o'qituvchi qo'shish" wide>
        <HireEmployeeForm onDone={() => setHireOpen(false)} />
      </Modal>
    </div>
  );
}

function StatCard({
  title,
  value,
  delta,
  spark,
  tone,
}: {
  title: string;
  value: number;
  delta: string;
  spark: number[];
  tone: "blue" | "violet" | "teal" | "amber" | "green" | "slate";
}) {
  const map = {
    blue: { icon: "bg-brand-50 text-brand-600", delta: "text-brand-600", stroke: "#2563eb" },
    violet: { icon: "bg-violet-50 text-violet-600", delta: "text-violet-600", stroke: "#7c3aed" },
    teal: { icon: "bg-teal-50 text-teal-600", delta: "text-teal-600", stroke: "#0d9488" },
    amber: { icon: "bg-amber-50 text-amber-600", delta: "text-amber-600", stroke: "#f59e0b" },
    green: { icon: "bg-emerald-50 text-emerald-600", delta: "text-emerald-600", stroke: "#10b981" },
    slate: { icon: "bg-slate-100 text-slate-600", delta: "text-slate-500", stroke: "#64748b" },
  };
  const down = delta.startsWith("-");
  const max = Math.max(...spark);
  const min = Math.min(...spark);
  const pts = spark
    .map((v, i) => {
      const x = (i / (spark.length - 1)) * 64;
      const y = 24 - ((v - min) / (max - min || 1)) * 18;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card">
      <div className="text-[11px] font-medium leading-snug text-slate-500">{title}</div>
      <div className="mt-2 flex items-end justify-between gap-2">
        <div>
          <div className="text-xl font-bold tracking-tight text-slate-900">{value}</div>
          <div className={cn("mt-0.5 text-[11px] font-semibold", down ? "text-red-500" : map[tone].delta)}>
            {delta}
          </div>
        </div>
        <svg width="64" height="28" viewBox="0 0 64 28" className="shrink-0 opacity-90">
          <polyline fill="none" stroke={map[tone].stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={pts} />
        </svg>
      </div>
    </div>
  );
}

function QuickRow({ icon, label, onClick }: { icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-slate-700 transition hover:bg-brand-50 hover:text-brand-700"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">{icon}</span>
      <span className="font-medium">{label}</span>
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
