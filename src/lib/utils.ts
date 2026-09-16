export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function formatMoney(n: number) {
  return new Intl.NumberFormat("uz-UZ").format(n) + " so'm";
}

export function formatCompact(n: number) {
  return new Intl.NumberFormat("uz-UZ").format(n);
}

export function formatDate(iso: string) {
  const d = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? parseYmd(iso) : new Date(iso);
  const months = [
    "yanvar", "fevral", "mart", "aprel", "may", "iyun",
    "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr",
  ];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export function toYmd(date: Date) {
  return `${date.getFullYear()}-${dPad(date.getMonth() + 1)}-${dPad(date.getDate())}`;
}

export function todayYmd(date = new Date()) {
  return toYmd(date);
}

/** Ta'til oxirgi kunidan keyingi birinchi ish kuni — ishga qaytish sanasi. */
export function returnToWorkDate(endDate: string) {
  const d = parseYmd(endDate);
  d.setDate(d.getDate() + 1);
  while (!isWorkday(d)) d.setDate(d.getDate() + 1);
  return toYmd(d);
}

export function calendarDaysUntil(from: string, to: string) {
  return Math.round((parseYmd(to).getTime() - parseYmd(from).getTime()) / 86400000);
}

/** Buyruq va jadval: boshlang‘ich va oxirgi kunlar ham kiradi. */
export function calendarDaysInclusive(start: string, end: string) {
  return calendarDaysUntil(start, end) + 1;
}

export type LeavePhase = "upcoming" | "active" | "completed" | "cancelled";

export function leavePhase(
  l: { startDate: string; endDate: string; status: string },
  today = todayYmd(),
): LeavePhase {
  if (l.status === "rejected" || l.status === "cancelled") return "cancelled";
  if (today < l.startDate) return "upcoming";
  if (today > l.endDate) return "completed";
  return "active";
}

export const leavePhaseLabel: Record<LeavePhase, string> = {
  upcoming: "Rejalashtirilgan",
  active: "Hozir ta'tilda",
  completed: "Qaytgan",
  cancelled: "Bekor / rad",
};

export function todayLabel(date = new Date()) {
  const days = ["Yakshanba", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];
  const months = [
    "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
    "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr",
  ];
  return `${dPad(date.getDate())} ${months[date.getMonth()]}, ${date.getFullYear()} / ${days[date.getDay()]}`;
}

function dPad(n: number) {
  return String(n).padStart(2, "0");
}

export function parseYmd(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

/** Ish haftasi: dushanba–juma (5 kun). Shanba/yakshanba hisoblanmaydi. */
export function isWorkday(date: Date) {
  const day = date.getDay();
  return day !== 0 && day !== 6;
}

export function workingDays(start: string, end: string) {
  const s = parseYmd(start);
  const e = parseYmd(end);
  let count = 0;
  const cur = new Date(s);
  while (cur <= e) {
    if (isWorkday(cur)) count += 1;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

export function workingDaysInMonth(year: number, monthIndex: number) {
  const last = new Date(year, monthIndex + 1, 0).getDate();
  let count = 0;
  for (let d = 1; d <= last; d += 1) {
    if (isWorkday(new Date(year, monthIndex, d))) count += 1;
  }
  return count;
}

/** O'z hisobidan ta'til: har bir ish kuni uchun oylik / shu oydagi ish kunlari minus. */
export function unpaidDeduction(salary: number, start: string, end: string) {
  const s = parseYmd(start);
  const e = parseYmd(end);
  let total = 0;
  const cur = new Date(s);
  while (cur <= e) {
    if (isWorkday(cur)) {
      const wd = workingDaysInMonth(cur.getFullYear(), cur.getMonth()) || 1;
      total += salary / wd;
    }
    cur.setDate(cur.getDate() + 1);
  }
  return Math.round(total);
}

export function daysUntil(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  return Math.ceil((d.getTime() - now.getTime()) / 86400000);
}

export function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

export function fillTemplate(body: string, vars: Record<string, string>) {
  return body.replace(/\{\{([^}]+)\}\}/g, (_, key: string) => vars[key.trim()] ?? "");
}

export function roleLabel(role: string) {
  const map: Record<string, string> = {
    super_admin: "Super Admin",
    hr_admin: "HR Administrator",
    hr_director: "HR Direktor",
    rector: "Rektor",
    dept_head: "Bo'lim rahbari",
    employee: "Xodim",
    owner: "Egasi",
    manager: "Menejer",
  };
  return map[role] ?? role;
}

export const leaveTypeLabel: Record<string, string> = {
  annual: "Mehnat ta'tili (otpusk)",
  sick: "Bolnichniy",
  unpaid: "O'z hisobidan ta'til",
  maternity: "Homiladorlik",
  study: "O'qish ta'tili",
  academic: "Akademik ta'til",
};

export const statusLabel: Record<string, string> = {
  pending: "Kutilmoqda",
  approved: "Tasdiqlangan",
  rejected: "Rad etilgan",
  returned: "Qaytarilgan",
  cancelled: "Bekor qilingan",
  draft: "Qoralama",
  active: "Faol",
  probation: "Sinov muddati",
  on_leave: "Ta'tilda",
  terminated: "Ishdan ketgan",
  archived: "Arxiv",
  open: "Ochiq",
  closed: "Yopilgan",
  escalated: "HR ga yuborilgan",
  in_progress: "Jarayonda",
  ai_resolved: "AI yechgan",
  done: "Bajarilgan",
  overdue: "Muddati o'tgan",
};

export const assignmentCategoryLabel: Record<string, string> = {
  leave: "Ta'til / hisob",
  payroll: "Ish haqi",
  document: "Hujjat",
  info: "Ma'lumot",
  other: "Boshqa",
};

export const stageLabel: Record<string, string> = {
  applied: "Ariza",
  screening: "Skrining",
  interview: "Suhbat",
  assessment: "Baholash",
  final: "Yakuniy suhbat",
  offer: "Taklif",
  hired: "Qabul qilindi",
  rejected: "Rad etildi",
};

export const priorityLabel: Record<string, string> = {
  critical: "Kritik",
  urgent: "Shoshilinch",
  high: "Yuqori",
  medium: "O'rta",
  low: "Past",
};
