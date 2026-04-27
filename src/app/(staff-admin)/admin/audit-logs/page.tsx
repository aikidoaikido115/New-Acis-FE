"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Pagination } from "@/components/ui/pagination";
import { AdminSectionTabs } from "@/components/features/admin/admin-section-tabs";
import { useToast } from "@/components/ui/toast";
import {
  AUDIT_SEVERITY_STYLES,
  formatDateTime,
  type AuditSeverity,
} from "@/components/features/admin/admin-data";
import adminService, { type AdminAuditEntry, type AdminManagedUser } from "@/services/admin.service";

const ITEMS_PER_PAGE = 10;

type SortField = "createdAt" | "actor" | "severity";
type SortDirection = "asc" | "desc";
type SeverityFilter = "all" | AuditSeverity;

function getSortLabel(field: SortField): string {
  if (field === "actor") return "ผู้ดำเนินการ";
  if (field === "severity") return "ระดับความสำคัญ";
  return "วันเวลา";
}

function getActionLabel(action: string): string {
  const normalized = action.trim().toLowerCase();
  if (normalized.includes("delete")) return "ลบข้อมูล";
  if (normalized.includes("update")) return "แก้ไขข้อมูล";
  if (normalized.includes("insert") || normalized.includes("create")) return "เพิ่มข้อมูล";
  return action || "-";
}

function parseAuditObject(value?: string): Record<string, unknown> | null {
  if (!value || !value.trim()) return null;
  try {
    const parsed = JSON.parse(value) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}

function findUsernameInPayload(entry: AdminAuditEntry): string | null {
  const newObj = parseAuditObject(entry.newValue);
  const oldObj = parseAuditObject(entry.oldValue);
  const usernameFromNew = typeof newObj?.username === "string" ? newObj.username.trim() : "";
  const usernameFromOld = typeof oldObj?.username === "string" ? oldObj.username.trim() : "";
  return usernameFromNew || usernameFromOld || null;
}

function getFirstString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed) return trimmed;
    }
  }
  return null;
}

function pickStringFromObjects(
  newObj: Record<string, unknown> | null,
  oldObj: Record<string, unknown> | null,
  keys: string[]
): string | null {
  for (const key of keys) {
    const value = getFirstString(newObj?.[key], oldObj?.[key]);
    if (value) return value;
  }
  return null;
}

function pickDisplayValueFromObjects(
  newObj: Record<string, unknown> | null,
  oldObj: Record<string, unknown> | null,
  keys: string[]
): string | null {
  for (const key of keys) {
    const candidate = newObj?.[key] ?? oldObj?.[key];
    if (typeof candidate === "string") {
      const trimmed = candidate.trim();
      if (trimmed) return trimmed;
    }
    if (typeof candidate === "number" && Number.isFinite(candidate)) return String(candidate);
    if (typeof candidate === "boolean") return candidate ? "ใช่" : "ไม่ใช่";
  }
  return null;
}

function findTicketTitleInPayload(entry: AdminAuditEntry): string | null {
  const newObj = parseAuditObject(entry.newValue);
  const oldObj = parseAuditObject(entry.oldValue);
  return pickStringFromObjects(newObj, oldObj, ["title", "subject", "description"]);
}

function findResidentNameInPayload(entry: AdminAuditEntry): string | null {
  const newObj = parseAuditObject(entry.newValue);
  const oldObj = parseAuditObject(entry.oldValue);
  const fullNameFromNew = pickStringFromObjects(newObj, oldObj, [
    "resident_name",
    "resident_full_name",
    "full_name",
    "patient_name",
  ]);
  if (fullNameFromNew) return fullNameFromNew;

  const firstName = pickStringFromObjects(newObj, oldObj, ["first_name", "resident_first_name"]);
  const lastName = pickStringFromObjects(newObj, oldObj, ["last_name", "resident_last_name"]);
  if (firstName || lastName) return [firstName, lastName].filter(Boolean).join(" ");
  return null;
}

function findRoomDisplayInPayload(entry: AdminAuditEntry): string | null {
  const newObj = parseAuditObject(entry.newValue);
  const oldObj = parseAuditObject(entry.oldValue);

  const roomNumber = pickStringFromObjects(newObj, oldObj, ["room_number", "roomNo"]);
  const floor = pickStringFromObjects(newObj, oldObj, ["floor", "floor_name"]);
  if (roomNumber && floor) return `ห้อง ${roomNumber} (${floor})`;
  if (roomNumber) return `ห้อง ${roomNumber}`;

  return pickStringFromObjects(newObj, oldObj, ["name"]);
}

