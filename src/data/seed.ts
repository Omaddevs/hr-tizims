import type {
  Activity,
  Assignment,
  AttendanceIssue,
  AuditEntry,
  Candidate,
  Contract,
  Department,
  DocumentFile,
  DocumentTemplate,
  Employee,
  HrRequest,
  HrTask,
  KnowledgeArticle,
  LeaveRequest,
  NotificationItem,
  OnboardingItem,
  PerformanceReview,
  Position,
  Ticket,
  Training,
  User,
  Vacancy,
  WorkflowRule,
} from "../types";

export const USERS: User[] = [
  { id: "u1", email: "hr@iau.uz", password: "admin123", name: "HR Admin", role: "hr_admin", employeeId: "e-hr" },
  { id: "u2", email: "admin@iau.uz", password: "super123", name: "IT Super Admin", role: "super_admin" },
  { id: "u3", email: "rector@iau.uz", password: "rector123", name: "Rektor A. Qodirov", role: "rector", employeeId: "e-rector" },
  { id: "u4", email: "director@iau.uz", password: "director123", name: "HR Direktor N. Saidova", role: "hr_director", employeeId: "e-dir" },
  { id: "u5", email: "dean@iau.uz", password: "dean123", name: "Dekan B. Karimov", role: "dept_head", employeeId: "e1" },
  { id: "u6", email: "employee@iau.uz", password: "emp123", name: "Jasur Normatov", role: "employee", employeeId: "e2" },
  { id: "u-omad", email: "omadbek@tizims.uz", password: "demo123", name: "Omadbek Egamberdiyev", role: "hr_admin", employeeId: "e-omad" },
  { id: "u-shop", email: "shop@abc.uz", password: "shop123", name: "Karimova Laylo", role: "manager", employeeId: "e-shop-1" },
  { id: "u-farm", email: "farm@medfarm.uz", password: "farm123", name: "Rahimov Aziz", role: "manager", employeeId: "e-ph-1" },
];

export const DEPARTMENTS: Department[] = [
  { id: "d0", name: "IAU Universitet", type: "rectorate", employeeCount: 1248 },
  { id: "d1", name: "Rektorat", parentId: "d0", type: "rectorate", employeeCount: 18, headId: "e-rector" },
  { id: "d2", name: "Akademik ishlar", parentId: "d0", type: "faculty", employeeCount: 318, headId: "e1" },
  { id: "d3", name: "Iqtisodiyot fakulteti", parentId: "d2", type: "faculty", employeeCount: 96, headId: "e1" },
  { id: "d4", name: "Moliyaviy bo'lim", parentId: "d0", type: "unit", employeeCount: 248, headId: "e4" },
  { id: "d5", name: "IT bo'limi", parentId: "d0", type: "unit", employeeCount: 156, headId: "e5" },
  { id: "d6", name: "Kadrlar bo'limi", parentId: "d0", type: "unit", employeeCount: 98, headId: "e-hr" },
  { id: "d7", name: "Marketing bo'limi", parentId: "d0", type: "unit", employeeCount: 86 },
  { id: "d8", name: "Xalqaro aloqalar", parentId: "d0", type: "unit", employeeCount: 42 },
  { id: "d9", name: "Kutubxona", parentId: "d0", type: "unit", employeeCount: 28 },
  { id: "d10", name: "Boshqalar", parentId: "d0", type: "unit", employeeCount: 340 },
];

export const POSITIONS: Position[] = [
  { id: "p1", title: "Kafedra mudiri", departmentId: "d3", category: "academic", vacant: 1 },
  { id: "p2", title: "Katta o'qituvchi", departmentId: "d3", category: "academic", vacant: 3 },
  { id: "p3", title: "O'qituvchi", departmentId: "d2", category: "academic", vacant: 8 },
  { id: "p4", title: "HR mutaxassisi", departmentId: "d6", category: "administrative", vacant: 1 },
  { id: "p5", title: "IT muhandisi", departmentId: "d5", category: "administrative", vacant: 2 },
  { id: "p6", title: "Moliya analitik", departmentId: "d4", category: "administrative", vacant: 2 },
];

const edu = (u: string, d: string, s: string, y: number, ad?: string) => ({
  university: u,
  degree: d,
  specialty: s,
  academicDegree: ad,
  year: y,
});

