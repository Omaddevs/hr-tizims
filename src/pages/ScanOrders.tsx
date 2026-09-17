import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  CloudUpload,
  Download,
  Eye,
  FileText,
  Filter,
  HardDrive,
  MoreHorizontal,
  Plus,
  RefreshCw,
  ScanLine,
  Search,
  Settings2,
  Wifi,
  Zap,
} from "lucide-react";
import { Badge, Card, Select, TableWrap, Td, Th } from "../components/ui";
import { OrderViewPanel } from "../components/OrderDocViewer";
import { cn } from "../lib/utils";
import { printBlankOrder } from "../lib/official";

export type ScanKind = "K" | "P" | "N";

type ScanStatus = "auto" | "processing" | "error";
type MainTab = "scan" | "list" | "history" | "settings";

type ScanDoc = {
  id: string;
  name: string;
  number: string;
  date: string;
  time: string;
  size: string;
  status: ScanStatus;
  department: string;
  subject: string;
  person: string;
  description: string;
};

const STATUS_META: Record<ScanStatus, { label: string; tone: "green" | "amber" | "red" }> = {
  auto: { label: "Avto yuklangan", tone: "green" },
  processing: { label: "Qayta ishlashda", tone: "amber" },
  error: { label: "Xatolik", tone: "red" },
};

const DEMO_STATS = {
  total: 1248,
  auto: 892,
  processing: 24,
  errors: 6,
  storage: "2.4 GB",
  today: 56,
};

function seedFor(kind: ScanKind): ScanDoc[] {
  const base = [
    {
      id: "1",
      suffix: "000124",
      subject: "Aliyev Behruzni lavozimga tayinlash to'g'risida",
      person: "Aliyev Behruz",
      department: "IT bo'limi",
      description: "Lavozimga tayinlash buyrug'i skan nusxasi.",
      date: "2025-01-12",
      time: "14:32",
      size: "245 KB",
      status: "auto" as ScanStatus,
    },
    {
      id: "2",
      suffix: "000123",
      subject: "Karimova Dilnozaga ta'til berish haqida",
      person: "Karimova Dilnoza",
      department: "Kadrlar bo'limi",
      description: "Mehnat ta'tili buyrug'i skan nusxasi.",
      date: "2025-01-11",
      time: "11:05",
      size: "198 KB",
      status: "auto" as ScanStatus,
    },
    {
      id: "3",
      suffix: "000122",
      subject: "Yusupova Nilufarni rag'batlantirish",
      person: "Yusupova Nilufar",
      department: "Iqtisodiyot fakulteti",
      description: "Rag'batlantirish buyrug'i skan nusxasi.",
      date: "2025-01-10",
      time: "16:48",
      size: "312 KB",
      status: "processing" as ScanStatus,
    },
    {
      id: "4",
      suffix: "000121",
      subject: "Toshmatov Bekzodga intizomiy jazo",
      person: "Toshmatov Bekzod",
      department: "Marketing bo'limi",
      description: "Intizomiy buyruq skan nusxasi.",
      date: "2025-01-09",
      time: "09:20",
      size: "156 KB",
      status: "error" as ScanStatus,
    },
    {
      id: "5",
      suffix: "000120",
      subject: "Rahimova Dilnozani o'tkazish haqida",
      person: "Rahimova Dilnoza",
      department: "Xalqaro aloqalar",
      description: "O'tkazish buyrug'i skan nusxasi.",
      date: "2025-01-08",
      time: "13:11",
      size: "221 KB",
      status: "auto" as ScanStatus,
    },
    {
      id: "6",
      suffix: "000119",
      subject: "Ismoilova Malika ishga qabul",
      person: "Ismoilova Malika",
      department: "Ingliz tili kafedrasi",
      description: "Ishga qabul buyrug'i skan nusxasi.",
      date: "2025-01-07",
      time: "10:44",
      size: "189 KB",
      status: "auto" as ScanStatus,
    },
    {
      id: "7",
      suffix: "000118",
      subject: "Ergashev Javlon lavozimga tayinlash",
      person: "Ergashev Javlon",
      department: "Xalqaro aloqalar",
      description: "Tayinlash buyrug'i skan nusxasi.",
      date: "2025-01-06",
      time: "15:02",
      size: "267 KB",
      status: "processing" as ScanStatus,
    },
  ];

  return base.map((b) => {
    const number = `${kind}-${b.suffix}`;
    return {
      id: `${kind.toLowerCase()}-${b.id}`,
      name: `${number}.pdf`,
      number,
      date: b.date,
      time: b.time,
      size: b.size,
      status: b.status,
      department: b.department,
      subject: b.subject,
      person: b.person,
      description: b.description,
    };
  });
}

