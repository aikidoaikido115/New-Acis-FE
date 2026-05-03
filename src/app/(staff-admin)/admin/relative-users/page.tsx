"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowUpDown, Search, Trash2 } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { useToast } from "@/components/ui/toast";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import { AdminSectionTabs } from "@/components/features/admin/admin-section-tabs";
import { formatDateTime } from "@/components/features/admin/admin-data";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import adminService, { type AdminRelativeManagedUser } from "@/services/admin.service";

const ITEMS_PER_PAGE = 8;

type SortField = "residentName" | "createdAt";
type SortDirection = "asc" | "desc";

function getSortLabel(field: SortField): string {
  if (field === "residentName") return "ชื่อผู้สูงอายุ";
  return "วันที่สร้างบัญชี";
}

export default function AdminRelativeUsersPage() {
  const { showToast } = useToast();
  const { confirm, confirmDialog } = useConfirmDialog();
  const [users, setUsers] = useState<AdminRelativeManagedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeletingUserId, setIsDeletingUserId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 400);
  const [dateFilter, setDateFilter] = useState<"all" | "7d" | "30d">("all");
  const [alphabetFilter, setAlphabetFilter] = useState<"all" | "latin" | "thai">("all");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [currentPage, setCurrentPage] = useState(1);

  const hasActiveFilters =
    debouncedSearchTerm.trim().length > 0 ||
    dateFilter !== "all" ||
    alphabetFilter !== "all";

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getRelativeUsers();
      setUsers(data);
    } catch {
      showToast({
        title: "โหลดข้อมูลไม่สำเร็จ",
        message: "ไม่สามารถดึงข้อมูลบัญชีญาติจากระบบได้",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const filteredAndSortedUsers = useMemo(() => {
    const normalizedSearch = debouncedSearchTerm.trim().toLowerCase();
    const now = Date.now();
    const dateLimitMs =
      dateFilter === "7d"
        ? 7 * 24 * 60 * 60 * 1000
        : dateFilter === "30d"
          ? 30 * 24 * 60 * 60 * 1000
          : null;

    const isThaiInitial = (value: string): boolean => /^[ก-ฮ]/i.test(value.trim());
    const isLatinInitial = (value: string): boolean => /^[a-z]/i.test(value.trim());

    const filtered = users.filter((user) => {
      const inSearch =
        normalizedSearch.length === 0 ||
        [user.residentName, user.username].some((field) =>
          (field || "").toLowerCase().includes(normalizedSearch)
        );

      const residentName = user.residentName || "";
      const inAlphabet =
        alphabetFilter === "all" ||
        (alphabetFilter === "latin" && isLatinInitial(residentName)) ||
        (alphabetFilter === "thai" && isThaiInitial(residentName));

      const createdAtMs = new Date(user.createdAt).getTime();
      const inDateFilter =
        dateLimitMs === null ||
        (Number.isFinite(createdAtMs) && now-createdAtMs <= dateLimitMs);

      return inSearch && inDateFilter && inAlphabet;
    });

    return [...filtered].sort((a, b) => {
      const directionFactor = sortDirection === "asc" ? 1 : -1;

      if (sortField === "createdAt") {
        return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * directionFactor;
      }

      return a.residentName.localeCompare(b.residentName, "th") * directionFactor;
    });
  }, [users, debouncedSearchTerm, dateFilter, alphabetFilter, sortField, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedUsers.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageStart = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const paginatedUsers = filteredAndSortedUsers.slice(pageStart, pageStart + ITEMS_PER_PAGE);
  const startItem = filteredAndSortedUsers.length === 0 ? 0 : pageStart + 1;
  const endItem = Math.min(pageStart + ITEMS_PER_PAGE, filteredAndSortedUsers.length);

  const handleSort = (field: SortField) => {
    setCurrentPage(1);
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }

    setSortField(field);
    setSortDirection(field === "createdAt" ? "desc" : "asc");
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setDateFilter("all");
    setAlphabetFilter("all");
    setCurrentPage(1);
  };

  const handleDeleteUser = async (userId: string) => {
    const target = users.find((user) => user.id === userId);
    if (!target) return;

    const isActive = target.residentStatus === "active";
    const warningText = isActive 
      ? `⚠️ ผู้สูงอายุ ${target.residentName} กำลังอยู่ในศูนย์รักษา (สถานะ: ใช้งาน)\n\n` 
      : "";
    
    const confirmMessage = `${warningText}ยืนยันการลบบัญชีญาติของ ${target.residentName} ใช่หรือไม่?\n\nการลบบัญชีนี้จะลบข้อมูลที่เกี่ยวข้องออกจากระบบ`;

    const isConfirmed = await confirm({
      title: "ลบบัญชีญาติ",
      message: confirmMessage,
      confirmText: "ลบ",
      cancelText: "ยกเลิก",
      tone: "danger",
    });
    
    if (!isConfirmed) return;

    setIsDeletingUserId(userId);
    try {
      await adminService.deleteRelativeUser(userId);
      setUsers((prev) => prev.filter((user) => user.id !== userId));
      showToast({
        title: "ลบผู้ใช้สำเร็จ",
        message: `ลบบัญชีญาติของ ${target.residentName} เรียบร้อยแล้ว`,
        type: "success",
      });
    } catch {
      showToast({
        title: "ลบผู้ใช้ไม่สำเร็จ",
        message: "ไม่สามารถลบบัญชีญาติได้",
        type: "error",
      });
    } finally {
      setIsDeletingUserId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h2 className="text-headline-5 font-bold text-gray-800">จัดการบัญชีญาติ</h2>
        <p className="mt-1 text-sm text-slate-500">แสดงบัญชีผู้ใช้งานที่เป็นญาติ พร้อมสิทธิ์ลบโดยผู้ดูแลระบบ</p>
      </div>

      <AdminSectionTabs />

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-3 border-b border-slate-200 px-4 py-4 sm:px-6 lg:grid-cols-5">
          <div className="relative lg:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setCurrentPage(1);
              }}
              placeholder="ค้นหาจากชื่อผู้สูงอายุ หรือชื่อผู้ใช้ญาติ"
              className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-blue-400"
            />
          </div>

          <select
            value={alphabetFilter}
            onChange={(event) => {
              setAlphabetFilter(event.target.value as "all" | "latin" | "thai");
              setCurrentPage(1);
            }}
            className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-blue-400"
          >
            <option value="all">ทุกตัวอักษร</option>
            <option value="latin">A-Z</option>
            <option value="thai">ก-ฮ</option>
          </select>

          <select
            value={dateFilter}
            onChange={(event) => {
              setDateFilter(event.target.value as "all" | "7d" | "30d");
              setCurrentPage(1);
            }}
            className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-blue-400"
          >
            <option value="all">ทุกช่วงเวลา</option>
            <option value="7d">ภายใน 7 วันล่าสุด</option>
            <option value="30d">ภายใน 30 วันล่าสุด</option>
          </select>

          <button
            type="button"
            onClick={handleResetFilters}
            disabled={!hasActiveFilters}
            className="h-10 rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ล้างตัวกรอง
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium sm:px-6">
                  <button type="button" onClick={() => handleSort("residentName")} className="inline-flex items-center gap-1.5">
                    ชื่อผู้สูงอายุ
                    <ArrowUpDown className="h-3.5 w-3.5" />
                  </button>
                </th>
                <th className="px-4 py-3 font-medium">
                  <button type="button" onClick={() => handleSort("createdAt")} className="inline-flex items-center gap-1.5">
                    วันที่สร้างบัญชี
                    <ArrowUpDown className="h-3.5 w-3.5" />
                  </button>
                </th>
                <th className="px-4 py-3 font-medium text-right sm:px-6">การจัดการ</th>
              </tr>
            </thead>

            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={3} className="px-6 py-10 text-center text-sm text-slate-500">
                    กำลังโหลดข้อมูลบัญชีญาติ...
                  </td>
                </tr>
              )}

              {paginatedUsers.map((user) => {
                const isDeleting = isDeletingUserId === user.id;

                return (
                  <tr key={user.id} className="border-t border-slate-100 text-slate-700">
                    <td className="px-4 py-3 font-medium text-gray-800 sm:px-6">{user.residentName || "-"}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{formatDateTime(user.createdAt)}</td>
                    <td className="px-4 py-3 sm:px-6">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(user.id)}
                          disabled={isDeleting}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1 text-xs font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          ลบผู้ใช้
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {!isLoading && paginatedUsers.length === 0 && (
            <div className="px-6 py-10 text-center text-sm text-slate-500">ไม่พบข้อมูลบัญชีญาติ</div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-4 py-3 text-xs text-slate-500 sm:px-6">
          <span>แสดง {startItem}-{endItem} จากทั้งหมด {filteredAndSortedUsers.length} รายการ</span>
          <span>
            เรียงลำดับตาม {getSortLabel(sortField)} ({sortDirection === "asc" ? "น้อยไปมาก" : "มากไปน้อย"})
          </span>
        </div>
      </section>

      {filteredAndSortedUsers.length > 0 && (
        <Pagination currentPage={safeCurrentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      )}

      {confirmDialog}
    </div>
  );
}