export const EMPLOYEES: Employee[] = [
  {
    id: "e1", employeeId: "EMP-1001", fullName: "Karimov Bahodir Olimovich", firstName: "Bahodir", lastName: "Karimov",
    dateOfBirth: "1978-04-12", gender: "erkak", citizenship: "O'zbekiston", passport: "AA 2345678",
    jshshir: "31204780123456", address: "Toshkent, Yunusobod 12", phone: "+998 90 111 22 01",
    email: "dean@iau.uz", departmentId: "d3", position: "Dekan", employmentType: "full_time",
    startDate: "2014-09-01", contractEnd: "2027-08-31", workSchedule: "09:00–18:00", salary: 18500000,
    status: "active", category: "academic", education: edu("TDIU", "Magistr", "Iqtisodiyot", 2002, "i.f.d."),
    languages: ["O'zbek", "Rus", "Ingliz"], leaveBalance: 18, completeness: 98, missing: [],
  },
  {
    id: "e2", employeeId: "EMP-1025", fullName: "Normatov Jasur Akmalovich", firstName: "Jasur", lastName: "Normatov",
    dateOfBirth: "1994-06-21", gender: "erkak", citizenship: "O'zbekiston", passport: "AB 4455123",
    jshshir: "32106940111223", address: "Toshkent, Chilonzor 8", phone: "+998 91 555 10 25",
    email: "employee@iau.uz", departmentId: "d3", position: "Katta o'qituvchi", employmentType: "full_time",
    startDate: "2024-09-02", contractEnd: "2026-09-01", managerId: "e1", workSchedule: "09:00–18:00",
    salary: 9200000, status: "probation", category: "academic",
    education: edu("O'zMU", "Magistr", "Iqtisodiyot", 2018, "i.f.f.d."),
    languages: ["O'zbek", "Ingliz"], leaveBalance: 14, completeness: 78, missing: ["Diplom nusxasi", "Favqulodda aloqa"],
  },
  {
    id: "e3", employeeId: "EMP-1042", fullName: "Rahimova Dilnoza Shavkatovna", firstName: "Dilnoza", lastName: "Rahimova",
    dateOfBirth: "1988-11-03", gender: "ayol", citizenship: "O'zbekiston", passport: "AA 7788122",
    jshshir: "40311880155667", address: "Toshkent, Mirzo Ulug'bek 4", phone: "+998 93 700 44 12",
    email: "d.rahimova@iau.uz", departmentId: "d6", position: "HR mutaxassisi", employmentType: "full_time",
    startDate: "2019-03-11", contractEnd: "2026-03-11", workSchedule: "09:00–18:00", salary: 7800000,
    status: "active", category: "administrative", education: edu("ToshDTU", "Bakalavr", "Menejment", 2010),
    languages: ["O'zbek", "Rus"], leaveBalance: 9, completeness: 94, missing: ["Til sertifikati"],
  },
  {
    id: "e4", employeeId: "EMP-1010", fullName: "Toshpulatov Azizbek Umarovich", firstName: "Azizbek", lastName: "Toshpulatov",
    dateOfBirth: "1982-01-19", gender: "erkak", citizenship: "O'zbekiston", passport: "AA 1122334",
    jshshir: "31901820199887", address: "Toshkent, Shayxontohur 2", phone: "+998 97 200 30 10",
    email: "a.toshpulatov@iau.uz", departmentId: "d4", position: "Moliya bo'limi boshlig'i", employmentType: "full_time",
    startDate: "2016-01-15", contractEnd: "2026-09-20", workSchedule: "09:00–18:00", salary: 16200000,
    status: "active", category: "administrative", education: edu("TMI", "Magistr", "Moliya", 2006),
    languages: ["O'zbek", "Rus", "Ingliz"], leaveBalance: 21, completeness: 100, missing: [],
  },
  {
    id: "e5", employeeId: "EMP-1077", fullName: "Yusupova Nilufar Rustamovna", firstName: "Nilufar", lastName: "Yusupova",
    dateOfBirth: "1991-08-14", gender: "ayol", citizenship: "O'zbekiston", passport: "AC 5566778",
    jshshir: "41408910122334", address: "Toshkent, Sergeli 6", phone: "+998 90 888 12 77",
    email: "n.yusupova@iau.uz", departmentId: "d5", position: "IT bo'limi boshlig'i", employmentType: "full_time",
    startDate: "2021-04-01", contractEnd: "2026-10-01", workSchedule: "09:00–18:00", salary: 14500000,
    status: "active", category: "administrative", education: edu("INHA", "Magistr", "Kompyuter injiniringi", 2015),
    languages: ["O'zbek", "Ingliz", "Koreys"], leaveBalance: 16, completeness: 96, missing: [],
  },
  {
    id: "e6", employeeId: "EMP-1102", fullName: "Aliyev Sardor Alisherovich", firstName: "Sardor", lastName: "Aliyev",
    dateOfBirth: "1996-02-08", gender: "erkak", citizenship: "O'zbekiston", passport: "AB 9090112",
    jshshir: "30802960144556", address: "Toshkent, Bektemir 3", phone: "+998 94 321 00 19",
    email: "s.aliyev@iau.uz", departmentId: "d5", position: "IT muhandisi", employmentType: "full_time",
    startDate: "2023-02-01", contractEnd: "2026-09-12", managerId: "e5", workSchedule: "09:00–18:00",
    salary: 8100000, status: "active", category: "administrative",
    education: edu("TATU", "Bakalavr", "Axborot tizimlari", 2018),
    languages: ["O'zbek", "Ingliz"], leaveBalance: 11, completeness: 88, missing: ["Passport skan"],
  },
  {
    id: "e7", employeeId: "EMP-1088", fullName: "Ismoilova Malika Ilhomovna", firstName: "Malika", lastName: "Ismoilova",
    dateOfBirth: "1990-05-27", gender: "ayol", citizenship: "O'zbekiston", passport: "AA 6677889",
    jshshir: "42705900166778", address: "Toshkent, Uchtepa 9", phone: "+998 95 111 90 88",
    email: "m.ismoilova@iau.uz", departmentId: "d2", position: "O'qituvchi", employmentType: "full_time",
    startDate: "2020-09-01", contractEnd: "2026-08-31", workSchedule: "09:00–17:00", salary: 7400000,
    status: "on_leave", category: "academic", education: edu("O'zDJTU", "Magistr", "Filologiya", 2013),
    languages: ["O'zbek", "Ingliz", "Nemis"], leaveBalance: 4, completeness: 91, missing: [],
  },
  {
    id: "e8", employeeId: "EMP-1115", fullName: "Qodirova Sevara Bakhtiyorovna", firstName: "Sevara", lastName: "Qodirova",
    dateOfBirth: "1998-12-02", gender: "ayol", citizenship: "O'zbekiston", passport: "AC 3344556",
    jshshir: "40212980177889", address: "Toshkent, Olmazor 1", phone: "+998 90 404 55 15",
    email: "s.qodirova@iau.uz", departmentId: "d7", position: "Marketing mutaxassisi", employmentType: "full_time",
    startDate: "2026-08-03", contractEnd: "2027-08-03", managerId: "e10", workSchedule: "09:00–18:00",
    salary: 6500000, status: "probation", category: "administrative",
    education: edu("WIUT", "Bakalavr", "Marketing", 2020),
    languages: ["O'zbek", "Ingliz"], leaveBalance: 22, completeness: 62, missing: ["Diplom", "Tibbiy ma'lumotnoma", "3x4 rasm"],
  },
  {
    id: "e9", employeeId: "EMP-1033", fullName: "Ergashev Javlon Farhodovich", firstName: "Javlon", lastName: "Ergashev",
    dateOfBirth: "1985-07-30", gender: "erkak", citizenship: "O'zbekiston", passport: "AA 2211445",
    jshshir: "33007850188990", address: "Toshkent, Yakkasaroy 7", phone: "+998 97 700 11 33",
    email: "j.ergashev@iau.uz", departmentId: "d8", position: "Xalqaro bo'lim mutaxassisi", employmentType: "full_time",
    startDate: "2018-05-14", contractEnd: "2026-09-18", workSchedule: "09:00–18:00", salary: 8900000,
    status: "active", category: "administrative", education: edu("UWED", "Magistr", "Xalqaro munosabatlar", 2009),
    languages: ["O'zbek", "Ingliz", "Fransuz"], leaveBalance: 7, completeness: 85, missing: ["Xorijiy passport"],
  },
  {
    id: "e10", employeeId: "EMP-1060", fullName: "Nazarova Kamola Odilovna", firstName: "Kamola", lastName: "Nazarova",
    dateOfBirth: "1987-03-16", gender: "ayol", citizenship: "O'zbekiston", passport: "AA 8899001",
    jshshir: "41603870199001", address: "Toshkent, Mirobod 5", phone: "+998 93 555 60 60",
    email: "k.nazarova@iau.uz", departmentId: "d7", position: "Marketing bo'limi boshlig'i", employmentType: "full_time",
    startDate: "2017-08-21", contractEnd: "2027-08-21", workSchedule: "09:00–18:00", salary: 12800000,
    status: "active", category: "administrative", education: edu("TDIU", "Magistr", "Marketing", 2011),
    languages: ["O'zbek", "Rus", "Ingliz"], leaveBalance: 13, completeness: 97, missing: [],
  },
  {
    id: "e-omad", employeeId: "EMP-1188", fullName: "Egamberdiyev Omadbek", firstName: "Omadbek", lastName: "Egamberdiyev",
    dateOfBirth: "1994-03-18", gender: "erkak", citizenship: "O'zbekiston", passport: "AA 4455667",
    jshshir: "31803940144556", address: "Toshkent, Chilonzor 18", phone: "+998 90 555 18 88",
    email: "o.egamberdiyev@iau.uz", departmentId: "d5", position: "IT mutaxassisi", employmentType: "full_time",
    startDate: "2021-02-01", contractEnd: "2027-02-01", workSchedule: "09:00–18:00", salary: 9500000,
    status: "active", category: "administrative", education: edu("TATU", "Bakalavr", "AXO", 2016),
    languages: ["O'zbek", "Rus", "Ingliz"], leaveBalance: 18, completeness: 94, missing: [],
  },
  {
    id: "e-hr", employeeId: "EMP-1000", fullName: "HR Admin", firstName: "Nodira", lastName: "Saidova",
    dateOfBirth: "1984-09-09", gender: "ayol", citizenship: "O'zbekiston", passport: "AA 1000001",
    jshshir: "40909840100000", address: "Toshkent, Markaz", phone: "+998 71 200 00 01",
    email: "hr@iau.uz", departmentId: "d6", position: "HR Administrator", employmentType: "full_time",
    startDate: "2015-01-10", contractEnd: "2028-01-10", workSchedule: "09:00–18:00", salary: 14000000,
    status: "active", category: "administrative", education: edu("Toshkent Moliya instituti", "Magistr", "HR", 2008),
    languages: ["O'zbek", "Rus", "Ingliz"], leaveBalance: 16, completeness: 100, missing: [],
  },
  {
    id: "e-rector", employeeId: "EMP-0001", fullName: "Qodirov Anvar Rasulovich", firstName: "Anvar", lastName: "Qodirov",
    dateOfBirth: "1969-02-11", gender: "erkak", citizenship: "O'zbekiston", passport: "AA 0000001",
    jshshir: "31102690100001", address: "Toshkent", phone: "+998 71 200 00 00",
    email: "rector@iau.uz", departmentId: "d1", position: "Rektor", employmentType: "full_time",
    startDate: "2012-09-01", contractEnd: "2029-09-01", workSchedule: "09:00–18:00", salary: 35000000,
    status: "active", category: "academic", education: edu("O'zMU", "Doktorantura", "Iqtisodiyot", 1995, "i.f.d."),
    languages: ["O'zbek", "Rus", "Ingliz"], leaveBalance: 24, completeness: 100, missing: [],
  },
];

