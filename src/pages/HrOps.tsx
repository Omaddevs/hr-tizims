import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useApp } from "../store/AppContext";
import { Badge, Button, Card, PageTitle, StatusBadge, TableWrap, Td, Th } from "../components/ui";
import { stageLabel } from "../lib/utils";
import type { RecruitmentStage } from "../types";

const STAGES: RecruitmentStage[] = ["applied", "screening", "interview", "assessment", "final", "offer", "hired", "rejected"];

export function RecruitmentPage() {
  const { candidates, moveCandidate, hireCandidate } = useApp();
  return (
    <div>
      <PageTitle title="Recruitment / ATS" subtitle="Pipeline avtomatik kuzatiladi. AI match — tavsiya; yakuniy hiring insonniki." />
      <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
        {STAGES.filter((s) => s !== "rejected").map((s) => (
          <div key={s} className="rounded-xl bg-white px-3 py-2 text-xs shadow-card">
            <div className="text-slate-400">{stageLabel[s]}</div>
            <div className="text-lg font-bold">{candidates.filter((c) => c.stage === s).length}</div>
          </div>
        ))}
      </div>
      <div className="grid gap-3 lg:grid-cols-4">
        {STAGES.filter((s) => s !== "hired" && s !== "rejected").map((s) => (
          <Card key={s} className="p-3">
            <div className="mb-2 text-xs font-semibold uppercase text-slate-400">{stageLabel[s]}</div>
            <div className="space-y-2">
              {candidates.filter((c) => c.stage === s).map((c) => (
                <div key={c.id} className="rounded-xl border border-slate-100 p-3">
                  <div className="text-sm font-semibold">{c.fullName}</div>
                  <div className="text-[11px] text-slate-400">{c.education}</div>
                  <div className="mt-2 flex items-center justify-between">
                    <Badge tone={c.match >= 80 ? "green" : "amber"}>Match {c.match}%</Badge>
                    <select
                      className="rounded-lg border px-1 py-1 text-[11px]"
                      value={c.stage}
                      onChange={(e) => {
                        const next = e.target.value as RecruitmentStage;
                        if (next === "hired") hireCandidate(c.id);
                        else moveCandidate(c.id, next);
                      }}
                    >
                      {STAGES.map((st) => (
                        <option key={st} value={st}>{stageLabel[st]}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function VacanciesPage() {
  const { departments, catalog } = useApp();
  return (
    <div>
      <PageTitle title="Vakansiyalar" />
      <div className="grid gap-4 md:grid-cols-2">
        {catalog.vacancies.map((v) => (
          <Card key={v.id} className="p-5">
            <div className="text-lg font-semibold">{v.position}</div>
            <div className="text-sm text-slate-500">{departments.find((d) => d.id === v.departmentId)?.name}</div>
            <div className="mt-3 text-sm">Maosh: {v.salaryRange} · Muddat: {v.deadline}</div>
            <div className="mt-2 flex flex-wrap gap-1">
              {v.requirements.map((r) => <Badge key={r}>{r}</Badge>)}
            </div>
            <div className="mt-3 text-xs text-slate-400">{v.openings} ochiq o'rin · {v.responsible}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function AttendancePage() {
  const { employees, catalog } = useApp();
  return (
    <div>
      <PageTitle title="Davomat — faqat istisnolar" subtitle="Normal holatlar yashirin. HR Action Required ni ko'radi." />
      <Card>
        <TableWrap>
          <thead><tr><Th>Xodim</Th><Th>Muammo</Th><Th>Risk</Th><Th>Harakat</Th><Th>Sana</Th></tr></thead>
          <tbody>
            {catalog.attendance.map((a) => (
              <tr key={a.id}>
                <Td className="font-medium">{employees.find((e) => e.id === a.employeeId)?.fullName}</Td>
                <Td>{a.issue}</Td>
                <Td><Badge tone={a.risk === "high" ? "red" : "amber"}>{a.risk}</Badge></Td>
                <Td>{a.action}</Td>
                <Td>{a.date}</Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </Card>
    </div>
  );
}

export function CalendarPage() {
  return <Navigate to="/leave/all" replace />;
}

export function RequestsPage() {
  const { requests, employees, approveRequest, tickets, createTicket, user } = useApp();
  const [subject, setSubject] = useState("");
  return (
    <div className="space-y-6">
      <PageTitle title="HR so'rovlar va ticketlar" subtitle="SLA bilan. AI yecha olsa — HRga yuborilmaydi." />
      <Card>
        <TableWrap>
          <thead><tr><Th>Xodim</Th><Th>Xizmat</Th><Th>SLA</Th><Th>Status</Th><Th></Th></tr></thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r.id}>
                <Td>{employees.find((e) => e.id === r.employeeId)?.fullName}</Td>
                <Td>{r.title}</Td>
                <Td>{r.slaHours} soat</Td>
                <Td><StatusBadge status={r.status} /></Td>
                <Td>
                  {r.status === "pending" && (
                    <Button size="sm" onClick={() => approveRequest(r.id, "approved")}>Tasdiqlash / PDF</Button>
                  )}
                  {r.documentReady && <Badge tone="green">PDF tayyor</Badge>}
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </Card>
      <Card className="p-5">
        <h3 className="mb-3 font-semibold">Ticketlar</h3>
        <div className="mb-4 flex gap-2">
          <input className="h-10 flex-1 rounded-xl border px-3 text-sm" placeholder="Savol yuborish (demo)" value={subject} onChange={(e) => setSubject(e.target.value)} />
          <Button onClick={() => { if (subject) { createTicket(user?.employeeId ?? "e2", subject, "HR Question"); setSubject(""); } }}>Yuborish</Button>
        </div>
        <div className="space-y-2">
          {tickets.map((t) => (
            <div key={t.id} className="rounded-xl border border-slate-100 p-3">
              <div className="flex items-center justify-between text-sm">
                <b>{t.id}</b>
                <StatusBadge status={t.status} />
              </div>
              <div className="text-sm">{t.subject}</div>
              {t.aiAnswer && <div className="mt-2 rounded-lg bg-brand-50 p-2 text-xs text-brand-800">{t.aiAnswer}</div>}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
