import type { ReactNode } from "react";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CalendarDays,
  ClipboardCheck,
  Download,
  FilePlus2,
  FileSpreadsheet,
  FileText,
  Plus,
  Sparkles,
  UserPlus,
  Users,
  Briefcase,
  HeartPulse,
  Palmtree,
  UserCheck,
  ArrowUpRight,
  ArrowDownRight,
  Headset,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DEPT_SHARE, HEADCOUNT_SERIES, REMINDERS } from "../data/seed";
import { useApp } from "../store/AppContext";
import { Avatar, Badge, Button, Card, StatusBadge } from "../components/ui";
import { downloadExcel } from "../lib/excel";
import {
  cn,
  formatCompact,
  formatDate,
  leavePhase,
  leaveTypeLabel,
  todayLabel,
} from "../lib/utils";

const SPARK = {
  total: [1180, 1195, 1210, 1225, 1238, 1248],
  work: [1120, 1135, 1148, 1160, 1172, 1180],
  leave: [22, 20, 18, 19, 17, 18],
  sick: [8, 6, 5, 7, 4, 5],
  neu: [18, 22, 25, 28, 30, 32],
};

const CALENDAR_EVENTS = [
  { time: "10:00", title: "HR yig'ilishi", place: "Zoom · HR zal" },
  { time: "14:00", title: "Yangi xodim onboarding", place: "Kadrlar bo'limi" },
  { time: "16:30", title: "Shartnoma muddati review", place: "Rektorat" },
];

