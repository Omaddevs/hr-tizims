import { Navigate, Route, Routes } from "react-router-dom";
import type { ReactNode } from "react";
import { AppProvider, useApp } from "./store/AppContext";
import { AppLayout } from "./components/Layout";
import { LoginPage } from "./pages/Login";
import { DashboardPage } from "./pages/Dashboard";
import {
  EmployeeProfilePage,
  EmployeesPage,
  OffboardingPage,
  OnboardingPage,
  OrgPage,
  DepartmentPage,
  PositionsPage,
} from "./pages/Employees";
import {
  AttendancePage,
  CalendarPage,
  RecruitmentPage,
  RequestsPage,
  VacanciesPage,
} from "./pages/HrOps";
import { LeaveEmployeePage, LeavePage } from "./pages/Leave";
import {
  BenefitsPage,
  ContractsPage,
  DocumentsPage,
  PayrollPage,
  PerformancePage,
  TemplatesPage,
  TrainingPage,
} from "./pages/DocsPay";
import {
  AIPage,
  AnalyticsPage,
  AuditPage,
  AutomationPage,
  KnowledgePage,
  RectorPage,
  ReportsPage,
  SettingsPage,
  SystemPage,
} from "./pages/Intel";
import { InboxPage } from "./pages/Inbox";
import {
  PortalAssistant,
  PortalHome,
  PortalLayout,
  PortalLeave,
  PortalProfile,
  PortalRequests,
} from "./pages/Portal";
import { ModuleHome, SelectOrgPage } from "./pages/SelectOrg";
import { OrgSettingsPage, PlatformAdminPage } from "./pages/PlatformAdmin";
import { RaxbariyatPage } from "./pages/Raxbariyat";
import { OquvBolimiPage } from "./pages/OquvBolimi";
import { KBuyruqlarPage } from "./pages/KBuyruqlar";
import { PBuyruqlarPage } from "./pages/PBuyruqlar";
import { NBuyruqlarPage } from "./pages/NBuyruqlar";
import { ScanOrdersPage } from "./pages/ScanOrders";
import { TasksPage, TaskTemplatesPage } from "./pages/Tasks";
import type { ModuleKey } from "./core/types";

function Gate() {
  const { user, organization } = useApp();
  if (!user) return <LoginPage />;
  if (!organization) return <SelectOrgPage />;
  if (user.role === "employee") return <Navigate to="/portal" replace />;
  if (user.role === "rector") return <Navigate to="/rector" replace />;
  return <Navigate to="/" replace />;
}

function RequireAuth({ children, portal }: { children: ReactNode; portal?: boolean }) {
  const { user, organization } = useApp();
  if (!user) return <Navigate to="/login" replace />;
  if (!organization) return <Navigate to="/login" replace />;
  if (user.role === "employee" && !portal) return <Navigate to="/portal" replace />;
  return <>{children}</>;
}

