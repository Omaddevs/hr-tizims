import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  Briefcase,
  Building2,
  CalendarClock,
  ClipboardCheck,
  Clock,
  FileText,
  GraduationCap,
  Mic,
  MessageSquare,
  Search,
  Sparkles,
  Trash2,
  User,
  X,
  type LucideIcon,
} from "lucide-react";
import { useApp } from "../store/AppContext";
import { useVoiceRecognition } from "../hooks/useVoiceRecognition";
import { cn, formatDate, leaveTypeLabel, statusLabel } from "../lib/utils";

type Category = "employee" | "document" | "application" | "contract" | "training" | "department" | "message";

interface SearchResult {
  id: string;
  category: Category;
  title: string;
  subtitle: string;
  badge?: string;
  to: string;
  score: number;
}

const CATEGORY_LABEL: Record<Category, string> = {
  employee: "Xodimlar",
  document: "Hujjatlar",
  application: "Arizalar",
  contract: "Shartnomalar",
  training: "Treninglar",
  department: "Bo'limlar",
  message: "Xabarlar",
};

const CATEGORY_ICON: Record<Category, LucideIcon> = {
  employee: User,
  document: FileText,
  application: ClipboardCheck,
  contract: Briefcase,
  training: GraduationCap,
  department: Building2,
  message: MessageSquare,
};

const CATEGORY_TONE: Record<Category, string> = {
  employee: "bg-brand-50 text-brand-600",
  document: "bg-red-50 text-red-600",
  application: "bg-violet-50 text-violet-600",
  contract: "bg-amber-50 text-amber-600",
  training: "bg-sky-50 text-sky-600",
  department: "bg-emerald-50 text-emerald-600",
  message: "bg-slate-100 text-slate-600",
};

const PRIMARY_TABS: Category[] = ["employee", "document", "application"];
const MORE_TABS: Category[] = ["contract", "training", "department", "message"];

const STOP_WORDS = new Set([
  "top", "toping", "topib", "ber", "bering", "bergin", "qidir", "qidiring", "qidirib",
  "izla", "izlang", "koʻrsat", "ko'rsat", "korsat", "korsating", "koʻrsating",
  "bor", "bormi", "bormikan", "kim", "kimlar", "kimning", "qancha", "nechta", "nechа",
  "qaysi", "och", "ochish", "royxati", "ro'yxati", "roʻyxati", "haqida", "malumot",
  "ma'lumot", "maʼlumot", "malumotini", "va", "yoki", "uchun", "bilan", "bu", "shu",
  "edi", "de", "deng", "ekan", "keyin", "oldin", "haqida", "menga",
]);

const VOICE_EXAMPLES = [
  "Karimovning mehnat shartnomasini och",
  "Iyun oyidagi ta'til kimlar bor?",
  "Marketing bo'limidagi xodim ro'yxati",
  "Bugungi uchrashuvlar",
  "Tibbiy ma'lumotnomani top",
];

function normalize(s: string) {
  return s
    .toLowerCase()
    .replace(/['’ʻʼ`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(s: string) {
  return normalize(s)
    .split(/[^a-z0-9À-ɏʻʼ]+/)
    .filter((t) => t.length >= 2 && !STOP_WORDS.has(t));
}

function scoreBlob(blob: string, query: string, tokens: string[]) {
  let score = 0;
  if (query.length >= 2 && blob.includes(query)) score += 6;
  for (const t of tokens) {
    if (blob.includes(t)) score += 1;
  }
  return score;
}

const HISTORY_KEY = "tizims.search.history";
const HISTORY_LIMIT = 8;

function loadHistory(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === "string" && x.trim().length > 0).slice(0, HISTORY_LIMIT);
  } catch {
    return [];
  }
}

function saveHistory(list: string[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, HISTORY_LIMIT)));
  } catch {
    // localStorage unavailable (private mode, quota) — history just won't persist
  }
}