export function DashboardPage() {
  const { user, tasks, markTask, employees, leaves, requests, catalog, kpis } = useApp();
  const nav = useNavigate();

  const pendingTasks = tasks.filter((t) => !t.done);
  const pendingLeaves = leaves.filter((l) => l.status === "pending");
  const onLeaveNow = leaves.filter((l) => l.status === "approved" && leavePhase(l) === "active");
  const sickNow = leaves.filter((l) => l.type === "sick" && l.status === "approved" && leavePhase(l) === "active");
  const pendingReqs = requests.filter((r) => r.status === "pending");
  const atWork = Math.max(0, kpis.totalEmployees - kpis.onLeave);
  const importantCount = Math.min(3, pendingTasks.filter((t) => t.priority === "critical" || t.priority === "urgent" || t.priority === "high").length || pendingTasks.length);

  const recentEmployees = useMemo(
    () => [...employees].sort((a, b) => b.startDate.localeCompare(a.startDate)).slice(0, 5),
    [employees],
  );

  const recentApps = useMemo(() => {
    const leaveApps = pendingLeaves.slice(0, 3).map((l) => {
      const emp = employees.find((e) => e.id === l.employeeId);
      return {
        id: l.id,
        title: leaveTypeLabel[l.type] ?? "Ta'til arizasi",
        name: emp?.fullName ?? "—",
        date: l.startDate,
        status: l.status,
        kind: "leave" as const,
      };
    });
    const reqApps = pendingReqs.slice(0, 3).map((r) => ({
      id: r.id,
      title: r.title || r.type,
      name: employees.find((e) => e.id === r.employeeId)?.fullName ?? "—",
      date: r.createdAt?.slice(0, 10) ?? todayLabel(),
      status: r.status,
      kind: "request" as const,
    }));
    return [...leaveApps, ...reqApps].slice(0, 5);
  }, [pendingLeaves, pendingReqs, employees]);

  const docs = catalog.documents.slice(0, 4);

  function exportDashboard() {
    downloadExcel(
      "tizims-uz-dashboard",
      ["Ko'rsatkich", "Qiymat"],
      [
        ["Sana", todayLabel()],
        ["Jami xodimlar", kpis.totalEmployees],
        ["Ishda", atWork],
        ["Ta'tilda", kpis.onLeave],
        ["Yangi (oy)", kpis.newThisMonth],
        ["Kutilayotgan ta'til", pendingLeaves.length],
      ],
    );
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
      <div className="min-w-0 space-y-5">
        {/* Welcome banner */}
        <section className="relative overflow-hidden rounded-[22px] bg-gradient-to-br from-[#1538c7] via-[#1b5ef3] to-[#4f8cff] p-6 text-white shadow-nav sm:p-7">
          <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute bottom-0 right-1/3 h-32 w-32 rounded-full bg-sky-300/25 blur-2xl" />
          <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="max-w-xl">
              <div className="text-xs font-medium text-blue-100/90">{todayLabel()}</div>
              <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-[30px]">
                Xush kelibsiz, {user?.name ?? "HR"}!
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-blue-100/90">
                Bugungi HR paneli — e'tibor kerak bo'lgan holatlar, KPI va tezkor amallar bir joyda.
              </p>
              <p className="mt-3 text-sm italic text-white/80">
                «Kichik tartib — katta natija. Har bir tasdiq — xodim ishonchi.»
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={exportDashboard}
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-sm font-medium text-slate-800 shadow-sm hover:bg-blue-50"
                >
                  <Download className="h-4 w-4" /> Excel
                </button>
                <button
                  type="button"
                  onClick={() => nav("/reports")}
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 text-sm font-medium text-white hover:bg-white/20"
                >
                  Hisobotlar
                </button>
              </div>
            </div>

            <div className="relative flex items-end justify-center gap-3 lg:min-w-[280px]">
              <div className="relative z-10 w-[200px] rounded-2xl bg-white p-4 text-slate-800 shadow-nav">
                <div className="flex items-center gap-2 text-xs font-semibold text-brand-700">
                  <ClipboardCheck className="h-4 w-4" /> Muhim vazifalar
                </div>
                <div className="mt-2 text-3xl font-bold tracking-tight">{importantCount}</div>
                <div className="mt-1 text-xs text-slate-500">Bugun bajarish kerak</div>
                <button
                  type="button"
                  onClick={() => document.getElementById("dash-tasks")?.scrollIntoView({ behavior: "smooth" })}
                  className="mt-3 inline-flex h-9 w-full items-center justify-center rounded-xl bg-brand-600 text-sm font-medium text-white hover:bg-brand-700"
                >
                  Ko'rish
                </button>
              </div>
              <div className="pointer-events-none absolute -right-2 bottom-0 hidden h-40 w-36 sm:block lg:relative lg:right-0">
                <WelcomeIllustration />
              </div>
            </div>
          </div>
        </section>

        {/* KPI row */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <SparkKpi
            title="Jami xodimlar"
            value={formatCompact(kpis.totalEmployees)}
            delta="+2.1%"
            up
            tone="blue"
            icon={<Users className="h-4 w-4" />}
            spark={SPARK.total}
            onClick={() => nav("/employees")}
          />
          <SparkKpi
            title="Ishda"
            value={formatCompact(atWork)}
            delta="+1.4%"
            up
            tone="green"
            icon={<UserCheck className="h-4 w-4" />}
            spark={SPARK.work}
            onClick={() => nav("/attendance")}
          />
          <SparkKpi
            title="Ta'tilda"
            value={String(kpis.onLeave)}
            delta={`${onLeaveNow.length} faol`}
            up={false}
            tone="amber"
            icon={<Palmtree className="h-4 w-4" />}
            spark={SPARK.leave}
            onClick={() => nav("/leave/all")}
          />
          <SparkKpi
            title="Kasallik varaqasi"
            value={String(Math.max(sickNow.length, kpis.attendanceIssues > 0 ? 5 : 0))}
            delta="-2"
            up
            tone="red"
            icon={<HeartPulse className="h-4 w-4" />}
            spark={SPARK.sick}
            onClick={() => nav("/leave/sick")}
          />
          <SparkKpi
            title="Yangi xodimlar"
            value={String(kpis.newThisMonth)}
            delta="+8"
            up
            tone="violet"
            icon={<Briefcase className="h-4 w-4" />}
            spark={SPARK.neu}
            onClick={() => nav("/recruitment")}
          />
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {[
            { icon: UserPlus, t: "Xodim qo'shish", to: "/employees", color: "bg-brand-50 text-brand-600" },
            { icon: FilePlus2, t: "Hujjat yaratish", to: "/documents", color: "bg-violet-50 text-violet-600" },
            { icon: ClipboardCheck, t: "Ariza tasdiqlash", to: "/leave/all", color: "bg-amber-50 text-amber-600" },
            { icon: FileSpreadsheet, t: "Hisobot olish", to: "/reports", color: "bg-emerald-50 text-emerald-600" },
            { icon: Bell, t: "Eslatma yaratish", to: "/automation", color: "bg-sky-50 text-sky-600" },
          ].map((x) => (
            <button
              key={x.t}
              type="button"
              onClick={() => nav(x.to)}
              className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white px-3 py-3 text-left shadow-card transition hover:-translate-y-0.5 hover:border-brand-200"
            >
              <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", x.color)}>
                <x.icon className="h-5 w-5" />
              </span>
              <span className="text-sm font-semibold leading-snug text-slate-800">{x.t}</span>
            </button>
          ))}
        </div>

        {/* Charts */}
        <div className="grid gap-4 lg:grid-cols-[1.45fr_1fr]">
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between gap-3 px-5 py-4">
              <div>
                <h3 className="text-[15px] font-semibold text-slate-900">Xodimlar soni dinamikasi</h3>
                <p className="mt-0.5 text-xs text-slate-500">2026-yil · headcount o'sishi</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => nav("/analytics")}>
                Batafsil
              </Button>
            </div>
            <div className="h-64 px-2 pb-3">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={HEADCOUNT_SERIES}>
                  <defs>
                    <linearGradient id="hcFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1B5EF3" stopOpacity={0.28} />
                      <stop offset="100%" stopColor="#1B5EF3" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} domain={[1160, 1280]} axisLine={false} tickLine={false} width={40} />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 8px 24px rgba(15,23,42,.06)" }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#1B5EF3" strokeWidth={3} fill="url(#hcFill)" dot={{ r: 4, fill: "#1B5EF3", strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="px-5 py-4">
              <h3 className="text-[15px] font-semibold text-slate-900">Xodimlar taqsimoti</h3>
              <p className="mt-0.5 text-xs text-slate-500">Bo'limlar bo'yicha</p>
            </div>
            <div className="flex flex-col items-center gap-2 px-4 pb-5 sm:flex-row">
              <div className="h-44 w-44 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={DEPT_SHARE} dataKey="value" innerRadius={48} outerRadius={72} paddingAngle={3} strokeWidth={0}>
                      {DEPT_SHARE.map((d) => (
                        <Cell key={d.name} fill={d.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full flex-1 space-y-2">
                {DEPT_SHARE.map((d) => (
                  <div key={d.name} className="flex items-center justify-between gap-2 text-xs">
                    <span className="flex min-w-0 items-center gap-2 text-slate-600">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: d.color }} />
                      <span className="truncate">{d.name}</span>
                    </span>
                    <span className="font-semibold text-slate-800">{d.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Tables */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4">
              <h3 className="text-[15px] font-semibold">So'nggi xodimlar</h3>
              <button type="button" className="text-xs font-medium text-brand-600 hover:underline" onClick={() => nav("/employees")}>
                Barchasi
              </button>
            </div>
            <div className="divide-y divide-slate-100">
              {recentEmployees.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => nav(`/employees/${e.id}`)}
                  className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-slate-50"
                >
                  <Avatar name={e.fullName} size="sm" src={e.photoUrl} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-slate-800">{e.fullName}</div>
                    <div className="truncate text-[11px] text-slate-400">{e.position}</div>
                  </div>
                  <div className="hidden text-right text-[11px] text-slate-400 sm:block">{formatDate(e.startDate)}</div>
                  <StatusBadge status={e.status} />
                </button>
              ))}
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4">
              <h3 className="text-[15px] font-semibold">So'nggi arizalar</h3>
              <button type="button" className="text-xs font-medium text-brand-600 hover:underline" onClick={() => nav("/leave/all")}>
                Barchasi
              </button>
            </div>
            <div className="divide-y divide-slate-100">
              {recentApps.length === 0 && (
                <div className="px-5 py-8 text-center text-sm text-slate-500">Hozircha ochiq ariza yo'q.</div>
              )}
              {recentApps.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => nav(a.kind === "leave" ? "/leave/all" : "/requests")}
                  className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-slate-50"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                    <FileText className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-slate-800">{a.title}</div>
                    <div className="truncate text-[11px] text-slate-400">{a.name}</div>
                  </div>
                  <div className="hidden text-[11px] text-slate-400 sm:block">{formatDate(a.date)}</div>
                  <StatusBadge status={a.status} />
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Right widgets */}
      <aside className="space-y-4 xl:sticky xl:top-4 xl:self-start">
        <Card className="overflow-hidden p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <CalendarDays className="h-4 w-4 text-brand-600" /> Kalendar
              </div>
              <div className="mt-1 text-xs text-slate-500">{todayLabel()}</div>
            </div>
            <button
              type="button"
              onClick={() => nav("/calendar")}
              className="inline-flex h-8 items-center gap-1 rounded-lg bg-brand-50 px-2.5 text-xs font-semibold text-brand-700 hover:bg-brand-100"
            >
              <Plus className="h-3.5 w-3.5" /> Yangi
            </button>
          </div>
          <div className="mt-4 space-y-3">
            {CALENDAR_EVENTS.map((ev) => (
              <div key={ev.time + ev.title} className="flex gap-3">
                <div className="w-11 shrink-0 text-xs font-semibold text-brand-700">{ev.time}</div>
                <div className="min-w-0 flex-1 border-l-2 border-brand-200 pl-3">
                  <div className="text-sm font-medium text-slate-800">{ev.title}</div>
                  <div className="text-[11px] text-slate-400">{ev.place}</div>
                </div>
              </div>
            ))}
            {REMINDERS.slice(0, 2).map((r) => (
              <div key={r.title} className="flex gap-3">
                <div className="w-11 shrink-0 text-[10px] font-medium text-slate-400">—</div>
                <div className="min-w-0 flex-1 border-l-2 border-slate-200 pl-3">
                  <div className="text-sm font-medium text-slate-700">{r.title}</div>
                  <div className="text-[11px] text-slate-400">{r.date}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card id="dash-tasks" className="overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <h3 className="text-sm font-semibold">Vazifalarim</h3>
            <Badge tone="red">{pendingTasks.length} ochiq</Badge>
          </div>
          <div className="max-h-64 divide-y divide-slate-100 overflow-y-auto">
            {tasks.slice(0, 6).map((t) => (
              <label key={t.id} className="flex cursor-pointer items-start gap-2.5 px-4 py-2.5 hover:bg-slate-50">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={t.done}
                  onChange={(e) => markTask(t.id, e.target.checked)}
                />
                <div className="min-w-0 flex-1">
                  <div className={cn("text-sm leading-snug", t.done && "text-slate-400 line-through")}>{t.title}</div>
                  <div className="mt-0.5 text-[11px] text-slate-400">{t.category}</div>
                </div>
                <Badge tone={t.dueLabel === "Bugun" ? "red" : t.priority === "high" || t.priority === "urgent" ? "amber" : "slate"}>
                  {t.dueLabel}
                </Badge>
              </label>
            ))}
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <h3 className="text-sm font-semibold">So'nggi hujjatlar</h3>
            <button type="button" className="text-xs font-medium text-brand-600" onClick={() => nav("/documents")}>
              Barchasi
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {docs.map((d) => (
              <div key={d.id} className="flex items-center gap-3 px-4 py-2.5">
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[10px] font-bold",
                    d.type === "PDF" && "bg-red-50 text-red-600",
                    d.type === "DOCX" && "bg-brand-50 text-brand-700",
                    d.type === "JPG" && "bg-amber-50 text-amber-700",
                    !["PDF", "DOCX", "JPG"].includes(d.type) && "bg-emerald-50 text-emerald-700",
                  )}
                >
                  {d.type}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-slate-800">{d.name}</div>
                  <div className="text-[11px] text-slate-400">{formatDate(d.date)}</div>
                </div>
                <button type="button" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-600" title="Yuklab olish">
                  <Download className="h-4 w-4" />
                </button>
              </div>
            ))}
            {docs.length === 0 && <div className="px-4 py-6 text-center text-xs text-slate-400">Hujjatlar yo'q</div>}
          </div>
        </Card>

        <button
          type="button"
          onClick={() => nav("/ai")}
          className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-fuchsia-600 to-brand-600 p-4 text-left text-white shadow-nav transition hover:brightness-105"
        >
          <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/15 blur-xl" />
          <div className="relative flex items-start gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <div className="text-sm font-semibold">AI yordamchi</div>
              <div className="mt-0.5 text-xs text-white/80">Savol bering, hisobot draft yoki risk tahlili oling</div>
              <div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold">
                Ochish <ArrowUpRight className="h-3.5 w-3.5" />
              </div>
            </div>
          </div>
        </button>

        <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-4 text-center">
          <Headset className="mx-auto h-6 w-6 text-brand-600" />
          <div className="mt-2 text-sm font-semibold text-slate-800">Yordam markazi</div>
          <div className="mt-0.5 text-xs text-slate-500">SLA, FAQ va qo'llab-quvvatlash</div>
          <button
            type="button"
            onClick={() => nav("/ai")}
            className="mt-3 inline-flex h-8 items-center rounded-lg bg-brand-600 px-3 text-xs font-semibold text-white hover:bg-brand-700"
          >
            Bog'lanish
          </button>
        </div>
      </aside>
    </div>
  );
}

function SparkKpi({
  title,
  value,
  delta,
  up,
  tone,
  icon,
  spark,
  onClick,
}: {
  title: string;
  value: string;
  delta: string;
  up: boolean;
  tone: "blue" | "green" | "amber" | "red" | "violet";
  icon: ReactNode;
  spark: number[];
  onClick: () => void;
}) {
  const tones = {
    blue: { icon: "bg-brand-50 text-brand-600", stroke: "#1B5EF3", fill: "#1B5EF3" },
    green: { icon: "bg-emerald-50 text-emerald-600", stroke: "#10b981", fill: "#10b981" },
    amber: { icon: "bg-amber-50 text-amber-600", stroke: "#f59e0b", fill: "#f59e0b" },
    red: { icon: "bg-red-50 text-red-600", stroke: "#ef4444", fill: "#ef4444" },
    violet: { icon: "bg-violet-50 text-violet-600", stroke: "#8b5cf6", fill: "#8b5cf6" },
  }[tone];
  const data = spark.map((v, i) => ({ i, v }));

  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-2xl border border-slate-200/80 bg-white p-4 text-left shadow-card transition hover:-translate-y-0.5 hover:border-brand-200"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="text-xs font-medium text-slate-500">{title}</div>
        <span className={cn("rounded-lg p-1.5", tones.icon)}>{icon}</span>
      </div>
      <div className="mt-2 flex items-end justify-between gap-2">
        <div>
          <div className="text-2xl font-bold tracking-tight text-slate-900">{value}</div>
          <div className={cn("mt-1 inline-flex items-center gap-0.5 text-[11px] font-semibold", up ? "text-emerald-600" : "text-slate-500")}>
            {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {delta}
          </div>
        </div>
        <div className="h-10 w-[72px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <Line type="monotone" dataKey="v" stroke={tones.stroke} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </button>
  );
}

function WelcomeIllustration() {
  return (
    <div className="relative h-40 w-36">
      <div className="absolute bottom-0 left-1/2 h-28 w-28 -translate-x-1/2 rounded-full bg-white/15" />
      <div className="absolute bottom-6 left-1/2 flex h-32 w-28 -translate-x-1/2 flex-col items-center">
        <div className="h-12 w-12 rounded-full bg-[#f8d7c0] shadow-sm ring-4 ring-white/20" />
        <div className="mt-1 h-16 w-20 rounded-t-[28px] bg-white/95 shadow-sm" />
        <div className="absolute bottom-14 right-0 flex h-10 w-10 items-center justify-center rounded-full bg-amber-300 text-amber-900 shadow">
          <Sparkles className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}