export const CONTRACTS: Contract[] = EMPLOYEES.filter((e) => e.contractEnd).map((e) => {
  const end = e.contractEnd!;
  const daysLeft = Math.ceil((new Date(end).getTime() - Date.now()) / 86400000);
  return {
    id: `c-${e.id}`,
    employeeId: e.id,
    type: "Mehnat shartnomasi",
    startDate: e.startDate,
    endDate: end,
    salary: e.salary,
    position: e.position,
    departmentId: e.departmentId,
    status: daysLeft < 0 ? "expired" : daysLeft <= 45 ? "expiring" : "active",
    daysLeft,
  };
});

export const LEAVES: LeaveRequest[] = [
  {
    id: "l1", employeeId: "e7", type: "annual", startDate: "2026-08-25", endDate: "2026-09-08", days: 11,
    reason: "Yillik mehnat ta'tili", status: "approved", createdAt: "2026-08-10T09:00:00",
    note: "Yozgi otpusk, o'qituvchi",
    documentName: "buyruq-otpusk-e7.pdf",
    steps: [
      { role: "Bo'lim rahbari", name: "Karimov B.", status: "approved", at: "2026-08-10" },
      { role: "HR", name: "HR Admin", status: "approved", at: "2026-08-11" },
    ],
  },
  {
    id: "l2", employeeId: "e2", type: "annual", startDate: "2026-09-08", endDate: "2026-09-12", days: 5,
    reason: "Oilaviy masala", status: "pending", createdAt: "2026-08-28T11:20:00",
    steps: [
      { role: "Bo'lim rahbari", name: "Karimov B.", status: "pending" },
      { role: "HR", name: "HR Admin", status: "pending" },
    ],
  },
  {
    id: "l3", employeeId: "e6", type: "sick", startDate: "2026-08-29", endDate: "2026-08-30", days: 1,
    reason: "Tibbiy ko'rik", status: "pending", createdAt: "2026-08-28T08:10:00",
    note: "Bolnichniy varaqasi kutilmoqda",
    documentName: "bolnichniy-e6.jpg",
    steps: [
      { role: "Bo'lim rahbari", name: "Yusupova N.", status: "approved", at: "2026-08-28" },
      { role: "HR", name: "HR Admin", status: "pending" },
    ],
  },
  {
    id: "l4", employeeId: "e9", type: "study", startDate: "2026-09-15", endDate: "2026-09-19", days: 5,
    reason: "Konferensiya, Istanbul", status: "pending", createdAt: "2026-08-27T14:00:00",
    steps: [
      { role: "Bo'lim rahbari", name: "Rektorat", status: "approved", at: "2026-08-27" },
      { role: "HR", name: "HR Admin", status: "pending" },
    ],
  },
  {
    id: "l5", employeeId: "e3", type: "sick", startDate: "2026-08-18", endDate: "2026-08-21", days: 4,
    reason: "Gripp, uy sharoitida davolanish", status: "approved", createdAt: "2026-08-17T09:00:00",
    documentName: "bolnichniy-e3.pdf",
    note: "Poliklinika 12-son",
    steps: [
      { role: "Bo'lim rahbari", name: "Karimov B.", status: "approved", at: "2026-08-17" },
      { role: "HR", name: "HR Admin", status: "approved", at: "2026-08-17" },
    ],
  },
  {
    id: "l6", employeeId: "e4", type: "unpaid", startDate: "2026-09-01", endDate: "2026-09-04", days: 4,
    reason: "Shaxsiy ishlar — o'z hisobidan", status: "approved", createdAt: "2026-08-20T10:00:00",
    deductionAmount: 0,
    note: "Oylikdan ish kunlari bo'yicha minus",
    steps: [
      { role: "Bo'lim rahbari", name: "Karimov B.", status: "approved", at: "2026-08-20" },
      { role: "HR", name: "HR Admin", status: "approved", at: "2026-08-21" },
    ],
  },
  {
    id: "l7", employeeId: "e8", type: "unpaid", startDate: "2026-09-07", endDate: "2026-09-08", days: 2,
    reason: "Oilaviy — o'z hisobidan", status: "pending", createdAt: "2026-08-26T12:00:00",
    steps: [
      { role: "Bo'lim rahbari", name: "Karimov B.", status: "pending" },
      { role: "HR", name: "HR Admin", status: "pending" },
    ],
  },
  {
    id: "l8", employeeId: "e-omad", type: "annual", startDate: "2026-09-14", endDate: "2026-09-25", days: 10,
    reason: "Yillik mehnat ta'tili", status: "pending", createdAt: "2026-08-28T15:40:00",
    note: "Rektor so'rovi asosida hisob tayyorlanadi",
    steps: [
      { role: "Bo'lim rahbari", name: "Yusupova N.", status: "pending" },
      { role: "HR", name: "HR Admin", status: "pending" },
    ],
  },
];

