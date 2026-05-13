import apiClient, { ApiResponse } from "@/lib/axios.ts/api-client";

export type AdminSystemRole = "nurse" | "kitchen" | "admin";
export type AdminUserStatus = "active" | "inactive";
export type AdminAuditSeverity = "info" | "warning" | "danger";

interface BackendRole {
  id?: string;
  name?: string;
}

interface BackendAdminUser {
  user_id: string;
  staff_id?: string;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  nickname?: string;
  is_approve: boolean;
  created_at: string;
  role?: BackendRole;
}

interface BackendAdminRelativeUser {
  user_id: string;
  relative_id: string;
  username: string;
  resident_name: string;
  resident_status: string;
  created_at: string;
}

interface BackendAuditLog {
  table_name: string;
  record_id: string;
  user_id: string;
  action: string;
  old_value?: string;
  new_value?: string;
  created_at: string;
}

export interface AdminManagedUser {
  id: string;
  staffId?: string;
  username: string;
  name: string;
  email: string;
  role: AdminSystemRole;
  roleName: string;
  isSuperuser: boolean;
  status: AdminUserStatus;
  createdAt: string;
}

export interface AdminAuditEntry {
  id: string;
  actorId: string;
  actor: string;
  action: string;
  actionLabel: string;
  targetTable: string;
  targetId: string;
  target: string;
  oldValue?: string;
  newValue?: string;
  createdAt: string;
  severity: AdminAuditSeverity;
}

export interface AdminRelativeManagedUser {
  id: string;
  relativeId: string;
  username: string;
  residentName: string;
  residentStatus: string;
  createdAt: string;
}

const ROLE_NAME_KITCHEN = "kitchen staff";
const ROLE_NAME_SUPER = "super user";
const ROLE_NAME_ADMIN = "admin";
const ROLE_NAME_MEDICAL = "Medical Staff";

function normalizeRoleName(roleName?: string): string {
  return (roleName || "").trim().toLowerCase();
}

function toSystemRole(roleName?: string): AdminSystemRole {
  const normalizedRole = normalizeRoleName(roleName);

  if (normalizedRole.includes(ROLE_NAME_ADMIN)) {
    return "admin";
  }

  if (normalizedRole.includes(ROLE_NAME_KITCHEN)) {
    return "kitchen";
  }

  return "nurse";
}

function isSuperuserRole(roleName?: string): boolean {
  return normalizeRoleName(roleName).includes(ROLE_NAME_SUPER);
}

function toDisplayName(user: BackendAdminUser): string {
  const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim();
  if (fullName) return fullName;
  if (user.nickname?.trim()) return user.nickname.trim();
  return user.username;
}

function toManagedUser(user: BackendAdminUser): AdminManagedUser {
  const roleName = user.role?.name || "";

  return {
    id: user.user_id,
    staffId: user.staff_id,
    username: user.username,
    name: toDisplayName(user),
    email: user.email,
    role: toSystemRole(roleName),
    roleName,
    isSuperuser: isSuperuserRole(roleName),
    status: user.is_approve ? "active" : "inactive",
    createdAt: user.created_at,
  };
}

function toRelativeManagedUser(user: BackendAdminRelativeUser): AdminRelativeManagedUser {
  return {
    id: user.user_id,
    relativeId: user.relative_id,
    username: user.username,
    residentName: user.resident_name,
    residentStatus: user.resident_status,
    createdAt: user.created_at,
  };
}

function toAuditSeverity(action: string): AdminAuditSeverity {
  const normalizedAction = action.trim().toLowerCase();

  if (normalizedAction.includes("delete")) return "danger";
  if (normalizedAction.includes("update")) return "warning";
  return "info";
}

function toAuditEntry(log: BackendAuditLog, index: number): AdminAuditEntry {
  const action = log.action || "-";
  return {
    id: `${log.created_at}-${log.user_id}-${log.record_id}-${index}`,
    actorId: log.user_id || "",
    actor: log.user_id || "-",
    action,
    actionLabel: action,
    targetTable: log.table_name || "",
    targetId: log.record_id || "",
    target: `${log.table_name || "-"}:${log.record_id || "-"}`,
    oldValue: log.old_value,
    newValue: log.new_value,
    createdAt: log.created_at,
    severity: toAuditSeverity(action),
  };
}

class AdminService {
  async getUsers(): Promise<AdminManagedUser[]> {
    const response = await apiClient.get<ApiResponse<BackendAdminUser[]>>("/api/admin/users");
    return (response.data.result || []).map(toManagedUser);
  }

  async updateUserApproval(userId: string, isApprove: boolean): Promise<AdminManagedUser> {
    const response = await apiClient.patch<ApiResponse<BackendAdminUser>>(
      `/api/admin/users/${userId}/approval`,
      { is_approve: isApprove }
    );

    return toManagedUser(response.data.result);
  }

  async updateStaffRole(staffId: string, roleName: string): Promise<AdminManagedUser> {
    const response = await apiClient.patch<ApiResponse<BackendAdminUser>>(
      `/api/admin/users/staffs/${staffId}/role`,
      { role_name: roleName }
    );

    return toManagedUser(response.data.result);
  }

  async grantSuperuser(staffId: string): Promise<AdminManagedUser> {
    return this.updateStaffRole(staffId, "Super User");
  }

  async revokeSuperuser(staffId: string): Promise<AdminManagedUser> {
    return this.updateStaffRole(staffId, ROLE_NAME_MEDICAL);
  }

  async deleteStaff(staffId: string): Promise<void> {
    await apiClient.delete(`/api/admin/users/staffs/${staffId}`);
  }

  async getAuditLogs(search?: string): Promise<AdminAuditEntry[]> {
    const normalizedSearch = search?.trim();
    const endpoint = normalizedSearch
      ? `/api/admin/audit-logs/search?search=${encodeURIComponent(normalizedSearch)}`
      : "/api/admin/audit-logs";

    const response = await apiClient.get<ApiResponse<BackendAuditLog[]>>(endpoint);
    return (response.data.result || []).map((item, index) => toAuditEntry(item, index));
  }

  async getRelativeUsers(): Promise<AdminRelativeManagedUser[]> {
    const response = await apiClient.get<ApiResponse<BackendAdminRelativeUser[]>>("/api/admin/users/relatives");
    return (response.data.result || []).map(toRelativeManagedUser);
  }

  async deleteRelativeUser(userId: string): Promise<void> {
    await apiClient.delete(`/api/admin/users/relatives/${userId}`);
  }

  async deleteUserById(userId: string): Promise<void> {
    await apiClient.delete(`/api/admin/users/${userId}`);
  }
}

export const adminService = new AdminService();
export default adminService;