export function GlobalSearchBar({ variant = "bar" }: { variant?: "bar" | "icon" }) {
  const { employees, departments, leaves, requests, assignments, catalog } = useApp();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Category | "all">("all");
  const [showMoreTabs, setShowMoreTabs] = useState(false);
  const [fromVoice, setFromVoice] = useState(false);
  const [history, setHistory] = useState<string[]>(() => loadHistory());
  const nav = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const voice = useVoiceRecognition("uz-UZ");

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
        setFromVoice(false);
        requestAnimationFrame(() => inputRef.current?.focus());
      }
      if (e.key === "Escape") {
        setOpen(false);
        setVoiceOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const employeeName = useMemo(() => {
    const map = new Map(employees.map((e) => [e.id, e.fullName]));
    return (id: string) => map.get(id) ?? "Noma'lum xodim";
  }, [employees]);

  const departmentName = useMemo(() => {
    const map = new Map(departments.map((d) => [d.id, d.name]));
    return (id: string) => map.get(id) ?? "";
  }, [departments]);

  const results = useMemo<SearchResult[]>(() => {
    const q = normalize(query);
    if (q.length < 1) return [];
    const tokens = tokenize(query);
    if (tokens.length === 0 && q.length < 2) return [];

    const list: SearchResult[] = [];

    for (const e of employees) {
      const dept = departmentName(e.departmentId);
      const blob = normalize(
        [
          e.fullName, e.firstName, e.lastName, e.employeeId, e.passport, e.jshshir,
          e.phone, e.email, e.position, dept, e.dateOfBirth, formatDate(e.dateOfBirth),
          e.startDate, formatDate(e.startDate), e.category, e.education?.specialty,
          e.education?.academicDegree, e.education?.university, statusLabel[e.status],
        ].filter(Boolean).join(" "),
      );
      const score = scoreBlob(blob, q, tokens);
      if (score > 0) {
        list.push({
          id: `emp-${e.id}`,
          category: "employee",
          title: e.fullName,
          subtitle: `${e.position}${dept ? " · " + dept : ""}`,
          badge: "Xodim",
          to: `/employees/${e.id}`,
          score,
        });
      }
    }

    for (const d of catalog.documents) {
      const empName = employeeName(d.employeeId);
      const blob = normalize([d.name, d.folder, d.type, d.date, formatDate(d.date), empName].join(" "));
      const score = scoreBlob(blob, q, tokens);
      if (score > 0) {
        list.push({
          id: `doc-${d.id}`,
          category: "document",
          title: d.name,
          subtitle: `${empName} · ${d.folder} · ${formatDate(d.date)}`,
          badge: d.type,
          to: `/employees/${d.employeeId}`,
          score,
        });
      }
    }

    for (const l of leaves) {
      const empName = employeeName(l.employeeId);
      const typeLabel = leaveTypeLabel[l.type] ?? l.type;
      const blob = normalize(
        [typeLabel, l.reason, empName, l.startDate, formatDate(l.startDate), l.endDate, formatDate(l.endDate), statusLabel[l.status]]
          .join(" "),
      );
      const score = scoreBlob(blob, q, tokens);
      if (score > 0) {
        list.push({
          id: `leave-${l.id}`,
          category: "application",
          title: `${typeLabel} arizasi — ${empName}`,
          subtitle: `${formatDate(l.startDate)} – ${formatDate(l.endDate)} · ${l.days} kun`,
          badge: statusLabel[l.status],
          to: `/employees/${l.employeeId}`,
          score,
        });
      }
    }

    for (const r of requests) {
      const empName = employeeName(r.employeeId);
      const blob = normalize([r.title, r.type, empName, statusLabel[r.status], r.createdAt, formatDate(r.createdAt)].join(" "));
      const score = scoreBlob(blob, q, tokens);
      if (score > 0) {
        list.push({
          id: `req-${r.id}`,
          category: "application",
          title: r.title,
          subtitle: `${empName} · ${r.type}`,
          badge: statusLabel[r.status],
          to: `/employees/${r.employeeId}`,
          score,
        });
      }
    }

    for (const c of catalog.contracts) {
      const empName = employeeName(c.employeeId);
      const dept = departmentName(c.departmentId);
      const blob = normalize(
        [c.type, empName, c.position, dept, c.startDate, formatDate(c.startDate), c.endDate, formatDate(c.endDate), statusLabel[c.status]]
          .join(" "),
      );
      const score = scoreBlob(blob, q, tokens);
      if (score > 0) {
        list.push({
          id: `con-${c.id}`,
          category: "contract",
          title: `${empName} — mehnat shartnomasi`,
          subtitle: `${c.position}${dept ? " · " + dept : ""}`,
          badge: statusLabel[c.status],
          to: `/employees/${c.employeeId}`,
          score,
        });
      }
    }

    for (const t of catalog.trainings) {
      const blob = normalize([t.title, t.type, t.date, formatDate(t.date)].join(" "));
      const score = scoreBlob(blob, q, tokens);
      if (score > 0) {
        list.push({
          id: `tr-${t.id}`,
          category: "training",
          title: t.title,
          subtitle: `${t.type} · ${formatDate(t.date)}`,
          badge: t.mandatory ? "Majburiy" : undefined,
          to: "/training",
          score,
        });
      }
    }

    for (const dep of departments) {
      const blob = normalize([dep.name, dep.type].join(" "));
      const score = scoreBlob(blob, q, tokens);
      if (score > 0) {
        list.push({
          id: `dept-${dep.id}`,
          category: "department",
          title: dep.name,
          subtitle: `Bo'lim · ${dep.employeeCount} xodim`,
          to: `/org/${dep.id}`,
          score,
        });
      }
    }

    for (const a of assignments) {
      const blob = normalize([a.title, a.body].join(" "));
      const score = scoreBlob(blob, q, tokens);
      if (score > 0) {
        list.push({
          id: `asg-${a.id}`,
          category: "message",
          title: a.title,
          subtitle: a.body.slice(0, 80),
          to: "/inbox",
          score,
        });
      }
    }

    return list.sort((a, b) => b.score - a.score);
  }, [query, employees, departments, leaves, requests, assignments, catalog, employeeName, departmentName]);

  const counts = useMemo(() => {
    const c: Record<Category, number> = { employee: 0, document: 0, application: 0, contract: 0, training: 0, department: 0, message: 0 };
    for (const r of results) c[r.category] += 1;
    return c;
  }, [results]);

  const filtered = activeTab === "all" ? results : results.filter((r) => r.category === activeTab);
  const shown = filtered.slice(0, 8);
  const remaining = filtered.length - shown.length;

  function commitToHistory(q: string) {
    const trimmed = q.trim();
    if (trimmed.length < 2) return;
    setHistory((prev) => {
      const next = [trimmed, ...prev.filter((x) => x.toLowerCase() !== trimmed.toLowerCase())].slice(0, HISTORY_LIMIT);
      saveHistory(next);
      return next;
    });
  }

  function removeHistoryItem(q: string) {
    setHistory((prev) => {
      const next = prev.filter((x) => x !== q);
      saveHistory(next);
      return next;
    });
  }

  function clearHistory() {
    setHistory([]);
    saveHistory([]);
  }

  function applyHistoryItem(q: string) {
    setQuery(q);
    setFromVoice(false);
    setActiveTab("all");
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function goTo(r: SearchResult) {
    commitToHistory(query);
    nav(r.to);
    setOpen(false);
    setQuery("");
  }

  function submitQuery() {
    if (shown.length > 0) {
      goTo(shown[0]);
      return;
    }
    commitToHistory(query);
  }

  function openVoice() {
    setOpen(false);
    setVoiceOpen(true);
    voice.reset();
    voice.start((text) => {
      setQuery(text);
      setFromVoice(true);
      commitToHistory(text);
      window.setTimeout(() => {
        setVoiceOpen(false);
        setOpen(true);
        setActiveTab("all");
      }, 500);
    });
  }

  function closeVoice() {
    voice.stop();
    setVoiceOpen(false);
  }

  function applyExample(example: string) {
    setQuery(example);
    setFromVoice(true);
    setVoiceOpen(false);
    setOpen(true);
    setActiveTab("all");
    commitToHistory(example);
  }

  const activeTabs = showMoreTabs ? [...PRIMARY_TABS, ...MORE_TABS] : PRIMARY_TABS;

  function openPanel() {
    setOpen(true);
    setFromVoice(false);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  return (
    <div ref={containerRef} className={cn(variant === "bar" && "relative w-full")}>
      {variant === "bar" ? (
        <button
          type="button"
          onClick={openPanel}
          className="flex h-10 w-full items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-left text-sm text-slate-400 transition hover:border-brand-200 hover:bg-white"
        >
          <Search className="h-4 w-4 shrink-0" />
          <span className="truncate">Nima qidiryapsiz? (xodim, hujjat, ta'til, ariza, lavozim, bo'lim, sana, ...)</span>
          <span className="ml-auto flex shrink-0 items-center gap-1.5">
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                openVoice();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.stopPropagation();
                  openVoice();
                }
              }}
              title="Ovoz orqali qidirish"
              className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-white shadow-sm transition hover:bg-brand-700"
            >
              <Mic className="h-3.5 w-3.5" />
            </span>
            <span className="hidden rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 md:inline">
              ⌘K
            </span>
          </span>
        </button>
      ) : (
        <button type="button" className="rounded-xl p-2 text-slate-500 hover:bg-slate-100" onClick={openPanel} title="Qidiruv">
          <Search className="h-5 w-5" />
        </button>
      )}

      {open && (
        <div
          className={cn(
            "absolute z-30 w-[min(92vw,420px)] rounded-2xl border border-slate-200 bg-white p-3 shadow-nav",
            variant === "bar" ? "left-0 top-12" : "right-0 top-11",
          )}
        >
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 focus-within:border-brand-400">
            <Search className="h-4 w-4 shrink-0 text-slate-400" />
            <input
              ref={inputRef}
              autoFocus
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setFromVoice(false);
                setActiveTab("all");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  submitQuery();
                }
              }}
              placeholder="Ism, familiya, pasport, lavozim, sana..."
              className="h-10 w-full bg-transparent text-sm outline-none"
            />
            <button
              type="button"
              onClick={openVoice}
              title="Ovoz orqali qidirish"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-brand-50 hover:text-brand-600"
            >
              <Mic className="h-4 w-4" />
            </button>
            {query && (
              <button type="button" onClick={() => setQuery("")} className="shrink-0 text-slate-300 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {results.length > 0 && (
            <div className="mt-2 flex items-center justify-between gap-2 px-0.5">
              <div className="flex flex-wrap items-center gap-1.5">
                <TabPill label="Barchasi" count={results.length} active={activeTab === "all"} onClick={() => setActiveTab("all")} />
                {activeTabs.filter((c) => counts[c] > 0).map((c) => (
                  <TabPill key={c} label={CATEGORY_LABEL[c]} count={counts[c]} active={activeTab === c} onClick={() => setActiveTab(c)} />
                ))}
                {!showMoreTabs && MORE_TABS.some((c) => counts[c] > 0) && (
                  <button
                    type="button"
                    onClick={() => setShowMoreTabs(true)}
                    className="rounded-full px-2 py-1 text-[11px] font-semibold text-slate-400 hover:bg-slate-100"
                  >
                    ...
                  </button>
                )}
              </div>
              {fromVoice && (
                <span className="hidden shrink-0 items-center gap-1 text-[10px] font-medium text-emerald-600 sm:flex">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Ovoz orqali
                </span>
              )}
            </div>
          )}

          {query.trim().length === 0 && (
            <div className="mt-2">
              {history.length > 0 ? (
                <>
                  <div className="flex items-center justify-between px-1 pb-1">
                    <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
                      <Clock className="h-3.5 w-3.5" /> Qidiruvlar tarixi
                    </span>
                    <button
                      type="button"
                      onClick={clearHistory}
                      className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-slate-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-3 w-3" /> Tozalash
                    </button>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {history.map((h) => (
                      <div key={h} className="group flex items-center gap-1 rounded-xl pr-1 hover:bg-slate-50">
                        <button
                          type="button"
                          onClick={() => applyHistoryItem(h)}
                          className="flex min-w-0 flex-1 items-center gap-3 px-2 py-2 text-left"
                        >
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                            <Clock className="h-4 w-4" />
                          </span>
                          <span className="min-w-0 flex-1 truncate text-sm text-slate-600">{h}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => removeHistoryItem(h)}
                          title="O'chirish"
                          className="shrink-0 rounded-md p-1.5 text-slate-300 opacity-0 transition group-hover:opacity-100 hover:text-red-500"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="px-2 py-8 text-center text-xs text-slate-400">
                  Qidiruv boshlash uchun yozing yoki mikrofondan foydalaning
                </div>
              )}
            </div>
          )}

          <div className="mt-2 max-h-80 overflow-y-auto">
            {query.trim().length > 0 && results.length === 0 && (
              <div className="px-2 py-8 text-center text-xs text-slate-400">Hech narsa topilmadi</div>
            )}
            {shown.map((r) => {
              const Icon = CATEGORY_ICON[r.category];
              return (
                <button
                  key={r.id}
                  onClick={() => goTo(r)}
                  className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-slate-50"
                >
                  <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", CATEGORY_TONE[r.category])}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-slate-800">{r.title}</span>
                    <span className="block truncate text-xs text-slate-400">{r.subtitle}</span>
                  </span>
                  {r.badge && (
                    <span className="shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                      {r.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {remaining > 0 && (
            <div className="mt-1 border-t border-slate-100 px-2 pt-2 text-center text-[11px] text-slate-400">
              Yana {remaining} ta natija mavjud
            </div>
          )}
        </div>
      )}

      {voiceOpen && (
        <VoiceSearchModal
          listening={voice.listening}
          supported={voice.supported}
          interimText={voice.interimText}
          error={voice.error}
          onClose={closeVoice}
          onExample={applyExample}
        />
      )}
    </div>
  );
}

function TabPill({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition",
        active ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200",
      )}
    >
      {label}
      <span className={cn("rounded-full px-1", active ? "bg-white/20" : "bg-white text-slate-400")}>{count}</span>
    </button>
  );
}

