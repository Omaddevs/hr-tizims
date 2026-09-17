import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Building2,
  ChevronDown,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  Mail,
  MoreHorizontal,
  Network,
  Phone,
  Plus,
  Printer,
  Search,
  Settings2,
  Upload,
  UserPlus,
  Users,
  AlertTriangle,
  Briefcase,
  GraduationCap,
} from "lucide-react";
import { useApp } from "../store/AppContext";
import { Avatar, Badge, Card, Select, TableWrap, Td, Th } from "../components/ui";
import { downloadExcel } from "../lib/excel";
import { cn } from "../lib/utils";
import type { Employee } from "../types";

type LeadTab = "all" | "rektorat" | "prorektor" | "dekan" | "bolim";

const LEADERSHIP_RE = /rektor|prorektor|dekan|boshlig|mudir|direktor/i;

function isLeadership(e: Employee) {
  return LEADERSHIP_RE.test(e.position);
}

function leadGroup(e: Employee): LeadTab {
  const p = e.position.toLowerCase();
  if (p === "rektor") return "rektorat";
  if (p.includes("prorektor")) return "prorektor";
  if (p.includes("dekan")) return "dekan";
  return "bolim";
}

function leadStatusLabel(status: string) {
  if (status === "active") return { text: "Faol", tone: "green" as const };
  if (status === "probation") return { text: "Vaqtincha", tone: "amber" as const };
  if (status === "on_leave") return { text: "Ta'tilda", tone: "amber" as const };
  return { text: status, tone: "slate" as const };
}

const RANK: Record<string, number> = {
  Rektor: 0,
  "Birinchi prorektor": 1,
  Prorektor: 2,
  Dekan: 3,
};

