import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Archive,
  ArrowUp,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileBarChart,
  FilePenLine,
  FileText,
  Filter,
  LayoutGrid,
  Mic,
  MoreHorizontal,
  PieChart,
  Plus,
  RotateCcw,
  Search,
  XCircle,
} from "lucide-react";
import { Select, TableWrap, Td, Th } from "./ui";
import { OrderViewPanel } from "./OrderDocViewer";
import { cn } from "../lib/utils";
import { printBlankOrder } from "../lib/official";

export type OrderStatus = "done" | "progress" | "cancelled" | "archived";

export type CategoryMeta = { label: string; bg: string; text: string };

export type JournalOrder = {
  id: string;
  number: string;
  date: string;
  subject: string;
  category: string;
  person: string;
  department: string;
  responsible: string;
  status: OrderStatus;
  description: string;
  history: { at: string; text: string; by: string }[];
  comments: { at: string; by: string; text: string }[];
};

export type JournalStats = {
  total: number;
  done: number;
  donePct: string;
  progress: number;
  progressPct: string;
  cancelled: number;
  cancelledPct: string;
  month: number;
  monthDelta: number;
  totalDelta: number;
  archive: number;
};

export type OrdersJournalConfig = {
  kind: "K" | "P" | "N";
  title: string;
  subtitle: string;
  path: string;
  newLabel: string;
  categories: Record<string, CategoryMeta>;
  stats: JournalStats;
  seed: JournalOrder[];
};

const STATUS_META: Record<
  OrderStatus,
  { label: string; bg: string; text: string; tone: "green" | "amber" | "red" | "slate" }
> = {
  done: { label: "Ijro etilgan", bg: "bg-[#dcfce7]", text: "text-[#15803d]", tone: "green" },
  progress: { label: "Jarayonda", bg: "bg-[#ffedd5]", text: "text-[#c2410c]", tone: "amber" },
  cancelled: { label: "Bekor qilingan", bg: "bg-[#fee2e2]", text: "text-[#dc2626]", tone: "red" },
  archived: { label: "Arxiv", bg: "bg-slate-100", text: "text-slate-600", tone: "slate" },
};

function formatDateUz(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

function pageNumbers(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "…")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) pages.push("…");
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1) pages.push("…");
  pages.push(total);
  return pages;
}

