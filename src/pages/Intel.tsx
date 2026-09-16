import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { HEADCOUNT_SERIES } from "../data/seed";
import { useApp, useStaticData } from "../store/AppContext";
import { Badge, Button, Card, PageTitle } from "../components/ui";
import { formatCompact } from "../lib/utils";

export function ReportsPage() {
  const { kpis } = useApp();
  function download(name: string, body: string) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([body], { type: "text/plain" }));
    a.download = name;
    a.click();
  }
  const daily = `Kunlik HR hisobot
Yangi xodimlar: ${kpis.newThisMonth}
Ketganlar: ${kpis.leftThisMonth}
Davomat istisnolari: ${kpis.attendanceIssues}
Kutilayotgan tasdiqlar: ${kpis.pendingApprovals}
Shartnoma riski: ${kpis.contractsExpiring}`;

  return (
    <div>
      <PageTitle title="Hisobotlar" subtitle="Og'ir hisobotlar fon reja sifatida. Demo — bir zumda generatsiya." />
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { t: "Kunlik HR hisobot", f: "daily-hr.txt", b: daily },
          { t: "Haftalik", f: "weekly-hr.txt", b: "Recruitment, onboarding, davomat, ta'til, o'zgarishlar." },
          { t: "Oylik", f: "monthly-hr.txt", b: `Headcount ${kpis.totalEmployees}. Turnover ${(kpis.leftThisMonth / kpis.totalEmployees * 100).toFixed(2)}%.` },
        ].map((r) => (
          <Card key={r.t} className="p-5">
            <div className="font-semibold">{r.t}</div>
            <p className="mt-2 text-sm text-slate-500">{r.b.slice(0, 80)}...</p>
            <Button className="mt-4" onClick={() => download(r.f, r.b)}>Yuklab olish</Button>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function AnalyticsPage() {
  const { kpis } = useApp();
  const turnover = kpis.totalEmployees ? ((kpis.leftThisMonth / kpis.totalEmployees) * 100).toFixed(2) : "0.00";
  const funnel = [
    { n: "Ariza", v: 48 },
    { n: "Skrining", v: 22 },
    { n: "Suhbat", v: 11 },
    { n: "Taklif", v: 4 },
    { n: "Qabul", v: 3 },
  ];
  return (
    <div>
      <PageTitle title="HR Analytics" subtitle="Headcount, turnover, recruitment, davomat" />
      <div className="mb-4 grid gap-3 sm:grid-cols-4">
        <Stat k="Turnover" v={`${turnover}%`} />
        <Stat k="Time-to-hire (o'rt.)" v="28 kun" />
        <Stat k="Self-service" v="82%" />
        <Stat k="Avtomatlashtirish" v="76%" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <div className="mb-2 text-sm font-semibold">Headcount</div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={HEADCOUNT_SERIES}>
                <CartesianGrid stroke="#eef2f7" />
                <XAxis dataKey="month" />
                <YAxis domain={[1160, 1280]} />
                <Tooltip />
                <Line dataKey="value" stroke="#1B5EF3" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-4">
          <div className="mb-2 text-sm font-semibold">Recruitment funnel</div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnel}>
                <CartesianGrid stroke="#eef2f7" />
                <XAxis dataKey="n" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="v" fill="#1B5EF3" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <Card className="p-4">
      <div className="text-xs text-slate-400">{k}</div>
      <div className="text-2xl font-bold">{v}</div>
    </Card>
  );
}

export function RectorPage() {
  const nav = useNavigate();
  const { assignments, user, kpis } = useApp();
  const incoming = assignments.filter((a) => a.toUserId === user?.id && a.status !== "done");
  const sentOpen = assignments.filter((a) => a.fromUserId === user?.id && a.status !== "done");
  return (
    <div>
      <PageTitle title="Rektor dashboard" subtitle="Faqat boshqaruv darajasidagi ko'rsatkichlar" />
      <Card className="mb-4 border-brand-100 bg-brand-50/60 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-800">HR ga topshiriq berish</div>
            <p className="mt-1 max-w-xl text-sm text-slate-600">
              Masalan: «Omadbek Egamberdiyev uchun mehnat ta'tili hisoblarini tayyorla». HR hisobni tayyorlab, Excel faylini shu yerga yuklaydi.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => nav("/inbox?compose=1&to=u1&category=leave")}>HR ga yozish</Button>
            <Button variant="outline" onClick={() => nav("/inbox")}>
              Xabarlar {sentOpen.length + incoming.length > 0 ? `(${sentOpen.length + incoming.length})` : ""}
            </Button>
          </div>
        </div>
      </Card>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Jami xodimlar", formatCompact(kpis.totalEmployees)],
          ["Akademik", String(kpis.academic)],
          ["Ma'muriy", String(kpis.administrative)],
          ["Bu oy yangi", String(kpis.newThisMonth)],
          ["Bu oy ketgan", String(kpis.leftThisMonth)],
          ["Bo'sh o'rinlar", String(kpis.vacancies)],
          ["Shartnoma tugaydi", String(kpis.contractsExpiring)],
          ["Davomat muammolari", String(kpis.attendanceIssues)],
        ].map(([k, v]) => (
          <Card key={k} className="p-5">
            <div className="text-sm text-slate-500">{k}</div>
            <div className="text-2xl font-bold">{v}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function AIPage() {
  const { chat, sendChat } = useApp();
  const [text, setText] = useState("");
  return (
    <div>
      <PageTitle title="AI HR Copilot" subtitle="Tavsiya qiladi, tahlil qiladi, draft yozadi. Hiring/termination/maosh — inson tasdiqlaydi." />
      <Card className="flex h-[640px] flex-col">
        <div className="flex-1 space-y-3 overflow-y-auto p-5">
          {chat.map((m) => (
            <div key={m.id} className={m.role === "user" ? "ml-12 rounded-2xl bg-brand-600 px-4 py-3 text-sm text-white" : "mr-12 rounded-2xl bg-slate-50 px-4 py-3 text-sm"}>
              {m.text}
              {m.table && (
                <table className="mt-3 w-full text-left text-xs">
                  <tbody>
                    {m.table.map((row, i) => (
                      <tr key={i} className={i === 0 ? "font-semibold" : ""}>
                        {row.map((c) => <td key={c} className="border-t border-slate-200 py-1 pr-2">{c}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ))}
        </div>
        <form
          className="flex gap-2 border-t p-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!text.trim()) return;
            sendChat(text);
            setText("");
          }}
        >
          <input className="h-11 flex-1 rounded-xl border px-3 text-sm" placeholder="Masalan: 30 kun ichida shartnomasi tugaydiganlarni ko'rsat" value={text} onChange={(e) => setText(e.target.value)} />
          <Button type="submit">Yuborish</Button>
        </form>
        <div className="flex flex-wrap gap-2 px-3 pb-3">
          {["Bugungi tasklar", "Shartnomasi tugayotganlar", "Onboardingda qolganlar", "Oylik hisobot"].map((q) => (
            <button key={q} className="rounded-full bg-slate-100 px-3 py-1 text-xs" onClick={() => sendChat(q)}>{q}</button>
          ))}
        </div>
      </Card>
    </div>
  );
}

export function AutomationPage() {
  const catalog = useStaticData();
  const [rules, setRules] = useState(catalog.workflows);
  return (
    <div>
      <PageTitle title="Workflow / avtomatlashtirish" subtitle="No-code qoidalar. IF → THEN. Tizim HR o'rniga eslatadi." />
      <div className="space-y-3">
        {rules.map((r) => (
          <Card key={r.id} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold">{r.name}</div>
                <div className="mt-1 font-mono text-xs text-brand-700">{r.trigger}</div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {r.actions.map((a) => <Badge key={a} tone="blue">{a}</Badge>)}
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={r.enabled} onChange={(e) => setRules((list) => list.map((x) => (x.id === r.id ? { ...x, enabled: e.target.checked } : x)))} />
                Faol
              </label>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function KnowledgePage() {
  const catalog = useStaticData();
  return (
    <div>
      <PageTitle title="Knowledge Base" subtitle="AI faqat tasdiqlangan reglament asosida javob beradi." />
      <div className="grid gap-4 md:grid-cols-2">
        {catalog.knowledge.map((k) => (
          <Card key={k.id} className="p-5">
            <Badge>{k.category}</Badge>
            <div className="mt-2 text-lg font-semibold">{k.title}</div>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{k.body}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function AuditPage() {
  const { audit } = useApp();
  return (
    <div>
      <PageTitle title="Audit log" subtitle="Hech qanday muhim o'zgarish izsiz qolmaydi." />
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase text-slate-400">
                <th className="px-4 py-3">Foydalanuvchi</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Obyekt</th>
                <th className="px-4 py-3">Qiymat</th>
                <th className="px-4 py-3">Sana</th>
                <th className="px-4 py-3">IP</th>
              </tr>
            </thead>
            <tbody>
              {audit.map((a) => (
                <tr key={a.id} className="border-t">
                  <td className="px-4 py-3">{a.user}</td>
                  <td className="px-4 py-3">{a.action}</td>
                  <td className="px-4 py-3">{a.object} {a.objectId}</td>
                  <td className="px-4 py-3 text-xs">{a.oldValue} {a.newValue}</td>
                  <td className="px-4 py-3">{a.date}</td>
                  <td className="px-4 py-3">{a.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

export function SettingsPage() {
  return (
    <div>
      <PageTitle title="HR sozlamalari" />
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-5">
          <h3 className="font-semibold">SLA</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li>Ma'lumotnoma — 1 ish kuni</li>
            <li>Ta'til — 1 ish kuni</li>
            <li>Shaxsiy ma'lumot — 2 ish kuni</li>
            <li>Murakkab so'rov — 3 ish kuni</li>
          </ul>
        </Card>
        <Card className="p-5">
          <h3 className="font-semibold">Bildirishnomalar</h3>
          <label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" defaultChecked /> In-app</label>
          <label className="mt-2 flex items-center gap-2 text-sm"><input type="checkbox" defaultChecked /> Telegram</label>
          <label className="mt-2 flex items-center gap-2 text-sm"><input type="checkbox" defaultChecked /> Email</label>
          <label className="mt-2 flex items-center gap-2 text-sm"><input type="checkbox" /> SMS</label>
        </Card>
      </div>
    </div>
  );
}

export function SystemPage() {
  return (
    <div>
      <PageTitle title="Tizim sozlamalari" subtitle="Super Admin: integratsiya, backup, monitoring, RBAC" />
      <div className="grid gap-3 md:grid-cols-3">
        {[
          ["API status", "OK"],
          ["Database", "PostgreSQL · healthy"],
          ["Queue", "0 failed jobs"],
          ["Backup", "Oxirgi: bugun 03:00"],
          ["Storage", "18% used"],
          ["MFA", "Majburiy (HR/rektor)"],
        ].map(([k, v]) => (
          <Card key={k} className="p-5">
            <div className="text-xs text-slate-400">{k}</div>
            <div className="mt-1 font-semibold">{v}</div>
          </Card>
        ))}
      </div>
      <Card className="mt-4 p-5">
        <h3 className="font-semibold">Integratsiya markazi</h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {["ERP", "Buxgalteriya", "Biometrik davomat", "Active Directory", "Google Workspace", "Telegram bot", "E-imzo", "LMS"].map((i) => (
            <div key={i} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm">
              <span>{i}</span>
              <Badge tone="amber">Tayyor (API)</Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