export const ATTENDANCE_ISSUES: AttendanceIssue[] = [
  { id: "a1", employeeId: "e6", issue: "Bu oy 5 marta kechikkan", risk: "medium", times: 5, action: "Ko'rib chiqish", date: "2026-08-29" },
  { id: "a2", employeeId: "e9", issue: "Davomat belgilanmagan", risk: "high", times: 2, action: "Tekshirish", date: "2026-08-28" },
  { id: "a3", employeeId: "e8", issue: "Sinov muddatida 2 kun kelmagan", risk: "high", times: 2, action: "Rahbar bilan suhbat", date: "2026-08-27" },
];

export const REQUESTS: HrRequest[] = [
  { id: "r1", employeeId: "e2", type: "Employment Certificate", title: "Ish joyidan ma'lumotnoma", status: "pending", slaHours: 8, dueAt: "2026-08-29T18:00:00", createdAt: "2026-08-29T09:10:00" },
  { id: "r2", employeeId: "e6", type: "Salary Certificate", title: "Ish haqi ma'lumotnomasi", status: "approved", slaHours: 8, dueAt: "2026-08-28T18:00:00", createdAt: "2026-08-28T10:00:00", documentReady: true },
  { id: "r3", employeeId: "e3", type: "Personal Data Update", title: "Manzilni yangilash", status: "pending", slaHours: 16, dueAt: "2026-08-30T18:00:00", createdAt: "2026-08-28T16:40:00" },
  { id: "r4", employeeId: "e9", type: "Business Trip", title: "Xizmat safari — Istanbul", status: "pending", slaHours: 24, dueAt: "2026-08-30T12:00:00", createdAt: "2026-08-27T14:00:00" },
];