function buildResidentRef(entry: AdminAuditEntry): string {
  const newObj = parseAuditObject(entry.newValue);
  const oldObj = parseAuditObject(entry.oldValue);
  const residentName = findResidentNameInPayload(entry);
  if (residentName) return residentName;
  const residentId = pickStringFromObjects(newObj, oldObj, ["resident_id"]);
  return residentId ? `รหัส ${residentId}` : "ผู้สูงอายุ";
}

function buildUserDisplay(user: AdminManagedUser): string {
  if (user.name && user.name !== user.username) {
    return `${user.name} (@${user.username})`;
  }
  return `@${user.username}`;
}

function buildActorDisplay(entry: AdminAuditEntry, userMap: Map<string, AdminManagedUser>): string {
  const user = userMap.get(entry.actorId);
  if (user) return buildUserDisplay(user);
  return entry.actor || "-";
}

function buildTargetDisplay(entry: AdminAuditEntry, userMap: Map<string, AdminManagedUser>): string {
  const newObj = parseAuditObject(entry.newValue);
  const oldObj = parseAuditObject(entry.oldValue);

  if (entry.targetTable === "users") {
    const matchedUser = userMap.get(entry.targetId);
    if (matchedUser) return `บัญชีผู้ใช้ ${buildUserDisplay(matchedUser)}`;

    const username = findUsernameInPayload(entry);
    if (username) return `บัญชีผู้ใช้ @${username}`;
    return "บัญชีผู้ใช้";
  }

  if (entry.targetTable === "staffs") {
    return "ข้อมูลเจ้าหน้าที่";
  }

  if (entry.targetTable === "support_tickets") {
    const ticketTitle = findTicketTitleInPayload(entry);
    if (ticketTitle) return `รายการแจ้งปัญหา: ${ticketTitle}`;
    return entry.targetId ? `รายการแจ้งปัญหา #${entry.targetId}` : "รายการแจ้งปัญหา";
  }

  if (entry.targetTable === "residents") {
    const residentName = findResidentNameInPayload(entry);
    if (residentName) return `ข้อมูลผู้สูงอายุ: ${residentName}`;
    return entry.targetId ? `ข้อมูลผู้สูงอายุ #${entry.targetId}` : "ข้อมูลผู้สูงอายุ";
  }

  if (entry.targetTable === "rooms") {
    const roomDisplay = findRoomDisplayInPayload(entry);
    if (roomDisplay) return roomDisplay;
    return entry.targetId ? `ห้องพัก #${entry.targetId}` : "ข้อมูลห้องพัก";
  }

  if (entry.targetTable === "warehouse_transactions") {
    const txCode = pickStringFromObjects(newObj, oldObj, ["code", "transaction_code"]);
    const txType = pickStringFromObjects(newObj, oldObj, ["type", "transaction_type"]);
    if (txCode && txType) return `รายการคลัง ${txCode} (${txType})`;
    if (txCode) return `รายการคลัง ${txCode}`;
    return entry.targetId ? `รายการคลัง #${entry.targetId}` : "รายการคลัง";
  }

  if (entry.targetTable === "warehouse_items") {
    const itemName = pickStringFromObjects(newObj, oldObj, ["name", "item_name"]);
    const itemCode = pickStringFromObjects(newObj, oldObj, ["code", "item_code"]);
    if (itemName && itemCode) return `สินค้า ${itemName} (${itemCode})`;
    if (itemName) return `สินค้า ${itemName}`;
    if (itemCode) return `สินค้า ${itemCode}`;
    return entry.targetId ? `สินค้าในคลัง #${entry.targetId}` : "สินค้าในคลัง";
  }

  if (entry.targetTable === "vital_signs") {
    const measurementDate = pickStringFromObjects(newObj, oldObj, ["measurement_date"]);
    const timeOfDay = pickStringFromObjects(newObj, oldObj, ["time_of_day"]);
    const residentRef = buildResidentRef(entry);
    if (measurementDate && timeOfDay) return `สัญญาณชีพของ ${residentRef} (${measurementDate} ${timeOfDay})`;
    return `สัญญาณชีพของ ${residentRef}`;
  }

  if (entry.targetTable === "laboratory_values") {
    const residentRef = buildResidentRef(entry);
    const measurementDate = pickStringFromObjects(newObj, oldObj, ["measurement_date"]);
    const timeOfDay = pickStringFromObjects(newObj, oldObj, ["time_of_day"]);
    if (measurementDate && timeOfDay) return `ค่าห้องแล็บของ ${residentRef} (${measurementDate} ${timeOfDay})`;
    return `ค่าห้องแล็บของ ${residentRef}`;
  }

  if (entry.targetTable === "personal_drugs") {
    const drugName = pickStringFromObjects(newObj, oldObj, ["drug_name", "name"]);
    const residentRef = buildResidentRef(entry);
    if (drugName) return `ข้อมูลยาประจำตัว ${drugName} (${residentRef})`;
    return `ข้อมูลยาประจำตัว (${residentRef})`;
  }

  if (entry.targetTable === "drug_plans") {
    const residentRef = buildResidentRef(entry);
    const note = pickStringFromObjects(newObj, oldObj, ["notes"]);
    const isTaken = pickDisplayValueFromObjects(newObj, oldObj, ["is_taken"]);
    if (note) return `แผนให้ยา (${residentRef}) - ${note}`;
    if (isTaken) return `แผนให้ยา (${residentRef}) สถานะ ${isTaken}`;
    return `แผนให้ยา (${residentRef})`;
  }

  if (entry.targetTable === "activities") {
    const activityName = pickStringFromObjects(newObj, oldObj, ["title", "name", "activity_name"]);
    if (activityName) return `กิจกรรม: ${activityName}`;
    return entry.targetId ? `กิจกรรม #${entry.targetId}` : "กิจกรรม";
  }

  if (entry.targetTable === "activity_schedules") {
    const activityName = pickStringFromObjects(newObj, oldObj, ["activity_name", "title", "name"]);
    const scheduleDate = pickStringFromObjects(newObj, oldObj, ["date", "schedule_date"]);
    if (activityName && scheduleDate) return `รอบกิจกรรม ${activityName} (${scheduleDate})`;
    if (activityName) return `รอบกิจกรรม ${activityName}`;
    return entry.targetId ? `รอบกิจกรรม #${entry.targetId}` : "รอบกิจกรรม";
  }

  if (entry.targetTable === "participations") {
    const residentRef = buildResidentRef(entry);
    const status = pickStringFromObjects(newObj, oldObj, ["status", "attendance_status"]);
    if (status) return `การเข้าร่วมกิจกรรมของ ${residentRef} (${status})`;
    return `การเข้าร่วมกิจกรรมของ ${residentRef}`;
  }

  if (entry.targetTable === "doctor_orders") {
    const title = pickStringFromObjects(newObj, oldObj, ["title"]);
    const residentRef = buildResidentRef(entry);
    if (title) return `คำสั่งแพทย์: ${title} (${residentRef})`;
    return `คำสั่งแพทย์ (${residentRef})`;
  }

  if (entry.targetTable === "nurse_notes") {
    const residentRef = buildResidentRef(entry);
    return `บันทึกพยาบาล (${residentRef})`;
  }

  if (entry.targetTable === "wound_care_notes") {
    const residentRef = buildResidentRef(entry);
    const location = pickStringFromObjects(newObj, oldObj, ["location"]);
    if (location) return `บันทึกแผล (${residentRef}) ตำแหน่ง ${location}`;
    return `บันทึกแผล (${residentRef})`;
  }

  if (entry.targetTable === "relative_notes") {
    const residentRef = buildResidentRef(entry);
    return `บันทึกญาติ (${residentRef})`;
  }

  if (entry.targetTable === "audit_logs") {
    return "ประวัติการใช้งานระบบ";
  }

  return entry.target;
}

