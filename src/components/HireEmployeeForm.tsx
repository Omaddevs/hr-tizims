import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { isResume, readFileAsDataUrl } from "../lib/files";
import { useApp } from "../store/AppContext";
import type { Employee, EmploymentType, StaffCategory } from "../types";
import { Button, Field, Input, Select } from "./ui";

const empty = {
  fullName: "",
  dateOfBirth: "1995-01-01",
  gender: "erkak" as "erkak" | "ayol",
  citizenship: "O'zbekiston",
  passport: "",
  jshshir: "",
  address: "",
  phone: "",
  email: "",
  departmentId: "",
  position: "",
  employmentType: "full_time" as EmploymentType,
  startDate: new Date().toISOString().slice(0, 10),
  contractEnd: "2027-09-01",
  salary: "",
  category: "administrative" as StaffCategory,
  university: "",
  degree: "Bakalavr",
  specialty: "",
  emergencyContact: "",
};

export function HireEmployeeForm({
  defaultDepartmentId,
  onDone,
}: {
  defaultDepartmentId?: string;
  onDone?: (id: string) => void;
}) {
  const { employees, departments, addEmployee } = useApp();
  const nav = useNavigate();
  const [form, setForm] = useState({ ...empty, departmentId: defaultDepartmentId || "d3" });
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoName, setPhotoName] = useState("");
  const [cvUrl, setCvUrl] = useState("");
  const [cvName, setCvName] = useState("");
  const [cvType, setCvType] = useState("");
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onPhoto(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Rasm JPG yoki PNG bo'lishi kerak.");
      return;
    }
    setPhotoUrl(await readFileAsDataUrl(file));
    setPhotoName(file.name);
    setError(null);
  }

  async function onCv(file?: File) {
    if (!file) return;
    if (!isResume(file)) {
      setError("CV: PDF, DOCX yoki rasm (JPG/PNG) yuklang.");
      return;
    }
    setCvUrl(await readFileAsDataUrl(file));
    setCvName(file.name);
    setCvType(file.type || "file");
    setError(null);
  }

  function submit() {
    if (!form.fullName.trim()) {
      setError("F.I.O. majburiy.");
      return;
    }
    if (!form.position.trim()) {
      setError("Lavozim majburiy.");
      return;
    }
    if (!form.departmentId) {
      setError("Bo'limni tanlang.");
      return;
    }
    if (form.jshshir && employees.some((e) => e.jshshir && e.jshshir === form.jshshir)) {
      setError("Bu JSHSHIR allaqachon mavjud.");
      return;
    }
    if (form.email && employees.some((e) => e.email === form.email)) {
      setError("Bu email allaqachon mavjud.");
      return;
    }
    const id = addEmployee({
      fullName: form.fullName.trim(),
      dateOfBirth: form.dateOfBirth,
      gender: form.gender,
      citizenship: form.citizenship,
      passport: form.passport,
      jshshir: form.jshshir,
      address: form.address,
      phone: form.phone,
      email: form.email,
      departmentId: form.departmentId,
      position: form.position,
      employmentType: form.employmentType,
      startDate: form.startDate,
      contractEnd: form.contractEnd,
      salary: Number(form.salary) || 0,
      category: form.category,
      education: { university: form.university, degree: form.degree, specialty: form.specialty, year: 2024 },
      emergencyContact: form.emergencyContact,
      photoUrl,
      cvName,
      cvUrl,
      cvType,
    } satisfies Partial<Employee>);
    onDone?.(id);
    nav(`/employees/${id}`);
  }

  const units = departments.filter((d) => d.id !== "d0");

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-dashed border-slate-200 p-4">
          <div className="mb-2 text-xs font-medium text-slate-500">Xodim rasmi</div>
          <div className="flex items-center gap-3">
            {photoUrl ? (
              <img src={photoUrl} alt="" className="h-16 w-16 rounded-full object-cover" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-xs text-slate-400">Rasm</div>
            )}
            <div>
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => onPhoto(e.target.files?.[0])} />
              {photoName && <div className="mt-1 text-[11px] text-slate-400">{photoName}</div>}
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-dashed border-slate-200 p-4">
          <div className="mb-2 text-xs font-medium text-slate-500">CV / resume (PDF, DOCX yoki rasm)</div>
          <input type="file" accept=".pdf,.doc,.docx,image/png,image/jpeg" onChange={(e) => onCv(e.target.files?.[0])} />
          {cvName && <div className="mt-2 text-xs text-brand-700">{cvName} yuklandi</div>}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="F.I.O. *"><Input value={form.fullName} onChange={(e) => set("fullName", e.target.value)} placeholder="Familiya Ism Sharif" /></Field>
        <Field label="Lavozim *"><Input value={form.position} onChange={(e) => set("position", e.target.value)} /></Field>
        <Field label="Bo'lim *">
          <Select value={form.departmentId} onChange={(e) => set("departmentId", e.target.value)}>
            {units.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </Select>
        </Field>
        <Field label="Kategoriya">
          <Select value={form.category} onChange={(e) => set("category", e.target.value as StaffCategory)}>
            <option value="academic">Akademik</option>
            <option value="administrative">Ma'muriy</option>
          </Select>
        </Field>
        <Field label="Email"><Input value={form.email} onChange={(e) => set("email", e.target.value)} /></Field>
        <Field label="Telefon"><Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+998" /></Field>
        <Field label="Passport"><Input value={form.passport} onChange={(e) => set("passport", e.target.value)} /></Field>
        <Field label="JSHSHIR"><Input value={form.jshshir} onChange={(e) => set("jshshir", e.target.value)} /></Field>
        <Field label="Tug'ilgan sana"><Input type="date" value={form.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} /></Field>
        <Field label="Jinsi">
          <Select value={form.gender} onChange={(e) => set("gender", e.target.value as "erkak" | "ayol")}>
            <option value="erkak">Erkak</option>
            <option value="ayol">Ayol</option>
          </Select>
        </Field>
        <Field label="Manzil"><Input value={form.address} onChange={(e) => set("address", e.target.value)} /></Field>
        <Field label="Ishga kirish sanasi"><Input type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} /></Field>
        <Field label="Shartnoma tugashi"><Input type="date" value={form.contractEnd} onChange={(e) => set("contractEnd", e.target.value)} /></Field>
        <Field label="Ish haqi (so'm)"><Input type="number" value={form.salary} onChange={(e) => set("salary", e.target.value)} /></Field>
        <Field label="Bandlik turi">
          <Select value={form.employmentType} onChange={(e) => set("employmentType", e.target.value as EmploymentType)}>
            <option value="full_time">To'liq stavka</option>
            <option value="part_time">Yarim stavka</option>
            <option value="contract">Shartnoma</option>
            <option value="hourly">Soatbay</option>
          </Select>
        </Field>
        <Field label="Favqulodda aloqa"><Input value={form.emergencyContact} onChange={(e) => set("emergencyContact", e.target.value)} /></Field>
        <Field label="OTM"><Input value={form.university} onChange={(e) => set("university", e.target.value)} /></Field>
        <Field label="Mutaxassislik"><Input value={form.specialty} onChange={(e) => set("specialty", e.target.value)} /></Field>
      </div>
      {error && <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      <Button onClick={submit}>Ishga qabul qilish va onboardingni boshlash</Button>
    </div>
  );
}
