import { useEffect, useState, type ReactNode } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  Bot,
  Briefcase,
  Building2,
  CalendarDays,
  ChevronDown,
  ClipboardCheck,
  FolderOpen,
  GraduationCap,
  Home,
  Menu,
  MessageSquare,
  Settings,
  Shield,
  Store,
  Users,
  Wallet,
  Workflow,
  X,
  FileBarChart,
  LogOut,
  Cross,
} from "lucide-react";
import { useApp } from "../store/AppContext";
import { cn, roleLabel } from "../lib/utils";
import { Avatar } from "./ui";
import { Logo } from "./Logo";
import { OfficialDocHost } from "./OfficialDocHost";
import { OrgSwitcher } from "./OrgSwitcher";
import { GlobalSearchBar } from "./GlobalSearchBar";
import type { ModuleKey } from "../core/types";

type NavItem = {
  to?: string;
  label: string;
  icon: typeof Home;
  children?: { to: string; label: string; end?: boolean; module?: ModuleKey }[];
  roles?: string[];
  module?: ModuleKey;
};

const NAV: NavItem[] = [
  { to: "/", label: "Bosh sahifa", icon: Home },
  { to: "/inbox", label: "Xabarlar", icon: MessageSquare, module: "hr" },
  { to: "/crm", label: "CRM", icon: Users, module: "crm" },
  { to: "/shop", label: "Do'kon", icon: Store, module: "shop" },
  { to: "/pharmacy", label: "Apteka", icon: Cross, module: "pharmacy" },
  {
    label: "Xodimlar",
    icon: Users,
    module: "hr",
    children: [
      { to: "/employees", label: "Xodimlar bazasi" },
      { to: "/onboarding", label: "Onboarding" },
      { to: "/offboarding", label: "Offboarding" },
      { to: "/requests", label: "So'rovlar / ticket" },
    ],
  },
  {
    label: "Tashkiliy tuzilma",
    icon: Building2,
    module: "hr",
    children: [
      { to: "/org", label: "Hierarchy" },
      { to: "/org/positions", label: "Lavozimlar" },
    ],
  },
  {
    label: "Ishga qabul qilish",
    icon: Briefcase,
    module: "hr",
    children: [
      { to: "/recruitment", label: "ATS / Pipeline" },
      { to: "/recruitment/vacancies", label: "Vakansiyalar" },
    ],
  },
  {
    label: "Mehnatga haq to'lash",
    icon: Wallet,
    module: "finance",
    children: [
      { to: "/payroll", label: "Ish haqi ma'lumoti" },
      { to: "/payroll/benefits", label: "Benefits" },
    ],
  },
  {
    label: "Ta'tillar va taqvim",
    icon: CalendarDays,
    module: "hr",
    children: [
      { to: "/leave/all", label: "Barcha ta'tillar" },
      { to: "/leave/sick", label: "Bolnichniy" },
      { to: "/leave/annual", label: "Mehnat ta'tili" },
      { to: "/leave/unpaid", label: "O'z hisobidan" },
      { to: "/attendance", label: "Davomat (istisnolar)" },
      { to: "/calendar", label: "HR kalendar" },
    ],
  },
  {
    label: "KPI va baholash",
    icon: ClipboardCheck,
    module: "hr",
    children: [
      { to: "/performance", label: "Performance" },
      { to: "/training", label: "O'qitish" },
    ],
  },
  {
    label: "O'qitish va rivojlantirish",
    icon: GraduationCap,
    module: "education",
    children: [{ to: "/training", label: "Treninglar va sertifikatlar" }],
  },
  {
    label: "Hujjatlar",
    icon: FolderOpen,
    module: "documents",
    children: [
      { to: "/documents", label: "Elektron papka" },
      { to: "/contracts", label: "Shartnomalar" },
      { to: "/templates", label: "Rasmiy hujjatlar" },
    ],
  },
  {
    label: "Hisobotlar",
    icon: FileBarChart,
    module: "analytics",
    children: [
      { to: "/reports", label: "Hisobotlar" },
      { to: "/analytics", label: "HR Analytics" },
      { to: "/rector", label: "Rektor dashboard" },
    ],
  },
  { to: "/ai", label: "AI HR Copilot", icon: Bot, module: "hr" },
  { to: "/automation", label: "Avtomatlashtirish", icon: Workflow, module: "hr" },
  {
    label: "Sozlamalar",
    icon: Settings,
    children: [
      { to: "/organization", label: "Tashkilot" },
      { to: "/settings", label: "HR sozlamalari", module: "hr" },
      { to: "/knowledge", label: "Knowledge Base", module: "hr" },
      { to: "/audit", label: "Audit log" },
    ],
  },
  {
    label: "Tizim sozlamalari",
    icon: Shield,
    roles: ["super_admin"],
    children: [
      { to: "/platform-admin", label: "Platform admin" },
      { to: "/system", label: "IT / xavfsizlik / integratsiya" },
    ],
  },
];