export default function AdminAuditLogsPage() {
  const { showToast } = useToast();
  const [auditLogs, setAuditLogs] = useState<AdminAuditEntry[]>([]);
  const [users, setUsers] = useState<AdminManagedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("all");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [currentPage, setCurrentPage] = useState(1);

  const loadAuditLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const [logs, userList] = await Promise.all([
        adminService.getAuditLogs(),
        adminService.getUsers(),
      ]);
      setAuditLogs(logs);
      setUsers(userList);
    } catch {
      showToast({
        title: "โหลดข้อมูลไม่สำเร็จ",
        message: "ไม่สามารถดึงประวัติการใช้งานจากระบบได้",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadAuditLogs();
  }, [loadAuditLogs]);

  const userMap = useMemo(() => {
    const map = new Map<string, AdminManagedUser>();
    users.forEach((user) => {
      map.set(user.id, user);
    });
    return map;
  }, [users]);

  const normalizedRows = useMemo(() => {
    return auditLogs.map((entry) => ({
      ...entry,
      actionLabel: getActionLabel(entry.action),
      actorDisplay: buildActorDisplay(entry, userMap),
      targetDisplay: buildTargetDisplay(entry, userMap),
    }));
  }, [auditLogs, userMap]);

  const filteredAndSortedLogs = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    const filtered = normalizedRows.filter((entry) => {
      const inSearch =
        normalizedSearch.length === 0 ||
        [entry.actorDisplay, entry.actionLabel, entry.targetDisplay]
          .some((field) => field.toLowerCase().includes(normalizedSearch));

      const inSeverity = severityFilter === "all" || entry.severity === severityFilter;

      return inSearch && inSeverity;
    });

    return [...filtered].sort((a, b) => {
      const directionFactor = sortDirection === "asc" ? 1 : -1;

      if (sortField === "createdAt") {
        return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * directionFactor;
      }

      if (sortField === "severity") {
        const severityRank: Record<AuditSeverity, number> = {
          info: 1,
          warning: 2,
          danger: 3,
        };
        return (severityRank[a.severity] - severityRank[b.severity]) * directionFactor;
      }

      return a.actorDisplay.localeCompare(b.actorDisplay, "th") * directionFactor;
    });
  }, [normalizedRows, searchTerm, severityFilter, sortField, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedLogs.length / ITEMS_PER_PAGE));

  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageStart = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const paginatedLogs = filteredAndSortedLogs.slice(pageStart, pageStart + ITEMS_PER_PAGE);
  const startItem = filteredAndSortedLogs.length === 0 ? 0 : pageStart + 1;
  const endItem = Math.min(pageStart + ITEMS_PER_PAGE, filteredAndSortedLogs.length);

  const handleSort = (field: SortField) => {
    setCurrentPage(1);
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }

    setSortField(field);
    setSortDirection(field === "createdAt" ? "desc" : "asc");
  };

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-headline-5 font-bold text-gray-800">ประวัติการใช้งานระบบ</h2>
          <p className="mt-1 text-sm text-slate-500">ติดตามว่าใครทำรายการอะไรในระบบและเมื่อไร</p>
        </div>

        <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700">
          บันทึกทั้งหมด {auditLogs.length} รายการ
        </div>
      </div>

      <AdminSectionTabs />

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-3 border-b border-slate-200 px-4 py-4 sm:px-6 lg:grid-cols-3">
          <div className="relative lg:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setCurrentPage(1);
              }}
              placeholder="ค้นหาจากผู้ดำเนินการ รายการ หรือข้อมูลที่เกี่ยวข้อง"
              className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-blue-400"
            />
          </div>

          <select
            value={severityFilter}
            onChange={(event) => {
              setSeverityFilter(event.target.value as SeverityFilter);
              setCurrentPage(1);
            }}
            className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-blue-400"
          >
            <option value="all">ทุกระดับ</option>
            <option value="info">ข้อมูล</option>
            <option value="warning">เตือน</option>
            <option value="danger">สำคัญ</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium sm:px-6">
                  <button type="button" onClick={() => handleSort("createdAt")} className="inline-flex items-center gap-1.5">
                    วันเวลา
                    <ArrowUpDown className="h-3.5 w-3.5" />
                  </button>
                </th>
                <th className="px-4 py-3 font-medium">
                  <button type="button" onClick={() => handleSort("actor")} className="inline-flex items-center gap-1.5">
                    ผู้ดำเนินการ
                    <ArrowUpDown className="h-3.5 w-3.5" />
                  </button>
                </th>
                <th className="px-4 py-3 font-medium">การดำเนินการ</th>
                <th className="px-4 py-3 font-medium">ข้อมูลที่เกี่ยวข้อง</th>
                <th className="px-4 py-3 font-medium sm:px-6">
                  <button type="button" onClick={() => handleSort("severity")} className="inline-flex items-center gap-1.5">
                    ระดับความสำคัญ
                    <ArrowUpDown className="h-3.5 w-3.5" />
                  </button>
                </th>
              </tr>
            </thead>

            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-slate-500">
                    กำลังโหลดประวัติการใช้งาน...
                  </td>
                </tr>
              )}

              {paginatedLogs.map((entry) => {
                const severityStyle = AUDIT_SEVERITY_STYLES[entry.severity];

                return (
                  <tr key={entry.id} className="border-t border-slate-100 text-slate-700">
                    <td className="px-4 py-3 text-xs text-slate-500 sm:px-6">{formatDateTime(entry.createdAt)}</td>
                    <td className="px-4 py-3">{entry.actorDisplay}</td>
                    <td className="px-4 py-3">{entry.actionLabel}</td>
                    <td className="px-4 py-3">{entry.targetDisplay}</td>
                    <td className="px-4 py-3 sm:px-6">
                      <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-medium", severityStyle.className)}>
                        {severityStyle.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {!isLoading && paginatedLogs.length === 0 && (
            <div className="px-6 py-10 text-center text-sm text-slate-500">
              ไม่พบประวัติการใช้งานตามเงื่อนไขที่เลือก
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-4 py-3 text-xs text-slate-500 sm:px-6">
          <span>แสดง {startItem}-{endItem} จาก {filteredAndSortedLogs.length} รายการ</span>
          <span>เรียงตาม {getSortLabel(sortField)} ({sortDirection === "asc" ? "น้อยไปมาก" : "มากไปน้อย"})</span>
        </div>
      </section>

      {filteredAndSortedLogs.length > 0 && (
        <Pagination currentPage={safeCurrentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      )}
    </div>
  );
}
