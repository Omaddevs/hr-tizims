import type { ReactNode } from "react";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  Bell,
  BriefcaseMedical,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  FileSpreadsheet,
  FileText,
  MapPin,
  Plus,
  Sparkles,
  UserPlus,
  Users,
  UserCheck,
  ArrowUp,
  ArrowUpRight,
  ArrowLeftRight,
  Headset,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DEPT_SHARE, HEADCOUNT_SERIES } from "../data/seed";
import { useApp } from "../store/AppContext";
import { Avatar, Button, Card, StatusBadge } from "../components/ui";
import {
  cn,
  formatCompact,
  formatDate,
  leavePhase,
  leaveTypeLabel,
  todayLabel,
} from "../lib/utils";

const SPARK = {
  total: [1180, 1192, 1205, 1218, 1228, 1235, 1248],
  work: [1080, 1110, 1095, 1135, 1120, 1145, 1120],
  leave: [38, 52, 44, 58, 41, 55, 48],
  sick: [22, 14, 19, 11, 17, 12, 15],
  neu: [8, 10, 12, 14, 16, 18, 20],
};

const CALENDAR_EVENTS = [
  { time: "10:00", title: "HR yig'ilishi", place: "Asosiy bino, 301-xona", pin: "blue" as const },
  { time: "12:30", title: "Yangi xodim bilan suhbat", place: "HR xonasi", pin: "green" as const },
  { time: "15:00", title: "Oylik hisobot tayyorlash", place: "HR Departamenti", pin: "amber" as const },
];

const PIN_COLOR = {
  blue: "text-[#2B6BFF]",
  green: "text-[#22C55E]",
  amber: "text-[#F59E0B]",
};

function calendarDateLabel(date = new Date()) {
  const months = [
    "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
    "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr",
  ];
  return `${date.getDate()} ${months[date.getMonth()]}, ${date.getFullYear()}`;
}

function docRelativeLabel(_iso: string, index: number) {
  const times = ["10:24", "09:15", "18:30", "16:45"];
  const day = index < 2 ? "Bugun" : "Kecha";
  return `${day}, ${times[index] ?? "12:00"}`;
}

function DocTypeIcon({ type }: { type: string }) {
  if (type === "PDF") {
    return (
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FEE2E2] text-[#EF4444]">
        <FileText className="h-5 w-5" strokeWidth={2.2} />
      </span>
    );
  }
  if (type === "DOCX") {
    return (
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#DBEAFE] text-[#2563EB]">
        <FileText className="h-5 w-5" strokeWidth={2.2} />
      </span>
    );
  }
  if (type === "XLSX" || type === "XLS") {
    return (
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#DCFCE7] text-[#16A34A]">
        <FileSpreadsheet className="h-5 w-5" strokeWidth={2.2} />
      </span>
    );
  }
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
      <FileText className="h-5 w-5" strokeWidth={2.2} />
    </span>
  );
}