export function OrdersJournalPage({ config }: { config: OrdersJournalConfig }) {
  const { kind, title, subtitle, path, newLabel, categories, stats: DEMO, seed } = config;
  const nav = useNavigate();
  const [orders, setOrders] = useState(seed);
  const [q, setQ] = useState("");
  const [year, setYear] = useState("all");
  const [category, setCategory] = useState("all");
  const [faculty, setFaculty] = useState("all");
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [selectedId, setSelectedId] = useState<string | null>(seed[0]?.id ?? null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [headerMenu, setHeaderMenu] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [catMenu, setCatMenu] = useState(false);

  const categoryKeys = Object.keys(categories);
  const departments = useMemo(() => [...new Set(orders.map((o) => o.department))].sort(), [orders]);

  const list = useMemo(() => {
    return orders.filter((o) => {
      const hit = `${o.number} ${o.subject} ${o.person} ${o.department}`
        .toLowerCase()
        .includes(q.toLowerCase());
      if (!hit) return false;
      if (year !== "all" && !o.date.startsWith(year)) return false;
      if (category !== "all" && o.category !== category) return false;
      if (faculty !== "all" && o.department !== faculty) return false;
      return true;
    });
  }, [orders, q, year, category, faculty]);

  const pageCount = Math.max(1, Math.ceil(DEMO.total / pageSize));
  const pageRows = list.slice((page - 1) * pageSize, page * pageSize);
  const allChecked = pageRows.length > 0 && pageRows.every((o) => checked[o.id]);
  const selected = orders.find((o) => o.id === selectedId) ?? null;
  const from = list.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, list.length);

  useEffect(() => {
    setPage(1);
  }, [q, year, category, faculty, pageSize]);

  useEffect(() => {
    if (selectedId && !list.some((o) => o.id === selectedId)) {
      setSelectedId(list[0]?.id ?? null);
    }
  }, [list, selectedId]);

  function clearFilters() {
    setQ("");
    setYear("all");
    setCategory("all");
    setFaculty("all");
  }

  const stats = [
    {
      title: `Jami ${kind}-buyruqlar`,
      value: DEMO.total,
      hint: (
        <>
          <ArrowUp className="h-3 w-3 shrink-0" strokeWidth={2.5} />
          <span className="font-semibold">+{DEMO.totalDelta}</span>
          <span className="font-medium text-slate-400">O'tgan oyga nisbatan</span>
        </>
      ),
      hintTone: "up" as const,
      icon: <FileText className="h-[18px] w-[18px]" strokeWidth={1.75} />,
      tone: "blue" as const,
    },
    {
      title: "Ijro etilgan",
      value: DEMO.done,
      hint: DEMO.donePct,
      hintTone: "muted" as const,
      icon: <CheckCircle2 className="h-[18px] w-[18px]" strokeWidth={1.75} />,
      tone: "green" as const,
    },
    {
      title: "Jarayonda",
      value: DEMO.progress,
      hint: DEMO.progressPct,
      hintTone: "muted" as const,
      icon: <PieChart className="h-[18px] w-[18px]" strokeWidth={1.75} />,
      tone: "amber" as const,
    },
    {
      title: "Bekor qilingan",
      value: DEMO.cancelled,
      hint: DEMO.cancelledPct,
      hintTone: "muted" as const,
      icon: <XCircle className="h-[18px] w-[18px]" strokeWidth={1.75} />,
      tone: "red" as const,
    },
    {
      title: "Joriy oy",
      value: DEMO.month,
      hint: (
        <>
          <ArrowUp className="h-3 w-3 shrink-0" strokeWidth={2.5} />
          <span className="font-semibold">+{DEMO.monthDelta}</span>
          <span className="font-medium text-slate-400">Mart oyida</span>
        </>
      ),
      hintTone: "up" as const,
      icon: <CalendarDays className="h-[18px] w-[18px]" strokeWidth={1.75} />,
      tone: "violet" as const,
    },
    {
      title: "Arxiv",
      value: DEMO.archive,
      hint: "Barcha yillar",
      hintTone: "muted" as const,
      icon: <Archive className="h-[18px] w-[18px]" strokeWidth={1.75} />,
      tone: "navy" as const,
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <div className="text-[12px] leading-none text-slate-400">
          <Link to="/" className="hover:text-brand-600">
            Bosh sahifa
          </Link>
          <span className="mx-1.5">›</span>
          <span>Jurnallar</span>
          <span className="mx-1.5">›</span>
          <span className="text-slate-500">{title}</span>
        </div>

        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#e8f1ff] text-brand-600">
                <FilePenLine className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <h1 className="text-[28px] font-bold leading-none tracking-tight text-[#0f172a]">{title}</h1>
            </div>
            <p className="mt-2.5 text-[13px] leading-snug text-slate-500">{subtitle}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 pt-0.5">
            <button
              type="button"
              onClick={() => nav("/reports")}
              className="inline-flex h-[42px] items-center gap-2 rounded-xl border border-[#93c5fd] bg-white px-4 text-[13px] font-semibold text-brand-600 hover:bg-[#eff6ff]"
            >
              <FileBarChart className="h-4 w-4" />
              Hisobot olish
            </button>
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setCatMenu((v) => !v);
                  setHeaderMenu(false);
                }}
                className="inline-flex h-[42px] items-center gap-2 rounded-xl border border-[#93c5fd] bg-white px-4 text-[13px] font-semibold text-brand-600 hover:bg-[#eff6ff]"
              >
                <LayoutGrid className="h-4 w-4" />
                Kategoriyalar
              </button>
              {catMenu && (
                <div className="absolute right-0 top-12 z-30 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-nav">
                  {categoryKeys.map((key) => (
                    <button
                      key={key}
                      type="button"
                      className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                      onClick={() => {
                        setCategory(key);
                        setCatMenu(false);
                      }}
                    >
                      {categories[key].label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => printBlankOrder()}
              className="inline-flex h-[42px] items-center gap-2 rounded-xl bg-brand-600 px-4 text-[13px] font-semibold text-white shadow-sm hover:bg-brand-700"
            >
              <Plus className="h-4 w-4" strokeWidth={2.5} />
              {newLabel}
            </button>
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setHeaderMenu((v) => !v);
                  setCatMenu(false);
                }}
                className="inline-flex h-[42px] w-[42px] items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
              {headerMenu && (
                <div className="absolute right-0 top-12 z-30 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-nav">
                  <MenuItem
                    onClick={() => {
                      nav("/reports");
                      setHeaderMenu(false);
                    }}
                  >
                    Eksport
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      printBlankOrder();
                      setHeaderMenu(false);
                    }}
                  >
                    Chop etish
                  </MenuItem>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((s) => (
          <StatCard key={s.title} {...s} />
        ))}
      </div>

      <div className={cn("grid gap-4", selected ? "xl:grid-cols-[minmax(0,1fr)_400px]" : "")}>
        <div className="min-w-0 space-y-4">
          {/* Filter bar — 1:1 */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative min-w-[280px] flex-[1.4]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Buyruq raqami, mavzu, xodim, fakultet, sana bo'yicha qidirish..."
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-10 text-[13px] text-slate-800 outline-none placeholder:text-slate-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-500/15"
                />
                <button
                  type="button"
                  title="Ovozli qidiruv"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-brand-600 hover:bg-brand-50"
                >
                  <Mic className="h-4 w-4" />
                </button>
              </div>
              <Select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="h-10 w-full rounded-lg border-slate-200 bg-white text-[13px] text-slate-600 sm:w-[138px]"
              >
                <option value="all">Barcha yillar</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
              </Select>
              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-10 w-full rounded-lg border-slate-200 bg-white text-[13px] text-slate-600 sm:w-[168px]"
              >
                <option value="all">Barcha kategoriyalar</option>
                {categoryKeys.map((key) => (
                  <option key={key} value={key}>
                    {categories[key].label}
                  </option>
                ))}
              </Select>
              <Select
                value={faculty}
                onChange={(e) => setFaculty(e.target.value)}
                className="h-10 w-full rounded-lg border-slate-200 bg-white text-[13px] text-slate-600 sm:w-[158px]"
              >
                <option value="all">Barcha fakultetlar</option>
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </Select>
              <button
                type="button"
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#93c5fd] bg-white px-3.5 text-[13px] font-medium text-brand-600 hover:bg-[#eff6ff]"
              >
                <Filter className="h-4 w-4" /> Filtrlar
              </button>
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#93c5fd] bg-white px-3.5 text-[13px] font-medium text-brand-600 hover:bg-[#eff6ff]"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Tozalash
              </button>
            </div>
          </div>

          {/* Table — 1:1 */}
          <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <TableWrap>
              <thead>
                <tr className="border-b border-slate-100 bg-white">
                  <Th className="w-10 !normal-case !tracking-normal !text-slate-500">
                    <input
                      type="checkbox"
                      className="h-3.5 w-3.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500/30"
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
                  <Th className="w-12 !normal-case !tracking-normal !text-slate-500">#</Th>
                  <Th className="!normal-case !tracking-normal !text-slate-500">Buyruq raqami</Th>
                  <Th className="!normal-case !tracking-normal !text-slate-500">Sana</Th>
                  <Th className="!normal-case !tracking-normal !text-slate-500">Mavzu</Th>
                  <Th className="!normal-case !tracking-normal !text-slate-500">Kategoriya</Th>
                  <Th className="!normal-case !tracking-normal !text-slate-500">Status</Th>
                  <Th className="w-[112px] !normal-case !tracking-normal !text-slate-500">Amallar</Th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((o, idx) => {
                  const cat = categories[o.category] ?? { label: o.category, bg: "bg-slate-100", text: "text-slate-600" };
                  const st = STATUS_META[o.status];
                  const isSel = selectedId === o.id;
                  return (
                    <tr
                      key={o.id}
                      onClick={() => setSelectedId(o.id)}
                      className={cn(
                        "cursor-pointer transition",
                        isSel ? "bg-[#f5f9ff]" : "hover:bg-slate-50/90",
                      )}
                    >
                      <Td onClick={(e) => e.stopPropagation()} className="py-2.5">
                        <input
                          type="checkbox"
                          className="h-3.5 w-3.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500/30"
                          checked={!!checked[o.id]}
                          onChange={(e) => setChecked((c) => ({ ...c, [o.id]: e.target.checked }))}
                        />
                      </Td>
                      <Td className="py-2.5 text-slate-400">{(page - 1) * pageSize + idx + 1}</Td>
                      <Td className="py-2.5">
                        <span className="font-semibold text-brand-600">{o.number}</span>
                      </Td>
                      <Td className="whitespace-nowrap py-2.5 text-slate-500">{formatDateUz(o.date)}</Td>
                      <Td className="max-w-[240px] py-2.5">
                        <div className="truncate text-[13px] font-medium text-slate-800" title={o.subject}>
                          {o.subject}
                        </div>
                      </Td>
                      <Td className="py-2.5">
                        <span
                          className={cn(
                            "inline-flex max-w-[150px] items-center truncate rounded-md px-2 py-0.5 text-[11px] font-semibold",
                            cat.bg,
                            cat.text,
                          )}
                        >
                          {cat.label}
                        </span>
                      </Td>
                      <Td className="py-2.5">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold",
                            st.bg,
                            st.text,
                          )}
                        >
                          {st.label}
                        </span>
                      </Td>
                      <Td className="relative py-2.5" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-0.5">
                          <IconBtn title="Ko'rish" active={isSel} onClick={() => setSelectedId(o.id)}>
                            <Eye className="h-4 w-4" />
                          </IconBtn>
                          <IconBtn title="Yuklab olish" onClick={() => printBlankOrder()}>
                            <Download className="h-4 w-4" />
                          </IconBtn>
                          <button
                            type="button"
                            className="rounded p-1.5 text-brand-500 hover:bg-brand-50 hover:text-brand-700"
                            onClick={() => setMenuId(menuId === o.id ? null : o.id)}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </div>
                        {menuId === o.id && (
                          <div className="absolute right-2 top-10 z-20 w-40 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-nav">
                            <MenuItem
                              onClick={() => {
                                setSelectedId(o.id);
                                setMenuId(null);
                              }}
                            >
                              Tafsilot
                            </MenuItem>
                            <MenuItem
                              onClick={() => {
                                printBlankOrder();
                                setMenuId(null);
                              }}
                            >
                              Chop etish
                            </MenuItem>
                            <MenuItem
                              onClick={() => {
                                setOrders((prev) =>
                                  prev.map((x) => (x.id === o.id ? { ...x, status: "cancelled" } : x)),
                                );
                                setMenuId(null);
                              }}
                            >
                              Bekor qilish
                            </MenuItem>
                          </div>
                        )}
                      </Td>
                    </tr>
                  );
                })}
                {pageRows.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-sm text-slate-500">
                      Mos {kind}-buyruq topilmadi
                    </td>
                  </tr>
                )}
              </tbody>
            </TableWrap>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-[13px]">
              <div className="flex items-center gap-3 text-slate-500">
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700 outline-none focus:border-brand-500"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <span>
                  {from}-{to} dan {DEMO.total} ta buyruq
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 disabled:opacity-40 hover:bg-slate-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {pageNumbers(page, pageCount).map((n, i) =>
                  n === "…" ? (
                    <span key={`e-${i}`} className="px-1 text-slate-400">
                      …
                    </span>
                  ) : (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setPage(n)}
                      className={cn(
                        "h-8 min-w-8 rounded-lg px-2 text-xs font-semibold",
                        page === n
                          ? "bg-brand-600 text-white shadow-sm"
                          : "border border-slate-200 text-slate-600 hover:bg-slate-50",
                      )}
                    >
                      {n}
                    </button>
                  ),
                )}
                <button
                  type="button"
                  disabled={page >= pageCount}
                  onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 disabled:opacity-40 hover:bg-slate-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {selected && (
          <aside className="xl:sticky xl:top-20 xl:self-start">
            <OrderViewPanel
              order={{
                number: selected.number,
                date: selected.date,
                subject: selected.subject,
                person: selected.person,
                department: selected.department,
                description: selected.description,
                responsible: selected.responsible,
              }}
              statusLabel={STATUS_META[selected.status].label}
              statusTone={STATUS_META[selected.status].tone}
              comments={selected.comments}
              history={selected.history}
              onClose={() => setSelectedId(null)}
              onPrint={() => printBlankOrder()}
              onDownload={() => printBlankOrder()}
              onShare={() => {
                void navigator.clipboard?.writeText(`${window.location.origin}${path}?id=${selected.id}`);
              }}
            />
          </aside>
        )}
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  hint,
  hintTone,
  icon,
  tone,
}: {
  title: string;
  value: number;
  hint: ReactNode;
  hintTone: "up" | "muted";
  icon: ReactNode;
  tone: "blue" | "violet" | "green" | "amber" | "red" | "navy";
}) {
  const map = {
    blue: "bg-[#e8f1ff] text-[#1b5ef3]",
    violet: "bg-[#f3e8ff] text-[#7c3aed]",
    green: "bg-[#e8f8ef] text-[#16a34a]",
    amber: "bg-[#fff4e6] text-[#ea580c]",
    red: "bg-[#feeCEC] text-[#dc2626]",
    navy: "bg-[#e8f1ff] text-[#1e40af]",
  };
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white px-4 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_rgba(15,23,42,0.04)]">
      <span className={cn("inline-flex h-9 w-9 items-center justify-center rounded-[10px]", map[tone])}>
        {icon}
      </span>
      <div className="mt-3 text-[12px] font-medium leading-snug text-slate-500">{title}</div>
      <div className="mt-1.5 text-[26px] font-bold leading-none tracking-tight text-[#0f172a]">{value}</div>
      <div
        className={cn(
          "mt-2 flex flex-wrap items-center gap-1 text-[11px]",
          hintTone === "up" ? "text-emerald-600" : "font-medium text-slate-400",
        )}
      >
        {hint}
      </div>
    </div>
  );
}

function IconBtn({
  children,
  onClick,
  title,
  active,
}: {
  children: ReactNode;
  onClick?: () => void;
  title?: string;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={cn(
        "rounded p-1.5 transition",
        active
          ? "text-brand-600 ring-1 ring-red-500"
          : "text-brand-500 hover:bg-brand-50 hover:text-brand-700",
      )}
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