const KIND_LABEL: Record<ScanKind, string> = {
  K: "K-buyruqlar",
  P: "P-buyruqlar",
  N: "N-buyruqlar",
};

export function ScanOrdersPage({ kind }: { kind: ScanKind }) {
  const label = KIND_LABEL[kind];
  const [docs] = useState(() => seedFor(kind));
  const [mainTab, setMainTab] = useState<MainTab>("scan");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [dept, setDept] = useState("all");
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [selectedId, setSelectedId] = useState<string | null>(docs[0]?.id ?? null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 7;
  const [autoUpload, setAutoUpload] = useState(true);
  const [scanSide, setScanSide] = useState<"one" | "two">("one");
  const [format, setFormat] = useState("pdf");
  const [dpi, setDpi] = useState("300");
  const [color, setColor] = useState<"auto" | "bw" | "color">("auto");
  const [scanning, setScanning] = useState(false);

  const departments = useMemo(() => [...new Set(docs.map((d) => d.department))].sort(), [docs]);

  const list = useMemo(() => {
    return docs.filter((d) => {
      const hit = `${d.name} ${d.number} ${d.person} ${d.subject}`.toLowerCase().includes(q.toLowerCase());
      if (!hit) return false;
      if (status !== "all" && d.status !== status) return false;
      if (dept !== "all" && d.department !== dept) return false;
      return true;
    });
  }, [docs, q, status, dept]);

  const pageCount = Math.max(1, Math.ceil(list.length / pageSize));
  const pageRows = list.slice((page - 1) * pageSize, page * pageSize);
  const allChecked = pageRows.length > 0 && pageRows.every((d) => checked[d.id]);
  const selected = docs.find((d) => d.id === selectedId) ?? null;
  const from = list.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, list.length);

  useEffect(() => {
    setPage(1);
    setSelectedId(docs[0]?.id ?? null);
    setChecked({});
    setQ("");
    setStatus("all");
    setDept("all");
  }, [kind, docs]);

  useEffect(() => {
    setPage(1);
  }, [q, status, dept]);

  function clearFilters() {
    setQ("");
    setStatus("all");
    setDept("all");
  }

  function startScan() {
    setScanning(true);
    window.setTimeout(() => setScanning(false), 1600);
  }

  const stats = [
    { title: "Jami skanlar", value: String(DEMO_STATS.total), hint: "+12%", icon: <ScanLine className="h-4 w-4" />, tone: "blue" as const },
    { title: "Avto yuklangan", value: String(DEMO_STATS.auto), hint: "+18%", icon: <CheckCircle2 className="h-4 w-4" />, tone: "green" as const },
    { title: "Qayta ishlashda", value: String(DEMO_STATS.processing), hint: "Jarayonda", icon: <RefreshCw className="h-4 w-4" />, tone: "amber" as const },
    { title: "Xatoliklar", value: String(DEMO_STATS.errors), hint: "-3", icon: <AlertTriangle className="h-4 w-4" />, tone: "red" as const },
    { title: "Saqlangan hajm", value: DEMO_STATS.storage, hint: "Bu oy", icon: <HardDrive className="h-4 w-4" />, tone: "violet" as const },
    { title: "Bugungi skanlar", value: String(DEMO_STATS.today), hint: "+7", icon: <CalendarDays className="h-4 w-4" />, tone: "blue" as const },
  ];

  const tabs: { id: MainTab; label: string }[] = [
    { id: "scan", label: "Skan qilish" },
    { id: "list", label: "Skanlar ro'yxati" },
    { id: "history", label: "Avto yuklash tarixi" },
    { id: "settings", label: "Sozlamalar" },
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
            <span className="text-slate-500">Skan</span>
            <span className="mx-1.5">›</span>
            <span className="text-slate-600">{label}</span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <ScanLine className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">{label} skan</h1>
              <p className="text-sm text-slate-500">
                Hujjatlarni skanerlash, OCR orqali tanib olish va {label.toLowerCase()}ga avtomatik yuklash
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setMainTab("settings")}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Settings2 className="h-4 w-4 text-slate-500" />
            Skaner sozlamalari
          </button>
          <button
            type="button"
            onClick={() => {
              setMainTab("scan");
              startScan();
            }}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" />
            Yangi skan
          </button>
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
            onClick={() => setMainTab(t.id)}
            className={cn(
              "inline-flex shrink-0 items-center rounded-xl px-3.5 py-2 text-sm font-medium transition",
              mainTab === t.id ? "bg-brand-50 text-brand-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {(mainTab === "scan" || mainTab === "settings") && (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px_340px]">
          <Card className="p-4 sm:p-5">
            <h3 className="text-sm font-semibold text-slate-900">
              {mainTab === "settings" ? "Skaner sozlamalari" : "Skaner paneli"}
            </h3>
            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-500">Qurilma</label>
                <div className="flex flex-wrap items-center gap-2">
                  <Select className="h-10 flex-1" defaultValue="hp">
                    <option value="hp">HP LaserJet Pro MFP (192.168.1.50)</option>
                    <option value="canon">Canon imageRUNNER (192.168.1.61)</option>
                    <option value="epson">Epson WorkForce (USB)</option>
                  </Select>
                  <Badge tone="green">Online</Badge>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-500">Skan turi</label>
                  <div className="flex gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
                    <ToggleBtn active={scanSide === "one"} onClick={() => setScanSide("one")}>
                      Bir tomonlama
                    </ToggleBtn>
                    <ToggleBtn active={scanSide === "two"} onClick={() => setScanSide("two")}>
                      Ikki tomonlama
                    </ToggleBtn>
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-500">Format</label>
                  <Select value={format} onChange={(e) => setFormat(e.target.value)} className="h-10">
                    <option value="pdf">PDF</option>
                    <option value="jpg">JPG</option>
                    <option value="png">PNG</option>
                    <option value="tiff">TIFF</option>
                  </Select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-500">Sifat</label>
                  <Select value={dpi} onChange={(e) => setDpi(e.target.value)} className="h-10">
                    <option value="200">200 DPI</option>
                    <option value="300">300 DPI (Tavsiya)</option>
                    <option value="600">600 DPI</option>
                  </Select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-500">Rang</label>
                  <div className="flex gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
                    <ToggleBtn active={color === "auto"} onClick={() => setColor("auto")}>
                      Avto
                    </ToggleBtn>
                    <ToggleBtn active={color === "bw"} onClick={() => setColor("bw")}>
                      Qora-oq
                    </ToggleBtn>
                    <ToggleBtn active={color === "color"} onClick={() => setColor("color")}>
                      Rangli
                    </ToggleBtn>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={startScan}
                disabled={scanning}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 disabled:opacity-70"
              >
                <ScanLine className={cn("h-4 w-4", scanning && "animate-pulse")} />
                {scanning ? "Skanlanmoqda..." : "Skan boshlash"}
              </button>

              <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50/80 px-3 py-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-emerald-900">{label} uchun avtomatik yuklash</div>
                  <div className="text-[11px] text-emerald-700/80">OCR dan keyin jurnalga joylanadi</div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={autoUpload}
                  onClick={() => setAutoUpload((v) => !v)}
                  className={cn(
                    "relative h-6 w-11 shrink-0 rounded-full transition",
                    autoUpload ? "bg-emerald-500" : "bg-slate-300",
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition",
                      autoUpload ? "left-5" : "left-0.5",
                    )}
                  />
                </button>
              </div>
            </div>
          </Card>

          <div className="space-y-4">
            <Card className="p-4">
              <h3 className="text-sm font-semibold text-slate-900">Qo'lda yuklash</h3>
              <label className="mt-3 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-4 py-8 text-center transition hover:border-brand-300 hover:bg-brand-50/40">
                <CloudUpload className="h-7 w-7 text-slate-400" />
                <span className="text-sm font-medium text-slate-700">Faylni tashlang yoki tanlang</span>
                <span className="text-[11px] text-slate-400">PDF, JPG, PNG, TIFF · max 25 MB</span>
                <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.tiff" />
              </label>
            </Card>

            <Card className="overflow-hidden">
              <div className="border-b border-slate-100 px-4 py-3">
                <h3 className="text-sm font-semibold text-slate-900">Tezkor amallar</h3>
              </div>
              <div className="space-y-1 p-2">
                <QuickRow icon={<Wifi className="h-4 w-4" />} label="Skanerni tekshirish" />
                <QuickRow icon={<Zap className="h-4 w-4" />} label="Test skan" onClick={startScan} />
                <QuickRow icon={<RefreshCw className="h-4 w-4" />} label="Drayverlarni yangilash" />
              </div>
              <div className="mx-3 mb-3 flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50/70 px-3 py-2.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-emerald-900">Skaner ulangan</div>
                  <div className="truncate text-[11px] text-emerald-700/80">HP LaserJet Pro MFP</div>
                </div>
              </div>
            </Card>
          </div>

          <aside className="xl:sticky xl:top-20 xl:self-start">
            {selected ? (
              <OrderViewPanel
                order={{
                  number: selected.number,
                  date: selected.date,
                  subject: selected.subject,
                  person: selected.person,
                  department: selected.department,
                  description: selected.description,
                  responsible: "HR Admin",
                }}
                statusLabel={STATUS_META[selected.status].label}
                statusTone={STATUS_META[selected.status].tone}
                onClose={() => setSelectedId(null)}
                onPrint={() => printBlankOrder()}
                onDownload={() => printBlankOrder()}
                onShare={() => {
                  void navigator.clipboard?.writeText(
                    `${window.location.origin}/scan/${kind.toLowerCase()}-buyruqlar?id=${selected.id}`,
                  );
                }}
              />
            ) : (
              <Card className="flex h-80 flex-col items-center justify-center gap-2 p-6 text-center text-sm text-slate-400">
                <FileText className="h-8 w-8 opacity-40" />
                Jadvaldan hujjat tanlang
              </Card>
            )}
          </aside>
        </div>
      )}

      {(mainTab === "list" || mainTab === "history" || mainTab === "scan" || mainTab === "settings") && (
        <div className="space-y-4">
          {mainTab === "history" && (
            <Card className="p-4">
              <h3 className="text-sm font-semibold text-slate-900">Avto yuklash tarixi — {label}</h3>
              <p className="mt-1 text-sm text-slate-500">
                Oxirgi 7 kunda OCR orqali avtomatik yuklangan {kind}-buyruqlar jurnali.
              </p>
            </Card>
          )}

          <Card className="p-3 sm:p-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[220px] flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Hujjat nomi, buyruq raqami..."
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none ring-brand-500/20 focus:border-brand-500 focus:ring-4"
                />
              </div>
              <Select value={status} onChange={(e) => setStatus(e.target.value)} className="h-10 w-full sm:w-44">
                <option value="all">Barcha holatlar</option>
                <option value="auto">Avto yuklangan</option>
                <option value="processing">Qayta ishlashda</option>
                <option value="error">Xatolik</option>
              </Select>
              <Select value={dept} onChange={(e) => setDept(e.target.value)} className="h-10 w-full sm:w-44">
                <option value="all">Barcha bo'limlar</option>
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </Select>
              <button
                type="button"
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                <Filter className="h-4 w-4" /> Filtrlar
              </button>
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium text-slate-500 hover:bg-slate-100"
              >
                Tozalash
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
                  <Th>Hujjat nomi</Th>
                  <Th>Buyruq raqami</Th>
                  <Th>Skan sanasi</Th>
                  <Th>Hajmi</Th>
                  <Th>Holat</Th>
                  <Th className="w-28">Amallar</Th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((d, idx) => {
                  const st = STATUS_META[d.status];
                  const isSel = selectedId === d.id;
                  return (
                    <tr
                      key={d.id}
                      onClick={() => setSelectedId(d.id)}
                      className={cn("cursor-pointer transition", isSel ? "bg-brand-50/60" : "hover:bg-slate-50")}
                    >
                      <Td onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={!!checked[d.id]}
                          onChange={(e) => setChecked((c) => ({ ...c, [d.id]: e.target.checked }))}
                        />
                      </Td>
                      <Td className="text-slate-400">{(page - 1) * pageSize + idx + 1}</Td>
                      <Td>
                        <div className="flex items-center gap-2">
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600">
                            <FileText className="h-4 w-4" />
                          </span>
                          <span className="font-medium text-slate-800">{d.name}</span>
                        </div>
                      </Td>
                      <Td>
                        <span className="font-semibold text-brand-600">{d.number}</span>
                      </Td>
                      <Td className="whitespace-nowrap text-slate-500">
                        {formatDateUz(d.date)} · {d.time}
                      </Td>
                      <Td className="text-slate-500">{d.size}</Td>
                      <Td>
                        <Badge tone={st.tone}>{st.label}</Badge>
                      </Td>
                      <Td className="relative" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-0.5">
                          <IconBtn title="Ko'rish" onClick={() => setSelectedId(d.id)}>
                            <Eye className="h-4 w-4" />
                          </IconBtn>
                          <IconBtn title="Yuklab olish" onClick={() => printBlankOrder()}>
                            <Download className="h-4 w-4" />
                          </IconBtn>
                          <button
                            type="button"
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
                            onClick={() => setMenuId(menuId === d.id ? null : d.id)}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </div>
                        {menuId === d.id && (
                          <div className="absolute right-2 top-10 z-20 w-40 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-nav">
                            <MenuItem
                              onClick={() => {
                                setSelectedId(d.id);
                                setMenuId(null);
                              }}
                            >
                              Ko'rish
                            </MenuItem>
                            <MenuItem
                              onClick={() => {
                                printBlankOrder();
                                setMenuId(null);
                              }}
                            >
                              Chop etish
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
                      Mos skan topilmadi
                    </td>
                  </tr>
                )}
              </tbody>
            </TableWrap>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-sm">
              <div className="text-slate-500">
                {from}–{to} dan {list.length} ta hujjat
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
                {Array.from({ length: Math.min(pageCount, 5) }, (_, i) => i + 1).map((n) => (
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
      )}
    </div>
  );
}

function formatDateUz(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

function ToggleBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 rounded-lg px-2 py-1.5 text-xs font-semibold transition",
        active ? "bg-white text-brand-700 shadow-sm" : "text-slate-500 hover:text-slate-700",
      )}
    >
      {children}
    </button>
  );
}

function QuickRow({ icon, label, onClick }: { icon: ReactNode; label: string; onClick?: () => void }) {
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
  tone: "blue" | "green" | "amber" | "red" | "violet";
}) {
  const map = {
    blue: "bg-brand-50 text-brand-600",
    green: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-600",
    violet: "bg-violet-50 text-violet-600",
  };
  const hintColor = {
    blue: "text-brand-600",
    green: "text-emerald-600",
    amber: "text-amber-600",
    red: "text-red-600",
    violet: "text-violet-600",
  };
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-card">
      <div className="flex items-start justify-between gap-2">
        <div className="text-[11px] font-medium leading-snug text-slate-500">{title}</div>
        <span className={cn("rounded-lg p-1.5", map[tone])}>{icon}</span>
      </div>
      <div className="mt-2 text-xl font-bold tracking-tight text-slate-900">{value}</div>
      <div className={cn("mt-0.5 text-[11px] font-semibold", hintColor[tone])}>{hint}</div>
    </div>
  );
}

function IconBtn({ children, onClick, title }: { children: ReactNode; onClick?: () => void; title?: string }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
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