export function RaxbariyatPage() {
  const { employees, departments } = useApp();
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<LeadTab>("all");
  const [position, setPosition] = useState("all");
  const [dept, setDept] = useState("all");
  const [status, setStatus] = useState("all");
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const leaders = useMemo(
    () =>
      employees
        .filter(isLeadership)
        .slice()
        .sort((a, b) => (RANK[a.position] ?? 40) - (RANK[b.position] ?? 40) || a.fullName.localeCompare(b.fullName, "uz")),
    [employees],
  );

  const positions = useMemo(() => [...new Set(leaders.map((e) => e.position))].sort(), [leaders]);

  const counts = useMemo(() => {
    const rektorat = leaders.filter((e) => e.departmentId === "d1").length;
    const prorektor = leaders.filter((e) => leadGroup(e) === "prorektor").length;
    const dekan = leaders.filter((e) => leadGroup(e) === "dekan").length;
    const bolim = leaders.filter((e) => leadGroup(e) === "bolim").length;
    return { all: leaders.length, rektorat, prorektor, dekan, bolim };
  }, [leaders]);

  const list = useMemo(() => {
    return leaders.filter((e) => {
      const hit = `${e.fullName} ${e.position} ${e.email} ${e.phone}`.toLowerCase().includes(q.toLowerCase());
      if (!hit) return false;
      if (position !== "all" && e.position !== position) return false;
      if (dept !== "all" && e.departmentId !== dept) return false;
      if (status === "active" && e.status !== "active") return false;
      if (status === "temp" && e.status !== "probation") return false;
      if (tab === "rektorat" && e.departmentId !== "d1") return false;
      if (tab === "prorektor" && leadGroup(e) !== "prorektor") return false;
      if (tab === "dekan" && leadGroup(e) !== "dekan") return false;
      if (tab === "bolim" && leadGroup(e) !== "bolim") return false;
      return true;
    });
  }, [leaders, q, position, dept, status, tab]);

  const pageCount = Math.max(1, Math.ceil(list.length / pageSize));
  const pageRows = list.slice((page - 1) * pageSize, page * pageSize);
  const allChecked = pageRows.length > 0 && pageRows.every((e) => checked[e.id]);

  useEffect(() => {
    setPage(1);
  }, [q, position, dept, status, tab, pageSize]);

  const orgTree = useMemo(() => {
    const rector = leaders.find((e) => e.position === "Rektor");
    const firstPro = leaders.find((e) => e.position === "Birinchi prorektor");
    const pros = leaders.filter((e) => e.position === "Prorektor");
    const dekans = leaders.filter((e) => e.position === "Dekan").slice(0, 2);
    return { rector, firstPro, pros, dekans };
  }, [leaders]);

  function exportList() {
    downloadExcel(
      "tizims-uz-raxbariyat",
      ["#", "F.I.Sh.", "Lavozim", "Bo'lim", "Telefon", "Email", "Holat"],
      list.map((e, i) => [
        i + 1,
        e.fullName,
        e.position,
        departments.find((d) => d.id === e.departmentId)?.name ?? "",
        e.phone,
        e.email,
        leadStatusLabel(e.status).text,
      ]),
    );
  }

  const tabs: { id: LeadTab; label: string; count: number }[] = [
    { id: "all", label: "Barcha raxbariyat", count: counts.all },
    { id: "rektorat", label: "Rektorat", count: counts.rektorat },
    { id: "prorektor", label: "Prorektorlar", count: counts.prorektor },
    { id: "dekan", label: "Dekanlar", count: counts.dekan },
    { id: "bolim", label: "Bo'lim boshliqlari", count: counts.bolim },
  ];

  const stats = [
    {
      title: "Raxbariyat a'zolari",
      value: String(counts.all),
      hint: "+1 o'tgan oyga nisbatan",
      icon: <Users className="h-4 w-4" />,
      tone: "blue" as const,
    },
    {
      title: "Rektorat",
      value: String(Math.max(counts.rektorat, 3)),
      hint: "O'zgarishsiz",
      icon: <Building2 className="h-4 w-4" />,
      tone: "violet" as const,
    },
    {
      title: "Prorektorlar",
      value: String(counts.prorektor),
      hint: "To'liq komplekt",
      icon: <Briefcase className="h-4 w-4" />,
      tone: "green" as const,
    },
    {
      title: "Dekanlar",
      value: String(counts.dekan),
      hint: "Fakultetlar bo'yicha",
      icon: <GraduationCap className="h-4 w-4" />,
      tone: "amber" as const,
    },
  ];

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
            <span className="text-slate-600">Raxbariyat</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Raxbariyat</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => nav("/org")}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-brand-200 bg-white px-4 text-sm font-semibold text-brand-700 hover:bg-brand-50"
          >
            <Network className="h-4 w-4" />
            Tashkiliy tuzilma
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => setAddOpen((v) => !v)}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
            >
              <Plus className="h-4 w-4" />
              Yangi rahbar qo'shish
              <ChevronDown className="h-4 w-4 opacity-80" />
            </button>
            {addOpen && (
              <div className="absolute right-0 top-12 z-20 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-nav">
                <MenuItem
                  onClick={() => {
                    setAddOpen(false);
                    nav("/employees");
                  }}
                >
                  Mavjud xodimdan tanlash
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    setAddOpen(false);
                    nav("/employees");
                  }}
                >
                  Yangi profil yaratish
                </MenuItem>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#1d4ed8] via-[#2563eb] to-[#3b82f6] shadow-card">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1400&q=60)",
            backgroundSize: "cover",
            backgroundPosition: "center right",
          }}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#1d4ed8]/95 via-[#2563eb]/85 to-[#3b82f6]/40" />
        <div className="relative flex min-h-[148px] items-center px-6 py-7 sm:px-8">
          <div className="max-w-xl text-white">
            <h2 className="text-2xl font-bold tracking-tight sm:text-[28px]">Universitet raxbariyati</h2>
            <p className="mt-2 text-sm leading-relaxed text-blue-100">
              Ta'lim sifatini oshirish va innovatsion muhit yaratish — bizning asosiy maqsadimiz.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
              <div className="relative min-w-[200px] flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Rahbar qidirish..."
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none ring-brand-500/20 focus:border-brand-500 focus:ring-4"
                />
              </div>
              <Select value={position} onChange={(e) => setPosition(e.target.value)} className="h-10 w-full sm:w-44">
                <option value="all">Barcha lavozimlar</option>
                {positions.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </Select>
              <Select value={dept} onChange={(e) => setDept(e.target.value)} className="h-10 w-full sm:w-44">
                <option value="all">Barcha bo'limlar</option>
                {departments
                  .filter((d) => d.id !== "d0")
                  .map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
              </Select>
              <Select value={status} onChange={(e) => setStatus(e.target.value)} className="h-10 w-full sm:w-36">
                <option value="all">Holat</option>
                <option value="active">Faol</option>
                <option value="temp">Vaqtincha</option>
              </Select>
              <button
                type="button"
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                <Filter className="h-4 w-4" /> Filtrlar
              </button>
              <div className="ml-auto flex items-center gap-1">
                <IconBtn title="Excel" onClick={exportList}>
                  <FileSpreadsheet className="h-4 w-4" />
                </IconBtn>
                <IconBtn title="PDF" onClick={() => window.print()}>
                  <FileText className="h-4 w-4" />
                </IconBtn>
                <IconBtn title="Chop etish" onClick={() => window.print()}>
                  <Printer className="h-4 w-4" />
                </IconBtn>
                <IconBtn title="Ustunlar">
                  <Settings2 className="h-4 w-4" />
                </IconBtn>
              </div>
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
                  <Th className="w-14">Rasm</Th>
                  <Th>F.I.Sh.</Th>
                  <Th>Lavozim</Th>
                  <Th>Bo'lim / Fakultet</Th>
                  <Th>Aloqa</Th>
                  <Th>Holat</Th>
                  <Th className="w-12">Amallar</Th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((e, idx) => {
                  const st = leadStatusLabel(e.status);
                  const deptName = departments.find((d) => d.id === e.departmentId)?.name ?? "—";
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
                        <Avatar name={e.fullName} size="sm" src={e.photoUrl} />
                      </Td>
                      <Td>
                        <button
                          type="button"
                          onClick={() => nav(`/employees/${e.id}`)}
                          className="text-left font-semibold text-slate-800 hover:text-brand-700"
                        >
                          {e.fullName}
                        </button>
                      </Td>
                      <Td className="text-slate-600">{e.position}</Td>
                      <Td className="max-w-[150px] truncate text-slate-500">{deptName}</Td>
                      <Td>
                        <div className="space-y-0.5 text-xs">
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <Phone className="h-3 w-3 text-slate-400" />
                            {e.phone}
                          </div>
                          <div className="flex max-w-[170px] items-center gap-1.5 truncate text-slate-400">
                            <Mail className="h-3 w-3" />
                            {e.email}
                          </div>
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
                                nav("/org");
                                setMenuId(null);
                              }}
                            >
                              Tuzilmada ko'rish
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
                      Mos rahbar topilmadi
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
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
                <span className="text-xs text-slate-400">· {list.length} ta natija</span>
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

        <aside className="space-y-4 xl:sticky xl:top-20 xl:self-start">
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <h3 className="text-sm font-semibold text-slate-900">Tashkiliy tuzilma</h3>
              <button type="button" onClick={() => nav("/org")} className="text-xs font-medium text-brand-600 hover:underline">
                To'liq →
              </button>
            </div>
            <div className="px-4 py-4">
              {orgTree.rector && (
                <OrgNode name={orgTree.rector.fullName} role={orgTree.rector.position} photo={orgTree.rector.photoUrl} root />
              )}
              <div className="ml-4 space-y-3 border-l border-slate-200 pl-4">
                {orgTree.firstPro && (
                  <OrgNode name={orgTree.firstPro.fullName} role={orgTree.firstPro.position} photo={orgTree.firstPro.photoUrl} />
                )}
                {orgTree.pros.map((p) => (
                  <OrgNode key={p.id} name={p.fullName} role={p.position} photo={p.photoUrl} />
                ))}
                {orgTree.dekans.map((d) => (
                  <OrgNode key={d.id} name={d.fullName} role={d.position} photo={d.photoUrl} />
                ))}
              </div>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="border-b border-slate-100 px-4 py-3">
              <h3 className="text-sm font-semibold text-slate-900">Tezkor amallar</h3>
            </div>
            <div className="space-y-1 p-2">
              <QuickRow
                icon={<UserPlus className="h-4 w-4" />}
                label="Yangi rahbar qo'shish"
                onClick={() => nav("/employees")}
              />
              <QuickRow icon={<Upload className="h-4 w-4" />} label="Ma'lumot import qilish" onClick={exportList} />
              <QuickRow icon={<Network className="h-4 w-4" />} label="Tuzilmani tahrirlash" onClick={() => nav("/org")} />
              <QuickRow icon={<Download className="h-4 w-4" />} label="Ro'yxatni yuklab olish" onClick={exportList} />
            </div>
          </Card>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <AlertTriangle className="h-4 w-4" />
              </span>
              <div>
                <div className="text-sm font-semibold text-amber-900">Ma'lumot yangilash eslatmasi</div>
                <p className="mt-1 text-xs leading-relaxed text-amber-800/80">
                  3 ta rahbar profilida kontakt ma'lumotlari eskirgan. Iltimos, tekshiring.
                </p>
                <button type="button" className="mt-2 text-xs font-semibold text-amber-900 underline-offset-2 hover:underline">
                  Ko'rish
                </button>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  hint,
  icon,
  tone,
}: {
  title: string;
  value: string;
  hint: string;
  icon: ReactNode;
  tone: "blue" | "green" | "amber" | "violet";
}) {
  const map = {
    blue: "bg-brand-50 text-brand-600",
    green: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    violet: "bg-violet-50 text-violet-600",
  };
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card">
      <div className="flex items-start justify-between gap-2">
        <div className="text-xs font-medium text-slate-500">{title}</div>
        <span className={cn("rounded-lg p-1.5", map[tone])}>{icon}</span>
      </div>
      <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{value}</div>
      <div className="mt-1 text-[11px] font-medium text-slate-400">{hint}</div>
    </div>
  );
}

function OrgNode({ name, role, photo, root }: { name: string; role: string; photo?: string; root?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2.5", root && "mb-3")}>
      <Avatar name={name} size="sm" src={photo} />
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-slate-800">{name.split(" ").slice(0, 2).join(" ")}</div>
        <div className="text-[11px] text-slate-400">{role}</div>
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
