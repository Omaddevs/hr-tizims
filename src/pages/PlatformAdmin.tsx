import { useApp } from "../store/AppContext";
import { ORGANIZATIONS, ORGANIZATION_MODULES } from "../core/seed";
import { MEMBERSHIPS } from "../core/seed";
import { MODULES } from "../core/catalog";
import { USERS } from "../data/seed";
import { Badge, Card, PageTitle } from "../components/ui";
import { Navigate } from "react-router-dom";

export function PlatformAdminPage() {
  const { user } = useApp();
  if (user?.role !== "super_admin") return <Navigate to="/" replace />;

  return (
    <div>
      <PageTitle title="Platform admin" subtitle="tizims.uz — tashkilotlar, foydalanuvchilar, modullar" />
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <div className="text-xs text-slate-400">Tashkilotlar</div>
          <div className="text-2xl font-bold">{ORGANIZATIONS.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-slate-400">Foydalanuvchilar</div>
          <div className="text-2xl font-bold">{USERS.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-slate-400">Modullar</div>
          <div className="text-2xl font-bold">{MODULES.length}</div>
        </Card>
      </div>
      <Card className="overflow-hidden">
        <div className="border-b px-5 py-3 text-sm font-semibold">Tashkilotlar</div>
        <div className="divide-y">
          {ORGANIZATIONS.map((o) => {
            const mods = ORGANIZATION_MODULES.filter((m) => m.organizationId === o.id && m.enabled);
            const members = MEMBERSHIPS.filter((m) => m.organizationId === o.id).length;
            return (
              <div key={o.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3">
                <div>
                  <div className="font-medium">{o.name}</div>
                  <div className="text-[11px] text-slate-400">{o.slug} · {o.organizationType} · {members} a'zo</div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {mods.map((m) => (
                    <Badge key={m.id} tone="blue">{m.moduleKey}</Badge>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

export function OrgSettingsPage() {
  const { organization, enabledModules, memberships } = useApp();
  return (
    <div>
      <PageTitle title="Tashkilot sozlamalari" subtitle={organization?.name} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="text-sm font-semibold">Umumiy</div>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-slate-400">Nomi</dt><dd>{organization?.name}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-400">Tur</dt><dd className="capitalize">{organization?.organizationType}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-400">Asosiy rang</dt><dd>{organization?.primaryColor}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-400">Valyuta</dt><dd>{organization?.currency}</dd></div>
          </dl>
        </Card>
        <Card className="p-5">
          <div className="text-sm font-semibold">Yoqilgan modullar</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {enabledModules.map((m) => (
              <Badge key={m} tone="green">{m}</Badge>
            ))}
          </div>
          <div className="mt-4 text-sm font-semibold">A'zolar</div>
          <div className="mt-2 text-sm text-slate-500">{memberships.length} ta membership</div>
        </Card>
      </div>
    </div>
  );
}