export function AppLayout() {
  const { user, logout, notifications, tasks, assignments, hasModule } = useApp();
  const [open, setOpen] = useState(true);
  const [mobile, setMobile] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const loc = useLocation();
  const nav = useNavigate();
  const visibleNotes = notifications.filter((n) => !n.forUserId || n.forUserId === user?.id);
  const unread = visibleNotes.filter((n) => !n.read).length;
  const unreadMail = assignments.filter(
    (a) => (a.toUserId === user?.id || a.fromUserId === user?.id) && !a.readBy.includes(user?.id ?? ""),
  ).length;

  useEffect(() => {
    setMobile(false);
    setBellOpen(false);
  }, [loc.pathname]);

  const menu = NAV.filter((i) => {
    if (i.roles && !(user && i.roles.includes(user.role))) return false;
    if (i.module && !hasModule(i.module)) return false;
    return true;
  }).map((i) => ({
    ...i,
    children: i.children?.filter((c) => !c.module || hasModule(c.module)),
  })).filter((i) => i.to || (i.children && i.children.length > 0));

  return (
    <div className="min-h-screen bg-[#f3f6fb]">
      {mobile && <div className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden" onClick={() => setMobile(false)} />}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex flex-col border-r border-slate-200 bg-white transition-all duration-200",
          open ? "w-[268px]" : "w-[76px]",
          mobile ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div
          className={cn(
            "flex h-[72px] shrink-0 items-center border-b border-slate-100",
            open ? "px-4" : "justify-center px-2",
          )}
        >
          <NavLink to="/" className="min-w-0" title="tizims.uz">
            <Logo compact={!open} />
          </NavLink>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-4 pt-4">
          {menu.map((item) => (
            <NavGroup key={item.label} item={item} collapsed={!open} inboxBadge={item.to === "/inbox" ? unreadMail : 0} />
          ))}
        </nav>
      </aside>

      <div className={cn("flex min-h-screen flex-col transition-all", open ? "lg:pl-[268px]" : "lg:pl-[76px]")}>
        <header className="relative sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-md sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"
              onClick={() => {
                if (window.innerWidth < 1024) setMobile((v) => !v);
                else setOpen((v) => !v);
              }}
            >
              {mobile ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <OrgSwitcher />
          </div>

          <div className="mx-auto hidden w-full max-w-md md:block">
            <GlobalSearchBar variant="bar" />
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <div className="md:hidden">
              <GlobalSearchBar variant="icon" />
            </div>
            {hasModule("hr") && (
            <div className="relative">
              <button className="relative rounded-xl p-2 text-slate-500 hover:bg-slate-100" onClick={() => nav("/inbox")} title="Xabarlar">
                <MessageSquare className="h-5 w-5" />
                {unreadMail > 0 && (
                  <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {unreadMail}
                  </span>
                )}
              </button>
            </div>
            )}
            <div className="relative">
              <button className="relative rounded-xl p-2 text-slate-500 hover:bg-slate-100" onClick={() => setBellOpen((v) => !v)}>
                <Bell className="h-5 w-5" />
                {unread > 0 && (
                  <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {unread}
                  </span>
                )}
              </button>
              {bellOpen && <NotificationPanel />}
            </div>
            <span className="hidden rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-500 sm:inline">UZ</span>
            <div className="hidden items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/80 px-2 py-1 md:flex">
              <Avatar name={user?.name ?? "HR"} size="sm" />
              <div className="hidden lg:block">
                <div className="text-sm font-semibold leading-tight">{user?.name}</div>
                <div className="text-[11px] text-slate-400">{roleLabel(user?.role ?? "")}</div>
              </div>
            </div>
            <button className="rounded-xl p-2 text-slate-400 hover:bg-slate-100" onClick={logout} title="Chiqish">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6">
          <div className="page-enter mx-auto max-w-[1520px]">
            <Outlet />
          </div>
        </main>
        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/70 px-6 py-3 text-xs text-slate-400">
          <span>© 2026 tizims.uz. Barcha huquqlar himoyalangan.</span>
          <span>Versiya: 1.0.0 · {tasks.filter((t) => !t.done).length} ochiq vazifa</span>
        </footer>
      </div>
      <OfficialDocHost />
    </div>
  );
}

function NotificationPanel() {
  const { user, notifications, markNotificationRead, markAllRead } = useApp();
  const nav = useNavigate();
  const mine = notifications.filter((n) => !n.forUserId || n.forUserId === user?.id);
  return (
    <div className="absolute right-0 top-11 w-[min(92vw,360px)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-nav">
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-sm font-semibold">Bildirishnomalar</span>
        <button className="text-xs text-brand-600" onClick={markAllRead}>
          Barchasini o'qilgan
        </button>
      </div>
      <div className="max-h-80 overflow-y-auto">
        {mine.map((n) => (
          <button
            key={n.id}
            onClick={() => {
              markNotificationRead(n.id);
              if (n.link) nav(n.link);
            }}
            className={cn("block w-full border-t border-slate-100 px-4 py-3 text-left hover:bg-slate-50", !n.read && "bg-brand-50/50")}
          >
            <div className="text-sm font-medium">{n.title}</div>
            <div className="mt-0.5 text-xs text-slate-500">{n.body}</div>
            <div className="mt-1 text-[11px] text-slate-400">{n.time} · {n.channel}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function NavGroup({ item, collapsed, inboxBadge = 0 }: { item: NavItem; collapsed: boolean; inboxBadge?: number }) {
  const loc = useLocation();
  const childActive = item.children?.some((c) => loc.pathname === c.to || loc.pathname.startsWith(c.to + "/"));
  const [open, setOpen] = useState(!!childActive);
  const Icon = item.icon;

  if (item.to) {
    return (
      <NavLink
        to={item.to}
        end={item.to === "/"}
        className={({ isActive }) =>
          cn(
            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
            isActive ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-50",
            collapsed && "justify-center px-0",
          )
        }
      >
        <span className="relative">
          <Icon className="h-[18px] w-[18px] shrink-0" />
          {collapsed && inboxBadge > 0 && (
            <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-brand-600" />
          )}
        </span>
        {!collapsed && item.label}
        {!collapsed && inboxBadge > 0 && (
          <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white">
            {inboxBadge}
          </span>
        )}
      </NavLink>
    );
  }

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
          childActive ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-50",
          collapsed && "justify-center px-0",
        )}
      >
        <Icon className="h-[18px] w-[18px] shrink-0" />
        {!collapsed && (
          <>
            <span className="flex-1 text-left">{item.label}</span>
            <ChevronDown className={cn("h-4 w-4 transition", open && "rotate-180")} />
          </>
        )}
      </button>
      {open && !collapsed && item.children && (
        <div className="mb-1 ml-4 mt-0.5 space-y-0.5 border-l border-slate-100 pl-3">
          {item.children.map((c) => (
            <NavLink
              key={c.to}
              to={c.to}
              end={c.end}
              className={({ isActive }) =>
                cn("block rounded-lg px-3 py-1.5 text-[13px]", isActive ? "font-semibold text-brand-700" : "text-slate-500 hover:text-slate-800")
              }
            >
              {c.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

export function Guard({ children, roles }: { children: ReactNode; roles?: string[] }) {
  const { user } = useApp();
  if (!user) return null;
  if (roles && !roles.includes(user.role)) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
        Bu bo'lim sizning rolingiz uchun yopiq.
      </div>
    );
  }
  return <>{children}</>;
}