export const TASKS: HrTask[] = [
  { id: "t1", title: "Jasur Normatov hujjatlarini tekshirish", due: "2026-08-29", dueLabel: "Bugun", priority: "urgent", done: false, category: "Hujjat", relatedId: "e2" },
  { id: "t2", title: "5 ta ta'til so'rovini tasdiqlash", due: "2026-08-29", dueLabel: "Bugun", priority: "high", done: false, category: "Ta'til" },
  { id: "t3", title: "12 ta shartnoma muddati — yangilash workflow", due: "2026-08-29", dueLabel: "Bugun", priority: "critical", done: false, category: "Shartnoma" },
  { id: "t4", title: "Sevara Qodirova onboarding 2-bosqich", due: "2026-08-29", dueLabel: "Bugun", priority: "high", done: false, category: "Onboarding", relatedId: "e8" },
  { id: "t5", title: "Davomat istisnolari: 3 xodim", due: "2026-08-29", dueLabel: "Bugun", priority: "medium", done: false, category: "Davomat" },
  { id: "t6", title: "Rektor uchun oylik HR hisobot", due: "2026-08-30", dueLabel: "Ertaga", priority: "high", done: false, category: "Hisobot" },
  { id: "t7", title: "Yangi o'qituvchi vakansiyasini e'lon qilish", due: "2026-09-01", dueLabel: "1 sen", priority: "medium", done: false, category: "ATS" },
];

export const ACTIVITIES: Activity[] = [
  { id: "ac1", text: "Yangi xodim qo'shildi: Jasur Normatov", time: "2 soat oldin", type: "hire" },
  { id: "ac2", text: "Ta'til tasdiqlandi: Malika Ismoilova", time: "3 soat oldin", type: "leave" },
  { id: "ac3", text: "Ishdan ketish qayd etildi: 1 xodim", time: "5 soat oldin", type: "offboard" },
  { id: "ac4", text: "Xodim ma'lumoti yangilandi: Dilnoza Rahimova", time: "1 kun oldin", type: "update" },
  { id: "ac5", text: "Mehnat shartnomasi yaratildi: EMP-1115", time: "1 kun oldin", type: "doc" },
];