export function DashboardPage() {
  const { user, tasks, markTask, employees, leaves, requests, catalog, kpis } = useApp();
  const nav = useNavigate();
  const displayName = user?.name?.split(" ")[0] ?? "HR Admin";
  const welcomeDate = useMemo(() => {
    const now = new Date();
    const days = ["Yakshanba", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];
    const months = [
      "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
      "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr",
    ];
    return `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
  }, []);

  const pendingTasks = tasks.filter((t) => !t.done);
  const pendingLeaves = leaves.filter((l) => l.status === "pending");
  const onLeaveNow = leaves.filter((l) => l.status === "approved" && leavePhase(l) === "active");
  const sickNow = leaves.filter((l) => l.type === "sick" && l.status === "approved" && leavePhase(l) === "active");
  const pendingReqs = requests.filter((r) => r.status === "pending");
  const sickCount = Math.max(sickNow.length, kpis.attendanceIssues > 0 ? 5 : 0);
  const atWork = Math.max(0, kpis.totalEmployees - kpis.onLeave - sickCount);
  const importantCount = Math.min(3, pendingTasks.filter((t) => t.priority === "critical" || t.priority === "urgent" || t.priority === "high").length || pendingTasks.length);
  const total = Math.max(1, kpis.totalEmployees);
  const activePct = ((atWork / total) * 100).toFixed(1);
  const leavePct = ((kpis.onLeave / total) * 100).toFixed(1);
  const sickPct = ((sickCount / total) * 100).toFixed(1);

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

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
      <div className="min-w-0 space-y-5">
        {/* Welcome banner */}
        <section className="relative isolate overflow-hidden rounded-[28px] bg-[linear-gradient(105deg,#5BA3FF_0%,#3B82F6_42%,#2563EB_100%)] shadow-[0_14px_36px_rgba(37,99,235,0.28)]">
          {/* Soft waves */}
          <div className="pointer-events-none absolute inset-0 opacity-40">
            <svg className="absolute bottom-0 left-0 h-[70%] w-full" viewBox="0 0 1200 320" preserveAspectRatio="none" aria-hidden>
              <path fill="rgba(255,255,255,0.14)" d="M0,220 C180,160 320,280 520,210 C720,140 860,250 1200,180 L1200,320 L0,320 Z" />
              <path fill="rgba(255,255,255,0.10)" d="M0,250 C220,190 400,300 620,230 C840,160 980,270 1200,210 L1200,320 L0,320 Z" />
            </svg>
          </div>
          <div className="pointer-events-none absolute -right-8 top-6 h-28 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute right-24 bottom-4 h-16 w-48 rounded-full bg-white/10 blur-xl" />

          <div className="relative grid min-h-[220px] grid-cols-1 items-stretch gap-4 pl-5 pr-5 pt-5 pb-5 sm:min-h-[248px] sm:pl-7 sm:pr-7 sm:pt-6 sm:pb-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.9fr)] lg:pr-[200px]">
            {/* Left: greeting */}
            <div className="relative z-10 flex min-w-0 flex-col justify-between gap-5 pr-2 lg:pr-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-[#1E3A8A]/35 px-3 py-1.5 text-[12px] font-medium text-white backdrop-blur-sm ring-1 ring-white/15">
                  <CalendarDays className="h-3.5 w-3.5 shrink-0 text-white/90" strokeWidth={2.2} />
                  <span>{welcomeDate}</span>
                </div>

                <div className="mt-4 flex items-start gap-2.5 sm:mt-5">
                  <span className="mt-1.5 inline-flex shrink-0 items-center text-white/90" aria-hidden>
                    <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
                      <path d="M1 7H11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                      <path d="M8 2L13 7L8 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M14 2L17 7L14 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <div className="min-w-0">
                    <h1 className="text-[22px] font-bold leading-tight tracking-tight text-white sm:text-[26px] lg:text-[28px]">
                      Xush kelibsiz, {displayName}!
                    </h1>
                    <p className="mt-1.5 text-[14px] font-medium text-white/85 sm:text-[15px]">
                      Bugun ham samarali kun bo'lsin!
                    </p>
                  </div>
                </div>
              </div>

              <p className="max-w-[420px] text-[12px] leading-relaxed text-white/70 sm:text-[13px]">
                “To'g'ri boshqarilgan inson resurslari – muvaffaqiyatli universitet asosi.”
              </p>
            </div>

            {/* Right: task card (vertically centered) */}
            <div className="relative z-10 flex items-center justify-start lg:justify-center">
              <div className="w-full max-w-[260px] rounded-[22px] bg-[#F2F6FC] p-5 shadow-[0_16px_40px_rgba(15,23,42,0.18)] sm:max-w-[270px]">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-[17px] w-[17px] shrink-0 text-[#2563EB]" strokeWidth={2.4} />
                  <h2 className="text-[15px] font-bold leading-tight text-[#0F2A6B] sm:text-[16px]">
                    Bugungi vazifalaringiz
                  </h2>
                </div>
                <p className="mt-1.5 text-[12px] font-medium text-slate-400 sm:text-[13px]">
                  {importantCount} ta muhim vazifa
                </p>
                <button
                  type="button"
                  onClick={() => document.getElementById("dash-tasks")?.scrollIntoView({ behavior: "smooth" })}
                  className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-[#2563EB] shadow-[0_4px_12px_rgba(37,99,235,0.12)] ring-1 ring-slate-100 transition hover:bg-slate-50"
                >
                  Ko'rish <span aria-hidden className="text-sm leading-none">→</span>
                </button>
              </div>
            </div>
          </div>

          {/* Character — pinned to banner bottom-right */}
          <img
            src="/hr-welcome-hero.png"
            alt="HR yordamchi"
            className="pointer-events-none absolute bottom-0 right-0 z-20 hidden h-[100%] w-auto select-none object-contain object-bottom drop-shadow-[0_12px_28px_rgba(15,23,42,0.3)] sm:block sm:max-h-[248px] lg:max-h-[268px]"
            draggable={false}
          />
        </section>

        {/* KPI row */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <SparkKpi
            id="total"
            title="Jami xodimlar"
            value={formatCompact(kpis.totalEmployees)}
            metaValue="+12"
            metaLabel="o'tgan oyga nisbatan"
            metaKind="up"
            tone="blue"
            icon={<Users className="h-[18px] w-[18px]" />}
            spark={SPARK.total}
            onClick={() => nav("/employees")}
          />
          <SparkKpi
            id="work"
            title="Ishda"
            value={formatCompact(atWork)}
            metaValue={`${activePct}%`}
            metaLabel="faol xodimlar"
            metaKind="bar"
            tone="green"
            icon={<UserCheck className="h-[18px] w-[18px]" />}
            spark={SPARK.work}
            onClick={() => nav("/attendance")}
          />
          <SparkKpi
            id="leave"
            title="Ta'tilda"
            value={String(Math.max(kpis.onLeave, onLeaveNow.length))}
            metaValue={`${leavePct}%`}
            metaLabel="hozirda ta'tilda"
            metaKind="bar"
            tone="amber"
            icon={<ArrowLeftRight className="h-[18px] w-[18px]" />}
            spark={SPARK.leave}
            onClick={() => nav("/leave/all")}
          />
          <SparkKpi
            id="sick"
            title="Kasallikda"
            value={String(sickCount)}
            metaValue={`${sickPct}%`}
            metaLabel="tibbiy ruxsat"
            metaKind="bar"
            tone="red"
            icon={<BriefcaseMedical className="h-[18px] w-[18px]" />}
            spark={SPARK.sick}
            onClick={() => nav("/leave/sick")}
          />
          <SparkKpi
            id="new"
            title="Yangi xodimlar"
            value={String(kpis.newThisMonth || 20)}
            metaValue="+5"
            metaLabel="shu oyda"
            metaKind="bar"
            tone="violet"
            icon={<UserPlus className="h-[18px] w-[18px]" />}
            spark={SPARK.neu}
            onClick={() => nav("/recruitment")}
          />
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {[
            {
              t: "Yangi xodim qo'shish",
              to: "/employees",
              iconBg: "bg-[#2B6BFF]",
              icon: <Plus className="h-5 w-5 text-white" strokeWidth={2.5} />,
            },
            {
              t: "Hujjat yaratish",
              to: "/documents",
              iconBg: "bg-[#E8F1FF]",
              icon: <FileText className="h-5 w-5 text-[#2B6BFF]" strokeWidth={2} />,
            },
            {
              t: "Ariza tasdiqlash",
              to: "/leave/all",
              iconBg: "bg-[#E9F9EF]",
              icon: (
                <span className="flex h-5 w-5 items-center justify-center rounded-[5px] bg-[#22C55E]">
                  <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                </span>
              ),
            },
            {
              t: "Hisobot olish",
              to: "/reports",
              iconBg: "bg-[#F3ECFF]",
              icon: <BarChart3 className="h-5 w-5 text-[#8B5CF6]" strokeWidth={2} />,
            },
            {
              t: "Eslatma yaratish",
              to: "/automation",
              iconBg: "bg-[#FFECEC]",
              icon: <Bell className="h-5 w-5 text-[#EF4444]" strokeWidth={2} />,
            },
          ].map((x) => (
            <button
              key={x.t}
              type="button"
              onClick={() => nav(x.to)}
              className="flex items-center gap-3 rounded-[16px] border border-slate-100 bg-white px-3.5 py-3.5 text-left shadow-[0_8px_24px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(15,23,42,0.08)]"
            >
              <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px]", x.iconBg)}>
                {x.icon}
              </span>
              <span className="min-w-0 flex-1 text-[13px] font-semibold leading-snug text-slate-800">{x.t}</span>
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" strokeWidth={2.25} />
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

          <Card className="overflow-hidden border-slate-100 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
            <div className="flex items-center justify-between gap-3 px-5 pt-5">
              <h3 className="text-[15px] font-semibold text-slate-900">Xodimlar bo'yicha taqsimot</h3>
              <button
                type="button"
                className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Bo'limlar kesimida
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>
            </div>
            <div className="flex flex-col items-center gap-6 px-5 pb-6 pt-5 sm:flex-row sm:items-center sm:gap-4">
              <div className="relative h-[176px] w-[176px] shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={DEPT_SHARE}
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      startAngle={90}
                      endAngle={-270}
                      innerRadius={58}
                      outerRadius={82}
                      paddingAngle={2}
                      strokeWidth={0}
                    >
                      {DEPT_SHARE.map((d) => (
                        <Cell key={d.name} fill={d.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [`${value}%`, "Ulush"]}
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 8px 24px rgba(15,23,42,.06)",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-[26px] font-bold leading-none tracking-tight text-slate-900">
                    {kpis.totalEmployees.toLocaleString("en-US")}
                  </div>
                  <div className="mt-1 text-[12px] font-medium text-slate-400">jami xodim</div>
                </div>
              </div>
              <div className="w-full flex-1 space-y-3.5">
                {DEPT_SHARE.map((d) => (
                  <div key={d.name} className="flex items-center justify-between gap-3">
                    <span className="flex min-w-0 items-center gap-2.5 text-[13px] text-slate-600">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: d.color }} />
                      <span className="truncate">{d.name}</span>
                    </span>
                    <span className="shrink-0 text-[13px] font-semibold tabular-nums text-slate-800">{d.value}%</span>
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

      {/* Right widgets — Bugun / Vazifalarim / So'nggi hujjatlar */}
      <aside className="space-y-4 xl:sticky xl:top-4 xl:self-start">
        {/* Bugun — calendar */}
        <Card className="overflow-hidden rounded-[20px] border-0 p-5 shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#E8F0FF] text-[#2B6BFF]">
              <CalendarDays className="h-5 w-5" strokeWidth={2.2} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[12px] font-medium leading-none text-slate-400">Bugun</div>
              <div className="mt-1.5 text-[17px] font-bold leading-none tracking-tight text-[#1B4FD8]">
                {calendarDateLabel()}
              </div>
            </div>
            <div className="flex shrink-0 gap-1.5">
              <button
                type="button"
                onClick={() => nav("/calendar")}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50"
                aria-label="Oldingi kun"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => nav("/calendar")}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50"
                aria-label="Keyingi kun"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="relative mt-5 space-y-0">
            {CALENDAR_EVENTS.map((ev, i) => (
              <div key={ev.time + ev.title} className="relative flex gap-3 pb-5 last:pb-0">
                {i < CALENDAR_EVENTS.length - 1 && (
                  <span className="absolute left-[68px] top-6 bottom-0 w-px bg-slate-200" aria-hidden />
                )}
                <div className="w-11 shrink-0 pt-0.5 text-right text-[13px] font-semibold tabular-nums text-[#2B6BFF]">
                  {ev.time}
                </div>
                <div className="relative z-10 flex w-5 shrink-0 justify-center pt-1">
                  <MapPin className={cn("h-[18px] w-[18px]", PIN_COLOR[ev.pin])} fill="currentColor" strokeWidth={0} />
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="text-[14px] font-semibold leading-snug text-slate-800">{ev.title}</div>
                  <div className="mt-0.5 text-[12px] text-slate-400">{ev.place}</div>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => nav("/calendar")}
            className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#E8F0FF] text-[14px] font-semibold text-[#1B4FD8] transition hover:bg-[#D9E7FF]"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            Yangi tadbir qo'shish
          </button>
        </Card>

        {/* Vazifalarim */}
        <Card id="dash-tasks" className="overflow-hidden rounded-[20px] border-0 shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <h3 className="text-[16px] font-bold text-[#0F1B4C]">Vazifalarim</h3>
            <button
              type="button"
              className="text-[13px] font-semibold text-[#2B6BFF] hover:underline"
              onClick={() => nav("/tasks")}
            >
              Barchasi →
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {tasks.slice(0, 4).map((t) => (
              <label
                key={t.id}
                className="flex cursor-pointer items-center gap-3 px-5 py-3.5 hover:bg-slate-50/80"
              >
                <input
                  type="checkbox"
                  className="h-[18px] w-[18px] shrink-0 rounded border-slate-300"
                  checked={t.done}
                  onChange={(e) => markTask(t.id, e.target.checked)}
                />
                <div className={cn("min-w-0 flex-1 text-[14px] leading-snug text-slate-800", t.done && "text-slate-400 line-through")}>
                  {t.title}
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                    t.dueLabel === "Bugun"
                      ? "bg-[#EF4444] text-white"
                      : "bg-slate-100 text-slate-500",
                  )}
                >
                  {t.dueLabel}
                </span>
              </label>
            ))}
          </div>
        </Card>

        {/* So'nggi hujjatlar */}
        <Card className="overflow-hidden rounded-[20px] border-0 shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <h3 className="text-[16px] font-bold text-[#0F1B4C]">So'nggi hujjatlar</h3>
            <button
              type="button"
              className="text-[13px] font-semibold text-[#2B6BFF] hover:underline"
              onClick={() => nav("/documents")}
            >
              Barchasi →
            </button>
          </div>
          <div className="divide-y divide-slate-100 px-2 pb-2">
            {docs.map((d, i) => (
              <div key={d.id} className="flex items-center gap-3 px-3 py-3">
                <DocTypeIcon type={d.type} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] font-semibold text-slate-800">{d.name}</div>
                  <div className="mt-0.5 text-[12px] text-slate-400">{docRelativeLabel(d.date, i)}</div>
                </div>
                <button
                  type="button"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E8F0FF] text-[#2B6BFF] transition hover:bg-[#D9E7FF]"
                  title="Yuklab olish"
                >
                  <Download className="h-4 w-4" strokeWidth={2.2} />
                </button>
              </div>
            ))}
            {docs.length === 0 && (
              <div className="px-4 py-6 text-center text-xs text-slate-400">Hujjatlar yo'q</div>
            )}
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
  id,
  title,
  value,
  metaValue,
  metaLabel,
  metaKind,
  tone,
  icon,
  spark,
  onClick,
}: {
  id: string;
  title: string;
  value: string;
  metaValue: string;
  metaLabel: string;
  metaKind: "up" | "bar";
  tone: "blue" | "green" | "amber" | "red" | "violet";
  icon: ReactNode;
  spark: number[];
  onClick: () => void;
}) {
  const tones = {
    blue: { icon: "bg-[#E8F0FF] text-[#2B6BFF]", stroke: "#2B6BFF", meta: "text-[#22C55E]" },
    green: { icon: "bg-[#E9F9F0] text-[#16A34A]", stroke: "#22C55E", meta: "text-[#16A34A]" },
    amber: { icon: "bg-[#FFF6E5] text-[#F59E0B]", stroke: "#F59E0B", meta: "text-[#F59E0B]" },
    red: { icon: "bg-[#FFECEC] text-[#EF4444]", stroke: "#EF4444", meta: "text-[#EF4444]" },
    violet: { icon: "bg-[#F3ECFF] text-[#8B5CF6]", stroke: "#8B5CF6", meta: "text-[#8B5CF6]" },
  }[tone];
  const data = spark.map((v, i) => ({ i, v }));
  const gradId = `kpiSpark-${id}`;

  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-[18px] border border-slate-100 bg-white p-4 text-left shadow-[0_8px_24px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(15,23,42,0.08)]"
    >
      <div className="flex items-start gap-3">
        <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px]", tones.icon)}>
          {icon}
        </span>
        <div className="min-w-0 pt-0.5">
          <div className="text-[13px] font-medium leading-none text-slate-500">{title}</div>
          <div className="mt-2 text-[28px] font-bold leading-none tracking-tight text-slate-900">{value}</div>
        </div>
      </div>

      <div className="mt-4 flex items-end justify-between gap-2">
        <div className="min-w-0">
          <div className={cn("flex items-center gap-1.5 text-[13px] font-semibold", tones.meta)}>
            {metaKind === "up" ? (
              <ArrowUp className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
            ) : (
              <span className="inline-block h-3.5 w-[3px] shrink-0 rounded-full" style={{ background: tones.stroke }} />
            )}
            {metaValue}
          </div>
          <div className="mt-0.5 truncate text-[11px] leading-snug text-slate-400">{metaLabel}</div>
        </div>
        <div className="h-11 w-[88px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={tones.stroke} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={tones.stroke} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="v"
                stroke={tones.stroke}
                strokeWidth={2.2}
                fill={`url(#${gradId})`}
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </button>
  );
}

