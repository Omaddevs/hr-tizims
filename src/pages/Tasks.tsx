import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock3,
  FileText,
  Filter,
  Flag,
  FolderOpen,
  LayoutTemplate,
  MoreHorizontal,
  Pencil,
  Play,
  Plus,
  Search,
  Tag,
  UserRound,
  X,
} from "lucide-react";
import { useApp } from "../store/AppContext";
import { Avatar, Button, Card, Field, Input, Modal, Select } from "../components/ui";
import { cn, priorityLabel } from "../lib/utils";
import { TASK_TEMPLATES } from "../data/seed";
import type { HrTask, Priority, TaskStatus } from "../types";

type Scope = "mine" | "all";
type TabKey = "all" | "mine" | "others" | "important" | "archive";
type DrawerTab = "details" | "files" | "comments" | "subtasks";

const CATEGORIES = ["HR", "Ta'til", "Hisobot", "Kadrlar", "Davomat", "ATS", "Onboarding", "Shartnoma", "KPI", "Maosh", "Hujjat"];

const STATUS_META: Record<
  TaskStatus,
  { label: string; className: string; Icon: typeof Play }
> = {
  in_progress: {
    label: "Bajarilmoqda",
    className: "bg-[#E8F1FF] text-[#1B5EF3]",
    Icon: Play,
  },
  pending: {
    label: "Kutilmoqda",
    className: "bg-[#FFF4E5] text-[#D97706]",
    Icon: Clock3,
  },
  done: {
    label: "Bajarilgan",
    className: "bg-[#E8F8EF] text-[#059669]",
    Icon: Check,
  },
  failed: {
    label: "Bajarilmagan",
    className: "bg-[#FEECEC] text-[#DC2626]",
    Icon: Flag,
  },
};

function formatLongDate(d = new Date()) {
  const months = [
    "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
    "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr",
  ];
  return `Bugun ${d.getDate()}-${months[d.getMonth()]}, ${d.getFullYear()}`;
}

function formatDateDot(iso?: string) {
  if (!iso) return "—";
  const datePart = iso.slice(0, 10);
  const [y, m, d] = datePart.split("-");
  if (!d) return iso;
  const time = iso.includes("T") ? iso.slice(11, 16) : "";
  return time ? `${d}.${m}.${y} ${time}` : `${d}.${m}.${y}`;
}

function isOverdue(t: HrTask) {
  if (t.done || t.status === "done") return false;
  const today = new Date().toISOString().slice(0, 10);
  return t.due < today || t.status === "failed";
}

function isMine(t: HrTask, userId?: string) {
  if (!userId) return false;
  return t.assigneeId === userId || t.ownerId === userId;
}

function isImportant(t: HrTask) {
  return t.priority === "critical" || t.priority === "urgent" || t.priority === "high";
}

function assigneeShort(name?: string, mine?: boolean) {
  if (mine) return "Men";
  if (!name) return "—";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 8);
  return parts.map((p) => p[0]).join("").toUpperCase().slice(0, 3) || name.slice(0, 8);
}

function PriorityPill({ priority }: { priority: Priority }) {
  const high = priority === "critical" || priority === "urgent" || priority === "high";
  const mid = priority === "medium";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold",
        high && "bg-[#FEECEC] text-[#DC2626]",
        mid && "bg-[#E8F1FF] text-[#2563EB]",
        !high && !mid && "bg-[#E8F8EF] text-[#16A34A]",
      )}
    >
      {high || mid ? <ArrowUp className="h-3 w-3" strokeWidth={2.5} /> : <ArrowDown className="h-3 w-3" strokeWidth={2.5} />}
      {priorityLabel[priority] ?? priority}
    </span>
  );
}

function StatusPill({ status }: { status: TaskStatus }) {
  const m = STATUS_META[status] ?? STATUS_META.pending;
  const Icon = m.Icon;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold", m.className)}>
      <Icon className="h-3 w-3" strokeWidth={2.5} />
      {m.label}
    </span>
  );
}