export const NOTIFICATIONS: NotificationItem[] = [
  { id: "n1", title: "Shartnoma riski", body: "12 ta xodimning mehnat shartnomasi 30 kun ichida tugaydi.", time: "10 daqiqa oldin", read: false, channel: "inapp" },
  { id: "n2", title: "Onboarding", body: "3 ta yangi xodim onboarding 2-bosqichini bajarmagan.", time: "25 daqiqa oldin", read: false, channel: "inapp" },
  { id: "n3", title: "Hujjat yetishmovchiligi", body: "7 ta xodim profilida ma'lumot yetishmaydi.", time: "1 soat oldin", read: false, channel: "inapp" },
  { id: "n4", title: "Ta'til so'rovi", body: "Normatov J. ta'til so'rovi tasdiqlashni kutmoqda.", time: "2 soat oldin", read: false, channel: "telegram" },
  { id: "n5", title: "Davomat", body: "7 ta davomat istisnosi aniqlandi.", time: "3 soat oldin", read: true, channel: "email" },
  {
    id: "n6", title: "Yangi topshiriq — Rektor",
    body: "Egamberdiyev Omadbek uchun mehnat ta'tili hisoblarini tayyorlab yuboring.",
    time: "Bugun", read: false, channel: "inapp", forUserId: "u1", link: "/inbox",
  },
];

export const ASSIGNMENTS: Assignment[] = [
  {
    id: "as1",
    fromUserId: "u3",
    toUserId: "u1",
    title: "Mehnat ta'tili hisobi — Egamberdiyev Omadbek",
    body: "Omadbek Egamberdiyev uchun mehnat ta'tili hisoblarini tayyorlab yuboring. Qachon chiqadi, necha ish kuni, qolgan balans va ishga qaytish sanasini hisoblang. Excel faylini shu yerga yuklang.",
    relatedEmployeeId: "e-omad",
    category: "leave",
    status: "open",
    createdAt: "2026-08-29T09:15:00",
    readBy: ["u3"],
    messages: [
      {
        id: "am1",
        authorId: "u3",
        text: "Omadbek Egamberdiyev uchun mehnat ta'tili hisoblarini tayyorlab yuboring. Qachon chiqadi, necha ish kuni, qolgan balans va ishga qaytish sanasini hisoblang. Excel faylini shu yerga yuklang.",
        createdAt: "2026-08-29T09:15:00",
      },
    ],
  },
];

export const VACANCIES: Vacancy[] = [
  { id: "v1", position: "O'qituvchi — Iqtisodiyot", departmentId: "d3", requirements: ["Magistr", "i.f.f.d. afzal", "Ingliz tili B2", "2+ yil tajriba"], salaryRange: "7.5–10 mln", deadline: "2026-09-20", responsible: "Karimov B.", openings: 3 },
  { id: "v2", position: "IT muhandisi", departmentId: "d5", requirements: ["Bakalavr", "React/Python", "1+ yil tajriba"], salaryRange: "8–12 mln", deadline: "2026-09-10", responsible: "Yusupova N.", openings: 2 },
  { id: "v3", position: "HR mutaxassisi", departmentId: "d6", requirements: ["Bakalavr", "HR tajriba", "Hujjat ishlari"], salaryRange: "6.5–9 mln", deadline: "2026-09-15", responsible: "HR Admin", openings: 1 },
];

export const CANDIDATES: Candidate[] = [
  { id: "c1", fullName: "Olimov Farrux", phone: "+998 90 111 22 33", email: "f.olimov@mail.uz", education: "TDIU, Magistr, Iqtisodiyot", experience: "4 yil o'qituvchi", skills: ["Iqtisodiyot", "Ingliz", "Tadqiqot"], stage: "interview", match: 87, vacancyId: "v1", interviewScore: 8.4 },
  { id: "c2", fullName: "Abdullayeva Madina", phone: "+998 93 444 55 66", email: "m.abdullayeva@mail.uz", education: "O'zMU, Magistr", experience: "2 yil assistent", skills: ["Statistika", "Ingliz"], stage: "screening", match: 74, vacancyId: "v1" },
  { id: "c3", fullName: "Xolmatov Bekzod", phone: "+998 97 222 11 00", email: "b.xolmatov@mail.uz", education: "TATU, Bakalavr", experience: "3 yil frontend", skills: ["React", "TypeScript"], stage: "assessment", match: 91, vacancyId: "v2", interviewScore: 9.1 },
  { id: "c4", fullName: "Saidova Dildora", phone: "+998 91 777 88 99", email: "d.saidova@mail.uz", education: "WIUT, Bakalavr, HR", experience: "1 yil HR assistant", skills: ["HR", "Excel", "Hujjat"], stage: "offer", match: 82, vacancyId: "v3" },
  { id: "c5", fullName: "Rustamov Ibrohim", phone: "+998 90 333 44 55", email: "i.rustamov@mail.uz", education: "TDIU, Bakalavr", experience: "Yangi bitiruvchi", skills: ["Makroiqtisod"], stage: "applied", match: 61, vacancyId: "v1" },
];

