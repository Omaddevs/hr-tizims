import { useState } from "react";
import { Building2, Check, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../store/AppContext";
import { cn } from "../lib/utils";

export function OrgSwitcher() {
  const { organization, organizations, switchOrganization } = useApp();
  const [open, setOpen] = useState(false);
  const nav = useNavigate();
  if (!organization) return null;

  return (
    <div className="relative min-w-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex max-w-[240px] items-center gap-2 rounded-xl px-2 py-1.5 text-left hover:bg-slate-50"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
          <Building2 className="h-4 w-4" />
        </span>
        <span className="min-w-0 hidden sm:block">
          <span className="block truncate text-sm font-semibold text-slate-800">{organization.name}</span>
          <span className="block truncate text-[11px] capitalize text-slate-400">{organization.organizationType}</span>
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
      </button>
      {open && (
        <div className="absolute left-0 top-11 z-30 w-[min(92vw,280px)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-nav">
          <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Tashkilotni almashtirish</div>
          {organizations.map((o) => (
            <button
              key={o.id}
              onClick={() => {
                switchOrganization(o.id);
                setOpen(false);
                nav("/");
              }}
              className={cn("flex w-full items-center justify-between px-3 py-2.5 text-left text-sm hover:bg-slate-50", o.id === organization.id && "bg-brand-50/70")}
            >
              <span>
                <span className="block font-medium">{o.name}</span>
                <span className="text-[11px] capitalize text-slate-400">{o.organizationType}</span>
              </span>
              {o.id === organization.id && <Check className="h-4 w-4 text-brand-600" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
