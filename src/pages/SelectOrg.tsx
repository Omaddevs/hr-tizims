import { useNavigate } from "react-router-dom";
import { Building2 } from "lucide-react";
import { useApp } from "../store/AppContext";
import { Button, Card, PageTitle } from "../components/ui";
import { Logo } from "../components/Logo";

export function SelectOrgPage() {
  const { user, organizations, switchOrganization, logout } = useApp();
  const nav = useNavigate();

  if (!user) return null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f3f6fb] p-6">
      <div className="w-full max-w-lg">
        <Logo size={22} />
        <PageTitle title="Qaysi tashkilotga kirmoqchisiz?" subtitle={`${user.name} — bir nechta workspace`} />
        <div className="space-y-3">
          {organizations.map((o) => (
            <button
              key={o.id}
              onClick={() => {
                const err = switchOrganization(o.id);
                if (!err) nav("/");
              }}
              className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-card hover:border-brand-200"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                <Building2 className="h-5 w-5" />
              </span>
              <span>
                <span className="block font-semibold">{o.name}</span>
                <span className="text-xs capitalize text-slate-400">{o.organizationType}</span>
              </span>
            </button>
          ))}
        </div>
        <Button variant="ghost" className="mt-4" onClick={logout}>
          Chiqish
        </Button>
      </div>
    </div>
  );
}

export function ModuleHome({ title, subtitle }: { title: string; subtitle: string }) {
  const { organization } = useApp();
  return (
    <div>
      <PageTitle title={title} subtitle={`${organization?.name ?? "Tashkilot"} · ${subtitle}`} />
      <Card className="p-6">
        <p className="text-sm text-slate-600">
          Bu modul Tizims Core ga ulangan. Hozircha demo sahifa — HR moduli to'liq ishlaydi, qolgan modullar shu Core ustiga qo'shiladi.
        </p>
        <p className="mt-2 text-xs text-slate-400">Tenant: {organization?.id}</p>
      </Card>
    </div>
  );
}