export const ONBOARDING: OnboardingItem[] = [
  { id: "ob1", employeeId: "e2", day: 0, title: "Shartnoma va shaxsiy hujjatlar", status: "done", owner: "HR" },
  { id: "ob2", employeeId: "e2", day: 1, title: "Xush kelibsiz xabari va reglament", status: "done", owner: "HR" },
  { id: "ob3", employeeId: "e2", day: 3, title: "IT akkaunt va email", status: "overdue", owner: "IT" },
  { id: "ob4", employeeId: "e2", day: 7, title: "Rahbar check-in", status: "pending", owner: "Dekan" },
  { id: "ob5", employeeId: "e2", day: 30, title: "Sinov muddati ko'rigi", status: "pending", owner: "HR" },
  { id: "ob6", employeeId: "e8", day: 0, title: "Shartnoma va shaxsiy hujjatlar", status: "done", owner: "HR" },
  { id: "ob7", employeeId: "e8", day: 1, title: "Bo'lim tanishtiruvi", status: "overdue", owner: "Marketing" },
  { id: "ob8", employeeId: "e8", day: 3, title: "IT akkaunt", status: "overdue", owner: "IT" },
];

export const TICKETS: Ticket[] = [
  { id: "HR-1025", employeeId: "e2", category: "Leave", priority: "medium", status: "escalated", subject: "Ta'til balansim noto'g'ri ko'rsatilgan", createdAt: "2026-08-28T10:12:00" },
  { id: "HR-1026", employeeId: "e6", category: "FAQ", priority: "low", status: "ai_resolved", subject: "Necha kun ta'til olishim mumkin?", aiAnswer: "Sizning tizimdagi leave balansingiz 11 kun. Mehnat ta'tili uchun bo'lim rahbari va HR tasdiqi kerak.", createdAt: "2026-08-29T08:40:00" },
  { id: "HR-1027", employeeId: "e3", category: "Documents", priority: "low", status: "open", subject: "Ma'lumotnoma qancha vaqtda tayyor bo'ladi?", createdAt: "2026-08-29T09:05:00" },
];

export const AUDIT: AuditEntry[] = [
  { id: "au1", user: "HR Admin", action: "UPDATE", object: "Employee", objectId: "EMP-1025", oldValue: "completeness: 72%", newValue: "completeness: 78%", date: "2026-08-29 10:14", ip: "192.168.1.14" },
  { id: "au2", user: "HR Admin", action: "APPROVE", object: "Leave", objectId: "l1", newValue: "approved", date: "2026-08-11 11:02", ip: "192.168.1.14" },
  { id: "au3", user: "Karimov B.", action: "APPROVE", object: "Leave", objectId: "l3", newValue: "approved", date: "2026-08-28 09:22", ip: "10.0.0.18" },
  { id: "au4", user: "HR Admin", action: "CREATE", object: "Contract", objectId: "c-e8", newValue: "Mehnat shartnomasi", date: "2026-08-03 16:40", ip: "192.168.1.14" },
];

export const DOCUMENTS: DocumentFile[] = [
  { id: "d1", employeeId: "e2", folder: "Passport", name: "passport_normatov.pdf", type: "PDF", date: "2024-09-02" },
  { id: "d2", employeeId: "e2", folder: "Employment Contract", name: "shartnoma_EMP-1025.docx", type: "DOCX", date: "2024-09-02" },
  { id: "d3", employeeId: "e1", folder: "Diploma", name: "diplom_karimov.pdf", type: "PDF", date: "2014-09-01" },
  { id: "d4", employeeId: "e8", folder: "Personal Documents", name: "3x4.jpg", type: "JPG", date: "2026-08-03" },
];

export const TRAININGS: Training[] = [
  { id: "tr1", title: "Mehnat muhofazasi (majburiy)", type: "Majburiy", date: "2026-09-05", mandatory: true, attendees: 214, overdue: 18 },
  { id: "tr2", title: "Pedagogik mahorat seminar", type: "Seminar", date: "2026-09-12", mandatory: false, attendees: 46, overdue: 0 },
  { id: "tr3", title: "Axborot xavfsizligi", type: "Sertifikat", date: "2026-08-20", mandatory: true, attendees: 156, overdue: 7 },
];

export const PERFORMANCE: PerformanceReview[] = [
  { id: "pf1", employeeId: "e1", cycle: "2026 Q2", kpi: 92, status: "Yakunlangan", nextReview: "2026-10-01" },
  { id: "pf2", employeeId: "e2", cycle: "Sinov 30 kun", kpi: 0, status: "Kutilmoqda", nextReview: "2026-10-02" },
  { id: "pf3", employeeId: "e3", cycle: "2026 Q2", kpi: 88, status: "Yakunlangan", nextReview: "2026-10-01" },
  { id: "pf4", employeeId: "e6", cycle: "2026 Q2", kpi: 71, status: "Rivojlanish rejasi", nextReview: "2026-09-15" },
];

