import { FormEvent, useState } from "react";
import { ShieldCheck, Workflow, Bot } from "lucide-react";
import { useApp } from "../store/AppContext";
import { Button, Input } from "../components/ui";
import { Logo } from "../components/Logo";

const DEMOS = [
  { email: "hr@iau.uz", password: "admin123", role: "IAU · HR Administrator" },
  { email: "rector@iau.uz", password: "rector123", role: "IAU · Rektor" },
  { email: "omadbek@tizims.uz", password: "demo123", role: "IAU + ABC Shop" },
  { email: "shop@abc.uz", password: "shop123", role: "ABC Shop · Menejer" },
  { email: "farm@medfarm.uz", password: "farm123", role: "MedFarm · Menejer" },
  { email: "dean@iau.uz", password: "dean123", role: "IAU · Bo'lim rahbari" },
  { email: "employee@iau.uz", password: "emp123", role: "IAU · Xodim" },
  { email: "admin@iau.uz", password: "super123", role: "Super Admin" },
  { email: "director@iau.uz", password: "director123", role: "IAU · HR Direktor" },
];

export function LoginPage() {
  const { login } = useApp();
  const [email, setEmail] = useState("hr@iau.uz");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(login(email, password));
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-[#0f2460] p-12 text-white lg:flex lg:flex-col justify-between">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-brand-500/30 blur-3xl" />
        <div className="relative">
          <div className="inline-flex items-center">
            <Logo inverted size={28} />
          </div>
          <div className="mt-3 text-xs text-blue-200">Multi-tenant CRM / ERP · HR moduli</div>
          <h1 className="mt-16 max-w-md text-4xl font-bold leading-tight">
            Tizim HR uchun ishlaydi. HR nazorat qiladi.
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-blue-100/80">
            1 nafar HR xodimi + workflow + self-service + AI. Takroriy ishlar avtomatik: hujjat, ta'til, eslatma, hisobot.
          </p>
        </div>
        <div className="relative grid gap-4">
          {[
            { icon: Workflow, t: "Workflow engine", d: "Tasdiqlash, SLA, eslatmalar" },
            { icon: Bot, t: "AI Copilot", d: "Risk, FAQ, hisobot draft" },
            { icon: ShieldCheck, t: "RBAC + audit", d: "Maosh, passport, JSHSHIR himoyasi" },
          ].map((x) => (
            <div key={x.t} className="flex gap-3 rounded-2xl bg-white/10 p-4">
              <x.icon className="h-5 w-5 text-amber-300" />
              <div>
                <div className="text-sm font-semibold">{x.t}</div>
                <div className="text-xs text-blue-100/70">{x.d}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-center p-6">
        <form onSubmit={onSubmit} className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-card">
          <div className="mb-6 lg:hidden">
            <Logo size={24} />
          </div>
          <h2 className="text-2xl font-bold">Tizimga kirish</h2>
          <p className="mt-1 text-sm text-slate-500">Tizims.uz — tashkilot workspace va HR moduli</p>
          <div className="mt-6 space-y-4">
            <label className="block text-sm">
              <span className="mb-1.5 block text-slate-500">Email</span>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block text-slate-500">Parol</span>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </label>
            {error && <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
            <Button type="submit" className="w-full" size="lg">
              Kirish
            </Button>
          </div>
          <div className="mt-6">
            <div className="mb-2 text-xs font-medium text-slate-400">Demo akkauntlar</div>
            <div className="grid gap-2">
              {DEMOS.map((d) => (
                <button
                  key={d.email}
                  type="button"
                  onClick={() => {
                    setEmail(d.email);
                    setPassword(d.password);
                  }}
                  className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2 text-left text-xs hover:bg-slate-50"
                >
                  <span className="font-medium text-slate-700">{d.role}</span>
                  <span className="text-slate-400">{d.email}</span>
                </button>
              ))}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
