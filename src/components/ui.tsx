import { type ButtonHTMLAttributes, type HTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn, statusLabel } from "../lib/utils";

export function Card({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("rounded-2xl border border-slate-200/80 bg-white shadow-card", className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ title, action, subtitle }: { title: string; action?: ReactNode; subtitle?: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
      <div>
        <h3 className="text-[15px] font-semibold text-slate-900">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition disabled:opacity-50",
        size === "sm" && "h-8 px-3 text-xs",
        size === "md" && "h-10 px-4 text-sm",
        size === "lg" && "h-11 px-5 text-sm",
        variant === "primary" && "bg-brand-600 text-white shadow-sm hover:bg-brand-700",
        variant === "secondary" && "bg-slate-100 text-slate-800 hover:bg-slate-200",
        variant === "ghost" && "text-slate-600 hover:bg-slate-100",
        variant === "danger" && "bg-red-600 text-white hover:bg-red-700",
        variant === "outline" && "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
        className,
      )}
      {...props}
    />
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none ring-brand-500/20 placeholder:text-slate-400 focus:border-brand-500 focus:ring-4",
        className,
      )}
      {...props}
    />
  );
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none ring-brand-500/20 focus:border-brand-500 focus:ring-4",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none ring-brand-500/20 placeholder:text-slate-400 focus:border-brand-500 focus:ring-4",
        className,
      )}
      {...props}
    />
  );
}

export function Badge({
  tone = "slate",
  children,
  className,
}: {
  tone?: "slate" | "blue" | "green" | "red" | "amber" | "violet";
  children: ReactNode;
  className?: string;
}) {
  const map = {
    slate: "bg-slate-100 text-slate-600",
    blue: "bg-brand-50 text-brand-700",
    green: "bg-emerald-50 text-emerald-700",
    red: "bg-red-50 text-red-700",
    amber: "bg-amber-50 text-amber-700",
    violet: "bg-violet-50 text-violet-700",
  };
  return (
    <span className={cn("inline-flex items-center rounded-lg px-2 py-0.5 text-[11px] font-semibold", map[tone], className)}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "approved" || status === "active" || status === "hired" || status === "done" || status === "ai_resolved"
      ? "green"
      : status === "pending" || status === "probation" || status === "open" || status === "in_progress"
        ? "amber"
        : status === "rejected" || status === "terminated" || status === "overdue" || status === "expired"
          ? "red"
          : status === "on_leave" || status === "expiring"
            ? "blue"
            : "slate";
  return <Badge tone={tone}>{statusLabel[status] ?? status}</Badge>;
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-slate-500">{label}</span>
      {children}
    </label>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 pt-[8vh]" onClick={onClose}>
      <div
        className={cn("w-full rounded-2xl bg-white shadow-nav", wide ? "max-w-3xl" : "max-w-lg")}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 className="text-base font-semibold">{title}</h3>
          <button className="text-slate-400 hover:text-slate-700" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function Empty({ text }: { text: string }) {
  return <div className="px-5 py-10 text-center text-sm text-slate-500">{text}</div>;
}

export function Avatar({ name, size = "md", src }: { name: string; size?: "sm" | "md" | "lg"; src?: string }) {
  const s = size === "sm" ? "h-8 w-8 text-[11px]" : size === "lg" ? "h-16 w-16 text-lg" : "h-10 w-10 text-sm";
  const colors = ["bg-brand-600", "bg-violet-600", "bg-emerald-600", "bg-amber-600", "bg-sky-600"];
  const i = name.length % colors.length;
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
  if (src) {
    return <img src={src} alt={name} className={cn("rounded-full object-cover", s)} />;
  }
  return (
    <div className={cn("flex items-center justify-center rounded-full font-semibold text-white", colors[i], s)}>
      {initials}
    </div>
  );
}

export function PageTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function TableWrap({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">{children}</table>
    </div>
  );
}

export function Th({ children, className, ...props }: HTMLAttributes<HTMLTableCellElement>) {
  return (
    <th className={cn("px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400", className)} {...props}>
      {children}
    </th>
  );
}

export function Td({ children, className, ...props }: HTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={cn("border-t border-slate-100 px-4 py-3 text-slate-700", className)} {...props}>
      {children}
    </td>
  );
}
