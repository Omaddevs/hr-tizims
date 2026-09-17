import { useState, type ReactNode } from "react";
import {
  Download,
  Eye,
  FileText,
  History,
  Link2,
  Maximize2,
  Menu,
  MessageSquare,
  MoreVertical,
  Printer,
  RotateCw,
  Scaling,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { IAU_OFFICIAL } from "../lib/official";
import { cn } from "../lib/utils";

export type OrderDocData = {
  number: string;
  date: string;
  subject: string;
  person: string;
  department: string;
  description: string;
  responsible?: string;
};

export type OrderViewTab = "view" | "desc" | "comments" | "history";

type Comment = { at: string; by: string; text: string };
type HistoryItem = { at: string; text: string; by: string };

function formatDateUz(iso: string) {
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}.${m}.${y}`;
}

/** Full side panel matching the design: header + tabs + PDF viewer + actions */
export function OrderViewPanel({
  order,
  statusLabel = "Ijro etilgan",
  statusTone = "green",
  comments = [],
  history = [],
  onClose,
  onPrint,
  onDownload,
  onShare,
}: {
  order: OrderDocData;
  statusLabel?: string;
  statusTone?: "green" | "amber" | "red" | "blue" | "slate" | "violet";
  comments?: Comment[];
  history?: HistoryItem[];
  onClose?: () => void;
  onPrint?: () => void;
  onDownload?: () => void;
  onShare?: () => void;
}) {
  const [tab, setTab] = useState<OrderViewTab>("view");

  const tabs: { id: OrderViewTab; label: string; icon?: ReactNode }[] = [
    { id: "view", label: "Ko'rish", icon: <Eye className="h-3.5 w-3.5" /> },
    { id: "desc", label: "Tavsif" },
    { id: "comments", label: `Izohlar (${comments.length})` },
    { id: "history", label: "Tarix" },
  ];

  const statusChip =
    statusTone === "green"
      ? "bg-[#dcfce7] text-[#15803d]"
      : statusTone === "amber"
        ? "bg-[#ffedd5] text-[#c2410c]"
        : statusTone === "red"
          ? "bg-[#fee2e2] text-[#dc2626]"
          : "bg-slate-100 text-slate-600";

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_rgba(15,23,42,0.04)]">
      {/* Header: icon + number | status + close */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#e8f1ff] text-brand-600">
            <FileText className="h-3.5 w-3.5" />
          </span>
          <span className="text-[15px] font-bold tracking-tight text-slate-900">{order.number}</span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className={cn("inline-flex items-center rounded-md px-2.5 py-0.5 text-[11px] font-semibold", statusChip)}>
            {statusLabel}
          </span>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 overflow-x-auto border-b border-slate-100 px-3">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 px-3 py-2.5 text-[13px] font-semibold transition",
              tab === t.id
                ? "border-b-2 border-brand-600 text-brand-600"
                : "border-b-2 border-transparent text-slate-500 hover:text-slate-700",
            )}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="p-3">
        {tab === "view" && (
          <OrderDocViewer
            order={order}
            onPrint={onPrint}
            onDownload={onDownload}
            onShare={onShare}
          />
        )}

        {tab === "desc" && (
          <div className="space-y-3 px-1 py-2">
            <p className="text-sm leading-relaxed text-slate-600">{order.description}</p>
            <div className="space-y-2 rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-xs">
              <DescRow k="Mavzu" v={order.subject} />
              <DescRow k="Xodim" v={order.person} />
              <DescRow k="Bo'lim" v={order.department} />
              <DescRow k="Sana" v={formatDateUz(order.date)} />
              <DescRow k="Mas'ul" v={order.responsible ?? "HR Admin"} />
            </div>
          </div>
        )}

        {tab === "comments" && (
          <div className="space-y-3 px-1 py-2">
            {comments.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-slate-400">
                <MessageSquare className="h-6 w-6 opacity-40" />
                Izohlar yo'q
              </div>
            )}
            {comments.map((c, i) => (
              <div key={i} className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-700">{c.by}</span>
                  <span className="text-[11px] text-slate-400">{c.at}</span>
                </div>
                <p className="mt-1 text-sm text-slate-600">{c.text}</p>
              </div>
            ))}
          </div>
        )}

        {tab === "history" && (
          <div className="space-y-3 px-1 py-2">
            {history.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-slate-400">
                <History className="h-6 w-6 opacity-40" />
                Tarix yo'q
              </div>
            )}
            {history.map((h, i) => (
              <div key={i} className="relative border-l-2 border-brand-100 pl-4">
                <div className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-brand-500" />
                <div className="text-sm font-medium text-slate-800">{h.text}</div>
                <div className="mt-0.5 text-[11px] text-slate-400">
                  {h.at} · {h.by}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DescRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-2">
      <span className="w-16 shrink-0 font-semibold text-slate-500">{k}</span>
      <span className="text-slate-800">{v}</span>
    </div>
  );
}

/** PDF-style viewer only (toolbar + page + footer actions) */
export function OrderDocViewer({
  order,
  onPrint,
  onDownload,
  onShare,
  compact,
}: {
  order: OrderDocData;
  onPrint?: () => void;
  onDownload?: () => void;
  onShare?: () => void;
  compact?: boolean;
}) {
  const [zoom, setZoom] = useState(100);
  const [page, setPage] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  const [rotation, setRotation] = useState(0);
  const totalPages = 2;

  const viewer = (
    <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
      {/* Dark toolbar */}
      <div className="flex items-center gap-0.5 bg-[#3d4654] px-2 py-1.5 text-white">
        <ToolbarBtn title="Menyu" dark>
          <Menu className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <button
          type="button"
          className="rounded px-1.5 py-1 text-[11px] font-medium text-white/90 hover:bg-white/10"
          onClick={() => setPage((p) => (p >= totalPages ? 1 : p + 1))}
        >
          {page} / {totalPages}
        </button>
        <span className="mx-0.5 h-3.5 w-px bg-white/20" />
        <ToolbarBtn title="Kichiklashtirish" dark onClick={() => setZoom((z) => Math.max(70, z - 10))}>
          <ZoomOut className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <span className="min-w-[36px] text-center text-[11px] font-medium text-white/90">{zoom}%</span>
        <ToolbarBtn title="Kattalashtirish" dark onClick={() => setZoom((z) => Math.min(150, z + 10))}>
          <ZoomIn className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <span className="mx-0.5 h-3.5 w-px bg-white/20" />
        <ToolbarBtn title="Kenglikka moslash" dark onClick={() => setZoom(100)}>
          <Scaling className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn title="Aylantirish" dark onClick={() => setRotation((r) => (r + 90) % 360)}>
          <RotateCw className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <div className="ml-auto flex items-center gap-0.5">
          <ToolbarBtn title="Yuklab olish" dark onClick={onDownload}>
            <Download className="h-3.5 w-3.5" />
          </ToolbarBtn>
          <ToolbarBtn title="Chop etish" dark onClick={onPrint}>
            <Printer className="h-3.5 w-3.5" />
          </ToolbarBtn>
          <ToolbarBtn title="Yana" dark>
            <MoreVertical className="h-3.5 w-3.5" />
          </ToolbarBtn>
        </div>
      </div>

      {/* Page canvas */}
      <div
        className={cn(
          "overflow-auto bg-[#e8ecf1] p-3",
          compact ? "max-h-[380px]" : "max-h-[440px]",
          fullscreen && "max-h-[min(70vh,640px)]",
        )}
      >
        <div
          className="mx-auto bg-white shadow-lg transition-transform"
          style={{
            width: 320,
            minHeight: page === 1 ? 440 : 400,
            transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
            transformOrigin: "top center",
            marginBottom: zoom > 100 ? ((zoom - 100) / 100) * 180 : 0,
          }}
        >
          {page === 1 ? <DocPage1 order={order} /> : <DocPage2 order={order} />}
        </div>
      </div>

      {/* Fullscreen link */}
      <div className="flex justify-end border-t border-slate-100 bg-white px-3 py-1.5">
        <button
          type="button"
          onClick={() => setFullscreen((v) => !v)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700"
        >
          <Maximize2 className="h-3.5 w-3.5" />
          To'liq ekran
        </button>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-3 gap-2 border-t border-slate-100 bg-white p-3">
        <button
          type="button"
          onClick={onShare}
          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-[#bfdbfe] bg-[#eef4ff] text-xs font-semibold text-brand-600 hover:bg-[#e0ebff]"
        >
          <Link2 className="h-3.5 w-3.5" />
          Ulashish
        </button>
        <button
          type="button"
          onClick={onPrint}
          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-[#bfdbfe] bg-[#eef4ff] text-xs font-semibold text-brand-600 hover:bg-[#e0ebff]"
        >
          <Printer className="h-3.5 w-3.5" />
          Chop etish
        </button>
        <button
          type="button"
          onClick={onDownload}
          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-brand-600 text-xs font-semibold text-white shadow-sm hover:bg-brand-700"
        >
          <Download className="h-3.5 w-3.5" />
          Yuklab olish
        </button>
      </div>
    </div>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 sm:p-8">
        <div className="relative w-full max-w-xl">
          <button
            type="button"
            onClick={() => setFullscreen(false)}
            className="absolute -right-2 -top-2 z-10 rounded-full border border-slate-200 bg-white p-1.5 text-slate-500 shadow-md hover:bg-slate-50"
          >
            <X className="h-4 w-4" />
          </button>
          {viewer}
        </div>
        <button
          type="button"
          className="absolute inset-0 -z-10"
          aria-label="Yopish"
          onClick={() => setFullscreen(false)}
        />
      </div>
    );
  }

  return viewer;
}

function DocPage1({ order }: { order: OrderDocData }) {
  return (
    <div
      className="relative px-5 pb-5 pt-4 text-[9px] leading-relaxed text-slate-800"
      style={{ fontFamily: "Times New Roman, Times, serif" }}
    >
      {/* Letterhead */}
      <div className="flex items-start gap-2.5">
        <div className="mt-0.5 flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-full border-[2.5px] border-amber-800/70 bg-gradient-to-b from-amber-50 to-amber-100 shadow-sm">
          <span className="text-[8px] font-black leading-none text-amber-900">IAU</span>
          <span className="mt-0.5 text-[5px] font-bold uppercase tracking-tighter text-amber-800/80">gerb</span>
        </div>
        <div className="min-w-0 flex-1 text-center">
          <div className="text-[6.5px] font-bold uppercase leading-snug tracking-wide text-slate-700">
            O'ZBEKISTON RESPUBLIKASI OLIY TA'LIM, FAN VA INNOVATSIYALAR VAZIRLIGI
          </div>
          <div className="mt-0.5 text-[7.5px] font-extrabold uppercase leading-snug text-slate-900">
            {IAU_OFFICIAL.orgNameUz}
          </div>
          <div className="mt-0.5 text-[6.5px] font-semibold uppercase tracking-wide text-slate-500">
            {IAU_OFFICIAL.orgNameEn}
          </div>
        </div>
      </div>

      <div className="my-2.5 h-px bg-slate-800" />

      <div className="text-center text-[11px] font-black tracking-[0.2em] text-slate-900">BUYRUQ</div>

      <div className="mt-2.5 flex items-start justify-between gap-2 text-[8px]">
        <span>{formatDateUz(order.date)}</span>
        <span className="text-center">Toshkent</span>
        <span className="text-right">№ {order.number}</span>
      </div>

      <div className="mt-3 text-center text-[9px] font-bold leading-snug">{order.subject}</div>

      <div className="mt-3 space-y-2 text-[8.5px] leading-[1.5]">
        <p>
          1. {order.person} — {order.department} xodimi sifatida ushbu buyruq asosida tegishli choralar ko'rilsin.
        </p>
        <p>2. {order.description}</p>
        <p>
          3. Buyruq ijrosini nazorat qilish {order.responsible ?? "HR bo'limi"} zimmasiga yuklatilsin.
        </p>
        <p>4. Mazkur buyruq imzolangan kundan boshlab kuchga kiradi.</p>
      </div>

      <p className="mt-3 text-[8px]">
        <span className="font-bold">Asos:</span> O'zbekiston Respublikasi Mehnat kodeksi va tegishli ariza.
      </p>

      {/* Signature */}
      <div className="mt-8 flex items-end justify-between gap-3 text-[8.5px]">
        <span className="font-semibold">Rektor</span>
        <div className="relative flex-1 text-center">
          <span
            className="absolute inset-x-0 -top-5 text-[16px] text-brand-600"
            style={{ fontFamily: "Brush Script MT, Segoe Script, cursive" }}
          >
            A.Karimov
          </span>
          <span className="inline-block w-full border-b border-slate-400" />
        </div>
        <span className="font-semibold">A. K. Karimov</span>
      </div>
    </div>
  );
}

function DocPage2({ order }: { order: OrderDocData }) {
  return (
    <div
      className="px-5 py-6 text-[9px] leading-relaxed text-slate-800"
      style={{ fontFamily: "Times New Roman, Times, serif" }}
    >
      <div className="text-center text-[9px] font-bold uppercase tracking-wide">Ilova</div>
      <div className="mt-1 text-center text-[8px] text-slate-500">
        Buyruq № {order.number} · {formatDateUz(order.date)}
      </div>
      <div className="mx-auto my-3 h-px w-full bg-slate-200" />
      <table className="w-full border-collapse text-[8px]">
        <tbody>
          {[
            ["Buyruq raqami", order.number],
            ["Sana", formatDateUz(order.date)],
            ["Mavzu", order.subject],
            ["Xodim", order.person],
            ["Bo'lim", order.department],
            ["Mas'ul", order.responsible ?? "HR Admin"],
          ].map(([k, v]) => (
            <tr key={k} className="border-b border-slate-100">
              <td className="w-[36%] py-1.5 pr-2 align-top font-semibold text-slate-500">{k}</td>
              <td className="py-1.5 align-top text-slate-800">{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-10 flex items-center justify-center gap-1 text-[7px] text-slate-400">
        <FileText className="h-3 w-3" /> — 2 —
      </div>
    </div>
  );
}

function ToolbarBtn({
  children,
  onClick,
  title,
  disabled,
  dark,
}: {
  children: ReactNode;
  onClick?: () => void;
  title?: string;
  disabled?: boolean;
  dark?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "rounded p-1.5 disabled:opacity-30",
        dark ? "text-white/85 hover:bg-white/10" : "text-slate-500 hover:bg-slate-100 hover:text-slate-800",
      )}
    >
      {children}
    </button>
  );
}
