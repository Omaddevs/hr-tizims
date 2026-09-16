import type { Department, Employee, LeaveRequest } from "../types";
import { calendarDaysInclusive, formatDate, parseYmd, returnToWorkDate, toYmd } from "./utils";
import { escapeHtml, printHtml } from "./printDoc";

export const IAU_OFFICIAL = {
  orgNameUz: "XALQARO QISHLOQ XO'JALIGI UNIVERSITETI",
  orgNameEn: "International Agriculture University",
  location: "Toshkent vil.",
  rectorSign: "M. Aminova",
  rectorFull: "Munira Abdug'afurovna Aminova",
  accountant: "D. Jumayev",
  accountantDept: "Buxgalteriya hisobi va hisoboti bo'limi",
  phone: "+998 95 788 00 28",
  email: "info@iau.uz",
};

const MONTHS = [
  "yanvar", "fevral", "mart", "aprel", "may", "iyun",
  "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr",
];

export type OfficialKind = "leave_order" | "hire_order" | "employment_contract" | "employment_certificate";

export const OFFICIAL_KINDS: { id: OfficialKind; name: string; category: string }[] = [
  { id: "leave_order", name: "Mehnat ta'tili buyrug'i", category: "Buyruq" },
  { id: "hire_order", name: "Ishga qabul qilish buyrug'i", category: "Buyruq" },
  { id: "employment_contract", name: "Mehnat shartnomasi (EN/UZ)", category: "Shartnoma" },
  { id: "employment_certificate", name: "Ish joyidan ma'lumotnoma", category: "Ma'lumotnoma" },
];

