import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FileSpreadsheet, MessageSquare, Paperclip, Send } from "lucide-react";
import { excelDataUrl } from "../lib/excel";
import { readFileAsDataUrl } from "../lib/files";
import {
  assignmentCategoryLabel,
  formatDate,
  formatMoney,
  leaveTypeLabel,
  returnToWorkDate,
  roleLabel,
  statusLabel,
  workingDays,
} from "../lib/utils";
import { useApp } from "../store/AppContext";
import { Avatar, Badge, Button, Card, Empty, Field, Input, Modal, PageTitle, Select, StatusBadge, Textarea } from "../components/ui";
import type { AssignmentCategory, Employee, LeaveRequest } from "../types";

const TEMPLATES: { id: string; title: string; category: AssignmentCategory; body: (name: string) => string }[] = [
  {
    id: "leave",
    title: "Mehnat ta'tili hisobi",
    category: "leave",
    body: (name) =>
      `${name} uchun mehnat ta'tili hisoblarini tayyorlab yuboring. Qachon chiqadi, necha ish kuni, qolgan balans va ishga qaytish sanasini hisoblang. Excel faylini shu yerga yuklang.`,
  },
  {
    id: "cert",
    title: "Ish joyidan ma'lumotnoma",
    category: "document",
    body: (name) => `${name} uchun ish joyidan ma'lumotnoma tayyorlab, faylni shu yerga yuklang.`,
  },
  {
    id: "pay",
    title: "Ish haqi hisob-kitobi",
    category: "payroll",
    body: (name) => `${name} uchun oylik hisob-kitob (stavka, minuslar, netto) ni tayyorlab yuboring.`,
  },
  {
    id: "info",
    title: "Ma'lumot so'rovi",
    category: "info",
    body: () => "Iltimos, so'ralgan ma'lumotni shu yerga yozing yoki fayl qo'shing.",
  },
];

type Tab = "inbox" | "sent" | "all";

