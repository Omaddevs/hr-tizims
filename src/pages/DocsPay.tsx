import { useMemo, useState } from "react";
import { useApp } from "../store/AppContext";
import { Badge, Button, Card, Field, PageTitle, Select, StatusBadge, TableWrap, Td, Th } from "../components/ui";
import { formatMoney, leaveTypeLabel, unpaidDeduction } from "../lib/utils";
import { OFFICIAL_KINDS, officialHtml, officialTitle, printBlankOrder, printOfficial, type OfficialKind } from "../lib/official";
import { wrapOfficialHtml } from "../lib/printDoc";

export function DocumentsPage() {
  const { employees, catalog } = useApp();
  const [empId, setEmpId] = useState(employees[1]?.id ?? employees[0]?.id);
  const docs = catalog.documents.filter((d) => d.employeeId === empId);
  return (
    <div>
      <PageTitle title="Elektron hujjatlar" subtitle="PDF, DOCX, JPG, PNG · xodim papkasi avtomatik" />
      <Select className="mb-4 max-w-sm" value={empId} onChange={(e) => setEmpId(e.target.value)}>
        {employees.map((e) => <option key={e.id} value={e.id}>{e.fullName}</option>)}
      </Select>
      <Card>
        <TableWrap>
          <thead><tr><Th>Fayl</Th><Th>Papka</Th><Th>Tur</Th><Th>Sana</Th></tr></thead>
          <tbody>
            {docs.map((d) => (
              <tr key={d.id}><Td className="font-medium">{d.name}</Td><Td>{d.folder}</Td><Td>{d.type}</Td><Td>{d.date}</Td></tr>
            ))}
          </tbody>
        </TableWrap>
      </Card>
    </div>
  );
}

export function ContractsPage() {
  const { employees, departments, catalog } = useApp();
  const rows = catalog.contracts.map((c) => ({ ...c, emp: employees.find((e) => e.id === c.employeeId) }))
    .sort((a, b) => a.daysLeft - b.daysLeft);
  return (
    <div>
      <PageTitle title="Shartnomalar" subtitle="90/60/30/14/7/1 kun oldin eslatma. Rasmiy mehnat shartnomasi xodim profilidan avtomatik chiqadi." />
      <Card>
        <TableWrap>
          <thead><tr><Th>Xodim</Th><Th>Lavozim</Th><Th>Boshlanish</Th><Th>Tugash</Th><Th>Qolgan</Th><Th>Status</Th><Th></Th></tr></thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className={c.daysLeft <= 45 ? "bg-amber-50/60" : ""}>
                <Td>{c.emp?.fullName}</Td>
                <Td>{c.position}</Td>
                <Td>{c.startDate}</Td>
                <Td>{c.endDate}</Td>
                <Td>{c.daysLeft} kun</Td>
                <Td><StatusBadge status={c.status} /></Td>
                <Td>
                  {c.emp && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        printOfficial(
                          "employment_contract",
                          c.emp!,
                          departments.find((d) => d.id === c.emp!.departmentId)?.name ?? "",
                        )
                      }
                    >
                      Shartnoma
                    </Button>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </Card>
    </div>
  );
}