export function orderNumber(kind: "K" | "S" = "K") {
  const seq = 180 + (Math.floor(Date.now() / 1000) % 220);
  return `${seq}-${kind}`;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function uzDayMonth(iso: string) {
  const d = parseYmd(iso);
  return `${d.getDate()}-${MONTHS[d.getMonth()]}`;
}

export function uzRange(start: string, end: string) {
  const s = parseYmd(start);
  const e = parseYmd(end);
  if (s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth()) {
    return `${s.getFullYear()}-yil ${s.getDate()}-${MONTHS[s.getMonth()]}dan ${e.getDate()}-${MONTHS[e.getMonth()]}gacha`;
  }
  if (s.getFullYear() === e.getFullYear()) {
    return `${s.getFullYear()}-yil ${s.getDate()}-${MONTHS[s.getMonth()]}dan ${e.getDate()}-${MONTHS[e.getMonth()]}gacha`;
  }
  return `${s.getFullYear()}-yil ${uzDayMonth(start)}dan ${e.getFullYear()}-yil ${uzDayMonth(end)}gacha`;
}

export function headerDateLine(iso = toYmd(new Date())) {
  const d = parseYmd(iso);
  return `${d.getFullYear()}-yil “${pad(d.getDate())}” ${pad(d.getMonth() + 1)}`;
}

function dativeName(fullName: string) {
  const n = fullName.trim();
  if (/ga$/i.test(n)) return n;
  return `${n}ga`;
}

function shortName(fullName: string) {
  const p = fullName.trim().split(/\s+/);
  if (p.length < 2) return fullName;
  const last = p[0];
  const first = p[1] ?? "";
  const mid = p[2] ?? "";
  const i1 = first ? `${first[0]}.` : "";
  const i2 = mid && !/o['’`]g['’]?li|qizi/i.test(mid) ? `${mid[0]}.` : "";
  return `${i1}${i2} ${last}`.replace(/\s+/g, " ").trim();
}

export function gerbUrl() {
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}/gerb.png?v=2`;
  }
  return "/gerb.png?v=2";
}

function gerbMarkup() {
  return `<img class="gerb" src="${gerbUrl()}" alt="O'zbekiston Respublikasi Davlat gerbi" width="96" height="96" />`;
}

function letterhead(title: string, number: string, dateIso: string) {
  return `
    <div class="center letterhead">
      ${gerbMarkup()}
      <div class="org-line">${escapeHtml(IAU_OFFICIAL.orgNameUz)} REKTORINING</div>
      <div class="order-line">B U Y R U G' I</div>
    </div>
    <table style="width:100%;font-size:12.5pt;margin-bottom:14px">
      <tr>
        <td style="width:38%">${escapeHtml(headerDateLine(dateIso))}</td>
        <td class="center">${escapeHtml(IAU_OFFICIAL.location)}</td>
        <td style="width:28%;text-align:right">№ ${escapeHtml(number)}-sonli</td>
      </tr>
    </table>
    <div class="center" style="font-size:13.5pt;font-weight:700;margin:10px 0 16px">${escapeHtml(title)}</div>`;
}

function signature() {
  return `
    <table style="width:100%;margin-top:40px;font-size:13pt">
      <tr>
        <td style="width:22%;vertical-align:bottom">Rektor</td>
        <td data-sign="rector" style="text-align:center;vertical-align:bottom;height:64px"></td>
        <td data-sign="stamp" style="width:96px;text-align:center;vertical-align:bottom"></td>
        <td style="width:28%;text-align:right;vertical-align:bottom">${escapeHtml(IAU_OFFICIAL.rectorSign)}</td>
      </tr>
    </table>`;
}

export function serviceYear(emp: Employee, leaveStart: string) {
  const start = parseYmd(emp.startDate);
  const leave = parseYmd(leaveStart);
  let from = new Date(leave.getFullYear() - 1, start.getMonth(), start.getDate());
  if (from < start) from = start;
  const to = new Date(from.getFullYear() + 1, from.getMonth(), from.getDate());
  return {
    from: toYmd(from),
    to: toYmd(to),
    fromLabel: `${from.getFullYear()}-yil ${MONTHS[from.getMonth()]} oyidan`,
    toLabel: `${to.getFullYear()}-yil ${MONTHS[to.getMonth()]} oyigacha`,
  };
}

export function laborArticles(type: LeaveRequest["type"]) {
  if (type === "sick") return "244, 245";
  if (type === "unpaid") return "241, 242";
  return "228, 230, 231";
}

export function buildLeaveOrderHtml(emp: Employee, leave: LeaveRequest, deptName: string, number = orderNumber("K")) {
  const days = calendarDaysInclusive(leave.startDate, leave.endDate);
  const back = returnToWorkDate(leave.endDate);
  const year = serviceYear(emp, leave.startDate);
  const remaining =
    leave.status === "approved" ? Math.max(0, emp.leaveBalance) : Math.max(0, emp.leaveBalance - days);
  const subject =
    leave.type === "sick"
      ? "Xodimga mehnatga qobiliyatsizlik ta'tili berish to'g'risida"
      : leave.type === "unpaid"
        ? "Xodimga ish haqi saqlanmagan ta'til berish to'g'risida"
        : "Xodimga mehnat ta'tili berish to'g'risida";
  const p1 =
    leave.type === "annual"
      ? `${escapeHtml(emp.position)} ${escapeHtml(dativeName(emp.fullName))} ${escapeHtml(year.fromLabel)} ${escapeHtml(year.toLabel)} bo'lgan ish davri uchun foydalanilmagan mehnat ta'tilining ${days} kalendar kuni ${escapeHtml(uzRange(leave.startDate, leave.endDate))} berilsin.`
      : `${escapeHtml(emp.position)} ${escapeHtml(dativeName(emp.fullName))} ${escapeHtml(uzRange(leave.startDate, leave.endDate))} ${days} kalendar kun muddatga ${leave.type === "unpaid" ? "ish haqi saqlanmagan ta'til" : "ta'til"} berilsin.`;

  return `
    ${letterhead(subject, number, leave.createdAt.slice(0, 10))}
    <ol class="points" style="font-size:13pt;line-height:1.45">
      <li>${p1}</li>
      <li>${escapeHtml(formatDate(back))}dan ishga chiqsin.</li>
      ${leave.type === "annual" ? `<li>Foydalanilmagan mehnat ta'tilining ${remaining} kalendar kuni keyinga qoldirilsin.</li>` : ""}
      <li>${escapeHtml(IAU_OFFICIAL.accountantDept)} (${escapeHtml(IAU_OFFICIAL.accountant)}) ta'til pullarini belgilangan tartibda to'lashni ta'minlasin.</li>
    </ol>
    <p style="margin-top:18px;font-size:12.5pt"><b>Asos:</b> O'zbekiston Respublikasi Mehnat kodeksining ${laborArticles(leave.type)}-moddalari va ${escapeHtml(shortName(emp.fullName))}ning arizasi.</p>
    <p class="muted" style="font-size:11pt">${escapeHtml(deptName)} · ${escapeHtml(emp.employeeId)}</p>
    ${signature()}`;
}

export function buildHireOrderHtml(emp: Employee, deptName: string, number = orderNumber("K")) {
  return `
    ${letterhead("Xodimni ishga qabul qilish to'g'risida", number, emp.startDate)}
    <ol class="points" style="font-size:13pt;line-height:1.45">
      <li>${escapeHtml(emp.fullName)} ${escapeHtml(formatDate(emp.startDate))} sanasidan ${escapeHtml(deptName)}ga ${escapeHtml(emp.position)} lavozimiga ishga qabul qilinsin.</li>
      <li>Sinov muddati 3 (uch) oy etib belgilansin.</li>
      <li>${escapeHtml(IAU_OFFICIAL.accountantDept)} (${escapeHtml(IAU_OFFICIAL.accountant)}) ish haqini shtat jadvali asosida hisoblab borishni ta'minlasin.</li>
    </ol>
    <p style="margin-top:18px;font-size:12.5pt"><b>Asos:</b> O'zbekiston Respublikasi Mehnat kodeksining 104, 128, 129-moddalari va tuzilgan mehnat shartnomasi.</p>
    ${signature()}`;
}

export function buildCertificateHtml(emp: Employee, deptName: string) {
  return `
    ${letterhead("Ish joyidan ma'lumotnoma", orderNumber("S"), toYmd(new Date()))}
    <p style="font-size:13pt;text-align:justify;line-height:1.5">
      Ushbu ma'lumotnoma ${escapeHtml(emp.fullName)}ga berilgan bo'lib, u ${escapeHtml(IAU_OFFICIAL.orgNameEn)}ning
      ${escapeHtml(deptName)}ida ${escapeHtml(emp.position)} lavozimida ishlaydi.
    </p>
    <p style="font-size:13pt">Tabel raqami: ${escapeHtml(emp.employeeId)}.<br/>Ishga kirgan sana: ${escapeHtml(formatDate(emp.startDate))}.</p>
    <p style="font-size:13pt;text-align:justify">Ma'lumotnoma taqdim etish uchun berildi.</p>
    ${signature()}`;
}

export function buildContractHtml(emp: Employee, deptName: string, number = emp.employeeId.replace(/\D/g, "") || orderNumber("S")) {
  const hours = emp.category === "academic" ? 36 : 40;
  const vacation = emp.category === "academic" ? 27 : 21;
  const end = emp.contractEnd ? formatDate(emp.contractEnd) : "nomuayyan";
  return `
    <div class="center letterhead">
      ${gerbMarkup()}
      <div class="org-line">${escapeHtml(IAU_OFFICIAL.orgNameEn)}</div>
      <div class="org-line" style="font-size:11pt;letter-spacing:.02em">${escapeHtml(IAU_OFFICIAL.orgNameUz)}</div>
    </div>
    <div class="center muted" style="font-size:10pt">${escapeHtml(IAU_OFFICIAL.phone)} · ${escapeHtml(IAU_OFFICIAL.email)}</div>
    <div class="center" style="margin:16px 0 8px;font-size:14pt;font-weight:800">EMPLOYMENT CONTRACT No. ${escapeHtml(number)}<br/>${escapeHtml(number)}-sonli MEHNAT SHARTNOMASI</div>
    <table style="width:100%;font-size:11pt;margin-bottom:12px"><tr>
      <td>Tashkent reg. ${new Date().getFullYear()}</td>
      <td style="text-align:right">Toshkent vil. ${new Date().getFullYear()}</td>
    </tr></table>
    <p style="font-size:11.5pt;text-align:justify;line-height:1.4">
      ${escapeHtml(IAU_OFFICIAL.orgNameEn)}, represented by the Rector ${escapeHtml(IAU_OFFICIAL.rectorFull)},
      acting under the authority of the Charter, hereinafter referred to as “Employer”, and the citizen of
      ${escapeHtml(emp.citizenship)}, ${escapeHtml(emp.fullName)}, hereinafter referred to as “Employee”,
      executed this Employment Contract in accordance with the Labor Code of the Republic of Uzbekistan.
    </p>
    <p style="font-size:11.5pt;text-align:justify;line-height:1.4">
      Keyingi o'rinlarda “Ish beruvchi” deb ataluvchi ${escapeHtml(IAU_OFFICIAL.orgNameUz)} nomidan Ustav asosida ish yurituvchi Rektor
      ${escapeHtml(IAU_OFFICIAL.rectorFull)}, bir tomondan, va ${escapeHtml(emp.citizenship)} fuqarosi ${escapeHtml(emp.fullName)},
      ikkinchi tomondan, ushbu Mehnat shartnomasini tuzdilar.
    </p>
    <p style="font-size:12pt;font-weight:700">Annex No. 1 / 1-Ilova — Personal details / Shaxsiy ma'lumotlar</p>
    <table class="data">
      <tr><td class="k">Full name / F.I.Sh.</td><td>${escapeHtml(emp.fullName)}</td></tr>
      <tr><td class="k">Date of birth / Tug'ilgan sana</td><td>${escapeHtml(formatDate(emp.dateOfBirth))}</td></tr>
      <tr><td class="k">Citizenship / Fuqaroligi</td><td>${escapeHtml(emp.citizenship)}</td></tr>
      <tr><td class="k">Passport No / Passport №</td><td>${escapeHtml(emp.passport)}</td></tr>
      <tr><td class="k">Place of residence / Turar joyi</td><td>${escapeHtml(emp.address)}</td></tr>
      <tr><td class="k">Position / Lavozim</td><td>${escapeHtml(emp.position)} · ${escapeHtml(deptName)}</td></tr>
      <tr><td class="k">Employment / Ish stavkasi</td><td>Full time / 1 stavka</td></tr>
      <tr><td class="k">Start date / Ishga kirish sanasi</td><td>${escapeHtml(formatDate(emp.startDate))}</td></tr>
      <tr><td class="k">Contract term / Shartnoma muddati</td><td>${escapeHtml(end)}</td></tr>
      <tr><td class="k">Probation / Sinov muddati</td><td>3 months / 3 oy</td></tr>
      <tr><td class="k">Working hours / Ish vaqti</td><td>${hours} hours / ${hours} soat</td></tr>
      <tr><td class="k">Vacation / Ta'til (yillik)</td><td>${vacation} calendar days / ${vacation} kalendar kuni</td></tr>
    </table>
    <p style="font-size:12pt;font-weight:700;margin-top:16px">Annex No. 3 / 3-Ilova — Employee benefits / Xodimning imtiyozlari</p>
    <table class="data">
      <tr><td class="k">Amount / Miqdori</td><td>${new Intl.NumberFormat("uz-UZ").format(emp.salary)} UZS</td></tr>
      <tr><td class="k">Currency / Valyuta</td><td>UZS</td></tr>
    </table>
    <p style="font-size:10.5pt;margin-top:10px">Ushbu Ilova Mehnat shartnomasining ajralmas qismi hisoblanadi. Asosiy matn: sinov muddati (MK 129), muddat va bekor qilish (MK 160), mehnatga haq to'lash (MK 253), ish va dam olish vaqti, maxfiylik (2-ilova).</p>
    <table style="width:100%;margin-top:28px;font-size:12pt">
      <tr>
        <td>Employer / Ish beruvchi<br/>Rektor ${escapeHtml(IAU_OFFICIAL.rectorSign)}</td>
        <td style="text-align:right">Employee / Xodim<br/>${escapeHtml(emp.fullName)}</td>
      </tr>
    </table>`;
}

export function officialHtml(kind: OfficialKind, emp: Employee, deptName: string, leave?: LeaveRequest | null) {
  if (kind === "leave_order" && leave) return buildLeaveOrderHtml(emp, leave, deptName);
  if (kind === "hire_order") return buildHireOrderHtml(emp, deptName);
  if (kind === "employment_contract") return buildContractHtml(emp, deptName);
  return buildCertificateHtml(emp, deptName);
}

export function officialTitle(kind: OfficialKind) {
  return OFFICIAL_KINDS.find((k) => k.id === kind)?.name ?? "Hujjat";
}

export function printOfficial(kind: OfficialKind, emp: Employee, deptName: string, leave?: LeaveRequest | null) {
  return printHtml(officialTitle(kind), officialHtml(kind, emp, deptName, leave));
}

export function buildBlankOrderHtml() {
  return `
    ${letterhead("................................................", orderNumber("K"), toYmd(new Date()))}
    <ol class="points" style="font-size:13pt;line-height:1.45">
      <li>&nbsp;</li>
      <li>&nbsp;</li>
      <li>&nbsp;</li>
    </ol>
    <p style="margin-top:18px;font-size:12.5pt"><b>Asos:</b> O'zbekiston Respublikasi Mehnat kodeksining 228, 230, 231-moddalari va ariza.</p>
    ${signature()}`;
}

export function printBlankOrder() {
  return printHtml("Yangi buyruq", buildBlankOrderHtml());
}

export function leaveScheduleExport(
  employees: Employee[],
  departments: Department[],
  leaves: LeaveRequest[],
) {
  const headers = ["№", "Bo'lim", "F.I.SH", "Ishga kirgan sana", "M/T kunlari", "2024-2025", "2025-2026"];
  const yearStart = "2025-09-01";
  const yearEnd = "2026-08-31";
  const grouped = [...employees].sort((a, b) => a.departmentId.localeCompare(b.departmentId) || a.fullName.localeCompare(b.fullName));
  const rows: Array<Array<string | number>> = [];
  grouped.forEach((e, i) => {
    const entitlement = e.category === "academic" ? 27 : 21;
    const used = leaves
      .filter((l) => l.employeeId === e.id && l.type === "annual" && l.status === "approved" && l.startDate >= yearStart && l.startDate <= yearEnd)
      .reduce((s, l) => s + calendarDaysInclusive(l.startDate, l.endDate), 0);
    rows.push([
      i + 1,
      departments.find((d) => d.id === e.departmentId)?.name ?? "",
      e.fullName,
      formatDate(e.startDate),
      entitlement,
      "-",
      used || "-",
    ]);
  });
  return { headers, rows };
}
