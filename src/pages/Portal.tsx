import { useState } from "react";
import { Bell, CalendarDays, FileText, Home, LogOut, MessageCircle, MessageSquare, User } from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useApp } from "../store/AppContext";
import { Badge, Button, Card, Field, Input, Select, Textarea } from "../components/ui";
import { Logo } from "../components/Logo";
import { formatMoney, leaveTypeLabel, unpaidDeduction, workingDays } from "../lib/utils";
import type { LeaveType } from "../types";

export function PortalLayout() {
  const { user, logout, assignments } = useApp();
  const unread = assignments.filter(
    (a) => (a.toUserId === user?.id || a.fromUserId === user?.id) && !a.readBy.includes(user?.id ?? ""),
  ).length;
  const items = [
    { to: "/portal", icon: Home, l: "Bosh sahifa", end: true },
    { to: "/portal/leave", icon: CalendarDays, l: "Ta'til" },
    { to: "/portal/inbox", icon: MessageSquare, l: "Xabarlar", badge: unread },
    { to: "/portal/requests", icon: FileText, l: "Xizmatlar" },
    { to: "/portal/profile", icon: User, l: "Profil" },
  ];
  return (
    <div className="min-h-screen bg-[#f3f6fb]">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b bg-white px-4 py-3">
        <div>
          <Logo size={20} />
          <div className="text-[11px] text-slate-400">{user?.name}</div>
        </div>
        <button onClick={logout} className="rounded-xl p-2 text-slate-400"><LogOut className="h-5 w-5" /></button>
      </header>
      <div className="mx-auto max-w-3xl p-4 pb-24">
        <Outlet />
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t bg-white/95 backdrop-blur">
        {items.map((i) => (
          <NavLink
            key={i.to}
            to={i.to}
            end={i.end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-2 text-[10px] ${isActive ? "text-brand-700" : "text-slate-400"}`
            }
          >
            <span className="relative">
              <i.icon className="h-5 w-5" />
              {"badge" in i && (i.badge ?? 0) > 0 && (
                <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[9px] font-bold text-white">
                  {i.badge}
                </span>
              )}
            </span>
            {i.l}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export function PortalHome() {
  const { user, employees, leaves, requests } = useApp();
  const emp = employees.find((e) => e.id === user?.employeeId) ?? employees[1];
  const nav = useNavigate();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Salom, {emp.firstName}</h1>
        <p className="text-sm text-slate-500">{emp.position}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4"><div className="text-xs text-slate-400">Ta'til balansi</div><div className="text-2xl font-bold">{emp.leaveBalance} kun</div></Card>
        <Card className="p-4"><div className="text-xs text-slate-400">Davomat</div><div className="text-2xl font-bold text-emerald-600">Normal</div></Card>
        <Card className="p-4"><div className="text-xs text-slate-400">Kutilayotgan so'rov</div><div className="text-2xl font-bold">{requests.filter((r) => r.employeeId === emp.id && r.status === "pending").length}</div></Card>
        <Card className="p-4"><div className="text-xs text-slate-400">Hujjatlar</div><div className="text-2xl font-bold">{emp.completeness >= 90 ? "To'liq" : "Yetishmaydi"}</div></Card>
      </div>
      <Card className="p-4">
        <div className="text-sm font-semibold">Keyingi vazifa</div>
        <div className="mt-1 text-slate-600">Performance review — {emp.status === "probation" ? "sinov muddati ko'rigi" : "kvartal baholash"}</div>
      </Card>
      <div className="grid gap-2">
        <Button onClick={() => nav("/portal/leave")}>Ta'til so'rash</Button>
        <Button variant="outline" onClick={() => nav("/portal/inbox")}>HR ga yozish</Button>
        <Button variant="outline" onClick={() => nav("/portal/requests")}>Ma'lumotnoma olish</Button>
        <Button variant="ghost" onClick={() => nav("/portal/assistant")}>
          <MessageCircle className="h-4 w-4" /> HR yordamchi
        </Button>
      </div>
      <div className="text-xs text-slate-400">Telegram: /leave /certificate /profile /help</div>
      <div className="flex items-center gap-2 text-xs text-slate-400"><Bell className="h-3 w-3" /> {leaves.filter((l) => l.employeeId === emp.id).length} ta'til yozuvi</div>
    </div>
  );
}

export function PortalLeave() {
  const { user, employees, createLeave, leaves } = useApp();
  const emp = employees.find((e) => e.id === user?.employeeId) ?? employees[1];
  const [type, setType] = useState<LeaveType>("annual");
  const [start, setStart] = useState("2026-09-14");
  const [end, setEnd] = useState("2026-09-18");
  const [reason, setReason] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const days = workingDays(start, end);
  const minus = type === "unpaid" ? unpaidDeduction(emp.salary, start, end) : 0;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Ta'til so'rovi</h1>
      <p className="text-sm text-slate-500">Ish haftasi dushanba–juma. O'z hisobidan ta'tilda kunlik oylikdan minus qilinadi.</p>
      <Card className="space-y-3 p-4">
        <Field label="Tur">
          <Select value={type} onChange={(e) => setType(e.target.value as LeaveType)}>
            {(["annual", "sick", "unpaid", "study"] as LeaveType[]).map((k) => (
              <option key={k} value={k}>{leaveTypeLabel[k]}</option>
            ))}
          </Select>
        </Field>
        <Field label="Boshlanish"><Input type="date" value={start} onChange={(e) => setStart(e.target.value)} /></Field>
        <Field label="Tugash"><Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} /></Field>
        <Field label="Sabab"><Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
        <div className="rounded-xl bg-slate-50 p-3 text-sm">
          Ish kunlari: <b>{days}</b>
          {type === "annual" && <div>Balans: {emp.leaveBalance} kun</div>}
          {type === "unpaid" && (
            <div className="text-amber-800">Oylikdan minus: <b>{formatMoney(minus)}</b></div>
          )}
        </div>
        {msg && <div className="rounded-xl bg-slate-50 p-2 text-sm">{msg}</div>}
        <Button
          className="w-full"
          onClick={() => {
            const err = createLeave(emp.id, type, start, end, reason || "Ta'til");
            setMsg(err ?? "So'rov yuborildi. Rahbar va HR tasdiqlaydi.");
          }}
        >
          Yuborish
        </Button>
      </Card>
      <div className="space-y-2">
        {leaves.filter((l) => l.employeeId === emp.id).map((l) => (
          <Card key={l.id} className="flex items-center justify-between p-4 text-sm">
            <div>
              <div>{leaveTypeLabel[l.type]} · {l.startDate} → {l.endDate} ({l.days} ish kuni)</div>
              {l.type === "unpaid" && l.deductionAmount ? (
                <div className="text-xs text-amber-700">Minus: {formatMoney(l.deductionAmount)}</div>
              ) : null}
            </div>
            <Badge>{l.status}</Badge>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function PortalRequests() {
  const { user, employees, createCertificate, requests } = useApp();
  const emp = employees.find((e) => e.id === user?.employeeId) ?? employees[1];
  const services = ["Employment Certificate", "Salary Certificate", "Employment History", "Document Request"];
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">HR xizmatlari</h1>
      <div className="grid gap-2">
        {services.map((s) => (
          <Button key={s} variant="outline" className="justify-between" onClick={() => createCertificate(emp.id, s)}>
            {s} <span className="text-xs text-slate-400">SLA 1 kun</span>
          </Button>
        ))}
      </div>
      {requests.filter((r) => r.employeeId === emp.id).map((r) => (
        <Card key={r.id} className="p-4 text-sm">
          {r.title} · {r.status} {r.documentReady && "· PDF tayyor"}
        </Card>
      ))}
    </div>
  );
}

export function PortalAssistant() {
  const { sendChat, chat } = useApp();
  const [t, setT] = useState("");
  return (
    <div className="space-y-3">
      <h1 className="text-xl font-bold">HR yordamchi</h1>
      <div className="space-y-2">
        {chat.slice(-8).map((m) => (
          <div key={m.id} className={`rounded-2xl px-3 py-2 text-sm ${m.role === "user" ? "bg-brand-600 text-white" : "bg-white"}`}>
            {m.text}
          </div>
        ))}
      </div>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          sendChat(t);
          setT("");
        }}
      >
        <Input value={t} onChange={(e) => setT(e.target.value)} placeholder="Necha kun ta'til olishim mumkin?" />
        <Button type="submit">OK</Button>
      </form>
    </div>
  );
}

export function PortalProfile() {
  const { user, employees } = useApp();
  const emp = employees.find((e) => e.id === user?.employeeId) ?? employees[1];
  return (
    <div className="space-y-3">
      <h1 className="text-xl font-bold">Mening profilim</h1>
      <Card className="space-y-2 p-4 text-sm">
        <Row k="F.I.O." v={emp.fullName} />
        <Row k="ID" v={emp.employeeId} />
        <Row k="Lavozim" v={emp.position} />
        <Row k="Email" v={emp.email} />
        <Row k="Shartnoma" v={emp.contractEnd ?? "—"} />
        <Row k="Ta'til" v={`${emp.leaveBalance} kun`} />
      </Card>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-2 border-b border-slate-50 py-1">
      <span className="text-slate-400">{k}</span>
      <span className="font-medium">{v}</span>
    </div>
  );
}