export function InboxPage({ portal }: { portal?: boolean }) {
  const { user, employees, leaves, assignments, createAssignment, replyAssignment, setAssignmentStatus, markAssignmentRead, directoryUsers } =
    useApp();
  const [params, setParams] = useSearchParams();
  const [tab, setTab] = useState<Tab>("inbox");
  const [compose, setCompose] = useState(params.get("compose") === "1");
  const [selectedId, setSelectedId] = useState<string | null>(params.get("id"));
  const [reply, setReply] = useState("");
  const [replyFile, setReplyFile] = useState<{ fileName: string; fileUrl: string } | null>(null);
  const [replyErr, setReplyErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const mine = user?.id ?? "";
  const incoming = assignments.filter((a) => a.toUserId === mine);
  const outgoing = assignments.filter((a) => a.fromUserId === mine);
  const visible = tab === "inbox" ? incoming : tab === "sent" ? outgoing : assignments.filter((a) => a.toUserId === mine || a.fromUserId === mine);
  const selected = assignments.find((a) => a.id === selectedId) ?? visible[0];

  useEffect(() => {
    if (params.get("compose") === "1") setCompose(true);
    const id = params.get("id");
    if (id) setSelectedId(id);
  }, [params]);

  useEffect(() => {
    if (selected && user && !selected.readBy.includes(user.id)) markAssignmentRead(selected.id);
  }, [selected?.id, user, markAssignmentRead]);

  const unreadInbox = incoming.filter((a) => !a.readBy.includes(mine)).length;

  useEffect(() => {
    if (!mine) return;
    if (incoming.length === 0 && outgoing.length > 0) setTab("sent");
  }, [mine]);

  async function onPickReply(file: File | undefined) {
    if (!file) return;
    setReplyFile({ fileName: file.name, fileUrl: await readFileAsDataUrl(file) });
  }

  function sendReply() {
    if (!selected) return;
    const err = replyAssignment(selected.id, reply, replyFile ?? undefined);
    setReplyErr(err);
    if (!err) {
      setReply("");
      setReplyFile(null);
    }
  }

  function sendLeaveCalc() {
    if (!selected || !user) return;
    const emp = employees.find((e) => e.id === selected.relatedEmployeeId);
    if (!emp) {
      setReplyErr("Xodim tanlanmagan — avval javobda ismni yozing yoki yangi topshiriqda xodimni belgilang.");
      return;
    }
    const related = leaves.filter((l) => l.employeeId === emp.id);
    const { fileName, fileUrl, summary } = buildLeaveCalc(emp, related);
    const err = replyAssignment(selected.id, summary, { fileName, fileUrl });
    setReplyErr(err);
    if (!err) setAssignmentStatus(selected.id, "done");
  }

  function afterCompose() {
    setCompose(false);
    setParams({});
    setSelectedId(null);
    setTab("sent");
  }

  return (
    <div>
      <PageTitle
        title="Xabarlar va topshiriqlar"
        subtitle="Rektor, HR, dekan va xodimlar o'rtasida topshiriq, so'rov va fayl almashish."
        action={
          <Button onClick={() => setCompose(true)}>
            <Send className="h-4 w-4" /> Yangi topshiriq
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {(
          [
            { id: "inbox" as const, label: "Kelgan", n: incoming.length, badge: unreadInbox },
            { id: "sent" as const, label: "Yuborilgan", n: outgoing.length },
            { id: "all" as const, label: "Barchasi", n: incoming.length + outgoing.filter((a) => a.toUserId !== mine).length },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-xl px-3 py-2 text-sm font-medium ${tab === t.id ? "bg-brand-600 text-white" : "bg-white text-slate-600 shadow-card hover:bg-slate-50"}`}
          >
            {t.label} ({t.n})
            {"badge" in t && t.badge > 0 && (
              <span className="ml-2 rounded-full bg-white/20 px-1.5 text-[10px]">{t.badge}</span>
            )}
          </button>
        ))}
      </div>

      <div className={`grid gap-4 ${portal ? "" : "lg:grid-cols-[340px_1fr]"}`}>
        <Card className="overflow-hidden">
          {visible.length === 0 && <Empty text="Hozircha xabar yo'q. Yangi topshiriq yuboring." />}
          <div className="divide-y divide-slate-100">
            {visible.map((a) => {
              const otherId = a.fromUserId === mine ? a.toUserId : a.fromUserId;
              const other = directoryUsers.find((u) => u.id === otherId);
              const emp = employees.find((e) => e.id === a.relatedEmployeeId);
              const unread = !a.readBy.includes(mine);
              const last = a.messages[a.messages.length - 1];
              return (
                <button
                  key={a.id}
                  onClick={() => setSelectedId(a.id)}
                  className={`block w-full px-4 py-3 text-left hover:bg-slate-50 ${selected?.id === a.id ? "bg-brand-50/70" : ""} ${unread ? "bg-brand-50/40" : ""}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className={`truncate text-sm ${unread ? "font-bold" : "font-medium"}`}>{a.title}</div>
                      <div className="truncate text-[11px] text-slate-400">
                        {a.fromUserId === mine ? "Kimga" : "Kimdan"}: {other?.name} · {roleLabel(other?.role ?? "")}
                      </div>
                    </div>
                    <StatusBadge status={a.status} />
                  </div>
                  <div className="mt-1 line-clamp-2 text-xs text-slate-500">{last?.text}</div>
                  {emp && <div className="mt-1 text-[11px] text-brand-700">{emp.fullName}</div>}
                </button>
              );
            })}
          </div>
        </Card>

        {selected ? (
          <Card className="flex min-h-[480px] flex-col">
            <div className="border-b border-slate-100 px-5 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">{selected.title}</h2>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <Badge>{assignmentCategoryLabel[selected.category]}</Badge>
                    <span>
                      {directoryUsers.find((u) => u.id === selected.fromUserId)?.name} → {directoryUsers.find((u) => u.id === selected.toUserId)?.name}
                    </span>
                    <span>{formatDate(selected.createdAt)}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selected.toUserId === mine && selected.status !== "done" && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => setAssignmentStatus(selected.id, "in_progress")}>
                        Jarayonda
                      </Button>
                      <Button size="sm" onClick={() => setAssignmentStatus(selected.id, "done")}>
                        Bajarildi
                      </Button>
                    </>
                  )}
                  {selected.status === "done" && <Badge tone="green">Yopilgan</Badge>}
                </div>
              </div>
              {selected.relatedEmployeeId && (
                <RelatedEmployee emp={employees.find((e) => e.id === selected.relatedEmployeeId)} portal={portal} />
              )}
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-5">
              {selected.messages.map((m) => {
                const author = directoryUsers.find((u) => u.id === m.authorId);
                const mineMsg = m.authorId === mine;
                return (
                  <div key={m.id} className={`flex gap-2 ${mineMsg ? "flex-row-reverse" : ""}`}>
                    <Avatar name={author?.name ?? "?"} size="sm" />
                    <div className={`max-w-md rounded-2xl px-4 py-3 text-sm ${mineMsg ? "bg-brand-600 text-white" : "bg-slate-50"}`}>
                      <div className={`mb-1 text-[11px] ${mineMsg ? "text-blue-100" : "text-slate-400"}`}>
                        {author?.name} · {roleLabel(author?.role ?? "")}
                      </div>
                      <div className="whitespace-pre-wrap">{m.text}</div>
                      {m.fileUrl && (
                        <a
                          href={m.fileUrl}
                          download={m.fileName}
                          className={`mt-2 inline-flex items-center gap-1 text-xs font-medium underline ${mineMsg ? "text-white" : "text-brand-700"}`}
                        >
                          <Paperclip className="h-3.5 w-3.5" />
                          {m.fileName ?? "Faylni yuklab olish"}
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {selected.status !== "cancelled" && (
              <div className="border-t border-slate-100 p-4">
                {selected.toUserId === mine && selected.category === "leave" && selected.relatedEmployeeId && selected.status !== "done" && (
                  <Button className="mb-3 w-full" variant="outline" onClick={sendLeaveCalc}>
                    <FileSpreadsheet className="h-4 w-4" />
                    Mehnat ta'tili hisobini tayyorlash va yuborish
                  </Button>
                )}
                <Textarea
                  rows={3}
                  placeholder="Javob yozing..."
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                />
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <input ref={fileRef} type="file" className="hidden" onChange={(e) => onPickReply(e.target.files?.[0])} />
                    <Button size="sm" variant="ghost" onClick={() => fileRef.current?.click()}>
                      <Paperclip className="h-4 w-4" /> Fayl biriktirish
                    </Button>
                    {replyFile && <span className="truncate">{replyFile.fileName}</span>}
                  </div>
                  <Button size="sm" onClick={sendReply}>
                    <Send className="h-4 w-4" /> Yuborish
                  </Button>
                </div>
                {replyErr && <div className="mt-2 text-xs text-red-600">{replyErr}</div>}
              </div>
            )}
          </Card>
        ) : (
          <Card className="flex min-h-[280px] flex-col items-center justify-center p-8 text-center text-slate-400">
            <MessageSquare className="h-8 w-8" />
            <div className="mt-2 text-sm">Chapdan xabar tanlang yoki yangi topshiriq yuboring.</div>
          </Card>
        )}
      </div>

      <ComposeModal
        open={compose}
        portal={portal}
        defaultTo={params.get("to") ?? (user?.role === "rector" || user?.role === "dept_head" || user?.role === "employee" ? "u1" : "")}
        defaultCategory={(params.get("category") as AssignmentCategory) || "leave"}
        prefillEmployee={user?.role === "rector" ? "e-omad" : user?.employeeId ?? ""}
        onClose={() => {
          setCompose(false);
          setParams({});
        }}
        onSent={() => afterCompose()}
        createAssignment={createAssignment}
        employees={employees}
        myId={mine}
      />
    </div>
  );
}

function RelatedEmployee({ emp, portal }: { emp?: Employee; portal?: boolean }) {
  if (!emp) return null;
  const inner = (
    <>
      <div>
        <div className="font-medium text-slate-800">{emp.fullName}</div>
        <div className="text-[11px] text-slate-400">
          {emp.employeeId} · {emp.position} · balans {emp.leaveBalance} kun
        </div>
      </div>
      {!portal && <span className="text-xs text-brand-700">Ta'til kartasi →</span>}
    </>
  );
  if (portal) {
    return <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">{inner}</div>;
  }
  return (
    <Link
      to={`/leave/employee/${emp.id}`}
      className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm hover:bg-slate-100"
    >
      {inner}
    </Link>
  );
}

function ComposeModal({
  open,
  onClose,
  onSent,
  createAssignment,
  employees,
  myId,
  defaultTo,
  defaultCategory,
  prefillEmployee,
  portal,
}: {
  open: boolean;
  onClose: () => void;
  onSent: () => void;
  createAssignment: ReturnType<typeof useApp>["createAssignment"];
  employees: Employee[];
  myId: string;
  defaultTo: string;
  defaultCategory: AssignmentCategory;
  prefillEmployee?: string;
  portal?: boolean;
}) {
  const [toUserId, setToUserId] = useState(defaultTo);
  const [category, setCategory] = useState<AssignmentCategory>(defaultCategory);
  const [employeeId, setEmployeeId] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<{ fileName: string; fileUrl: string } | null>(null);

  useEffect(() => {
    if (open) {
      setToUserId(defaultTo);
      setCategory(defaultCategory);
      const empId = prefillEmployee ?? "";
      setEmployeeId(empId);
      const tpl = TEMPLATES.find((t) => t.category === defaultCategory) ?? TEMPLATES[0];
      const empName = employees.find((e) => e.id === empId)?.fullName ?? "xodim";
      setTitle(tpl.title);
      setBody(tpl.body(empName));
      setError(null);
      setFile(null);
    }
  }, [open, defaultTo, defaultCategory, employees, prefillEmployee]);

  const { directoryUsers } = useApp();
  const recipients = directoryUsers.filter((u) => u.id !== myId);

  function applyTemplate(id: string) {
    const tpl = TEMPLATES.find((t) => t.id === id);
    if (!tpl) return;
    const emp = employees.find((e) => e.id === employeeId);
    setCategory(tpl.category);
    setTitle(tpl.title);
    setBody(tpl.body(emp?.fullName ?? "xodim"));
  }

  async function send() {
    const err = createAssignment({
      toUserId,
      title,
      body,
      category,
      relatedEmployeeId: employeeId || undefined,
      fileName: file?.fileName,
      fileUrl: file?.fileUrl,
    });
    setError(err);
    if (!err) onSent();
  }

  return (
    <Modal open={open} onClose={onClose} title="Yangi topshiriq / so'rov" wide>
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => applyTemplate(t.id)}
              className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs hover:border-brand-300 hover:bg-brand-50"
            >
              {t.title}
            </button>
          ))}
        </div>
        <Field label="Kimga">
          <Select value={toUserId} onChange={(e) => setToUserId(e.target.value)}>
            <option value="">Tanlang...</option>
            {recipients.map((u) => (
              <option key={u.id} value={u.id}>
                {roleLabel(u.role)} — {u.name} ({u.email})
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Turkum">
            <Select value={category} onChange={(e) => setCategory(e.target.value as AssignmentCategory)}>
              {Object.entries(assignmentCategoryLabel).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Xodim (ixtiyoriy)">
            <Select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
              <option value="">Bog'lanmagan</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.fullName}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Mavzu">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field label="Matn">
          <Textarea rows={5} value={body} onChange={(e) => setBody(e.target.value)} />
        </Field>
        <Field label="Fayl (ixtiyoriy)">
          <input
            type="file"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              setFile({ fileName: f.name, fileUrl: await readFileAsDataUrl(f) });
            }}
          />
          {file && <div className="mt-1 text-xs text-slate-500">{file.fileName}</div>}
        </Field>
        {error && <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Bekor
          </Button>
          <Button onClick={send}>Yuborish</Button>
        </div>
        {portal && (
          <p className="text-xs text-slate-400">Xodim sifatida odatda HR Administrator (hr@iau.uz) ga yozing.</p>
        )}
      </div>
    </Modal>
  );
}

function buildLeaveCalc(emp: Employee, leaves: LeaveRequest[]) {
  const featured = leaves
    .filter((l) => l.status !== "rejected" && l.status !== "cancelled")
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .at(-1);
  const start = featured?.startDate ?? "2026-09-14";
  const end = featured?.endDate ?? "2026-09-25";
  const days = featured?.days ?? workingDays(start, end);
  const back = returnToWorkDate(end);
  const remaining = emp.leaveBalance - (featured?.type === "annual" && featured.status === "approved" ? 0 : featured?.type === "annual" ? days : 0);

  const summary = [
    `${emp.fullName} (${emp.employeeId}) — mehnat ta'tili hisobi tayyor.`,
    `Lavozim: ${emp.position}.`,
    `Davr: ${formatDate(start)} — ${formatDate(end)} (${days} ish kuni, Du–Ju).`,
    `Ishga qaytish: ${formatDate(back)}.`,
    `Hozirgi balans: ${emp.leaveBalance} kun. Hisobdan keyin ~ ${Math.max(0, remaining)} kun.`,
    `Excel fayl biriktirildi.`,
  ].join("\n");

  const rows: Array<Array<string | number>> = [
    ["Xodim", emp.fullName],
    ["ID", emp.employeeId],
    ["Lavozim", emp.position],
    ["Oylik", formatMoney(emp.salary)],
    ["Mehnat ta'tili balansi (hozir)", emp.leaveBalance],
    ["Hisob davri", `${start} — ${end}`],
    ["Ish kunlari (Du–Ju)", days],
    ["Ishga qaytish", back],
    ["Tur", featured ? leaveTypeLabel[featured.type] : "Mehnat ta'tili (otpusk)"],
    ["Holat", featured ? statusLabel[featured.status] ?? featured.status : "Hisob"],
    ["Hisobdan keyin balans (taxmin)", Math.max(0, remaining)],
  ];
  leaves.forEach((l) => {
    rows.push([`${leaveTypeLabel[l.type]} ${l.startDate}`, `${l.days} kun · ${statusLabel[l.status] ?? l.status}`]);
  });

  return {
    fileName: `mehnat-tatili-${emp.employeeId}.xls`,
    fileUrl: excelDataUrl(["Maydon", "Qiymat"], rows, "Tatil hisobi"),
    summary,
  };
}