function RequireModule({ module, children }: { module: ModuleKey; children: ReactNode }) {
  const { hasModule } = useApp();
  if (!hasModule(module)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function RequireAnyModule({ modules, children }: { modules: ModuleKey[]; children: ReactNode }) {
  const { hasModule } = useApp();
  if (!modules.some((m) => hasModule(m))) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function RoleHome() {
  const { user, hasModule } = useApp();
  if (user?.role === "employee") return <Navigate to="/portal" replace />;
  if (!hasModule("hr")) {
    if (hasModule("shop")) return <ModuleHome title="Do'kon" subtitle="Mahsulot, buyurtma, ombor" />;
    if (hasModule("pharmacy")) return <ModuleHome title="Apteka" subtitle="Dori, partiya, muddat" />;
    if (hasModule("crm")) return <ModuleHome title="CRM" subtitle="Lidlar, mijozlar, bitimlar" />;
    return <OrgSettingsPage />;
  }
  if (user?.role === "rector") return <RectorPage />;
  return <DashboardPage />;
}

export default function App() {
  return (
    <AppProvider>
      <Routes>
        <Route path="/login" element={<Gate />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          <Route index element={<RoleHome />} />
          <Route path="organization" element={<OrgSettingsPage />} />
          <Route path="platform-admin" element={<PlatformAdminPage />} />
          <Route path="crm" element={<RequireModule module="crm"><ModuleHome title="CRM" subtitle="Lidlar, mijozlar, bitimlar" /></RequireModule>} />
          <Route path="shop" element={<RequireModule module="shop"><ModuleHome title="Do'kon" subtitle="Mahsulot, buyurtma, ombor" /></RequireModule>} />
          <Route path="pharmacy" element={<RequireModule module="pharmacy"><ModuleHome title="Apteka" subtitle="Dori, partiya, muddat" /></RequireModule>} />
          <Route path="employees" element={<RequireModule module="hr"><EmployeesPage /></RequireModule>} />
          <Route path="employees/:id" element={<RequireModule module="hr"><EmployeeProfilePage /></RequireModule>} />
          <Route path="raxbariyat" element={<RequireModule module="hr"><RaxbariyatPage /></RequireModule>} />
          <Route path="oquv-bolimi" element={<RequireModule module="hr"><OquvBolimiPage /></RequireModule>} />
          <Route path="onboarding" element={<RequireModule module="hr"><OnboardingPage /></RequireModule>} />
          <Route path="offboarding" element={<RequireModule module="hr"><OffboardingPage /></RequireModule>} />
          <Route path="org" element={<RequireModule module="hr"><OrgPage /></RequireModule>} />
          <Route path="org/positions" element={<RequireModule module="hr"><PositionsPage /></RequireModule>} />
          <Route path="org/:deptId" element={<RequireModule module="hr"><DepartmentPage /></RequireModule>} />
          <Route path="journals/k-buyruqlar" element={<RequireModule module="hr"><KBuyruqlarPage /></RequireModule>} />
          <Route path="journals/p-buyruqlar" element={<RequireModule module="hr"><PBuyruqlarPage /></RequireModule>} />
          <Route path="journals/n-buyruqlar" element={<RequireModule module="hr"><NBuyruqlarPage /></RequireModule>} />
          <Route path="journals/shartnomalar/soatbay" element={<RequireModule module="hr"><ModuleHome title="Soatbay" subtitle="Jurnallar · Shartnomalar" /></RequireModule>} />
          <Route path="scan/k-buyruqlar" element={<RequireModule module="hr"><ScanOrdersPage kind="K" /></RequireModule>} />
          <Route path="scan/p-buyruqlar" element={<RequireModule module="hr"><ScanOrdersPage kind="P" /></RequireModule>} />
          <Route path="scan/n-buyruqlar" element={<RequireModule module="hr"><ScanOrdersPage kind="N" /></RequireModule>} />
          <Route path="scan/shartnomalar/xodimlar" element={<RequireModule module="hr"><ModuleHome title="Xodimlar" subtitle="Skan · Shartnomalar" /></RequireModule>} />
          <Route path="scan/shartnomalar/chet-el" element={<RequireModule module="hr"><ModuleHome title="Chet El Xodimlar" subtitle="Skan · Shartnomalar" /></RequireModule>} />
          <Route path="scan/shartnomalar/cpx" element={<RequireModule module="hr"><ModuleHome title="CPX" subtitle="Skan · Shartnomalar" /></RequireModule>} />
          <Route path="recruitment" element={<RequireModule module="hr"><RecruitmentPage /></RequireModule>} />
          <Route path="recruitment/vacancies" element={<RequireModule module="hr"><VacanciesPage /></RequireModule>} />
          <Route path="payroll" element={<RequireModule module="finance"><PayrollPage /></RequireModule>} />
          <Route path="payroll/benefits" element={<RequireModule module="finance"><BenefitsPage /></RequireModule>} />
          <Route path="leave" element={<RequireModule module="hr"><Navigate to="/leave/all" replace /></RequireModule>} />
          <Route path="leave/employee/:id" element={<RequireModule module="hr"><LeaveEmployeePage /></RequireModule>} />
          <Route path="leave/:kind" element={<RequireModule module="hr"><LeavePage /></RequireModule>} />
          <Route path="attendance" element={<RequireModule module="hr"><AttendancePage /></RequireModule>} />
          <Route path="calendar" element={<RequireModule module="hr"><CalendarPage /></RequireModule>} />
          <Route path="requests" element={<RequireModule module="hr"><RequestsPage /></RequireModule>} />
          <Route path="performance" element={<RequireModule module="hr"><PerformancePage /></RequireModule>} />
          <Route path="training" element={<RequireAnyModule modules={["hr", "education"]}><TrainingPage /></RequireAnyModule>} />
          <Route path="documents" element={<RequireModule module="documents"><DocumentsPage /></RequireModule>} />
          <Route path="contracts" element={<RequireModule module="documents"><ContractsPage /></RequireModule>} />
          <Route path="templates" element={<RequireModule module="documents"><TemplatesPage /></RequireModule>} />
          <Route path="reports" element={<RequireModule module="analytics"><ReportsPage /></RequireModule>} />
          <Route path="analytics" element={<RequireModule module="analytics"><AnalyticsPage /></RequireModule>} />
          <Route path="rector" element={<RequireModule module="analytics"><RectorPage /></RequireModule>} />
          <Route path="tasks" element={<RequireModule module="hr"><TasksPage scope="mine" /></RequireModule>} />
          <Route path="tasks/all" element={<RequireModule module="hr"><TasksPage scope="all" /></RequireModule>} />
          <Route path="tasks/templates" element={<RequireModule module="hr"><TaskTemplatesPage /></RequireModule>} />
          <Route path="inbox" element={<RequireModule module="hr"><InboxPage /></RequireModule>} />
          <Route path="ai" element={<RequireModule module="hr"><AIPage /></RequireModule>} />
          <Route path="automation" element={<RequireModule module="hr"><AutomationPage /></RequireModule>} />
          <Route path="settings" element={<RequireModule module="hr"><SettingsPage /></RequireModule>} />
          <Route path="knowledge" element={<RequireModule module="hr"><KnowledgePage /></RequireModule>} />
          <Route path="audit" element={<AuditPage />} />
          <Route path="system" element={<SystemPage />} />
        </Route>
        <Route
          path="/portal"
          element={
            <RequireAuth portal>
              <PortalLayout />
            </RequireAuth>
          }
        >
          <Route index element={<PortalHome />} />
          <Route path="leave" element={<PortalLeave />} />
          <Route path="inbox" element={<InboxPage portal />} />
          <Route path="requests" element={<PortalRequests />} />
          <Route path="assistant" element={<PortalAssistant />} />
          <Route path="profile" element={<PortalProfile />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppProvider>
  );
}
