import { describe, expect, it } from "vitest";
import { EMPLOYEES, LEAVES } from "../data/seed";
import { buildBlankOrderHtml, buildContractHtml, buildLeaveOrderHtml, leaveScheduleExport, uzRange } from "./official";
import { calendarDaysInclusive } from "./utils";

describe("rasmiy hujjatlar", () => {
  const emp = EMPLOYEES.find((e) => e.id === "e2")!;
  const leave = LEAVES.find((l) => l.employeeId === "e2")!;

  it("ta'til buyrug'i rektor blankasiga mos", () => {
    const html = buildLeaveOrderHtml(emp, leave, "Iqtisodiyot kafedrasi", "248-K");
    expect(html).toContain("B U Y R U G' I");
    expect(html).toContain("gerb.png");
    expect(html).toContain("XALQARO QISHLOQ XO'JALIGI UNIVERSITETI");
    expect(html).toContain("Xodimga mehnat ta'tili berish to'g'risida");
    expect(html).toContain("248-K-sonli");
    expect(html).toContain("M. Aminova");
    expect(html).toContain("228, 230, 231");
    expect(html).toContain("kalendar kuni");
    expect(html).toContain("D. Jumayev");
  });

  it("mehnat shartnomasi 1-ilova maydonlarini to'ldiradi", () => {
    const html = buildContractHtml(emp, "Iqtisodiyot kafedrasi");
    expect(html).toContain("EMPLOYMENT CONTRACT");
    expect(html).toContain("MEHNAT SHARTNOMASI");
    expect(html).toContain(emp.fullName);
    expect(html).toContain(emp.passport);
    expect(html).toContain("Annex No. 1");
    expect(html).toContain("Annex No. 3");
  });

  it("jadval Excel ustunlari rasmiy jadvalga mos", () => {
    const { headers, rows } = leaveScheduleExport(EMPLOYEES.slice(0, 3), [{ id: emp.departmentId, name: "Kafedra", type: "department", employeeCount: 1 }], LEAVES);
    expect(headers).toEqual(["№", "Bo'lim", "F.I.SH", "Ishga kirgan sana", "M/T kunlari", "2024-2025", "2025-2026"]);
    expect(rows.length).toBe(3);
  });

  it("bo'sh buyruq ham gerb va blanka bilan ochiladi", () => {
    const html = buildBlankOrderHtml();
    expect(html).toContain("B U Y R U G' I");
    expect(html).toContain("gerb.png");
    expect(html).toContain("data-sign=\"rector\"");
  });

  it("kalendar kunlar ikkala chekka kunni ham hisoblaydi", () => {
    expect(calendarDaysInclusive("2026-07-16", "2026-07-28")).toBe(13);
    expect(uzRange("2026-07-16", "2026-07-28")).toContain("iyul");
  });
});