export function TasksPage({ scope }: { scope: Scope }) {
  const { tasks, user, markTask, addTask, updateTask, deleteTask, toggleSubtask, directoryUsers } = useApp();
  const [tab, setTab] = useState<TabKey>("all");
  const [q, setQ] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [prioFilter, setPrioFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawerTab, setDrawerTab] = useState<DrawerTab>("details");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const didAutoOpen = useRef(false);

  const [title, setTitle] = useState("");
  const [due, setDue] = useState(() => new Date().toISOString().slice(0, 10));
  const [priority, setPriority] = useState<Priority>("medium");
  const [category, setCategory] = useState("HR");
  const [description, setDescription] = useState("");
  const [assigneeId, setAssigneeId] = useState(user?.id ?? "");

  useEffect(() => {
    setTab("all");
    setPage(1);
    didAutoOpen.current = false;
  }, [scope]);

  useEffect(() => {
    setPage(1);
  }, [tab, q, catFilter, prioFilter, statusFilter, pageSize]);

  const stats = useMemo(() => {
    const pool = tasks;
    return {
      total: pool.length,
      pending: pool.filter((t) => !t.done && (t.status === "pending" || t.status === "in_progress")).length,
      done: pool.filter((t) => t.done || t.status === "done").length,
      overdue: pool.filter((t) => isOverdue(t)).length,
      mine: pool.filter((t) => isMine(t, user?.id) && !t.done).length,
    };
  }, [tasks, user?.id]);

  const tabCounts = useMemo(() => {
    return {
      all: tasks.length,
      mine: tasks.filter((t) => isMine(t, user?.id) && !t.archived).length,
      others: tasks.filter((t) => !isMine(t, user?.id) && !t.archived).length,
      important: tasks.filter((t) => isImportant(t) && !t.done && !t.archived).length,
      archive: tasks.filter((t) => t.archived || t.done).length,
    };
  }, [tasks, user?.id]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return tasks
      .filter((t) => {
        if (tab === "all") return true;
        if (tab === "mine") return !t.archived && isMine(t, user?.id);
        if (tab === "others") return !t.archived && !isMine(t, user?.id);
        if (tab === "important") return !t.archived && isImportant(t) && !t.done;
        if (tab === "archive") return !!t.archived || t.done;
        return true;
      })
      .filter((t) => (catFilter === "all" ? true : t.category === catFilter))
      .filter((t) => (prioFilter === "all" ? true : t.priority === prioFilter))
      .filter((t) => (statusFilter === "all" ? true : t.status === statusFilter))
      .filter((t) => {
        if (!needle) return true;
        return (
          t.title.toLowerCase().includes(needle) ||
          t.category.toLowerCase().includes(needle) ||
          (t.assigneeName ?? "").toLowerCase().includes(needle) ||
          (t.description ?? "").toLowerCase().includes(needle)
        );
      })
      .sort((a, b) => a.number - b.number);
  }, [tasks, tab, user?.id, catFilter, prioFilter, statusFilter, q]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageSafe = Math.min(page, pageCount);
  const pageRows = filtered.slice((pageSafe - 1) * pageSize, pageSafe * pageSize);
  const selected = tasks.find((t) => t.id === selectedId) ?? null;

  useEffect(() => {
    if (selectedId && !tasks.some((t) => t.id === selectedId)) setSelectedId(null);
  }, [tasks, selectedId]);

  useEffect(() => {
    if (didAutoOpen.current || selectedId || filtered.length === 0) return;
    setSelectedId(filtered[0].id);
    setDrawerTab("details");
    didAutoOpen.current = true;
  }, [filtered, selectedId]);

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setDue(new Date().toISOString().slice(0, 10));
    setPriority("medium");
    setCategory("HR");
    setDescription("");
    setAssigneeId(user?.id ?? "");
  };

  const openCreate = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEdit = (t: HrTask) => {
    setEditingId(t.id);
    setTitle(t.title);
    setDue(t.due);
    setPriority(t.priority);
    setCategory(t.category);
    setDescription(t.description ?? t.note ?? "");
    setAssigneeId(t.assigneeId ?? user?.id ?? "");
    setModalOpen(true);
  };

  const save = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    const assignee = directoryUsers.find((u) => u.id === assigneeId);
    if (editingId) {
      updateTask(editingId, {
        title: trimmed,
        due,
        priority,
        category,
        description: description.trim() || undefined,
        assigneeId,
        assigneeName: assignee?.name ?? user?.name,
      });
    } else {
      const id = addTask({
        title: trimmed,
        due,
        priority,
        category,
        description: description.trim() || undefined,
        assigneeId,
        assigneeName: assignee?.name ?? user?.name,
      });
      if (id) setSelectedId(id);
      setTab("mine");
    }
    setModalOpen(false);
    resetForm();
  };

  const toggleCheck = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllPage = () => {
    const ids = pageRows.map((r) => r.id);
    const allOn = ids.every((id) => checked.has(id));
    setChecked((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => (allOn ? next.delete(id) : next.add(id)));
      return next;
    });
  };

  const pageTitle = scope === "mine" ? "Vazifalarim" : "Barcha vazifalar";
  const pageSubtitle =
    scope === "mine"
      ? "HR xodim o'z vazifalarini ko'radi, kuzatadi va bajaradi."
      : "Tashkilotdagi barcha HR vazifalarini boshqaring.";

  const subDone = selected?.subtasks?.filter((s) => s.done).length ?? 0;
  const subTotal = selected?.subtasks?.length ?? 0;
  const subPct = subTotal ? Math.round((subDone / subTotal) * 100) : 0;

  return (
    <div className="relative -mx-1">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E8F1FF] text-brand-600 shadow-sm">
            <ClipboardList className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-[22px] font-bold tracking-tight text-slate-900">{pageTitle}</h1>
            <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-slate-500">{pageSubtitle}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-[13px] font-medium text-slate-600 shadow-sm transition hover:bg-slate-50"
          >
            <CalendarDays className="h-4 w-4 text-slate-400" />
            {formatLongDate()}
          </button>
          <Button onClick={openCreate} className="h-10 rounded-xl bg-brand-600 px-4 shadow-sm hover:bg-brand-700">
            <Plus className="h-4 w-4" />
            Yangi vazifa
          </Button>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard
          label="Jami vazifalar"
          value={stats.total}
          hint="+3"
          hintTone="green"
          icon={<ClipboardList className="h-4 w-4" />}
          iconClass="bg-[#EEF3FF] text-brand-600"
        />
        <KpiCard
          label="Bajarilishi kutilayotgan"
          value={stats.pending}
          icon={<Clock3 className="h-4 w-4" />}
          iconClass="bg-amber-50 text-amber-600"
        />
        <KpiCard
          label="Bajarilgan"
          value={stats.done}
          hint="+2"
          hintTone="green"
          icon={<CheckCircle2 className="h-4 w-4" />}
          iconClass="bg-emerald-50 text-emerald-600"
        />
        <KpiCard
          label="Muddati o'tgan"
          value={stats.overdue}
          icon={<AlertCircle className="h-4 w-4" />}
          iconClass="bg-red-50 text-red-600"
          valueClass="text-red-600"
        />
        <KpiCard
          label="Mening vazifalarim"
          value={stats.mine}
          icon={<UserRound className="h-4 w-4" />}
          iconClass="bg-violet-50 text-violet-600"
        />
      </div>

      <div className={cn("grid gap-4", selected ? "xl:grid-cols-[minmax(0,1fr)_400px]" : "")}>
        <Card className="overflow-hidden rounded-2xl border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
          <div className="flex gap-0.5 overflow-x-auto border-b border-slate-100 px-3 pt-1 sm:px-4">
            {(
              [
                { id: "all", label: "Barchasi", count: tabCounts.all },
                { id: "mine", label: "Menda", count: tabCounts.mine },
                { id: "others", label: "Boshqalar", count: tabCounts.others },
                { id: "important", label: "Muhim", count: tabCounts.important },
                { id: "archive", label: "Arxiv", count: tabCounts.archive },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  "relative shrink-0 px-3 py-3 text-[13px] font-medium transition",
                  tab === t.id ? "text-brand-600" : "text-slate-500 hover:text-slate-800",
                )}
              >
                {t.label}
                <span
                  className={cn(
                    "ml-1.5 inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-[11px] font-semibold",
                    tab === t.id ? "bg-brand-50 text-brand-600" : "bg-slate-100 text-slate-500",
                  )}
                >
                  {t.count}
                </span>
                {tab === t.id && <span className="absolute inset-x-2 bottom-0 h-[2px] rounded-full bg-brand-600" />}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-3 py-3 sm:px-4">
            <div className="relative min-w-[220px] flex-[1.4]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Vazifa nomi, tavsif, mas'ul, kategoriya..."
                className="h-9 w-full rounded-xl border border-slate-200 bg-[#F8FAFC] pl-9 pr-3 text-[13px] outline-none ring-brand-500/15 placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:ring-4"
              />
            </div>
            <FilterSelect value={catFilter} onChange={setCatFilter}>
              <option value="all">Barcha kategoriyalar</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect value={prioFilter} onChange={setPrioFilter}>
              <option value="all">Barcha ustuvorliklar</option>
              {(Object.keys(priorityLabel) as Priority[]).map((p) => (
                <option key={p} value={p}>
                  {priorityLabel[p]}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect value={statusFilter} onChange={setStatusFilter}>
              <option value="all">Barcha holatlar</option>
              {(Object.keys(STATUS_META) as TaskStatus[]).map((s) => (
                <option key={s} value={s}>
                  {STATUS_META[s].label}
                </option>
              ))}
            </FilterSelect>
            <button
              type="button"
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-[12px] font-medium text-slate-600 transition hover:bg-slate-50"
            >
              <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
              Sana oralig'i
            </button>
            <button
              type="button"
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-[12px] font-medium text-slate-600 transition hover:bg-slate-50"
            >
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              Filtrlar
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-[#F8FAFC] text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={pageRows.length > 0 && pageRows.every((r) => checked.has(r.id))}
                      onChange={toggleAllPage}
                      className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                  </th>
                  <th className="w-10 px-2 py-3">#</th>
                  <th className="px-3 py-3">Vazifa nomi</th>
                  <th className="px-3 py-3">Kategoriya</th>
                  <th className="px-3 py-3">Muddat</th>
                  <th className="px-3 py-3">Ustuvorlik</th>
                  <th className="px-3 py-3">Holat</th>
                  <th className="px-3 py-3">Mas'ul</th>
                  <th className="w-12 px-3 py-3" />
                </tr>
              </thead>
              <tbody>
                {pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-16 text-center">
                      <ClipboardList className="mx-auto h-10 w-10 text-slate-300" />
                      <p className="mt-3 text-sm font-medium text-slate-700">Vazifa topilmadi</p>
                      <p className="mt-1 text-xs text-slate-400">Filtrni o'zgartiring yoki yangi vazifa qo'shing.</p>
                    </td>
                  </tr>
                ) : (
                  pageRows.map((t) => {
                    const mine = isMine(t, user?.id);
                    return (
                      <tr
                        key={t.id}
                        onClick={() => {
                          setSelectedId(t.id);
                          setDrawerTab("details");
                        }}
                        className={cn(
                          "cursor-pointer border-b border-slate-50 transition",
                          selectedId === t.id ? "bg-brand-50/50" : "hover:bg-slate-50/90",
                        )}
                      >
                        <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={checked.has(t.id)}
                            onChange={() => toggleCheck(t.id)}
                            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                          />
                        </td>
                        <td className="px-2 py-3.5 text-[13px] tabular-nums text-slate-400">{t.number}</td>
                        <td className="px-3 py-3.5">
                          <div
                            className={cn(
                              "max-w-[260px] truncate text-[13px] font-semibold text-slate-800",
                              t.done && "text-slate-400 line-through",
                            )}
                          >
                            {t.title}
                          </div>
                        </td>
                        <td className="px-3 py-3.5">
                          <span className="inline-flex rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600">
                            {t.category}
                          </span>
                        </td>
                        <td className="px-3 py-3.5 text-[13px] tabular-nums text-slate-600">{formatDateDot(t.due)}</td>
                        <td className="px-3 py-3.5">
                          <PriorityPill priority={t.priority} />
                        </td>
                        <td className="px-3 py-3.5">
                          <StatusPill status={t.status} />
                        </td>
                        <td className="px-3 py-3.5">
                          <div className="flex items-center gap-2">
                            <Avatar name={t.assigneeName ?? "?"} size="sm" />
                            <span className="text-[13px] font-medium text-slate-700">
                              {assigneeShort(t.assigneeName, mine)}
                            </span>
                          </div>
                        </td>
                        <td className="relative px-3 py-3.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                            onClick={() => setMenuId(menuId === t.id ? null : t.id)}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                          {menuId === t.id && (
                            <div className="absolute right-4 top-10 z-20 w-40 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                              <MenuBtn
                                onClick={() => {
                                  setSelectedId(t.id);
                                  setMenuId(null);
                                }}
                              >
                                Ko'rish
                              </MenuBtn>
                              <MenuBtn
                                onClick={() => {
                                  openEdit(t);
                                  setMenuId(null);
                                }}
                              >
                                Tahrirlash
                              </MenuBtn>
                              <MenuBtn
                                onClick={() => {
                                  markTask(t.id, !t.done);
                                  setMenuId(null);
                                }}
                              >
                                {t.done ? "Qayta ochish" : "Bajarildi"}
                              </MenuBtn>
                              <MenuBtn
                                danger
                                onClick={() => {
                                  if (window.confirm("Vazifani o'chirasizmi?")) deleteTask(t.id);
                                  setMenuId(null);
                                }}
                              >
                                O'chirish
                              </MenuBtn>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-[12px] text-slate-500">
            <div className="flex items-center gap-2">
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-[12px] font-medium text-slate-600 outline-none"
              >
                {[5, 10, 20, 50].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <span>
                {filtered.length === 0
                  ? "0 vazifa"
                  : `${(pageSafe - 1) * pageSize + 1}–${Math.min(pageSafe * pageSize, filtered.length)} dan ${filtered.length} ta vazifa`}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={pageSafe <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 transition hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPage(n)}
                  className={cn(
                    "inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-[12px] font-semibold transition",
                    pageSafe === n
                      ? "bg-brand-600 text-white shadow-sm"
                      : "border border-slate-200 text-slate-600 hover:bg-slate-50",
                  )}
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                disabled={pageSafe >= pageCount}
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 transition hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </Card>

        {selected && (
          <aside className="flex max-h-[calc(100vh-7.5rem)] flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)] xl:sticky xl:top-20">
            <div className="flex items-start justify-between gap-2 border-b border-slate-100 px-5 py-4">
              <div className="min-w-0">
                <h2 className="text-[15px] font-bold leading-snug text-slate-900">{selected.title}</h2>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  <StatusPill status={selected.status} />
                  <PriorityPill priority={selected.priority} />
                </div>
              </div>
              <button
                type="button"
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                onClick={() => setSelectedId(null)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex gap-0.5 overflow-x-auto border-b border-slate-100 px-3">
              {(
                [
                  { id: "details", label: "Tafsilotlar" },
                  { id: "files", label: `Fayllar (${selected.files?.length ?? 0})` },
                  { id: "comments", label: `Izohlar (${selected.comments?.length ?? 0})` },
                  { id: "subtasks", label: `Subvazifalar (${selected.subtasks?.length ?? 0})` },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setDrawerTab(t.id)}
                  className={cn(
                    "relative shrink-0 px-2.5 py-3 text-[12px] font-medium transition",
                    drawerTab === t.id ? "text-brand-600" : "text-slate-500 hover:text-slate-700",
                  )}
                >
                  {t.label}
                  {drawerTab === t.id && <span className="absolute inset-x-1 bottom-0 h-[2px] rounded-full bg-brand-600" />}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {drawerTab === "details" && (
                <div className="space-y-5">
                  {selected.description && (
                    <p className="text-[13px] leading-relaxed text-slate-600">{selected.description}</p>
                  )}

                  <div className="space-y-3.5">
                    <MetaIconRow icon={<FolderOpen className="h-3.5 w-3.5" />} label="Kategoriya" value={selected.category} />
                    <MetaIconRow icon={<CalendarDays className="h-3.5 w-3.5" />} label="Muddat" value={formatDateDot(selected.due)} />
                    <MetaIconRow
                      icon={<UserRound className="h-3.5 w-3.5" />}
                      label="Mas'ul"
                      value={
                        <span className="inline-flex items-center gap-2">
                          <Avatar name={selected.assigneeName ?? "?"} size="sm" />
                          <span>
                            {selected.assigneeName ?? "—"}
                            {isMine(selected, user?.id) ? " (Men)" : ""}
                          </span>
                        </span>
                      }
                    />
                    <MetaIconRow
                      icon={<Tag className="h-3.5 w-3.5" />}
                      label="Teglar"
                      value={
                        <span className="flex flex-wrap justify-end gap-1">
                          {(selected.tags ?? []).map((tag) => (
                            <span
                              key={tag}
                              className="rounded-md bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-700"
                            >
                              {tag}
                            </span>
                          ))}
                          {(selected.tags ?? []).length === 0 && <span className="text-slate-400">—</span>}
                        </span>
                      }
                    />
                    <MetaIconRow
                      icon={<Clock3 className="h-3.5 w-3.5" />}
                      label="Yaratilgan"
                      value={formatDateDot(selected.createdAt)}
                    />
                  </div>

                  {subTotal > 0 && (
                    <div className="rounded-xl border border-slate-100 bg-[#F8FAFC]/p-3.5">
                      <div className="mb-2 flex items-center justify-between">
                        <h3 className="text-[13px] font-semibold text-slate-800">Bajarish jarayoni</h3>
                        <div className="flex items-center gap-2 text-[12px]">
                          <span className="font-semibold text-brand-600">{subPct}%</span>
                          <span className="text-slate-400">
                            {subDone}/{subTotal}
                          </span>
                        </div>
                      </div>
                      <div className="mb-3 h-2 overflow-hidden rounded-full bg-slate-200/80">
                        <div
                          className="h-full rounded-full bg-brand-600 transition-all duration-300"
                          style={{ width: `${subPct}%` }}
                        />
                      </div>
                      <ul className="space-y-1.5">
                        {selected.subtasks!.map((s) => (
                          <li key={s.id}>
                            <button
                              type="button"
                              onClick={() => toggleSubtask(selected.id, s.id)}
                              className="flex w-full items-start gap-2.5 rounded-lg px-1 py-1.5 text-left transition hover:bg-white"
                            >
                              <span
                                className={cn(
                                  "mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border-2 transition",
                                  s.done
                                    ? "border-emerald-500 bg-emerald-500 text-white"
                                    : "border-slate-300 bg-white",
                                )}
                              >
                                {s.done && <Check className="h-3 w-3" strokeWidth={3} />}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span
                                  className={cn(
                                    "block text-[13px] text-slate-700",
                                    s.done && "text-slate-400 line-through",
                                  )}
                                >
                                  {s.title}
                                </span>
                                {s.doneAt && <span className="text-[11px] text-slate-400">{s.doneAt}</span>}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {drawerTab === "files" && (
                <div className="space-y-2">
                  {(selected.files ?? []).length === 0 && (
                    <p className="py-8 text-center text-sm text-slate-400">Fayl yo'q</p>
                  )}
                  {(selected.files ?? []).map((f) => (
                    <div
                      key={f.id}
                      className="flex items-center gap-3 rounded-xl border border-slate-100 bg-[#F8FAFC] px-3 py-2.5 transition hover:bg-white"
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                        <FileText className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] font-medium text-slate-800">{f.name}</div>
                        <div className="text-[11px] text-slate-400">{f.size}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {drawerTab === "comments" && (
                <div className="space-y-3">
                  {(selected.comments ?? []).length === 0 && (
                    <p className="py-8 text-center text-sm text-slate-400">Izoh yo'q</p>
                  )}
                  {(selected.comments ?? []).map((c) => (
                    <div key={c.id} className="rounded-xl border border-slate-100 bg-[#F8FAFC] px-3 py-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[12px] font-semibold text-slate-800">{c.authorName}</span>
                        <span className="text-[11px] text-slate-400">{c.at}</span>
                      </div>
                      <p className="mt-1 text-[13px] leading-relaxed text-slate-600">{c.text}</p>
                    </div>
                  ))}
                </div>
              )}

              {drawerTab === "subtasks" && (
                <div className="space-y-2">
                  {(selected.subtasks ?? []).length === 0 && (
                    <p className="py-8 text-center text-sm text-slate-400">Subvazifa yo'q</p>
                  )}
                  {(selected.subtasks ?? []).map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleSubtask(selected.id, s.id)}
                      className="flex w-full items-center gap-2.5 rounded-xl border border-slate-100 px-3 py-2.5 text-left transition hover:bg-slate-50"
                    >
                      <span
                        className={cn(
                          "flex h-5 w-5 items-center justify-center rounded-[5px] border-2",
                          s.done ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300",
                        )}
                      >
                        {s.done && <Check className="h-3 w-3" strokeWidth={3} />}
                      </span>
                      <span className={cn("text-[13px]", s.done && "text-slate-400 line-through")}>{s.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2 border-t border-slate-100 px-4 py-3">
              <Button
                className="flex-1"
                onClick={() => {
                  markTask(selected.id, true);
                  updateTask(selected.id, { status: "done" });
                }}
                disabled={selected.done}
              >
                <Check className="h-4 w-4" />
                Bajarildi
              </Button>
              <Button
                variant="outline"
                className="border-brand-200 text-brand-600 hover:bg-brand-50"
                onClick={() => openEdit(selected)}
              >
                <Pencil className="h-3.5 w-3.5" />
                Tahrirlash
              </Button>
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
          </aside>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          resetForm();
        }}
        title={editingId ? "Vazifani tahrirlash" : "Yangi vazifa"}
      >
        <div className="space-y-4">
          <Field label="Sarlavha">
            <Input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Vazifa nomi" />
          </Field>
          <Field label="Tavsif">
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Qisqa tavsif..." />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Muddat">
              <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
            </Field>
            <Field label="Ustuvorlik">
              <Select value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
                {(Object.keys(priorityLabel) as Priority[]).map((p) => (
                  <option key={p} value={p}>
                    {priorityLabel[p]}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Kategoriya">
              <Select value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Mas'ul">
              <Select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
                {directoryUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setModalOpen(false);
                resetForm();
              }}
            >
              Bekor
            </Button>
            <Button onClick={save} disabled={!title.trim()}>
              {editingId ? "Saqlash" : "Qo'shish"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export function TaskTemplatesPage() {
  const { addTask } = useApp();
  return (
    <div>
      <div className="mb-5 flex items-start gap-3">
        <span className="mt-0.5 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E8F1FF] text-brand-600">
          <LayoutTemplate className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-slate-900">Shablonlar</h1>
          <p className="mt-1 text-[13px] text-slate-500">Tez-tez takrorlanadigan vazifalar uchun shablonlar.</p>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {TASK_TEMPLATES.map((tpl) => (
          <Card key={tpl.id} className="p-5">
            <div className="text-[15px] font-semibold text-slate-900">{tpl.title}</div>
            <div className="mt-2 flex flex-wrap gap-2 text-[12px] text-slate-500">
              <span className="rounded-lg bg-slate-100 px-2 py-1 font-medium text-slate-600">{tpl.category}</span>
              <span>{tpl.steps} qadam</span>
              <span>{priorityLabel[tpl.priority]}</span>
            </div>
            <Button
              className="mt-4"
              size="sm"
              onClick={() =>
                addTask({
                  title: tpl.title,
                  due: new Date().toISOString().slice(0, 10),
                  priority: tpl.priority,
                  category: tpl.category,
                })
              }
            >
              <Plus className="h-3.5 w-3.5" />
              Vazifa yaratish
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  children: ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-[12px] font-medium text-slate-600 outline-none transition hover:bg-slate-50 focus:border-brand-500"
    >
      {children}
    </select>
  );
}

function KpiCard({
  label,
  value,
  hint,
  hintTone,
  icon,
  iconClass,
  valueClass,
}: {
  label: string;
  value: number;
  hint?: string;
  hintTone?: "green";
  icon: ReactNode;
  iconClass: string;
  valueClass?: string;
}) {
  return (
    <Card className="rounded-2xl border-slate-200/80 p-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)] transition hover:shadow-[0_4px_16px_rgba(15,23,42,0.06)]">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[12px] font-medium text-slate-500">{label}</div>
          <div className={cn("mt-1.5 text-[28px] font-bold leading-none tracking-tight text-slate-900", valueClass)}>
            {value}
          </div>
          {hint && (
            <div
              className={cn(
                "mt-2 inline-flex rounded-full px-1.5 py-0.5 text-[11px] font-semibold",
                hintTone === "green" ? "bg-emerald-50 text-emerald-600" : "text-slate-400",
              )}
            >
              {hint}
            </div>
          )}
        </div>
        <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl", iconClass)}>{icon}</span>
      </div>
    </Card>
  );
}

function MetaIconRow({ icon, label, value }: { icon: ReactNode; label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 text-[13px]">
      <dt className="flex shrink-0 items-center gap-2 text-slate-400">
        <span className="text-slate-400">{icon}</span>
        {label}
      </dt>
      <dd className="text-right font-medium text-slate-800">{value}</dd>
    </div>
  );
}

function MenuBtn({ children, onClick, danger }: { children: ReactNode; onClick: () => void; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "block w-full px-3 py-2 text-left text-[13px] transition hover:bg-slate-50",
        danger ? "text-red-600" : "text-slate-700",
      )}
    >
      {children}
    </button>
  );
}