export function TemplatesPage() {
  const { employees, departments, leaves } = useApp();
  const [empId, setEmpId] = useState(employees[1]?.id ?? employees[0]?.id ?? "");
  const [kind, setKind] = useState<OfficialKind>("leave_order");
  const emp = employees.find((e) => e.id === empId);
  const empLeaves = leaves.filter((l) => l.employeeId === empId);
  const [leaveId, setLeaveId] = useState(empLeaves[0]?.id ?? "");
  const leave = empLeaves.find((l) => l.id === leaveId) ?? empLeaves[0];
  const deptName = emp ? departments.find((d) => d.id === emp.departmentId)?.name ?? "" : "";

  const html = useMemo(() => {
    if (!emp) return "";
    if (kind === "leave_order" && !leave) return "";
    return wrapOfficialHtml(officialTitle(kind), officialHtml(kind, emp, deptName, leave));
  }, [emp, kind, deptName, leave]);

  if (!emp) {
    return (
      <div>
        <PageTitle title="Rasmiy hujjatlar" subtitle="Rektor buyrug'i, mehnat shartnomasi va ma'lumotnoma xodim ma'lumotlaridan avtomatik yig'iladi." />
        <Card className="p-6 text-sm text-slate-500">Bu tashkilotda xodim yo'q.</Card>
      </div>
    );
  }

  const selected = emp;

  function print() {
    if (kind === "leave_order" && !leave) return;
    printOfficial(kind, selected, deptName, leave);
  }

  return (
    <div>
      <PageTitle
        title="Rasmiy hujjatlar"
        subtitle="Buyruq Word kabi ochiladi: shrift, o'lcham, rang, elektron imzo, muhr. Chop etishda ulangan printer tanlanadi."
        action={<Button variant="outline" onClick={printBlankOrder}>Yangi bo'sh buyruq</Button>}
      />
      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <Field label="Hujjat turi">
          <Select value={kind} onChange={(e) => setKind(e.target.value as OfficialKind)}>
            {OFFICIAL_KINDS.map((k) => (
              <option key={k.id} value={k.id}>{k.name}</option>
            ))}
          </Select>
        </Field>
        <Field label="Xodim">
          <Select
            value={empId}
            onChange={(e) => {
              setEmpId(e.target.value);
              const next = leaves.filter((l) => l.employeeId === e.target.value);
              setLeaveId(next[0]?.id ?? "");
            }}
          >
            {employees.map((e) => <option key={e.id} value={e.id}>{e.fullName}</option>)}
          </Select>
        </Field>
        {kind === "leave_order" && (
          <Field label="Ta'til yozuvi">
            <Select value={leave?.id ?? ""} onChange={(e) => setLeaveId(e.target.value)}>
              {empLeaves.length === 0 && <option value="">Ta'til yozuvi yo'q</option>}
              {empLeaves.map((l) => (
                <option key={l.id} value={l.id}>
                  {leaveTypeLabel[l.type]} · {l.startDate} → {l.endDate}
                </option>
              ))}
            </Select>
          </Field>
        )}
      </div>
      {kind === "leave_order" && !leave ? (
        <Card className="p-6 text-sm text-slate-500">Bu xodimda ta'til yozuvi yo'q. Avval Ta'til bo'limida yozuv yarating.</Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-3">
            <div className="text-sm font-semibold">{officialTitle(kind)}</div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={print}>Wordda ochish</Button>
              <Button onClick={print}>Chop etish / PDF</Button>
            </div>
          </div>
          <iframe title="Rasmiy hujjat" srcDoc={html} className="h-[820px] w-full bg-white" />
        </Card>
      )}
    </div>
  );
}

export function PayrollPage() {
  const { employees, leaves } = useApp();
  const total = employees.reduce((s, e) => s + e.salary, 0);
  const cuts = employees.reduce((s, e) => s + unpaidCut(e.id), 0);

  function unpaidCut(empId: string) {
    return leaves
      .filter((l) => l.employeeId === empId && l.type === "unpaid" && l.status === "approved")
      .reduce((sum, l) => {
        const emp = employees.find((x) => x.id === empId);
        return sum + (l.deductionAmount ?? (emp ? unpaidDeduction(emp.salary, l.startDate, l.endDate) : 0));
      }, 0);
  }

  return (
    <div>
      <PageTitle title="Ish haqi ma'lumoti" subtitle="O'z hisobidan ta'til: ish kunlari (Du–Ju) oylikdan minus qilinadi." />
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <Card className="p-5">
          <div className="text-sm text-slate-500">Tanlanma fond</div>
          <div className="text-2xl font-bold">{formatMoney(total)}</div>
        </Card>
        <Card className="p-5">
          <div className="text-sm text-slate-500">O'z hisobidan minus (tasdiqlangan)</div>
          <div className="text-2xl font-bold text-amber-700">{formatMoney(cuts)}</div>
        </Card>
      </div>
      <Card>
        <TableWrap>
          <thead><tr><Th>Xodim</Th><Th>Lavozim</Th><Th>Oylik</Th><Th>O'z hisobidan minus</Th><Th>Netto</Th></tr></thead>
          <tbody>
            {employees.map((e) => {
              const cut = unpaidCut(e.id);
              return (
                <tr key={e.id}>
                  <Td>{e.fullName}</Td>
                  <Td>{e.position}</Td>
                  <Td>{formatMoney(e.salary)}</Td>
                  <Td className="text-amber-700">{cut ? formatMoney(cut) : "—"}</Td>
                  <Td className="font-medium">{formatMoney(e.salary - cut)}</Td>
                </tr>
              );
            })}
          </tbody>
        </TableWrap>
      </Card>
    </div>
  );
}

export function BenefitsPage() {
  return (
    <div>
      <PageTitle title="Benefits" />
      <div className="grid gap-3 md:grid-cols-3">
        {["Tibbiy sug'urta", "Transport", "O'qish imtiyozi", "Sport", "Bolalar bog'chasi", "Uy-joy yordami"].map((b) => (
          <Card key={b} className="p-5 font-medium">{b}</Card>
        ))}
      </div>
    </div>
  );
}

export function PerformancePage() {
  const { employees, catalog } = useApp();
  return (
    <div>
      <PageTitle title="KPI va baholash" subtitle="Goal → Quarterly → Feedback → Self → Final → Development" />
      <Card>
        <TableWrap>
          <thead><tr><Th>Xodim</Th><Th>Sikl</Th><Th>KPI</Th><Th>Status</Th><Th>Keyingi</Th></tr></thead>
          <tbody>
            {catalog.performance.map((p) => (
              <tr key={p.id}>
                <Td>{employees.find((e) => e.id === p.employeeId)?.fullName}</Td>
                <Td>{p.cycle}</Td>
                <Td>{p.kpi || "—"}</Td>
                <Td>{p.status}</Td>
                <Td>{p.nextReview}</Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </Card>
    </div>
  );
}

export function TrainingPage() {
  const { catalog } = useApp();
  return (
    <div>
      <PageTitle title="O'qitish va rivojlantirish" />
      <div className="grid gap-4 md:grid-cols-3">
        {catalog.trainings.map((t) => (
          <Card key={t.id} className="p-5">
            <div className="text-lg font-semibold">{t.title}</div>
            <div className="mt-1 text-sm text-slate-500">{t.type} · {t.date}</div>
            <div className="mt-3 flex gap-2">
              <Badge tone="blue">{t.attendees} qatnashuvchi</Badge>
              {t.overdue > 0 && <Badge tone="red">{t.overdue} overdue</Badge>}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
