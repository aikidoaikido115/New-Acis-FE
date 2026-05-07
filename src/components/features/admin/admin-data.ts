export type SystemRole = "nurse" | "kitchen" | "admin";

export type UserStatus = "active" | "inactive";

export interface ManagedUser {
  id: string;
  username: string;
  name: string;
  email: string;
  role: SystemRole;
  isSuperuser: boolean;
  status: UserStatus;
  createdAt: string;
}

export type RegistrationStatus = "pending" | "approved" | "rejected";

export interface RegistrationRequest {
  id: string;
  username: string;
  name: string;
  email: string;
  roleRequested: SystemRole;
  requestedAt: string;
  status: RegistrationStatus;
}

export type AuditSeverity = "info" | "warning" | "danger";

export interface AuditEntry {
  id: string;
  actor: string;
  action: string;
  target: string;
  createdAt: string;
  severity: AuditSeverity;
}

export interface AdminNavItem {
  label: string;
  href: string;
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { label: "จัดการผู้ใช้งาน", href: "/admin/users" },
  { label: "จัดการบัญชีญาติ", href: "/admin/relative-users" },
  { label: "อนุมัติการสมัคร", href: "/admin/register-approvals" },
  { label: "Audit Log", href: "/admin/audit-logs" },
];

export const ROLE_LABELS: Record<SystemRole, string> = {
  nurse: "เจ้าหน้าที่ดูแล",
  kitchen: "เจ้าหน้าที่ครัว",
  admin: "ผู้ดูแลระบบ",
};

export const AUDIT_SEVERITY_STYLES: Record<
  AuditSeverity,
  { label: string; className: string }
> = {
  info: {
    label: "ข้อมูล",
    className: "bg-slate-100 text-slate-700",
  },
  warning: {
    label: "เตือน",
    className: "bg-yellow-100 text-yellow-800",
  },
  danger: {
    label: "สำคัญ",
    className: "bg-red-100 text-red-700",
  },
};

export function toRoleLabel(role: SystemRole): string {
  return ROLE_LABELS[role];
}

export function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