export const TEMPLATES: DocumentTemplate[] = [
  {
    id: "tpl1", name: "Mehnat shartnomasi", category: "Shartnoma",
    body: `MEHNAT SHARTNOMASI № {{employee.employee_id}}

Ish beruvchi: IAU Universitet
Xodim: {{employee.full_name}}
Lavozim: {{employee.position}}
Bo'lim: {{employee.department}}
Ishga kirish sanasi: {{employee.start_date}}
Shartnoma muddati: {{employee.contract_end_date}}
Ish haqi: {{employee.salary}}

Tomonlar ushbu shartnoma shartlariga rozilik bildiradilar.`,
  },
  {
    id: "tpl2", name: "Ishga qabul qilish buyrug'i", category: "Buyruq",
    body: `BUYRUQ

{{employee.full_name}} ({{employee.employee_id}}) {{employee.department}} bo'limiga {{employee.position}} lavozimiga {{employee.start_date}} sanasidan ishga qabul qilinsin.`,
  },
  {
    id: "tpl3", name: "Ish joyidan ma'lumotnoma", category: "Ma'lumotnoma",
    body: `MA'LUMOTNOMA

Ushbu ma'lumotnoma {{employee.full_name}} ga berilgan bo'lib, u IAU Universitetning {{employee.department}} bo'limida {{employee.position}} lavozimida ishlaydi.

ID: {{employee.employee_id}}
Ishga kirgan: {{employee.start_date}}`,
  },
  {
    id: "tpl4", name: "Ta'til buyrug'i", category: "Buyruq",
    body: `{{employee.full_name}} ga mehnat ta'tili berilsin.
Lavozim: {{employee.position}}
Bo'lim: {{employee.department}}`,
  },
];

export const WORKFLOWS: WorkflowRule[] = [
  { id: "w1", name: "Shartnoma 30 kun", trigger: "IF contract_expiry <= 30 days", actions: ["HR task yaratish", "HR ga xabar", "Rahbarga xabar"], enabled: true },
  { id: "w2", name: "Yangi xodim onboarding", trigger: "IF employee hired", actions: ["Onboarding checklist", "IT task", "Bo'lim rahbariga xabar"], enabled: true },
  { id: "w3", name: "Ishdan ketish", trigger: "IF employee.status = terminated", actions: ["IT offboarding", "Moliya task", "Bo'lim task", "Arxiv"], enabled: true },
  { id: "w4", name: "Ta'til tasdiqlash", trigger: "IF leave requested", actions: ["Balans tekshiruvi", "Rahbar → HR", "Kalendarni yangilash"], enabled: true },
];

export const KNOWLEDGE: KnowledgeArticle[] = [
  { id: "k1", title: "Mehnat ta'tili tartibi", category: "Leave Policy", body: "Asosiy mehnat ta'tili 21 kalendar kun. O'qituvchilar uchun yozgi ta'til alohida tartibda. So'rov kamida 7 kun oldin yuboriladi. Balans yetarli bo'lmasa tizim so'rovni bloklaydi." },
  { id: "k2", title: "Ish vaqti", category: "Working hours", body: "Ish kuni 09:00–18:00, tushlik 13:00–14:00. Kechikish 10 daqiqadan oshsa exception sifatida HRga chiqadi." },
  { id: "k3", title: "Onboarding SOP", category: "SOP", body: "1) Profil 2) Hujjatlar 3) Shartnoma 4) Tasdiq 5) ID 6) IT access 7) Onboarding 8) Sinov muddati." },
  { id: "k4", title: "Ma'lumotnoma SLA", category: "SOP", body: "Ish joyidan ma'lumotnoma — 1 ish kuni. Ish haqi ma'lumotnomasi — 1 ish kuni. Murakkab so'rovlar — 3 ish kuni." },
];

export const HEADCOUNT_SERIES = [
  { month: "Yan", value: 1184 },
  { month: "Fev", value: 1196 },
  { month: "Mar", value: 1208 },
  { month: "Apr", value: 1222 },
  { month: "May", value: 1248 },
  { month: "Iyn", value: 1239 },
  { month: "Iyl", value: 1241 },
  { month: "Avg", value: 1248 },
];

export const DEPT_SHARE = [
  { name: "Akademik ishlar", value: 25.5, color: "#1B5EF3" },
  { name: "Moliyaviy bo'lim", value: 19.9, color: "#22c55e" },
  { name: "IT bo'limi", value: 12.5, color: "#f59e0b" },
  { name: "Kadrlar bo'limi", value: 7.9, color: "#8b5cf6" },
  { name: "Marketing bo'limi", value: 6.9, color: "#06b6d4" },
  { name: "Boshqalar", value: 27.3, color: "#94a3b8" },
];

export const KPIS = {
  totalEmployees: 1248,
  newThisMonth: 32,
  onLeave: 18,
  payroll: 3456789000,
  academic: 780,
  administrative: 468,
  leftThisMonth: 9,
  vacancies: 17,
  contractsExpiring: 12,
  attendanceIssues: 7,
  pendingApprovals: 8,
  pendingRequests: 8,
  documentsMissing: 7,
  onboardingIssues: 4,
};

export const REMINDERS = [
  { title: "KPI baholash davri", date: "1–15 sentabr" },
  { title: "Yillik ta'til jadvali", date: "10 sentabr" },
  { title: "Majburiy trening: Mehnat muhofazasi", date: "5 sentabr" },
  { title: "Sinov muddati: Normatov J.", date: "2 oktabr" },
];

export const FOLDERS = [
  "Personal Documents", "Passport", "Diploma", "Certificates", "Employment Contract",
  "Additional Agreements", "Orders", "Leave Documents", "Business Trips",
  "Performance", "Training", "Disciplinary", "Offboarding",
];
