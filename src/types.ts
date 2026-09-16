export type Role =
  | "super_admin"
  | "hr_admin"
  | "hr_director"
  | "rector"
  | "dept_head"
  | "employee"
  | "owner"
  | "manager";

export type EmploymentType = "full_time" | "part_time" | "contract" | "hourly";
export type EmployeeStatus = "active" | "probation" | "on_leave" | "terminated" | "archived";
export type StaffCategory = "academic" | "administrative";

export type ApprovalStatus =
  | "draft"
  | "pending"
  | "approved"
  | "rejected"
  | "returned"
  | "cancelled";

export type Priority = "critical" | "urgent" | "high" | "medium" | "low";

export type LeaveType =
  | "annual"
  | "sick"
  | "unpaid"
  | "maternity"
  | "study"
  | "academic";

export type TicketStatus = "open" | "ai_resolved" | "escalated" | "in_progress" | "closed";

export type RecruitmentStage =
  | "applied"
  | "screening"
  | "interview"
  | "assessment"
  | "final"
  | "offer"
  | "hired"
  | "rejected";

export interface User {
  id: string;
  email: string;
  password: string;
  passwordHash?: string;
  name: string;
  role: Role;
  employeeId?: string;
  avatar?: string;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
  isPlatformAdmin?: boolean;
}

export interface Department {
  id: string;
  name: string;
  parentId?: string;
  headId?: string;
  type: "rectorate" | "faculty" | "department" | "unit";
  employeeCount: number;
  organizationId?: string;
}

export interface Position {
  id: string;
  title: string;
  departmentId: string;
  category: StaffCategory;
  vacant: number;
  organizationId?: string;
}

export interface Education {
  university: string;
  degree: string;
  specialty: string;
  academicDegree?: string;
  year: number;
}

export interface Employee {
  id: string;
  employeeId: string;
  fullName: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: "erkak" | "ayol";
  citizenship: string;
  passport: string;
  jshshir: string;
  address: string;
  phone: string;
  email: string;
  departmentId: string;
  position: string;
  employmentType: EmploymentType;
  startDate: string;
  contractEnd?: string;
  managerId?: string;
  workSchedule: string;
  salary: number;
  status: EmployeeStatus;
  category: StaffCategory;
  education: Education;
  languages: string[];
  leaveBalance: number;
  completeness: number;
  missing: string[];
  emergencyContact?: string;
  photoUrl?: string;
  cvName?: string;
  cvUrl?: string;
  cvType?: string;
  organizationId?: string;
}

export interface Contract {
  id: string;
  employeeId: string;
  type: string;
  startDate: string;
  endDate: string;
  salary: number;
  position: string;
  departmentId: string;
  status: "active" | "expiring" | "expired" | "renewed";
  daysLeft: number;
  organizationId?: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: ApprovalStatus;
  steps: ApprovalStep[];
  createdAt: string;
  note?: string;
  documentName?: string;
  documentUrl?: string;
  deductionAmount?: number;
  updatedAt?: string;
  organizationId?: string;
}

export interface ApprovalStep {
  role: string;
  name: string;
  status: ApprovalStatus;
  at?: string;
  comment?: string;
}

export interface AttendanceIssue {
  id: string;
  employeeId: string;
  issue: string;
  risk: "low" | "medium" | "high";
  times: number;
  action: string;
  date: string;
  organizationId?: string;
}

export interface HrRequest {
  id: string;
  employeeId: string;
  type: string;
  title: string;
  status: ApprovalStatus;
  slaHours: number;
  dueAt: string;
  createdAt: string;
  documentReady?: boolean;
  organizationId?: string;
}

export interface HrTask {
  id: string;
  title: string;
  due: string;
  dueLabel: string;
  priority: Priority;
  done: boolean;
  category: string;
  relatedId?: string;
  organizationId?: string;
}

export interface Activity {
  id: string;
  text: string;
  time: string;
  type: "hire" | "leave" | "offboard" | "update" | "doc" | "alert";
  organizationId?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
  channel: "inapp" | "telegram" | "email";
  forUserId?: string;
  link?: string;
  organizationId?: string;
}

export interface Vacancy {
  id: string;
  position: string;
  departmentId: string;
  requirements: string[];
  salaryRange: string;
  deadline: string;
  responsible: string;
  openings: number;
  organizationId?: string;
}

export interface Candidate {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  education: string;
  experience: string;
  skills: string[];
  stage: RecruitmentStage;
  match: number;
  vacancyId: string;
  interviewScore?: number;
  organizationId?: string;
}

export interface OnboardingItem {
  id: string;
  employeeId: string;
  day: number;
  title: string;
  status: "done" | "pending" | "overdue";
  owner: string;
  organizationId?: string;
}

export interface Ticket {
  id: string;
  employeeId: string;
  category: string;
  priority: Priority;
  status: TicketStatus;
  subject: string;
  aiAnswer?: string;
  createdAt: string;
  organizationId?: string;
}

export interface AuditEntry {
  id: string;
  user: string;
  action: string;
  object: string;
  objectId: string;
  oldValue?: string;
  newValue?: string;
  date: string;
  ip: string;
  organizationId?: string;
}

export interface DocumentFile {
  id: string;
  employeeId: string;
  folder: string;
  name: string;
  type: "PDF" | "DOCX" | "JPG" | "PNG";
  date: string;
  organizationId?: string;
}

export interface Training {
  id: string;
  title: string;
  type: string;
  date: string;
  mandatory: boolean;
  attendees: number;
  overdue: number;
  organizationId?: string;
}

export interface PerformanceReview {
  id: string;
  employeeId: string;
  cycle: string;
  kpi: number;
  status: string;
  nextReview: string;
  organizationId?: string;
}

export interface DocumentTemplate {
  id: string;
  name: string;
  category: string;
  body: string;
}

export interface WorkflowRule {
  id: string;
  name: string;
  trigger: string;
  actions: string[];
  enabled: boolean;
}

export interface KnowledgeArticle {
  id: string;
  title: string;
  category: string;
  body: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  table?: string[][];
}

export type AssignmentStatus = "open" | "in_progress" | "done" | "cancelled";
export type AssignmentCategory = "leave" | "payroll" | "document" | "info" | "other";

export interface AssignmentMessage {
  id: string;
  authorId: string;
  text: string;
  createdAt: string;
  fileName?: string;
  fileUrl?: string;
}

export interface Assignment {
  id: string;
  fromUserId: string;
  toUserId: string;
  title: string;
  body: string;
  relatedEmployeeId?: string;
  category: AssignmentCategory;
  status: AssignmentStatus;
  createdAt: string;
  readBy: string[];
  messages: AssignmentMessage[];
  organizationId?: string;
}