function VoiceSearchModal({
  listening,
  supported,
  interimText,
  error,
  onClose,
  onExample,
}: {
  listening: boolean;
  supported: boolean;
  interimText: string;
  error: string | null;
  onClose: () => void;
  onExample: (text: string) => void;
}) {
  return createPortal(
    <div
      className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 pt-[6vh]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[440px] rounded-3xl bg-white p-6 text-center shadow-nav sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-end">
          <button className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="relative mx-auto flex h-24 w-24 items-center justify-center">
          {listening && (
            <>
              <span className="absolute inset-0 animate-ping rounded-full bg-brand-400/30" style={{ animationDuration: "1.6s" }} />
              <span className="absolute inset-2 animate-ping rounded-full bg-brand-400/30" style={{ animationDuration: "1.6s", animationDelay: "0.3s" }} />
            </>
          )}
          <span
            className={cn(
              "relative flex h-16 w-16 items-center justify-center rounded-full text-white shadow-lg",
              error ? "bg-red-500" : "bg-gradient-to-br from-brand-500 to-brand-700",
            )}
          >
            {error ? <AlertCircle className="h-7 w-7" /> : <Mic className="h-7 w-7" />}
          </span>
        </div>

        {listening && !error && (
          <div className="mt-4 flex items-center justify-center gap-1">
            {Array.from({ length: 9 }).map((_, i) => (
              <span
                key={i}
                className="w-1 rounded-full bg-brand-400"
                style={{
                  height: `${10 + ((i * 7) % 22)}px`,
                  animation: "voice-eq 0.9s ease-in-out infinite",
                  animationDelay: `${i * 0.08}s`,
                }}
              />
            ))}
          </div>
        )}

        <p className="mt-4 text-base font-semibold text-slate-800">
          {error ? "Xatolik" : listening ? "Eshityapman..." : interimText ? "Tayyor" : "Tayyorlanmoqda..."}
        </p>
        <p className="mt-1 min-h-[20px] text-sm text-slate-500">
          {error ?? interimText ?? "Gapirishni boshlang"}
        </p>

        {!supported && !error && (
          <p className="mt-2 text-xs text-amber-600">
            Brauzeringiz ovozli kiritishni qo'llab-quvvatlamaydi. Quyidagi misollardan birini tanlang.
          </p>
        )}

        <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-left">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <Sparkles className="h-3.5 w-3.5 text-brand-500" /> Masalan, shunday deng:
          </p>
          <div className="space-y-1.5">
            {VOICE_EXAMPLES.map((ex) => (
              <button
                key={ex}
                onClick={() => onExample(ex)}
                className="block w-full truncate rounded-lg px-2 py-1.5 text-left text-[13px] text-slate-600 hover:bg-white hover:text-brand-700"
              >
                "{ex}"
              </button>
            ))}
          </div>
        </div>

        <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <CalendarClock className="h-3.5 w-3.5" /> Ovoz orqali qidiruv — ism, familiya, pasport, sana, lavozim, barcha bo'limlarda ishlaydi
        </p>
      </div>
    </div>,
    document.body,
  );
}
