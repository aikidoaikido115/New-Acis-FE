"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowUpDown, Search, Trash2 } from "lucide-react";
import { Dropdown } from "@/components/ui/dropdown";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
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
type DateFilter = "all" | "7d" | "30d";
type AlphabetFilter = "all" | "latin" | "thai";

const ALPHABET_FILTER_OPTIONS: Array<{ value: AlphabetFilter; label: string }> = [
  { value: "all", label: "ทุกตัวอักษร" },
  { value: "latin", label: "A-Z" },
  { value: "thai", label: "ก-ฮ" },
];

const DATE_FILTER_OPTIONS: Array<{ value: DateFilter; label: string }> = [
  { value: "all", label: "ทุกช่วงเวลา" },
  { value: "7d", label: "ภายใน 7 วันล่าสุด" },
  { value: "30d", label: "ภายใน 30 วันล่าสุด" },
];

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
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [alphabetFilter, setAlphabetFilter] = useState<AlphabetFilter>("all");
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
    <div className="grid grid-cols-1 gap-4 sm:gap-6 p-3 sm:p-6 lg:p-8 w-full max-w-full overflow-x-hidden min-w-0">
      
      {/* Header */}
      <div className="w-full min-w-0">
        <h2 className="text-headline-6 sm:text-headline-5 font-bold text-gray-800 truncate">จัดการบัญชีญาติ</h2>
        <p className="mt-1 text-xs sm:text-sm text-slate-500 truncate">แสดงบัญชีผู้ใช้งานที่เป็นญาติ พร้อมสิทธิ์ลบโดยผู้ดูแลระบบ</p>
      </div>

      {/* Tabs */}
      <div className="w-full min-w-0">
        <AdminSectionTabs />
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm w-full max-w-[calc(100vw-24px)] sm:max-w-full min-w-0 overflow-hidden flex flex-col">
        
        {/* ส่วนตัวกรอง (Filter Bar) */}
        <div className="flex flex-col lg:flex-row gap-3 border-b border-slate-200 px-4 py-4 sm:px-6 w-full min-w-0">
          
          <div className="relative w-full lg:flex-1 min-w-0">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setCurrentPage(1);
              }}
              placeholder="ค้นหาจากชื่อผู้สูงอายุ หรือชื่อผู้ใช้ญาติ"
              className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 min-w-0"
            />
          </div>

          <div className="flex flex-row gap-2 w-full lg:w-auto shrink-0 min-w-0">
            <div className="flex-1 lg:w-44 min-w-0">
              <Dropdown
                value={alphabetFilter}
                onChange={(value) => {
                  setAlphabetFilter(value as AlphabetFilter);
                  setCurrentPage(1);
                }}
                options={ALPHABET_FILTER_OPTIONS}
                className="h-10 w-full"
              />
            </div>

            <div className="flex-1 lg:w-44 min-w-0">
              <Dropdown
                value={dateFilter}
                onChange={(value) => {
                  setDateFilter(value as DateFilter);
                  setCurrentPage(1);
                }}
                options={DATE_FILTER_OPTIONS}
                className="h-10 w-full"
              />
            </div>
          </div>

          {/* ปุ่มล้างตัวกรอง */}
          <button
            type="button"
            onClick={handleResetFilters}
            disabled={!hasActiveFilters}
            className="h-10 w-full lg:w-auto shrink-0 rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 min-w-0"
          >
            ล้างตัวกรอง
          </button>
        </div>

        {/* ตารางเลื่อนซ้ายขวา */}
        <div className="w-full min-w-0 overflow-hidden">
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[400px] sm:min-w-[600px] text-sm">
              <thead className="bg-slate-50 text-left text-slate-600">
                <tr>
                  <th className="px-2 sm:px-6 py-3 font-medium whitespace-nowrap">
                    <button type="button" onClick={() => handleSort("residentName")} className="inline-flex items-center gap-1.5 hover:text-blue-600">
                      ชื่อผู้สูงอายุ
                      <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </th>
                  <th className="px-2 sm:px-4 py-3 font-medium whitespace-nowrap">
                    <button type="button" onClick={() => handleSort("createdAt")} className="inline-flex items-center gap-1.5 hover:text-blue-600">
                      วันที่สร้างบัญชี
                      <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </th>
                  <th className="px-2 sm:px-6 py-3 font-medium text-right whitespace-nowrap">การจัดการ</th>
                </tr>
              </thead>

              <tbody>
                {isLoading && (
                  <tr>
                    <td colSpan={3} className="px-6 py-10 text-center">
                      <LoadingSpinner />
                    </td>
                  </tr>
                )}

                {paginatedUsers.map((user) => {
                  const isDeleting = isDeletingUserId === user.id;

                  return (
                    <tr key={user.id} className="border-t border-slate-100 text-slate-700 hover:bg-slate-50 transition-colors">
                      <td className="px-2 sm:px-6 py-3 font-medium text-gray-800 whitespace-nowrap max-w-[120px] sm:max-w-[200px] truncate" title={user.residentName || "-"}>
                        {user.residentName || "-"}
                      </td>
                      <td className="px-2 sm:px-4 py-3 text-[11px] sm:text-xs text-slate-500 whitespace-nowrap">{formatDateTime(user.createdAt)}</td>
                      <td className="px-2 sm:px-6 py-3 whitespace-nowrap">
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={isDeleting}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 whitespace-nowrap"
                          >
                            <Trash2 className="h-3.5 w-3.5 shrink-0" />
                            <span className="hidden sm:inline">ลบผู้ใช้</span>
                            <span className="sm:hidden">ลบ</span>
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
        </div>

        {/* Footer ของตาราง */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-t border-slate-200 px-4 py-3 text-xs text-slate-500 sm:px-6 w-full min-w-0">
          <span className="shrink-0">แสดง {startItem}-{endItem} จากทั้งหมด {filteredAndSortedUsers.length} รายการ</span>
          <span className="truncate max-w-full">
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