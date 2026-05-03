"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, ChevronDown } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { useToast } from "@/components/ui/toast";
import { DatePicker } from "@/components/ui/date-picker";
import { useAuth } from "@/hooks/useAuth";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import {
  warehouseService,
  type WarehouseApprovalStatus as ApprovalStatus,
  type WarehouseTransaction as Transaction,
  type WarehouseTransactionType as TransactionType } from "@/services/warehouse.service";
import {
  ApproveTransactionsModal,
  RejectTransactionsModal,
  TransactionDetailLogModal } from "./modals";
import { ContactInformationModal } from "@/components/shared/contact/ContactInformationModal";
import { resolveContactInfo } from "@/components/shared/contact/contactDirectory";

const ITEMS_PER_PAGE = 15;

const STATUS_STYLES: Record<ApprovalStatus, string> = {
  รออนุมัติ: "bg-yellow-100 text-yellow-700 border border-yellow-300",
  อนุมัติ: "bg-green-100 text-green-700",
  ไม่อนุมัติ: "bg-red-100 text-red-600" };

const datePickerFieldClassName =
  "w-[150px] [&>button]:w-full [&>button]:justify-between [&>button]:border-[#CCCCCC] [&>button]:bg-[rgba(204,204,204,0.16)] [&>button]:font-normal";

const formatIsoDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseDateValue = (value: string): Date | null => {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!isoMatch) {
    return null;
  }

  const year = Number(isoMatch[1]);
  const month = Number(isoMatch[2]);
  const day = Number(isoMatch[3]);
  const date = new Date(year, month - 1, day);

  if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
    return date;
  }

  return null;
};

function ApprovalBadge({ status }: { status: ApprovalStatus }) {
  return (
    <span
      className={`inline-flex px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${STATUS_STYLES[status]}`}
    >
      {status}
    </span>
  );
}

// Checkbox state for bulk actions
type CheckedMap = Record<string, boolean>;

function isSuperuserOrHigher(role?: string): boolean {
  if (!role) return false;
  const normalizedRole = role.toLowerCase();
  return (
    normalizedRole.includes("superuser") ||
    normalizedRole.includes("super user") ||
    normalizedRole.includes("super_user") ||
    normalizedRole.includes("admin")
  );
}

export function TransactionHistoryTable() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const canApproveWarehouseTransactions = isSuperuserOrHigher(user?.role_name);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailLoadingId, setDetailLoadingId] = useState<string | null>(null);
  const [checkedMap, setCheckedMap] = useState<CheckedMap>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [detailTransaction, setDetailTransaction] = useState<Transaction | null>(null);
  const [activeContactName, setActiveContactName] = useState<string | null>(null);

  // Filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchItem, setSearchItem] = useState("");
  const [searchUser, setSearchUser] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<"" | ApprovalStatus>("");
  const [selectedType, setSelectedType] = useState<"" | TransactionType>("");
  const debouncedSearchItem = useDebouncedValue(searchItem, 400);
  const debouncedSearchUser = useDebouncedValue(searchUser, 400);

  const loadTransactions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await warehouseService.getTransactions({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        searchItem: debouncedSearchItem.trim() || undefined,
        searchUser: debouncedSearchUser.trim() || undefined,
        status: selectedStatus || undefined,
        type: selectedType || undefined,
      });
      setTransactions(data);
    } catch {
      setError("ไม่สามารถโหลดประวัติการทำรายการได้");
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate, debouncedSearchItem, debouncedSearchUser, selectedStatus, selectedType]);

  useEffect(() => {
    void loadTransactions();
  }, [loadTransactions]);

  useEffect(() => {
    setCurrentPage(1);
  }, [startDate, endDate, searchItem, searchUser, selectedStatus, selectedType]);

  useEffect(() => {
    setCheckedMap((prev) => {
      const pendingIds = new Set(
        transactions
          .filter((tx) => tx.approvalStatus === "รออนุมัติ")
          .map((tx) => tx.id)
      );
      const next: CheckedMap = {};
      for (const [id, checked] of Object.entries(prev)) {
        if (checked && pendingIds.has(id)) {
          next[id] = true;
        }
      }
      return next;
    });
  }, [transactions]);

  const filtered = useMemo(() => transactions, [transactions]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const resetPage = () => setCurrentPage(1);

  // Checkbox logic
  const pendingPageIds = paginated
    .filter((tx) => tx.approvalStatus === "รออนุมัติ")
    .map((tx) => tx.id);
  const allChecked = pendingPageIds.length > 0 && pendingPageIds.every((id) => checkedMap[id]);
  const someChecked = pendingPageIds.some((id) => checkedMap[id]);

  const toggleAll = () => {
    if (!canApproveWarehouseTransactions) {
      return;
    }

    if (allChecked) {
      setCheckedMap((prev) => {
        const next = { ...prev };
        pendingPageIds.forEach((id) => delete next[id]);
        return next;
      });
    } else {
      setCheckedMap((prev) => {
        const next = { ...prev };
        pendingPageIds.forEach((id) => (next[id] = true));
        return next;
      });
    }
  };

  const toggleOne = (id: string) => {
    if (!canApproveWarehouseTransactions) {
      return;
    }

    const transaction = transactions.find((tx) => tx.id === id);
    if (!transaction || transaction.approvalStatus !== "รออนุมัติ") {
      return;
    }

    setCheckedMap((prev) => {
      const next = { ...prev };
      if (next[id]) {
        delete next[id];
      } else {
        next[id] = true;
      }
      return next;
    });
  };

  const selectedIds = Object.entries(checkedMap)
    .filter(([id, isChecked]) => {
      if (!isChecked) {
        return false;
      }

      const tx = transactions.find((item) => item.id === id);
      return tx?.approvalStatus === "รออนุมัติ";
    })
    .map(([id]) => id);

  const checkedCount = selectedIds.length;

  const handleApprove = async () => {
    if (!canApproveWarehouseTransactions) {
      return;
    }

    if (selectedIds.length === 0) {
      return;
    }

    try {
      await warehouseService.approveTransactions(selectedIds);
      setCheckedMap({});
      setShowApproveModal(false);
      await loadTransactions();
      showToast({
        type: "success",
        title: "อนุมัติสำเร็จ",
        message: `อนุมัติรายการ ${selectedIds.length} รายการเรียบร้อยแล้ว`,
      });
    } catch {
      alert("ไม่สามารถอนุมัติรายการได้");
    }
  };

  const handleReject = async (reason: string) => {
    if (!canApproveWarehouseTransactions) {
      return;
    }

    if (!reason.trim()) {
      return;
    }

    try {
      await warehouseService.rejectTransactions(selectedIds, reason.trim());
      setCheckedMap({});
      setShowRejectModal(false);
      await loadTransactions();
      showToast({
        type: "success",
        title: "บันทึกสำเร็จ",
        message: `ไม่อนุมัติรายการ ${selectedIds.length} รายการเรียบร้อยแล้ว`,
      });
    } catch {
      alert("ไม่สามารถไม่อนุมัติรายการได้");
    }
  };

  const openTransactionDetail = async (id: string) => {
    setDetailLoadingId(id);
    try {
      const detail = await warehouseService.getTransactionById(id);
      setDetailTransaction(detail);
    } catch {
      alert("ไม่สามารถโหลดรายละเอียดรายการได้");
    } finally {
      setDetailLoadingId(null);
    }
  };

  const columnCount = canApproveWarehouseTransactions ? 9 : 8;

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div>
        <div className="flex flex-wrap items-center gap-3 rounded-lg bg-[rgba(204,204,204,0.14)] p-3">
          {/* Start Date */}
          <div className="w-[150px]">
            <DatePicker
              value={parseDateValue(startDate)}
              onChange={(date) => {
                setStartDate(date ? formatIsoDate(date) : "");
                resetPage();
              }}
              placeholder="วันที่เริ่มต้น"
              className={datePickerFieldClassName}
            />
          </div>

          {/* End Date */}
          <div className="w-[150px]">
            <DatePicker
              value={parseDateValue(endDate)}
              onChange={(date) => {
                setEndDate(date ? formatIsoDate(date) : "");
                resetPage();
              }}
              placeholder="วันที่สิ้นสุด"
              className={datePickerFieldClassName}
            />
          </div>

          {/* Search Item */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหาชื่อสินค้า..."
              value={searchItem}
              onChange={(e) => { setSearchItem(e.target.value); resetPage(); }}
              className="pl-10 pr-4 py-2 border border-gray-400 bg-white shadow-sm rounded-lg placeholder:text-[#CCCCCC] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-body-small text-black w-44"
            />
          </div>

          {/* Search User */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหาผู้ทำรายการ..."
              value={searchUser}
              onChange={(e) => { setSearchUser(e.target.value); resetPage(); }}
              className="pl-10 pr-4 py-2 border border-gray-400 bg-white shadow-sm rounded-lg placeholder:text-[#CCCCCC] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-body-small text-black w-44"
            />
          </div>

          {/* Status Dropdown */}
          <div className="relative">
            <select
              value={selectedStatus}
              onChange={(e) => { setSelectedStatus(e.target.value as "" | ApprovalStatus); resetPage(); }}
              className="appearance-none pl-4 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-body-small bg-[rgba(204,204,204,0.16)] text-gray-700 cursor-pointer"
              style={{ borderColor: "rgba(204, 204, 204, 1)" }}
            >
              <option value="">สถานะการอนุมัติ</option>
              <option value="รออนุมัติ">รออนุมัติ</option>
              <option value="อนุมัติ">อนุมัติ</option>
              <option value="ไม่อนุมัติ">ไม่อนุมัติ</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Type Dropdown */}
          <div className="relative">
            <select
              value={selectedType}
              onChange={(e) => { setSelectedType(e.target.value as "" | TransactionType); resetPage(); }}
              className="appearance-none pl-4 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-body-small bg-[rgba(204,204,204,0.16)] text-gray-700 cursor-pointer"
              style={{ borderColor: "rgba(204, 204, 204, 1)" }}
            >
              <option value="">ประเภทรายการ</option>
              <option value="เพิ่มสินค้าใหม่">เพิ่มสินค้าใหม่</option>
              <option value="เติมสินค้า">เติมสินค้า</option>
              <option value="เบิกสินค้า">เบิกสินค้า</option>
              <option value="นำออก">นำออก</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {canApproveWarehouseTransactions && checkedCount > 0 && (
        <div className="rounded-lg px-4 py-2 flex items-center gap-3" style={{ backgroundColor: 'rgba(103, 103, 103, 0.24)' }}>
          <span className="text-body-small text-black font-medium">
            เลือก {checkedCount} รายการ
          </span>
          <div className="flex-1" />
          <button
            type="button"
            onClick={() => setShowApproveModal(true)}
            className="px-3 py-1 bg-green-500 text-white rounded-lg text-overline font-medium hover:bg-green-600 transition-colors"
          >
            อนุมัติ ({checkedCount})
          </button>
          <button
            type="button"
            onClick={() => setShowRejectModal(true)}
            className="px-3 py-1 bg-red-500 text-white rounded-lg text-overline font-medium hover:bg-red-600 transition-colors"
          >
            ไม่อนุมัติ ({checkedCount})
          </button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-lg" style={{ border: '1px solid rgba(103, 103, 103, 0.48)' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: 'rgba(239, 242, 247, 1)', borderBottom: '1px solid rgba(103, 103, 103, 0.48)' }}>
                {canApproveWarehouseTransactions ? (
                  <th className="py-3 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={allChecked}
                      ref={(el) => {
                        if (el) el.indeterminate = someChecked && !allChecked;
                      }}
                      onChange={toggleAll}
                      disabled={pendingPageIds.length === 0}
                      className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500 cursor-pointer"
                      aria-label="เลือกทั้งหมด"
                    />
                  </th>
                ) : null}
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 w-36">
                  รหัสการแก้ไข
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 w-36">
                  ประเภท
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 w-28">
                  รหัสสินค้า
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700">
                  ชื่อสินค้า
                </th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-700 w-24">
                  จำนวน
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 w-28">
                  ผู้ทำรายการ
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 w-40">
                  วันที่แก้ไข
                </th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-700 w-28">
                  การอนุมัติ
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={columnCount} className="py-12 px-4 text-center text-sm text-gray-500">
                    กำลังโหลดข้อมูล...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={columnCount} className="py-12 px-4 text-center text-sm text-red-500">
                    {error}
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={columnCount} className="py-12 px-4 text-center">
                    <div className="text-sm text-gray-600">ไม่พบประวัติการทำรายการ</div>
                    <div className="text-xs text-gray-400 mt-1">ยังไม่มีข้อมูลธุรกรรมตามเงื่อนไขที่เลือก</div>
                  </td>
                </tr>
              ) : (
                paginated.map((tx) => (
                  <tr
                    key={tx.id}
                    className={`hover:bg-gray-50 transition-colors align-middle ${
                      checkedMap[tx.id] ? "bg-blue-50" : "bg-white"
                    }`}
                    style={{ borderBottom: '1px solid rgba(103, 103, 103, 0.48)' }}
                  >
                    {canApproveWarehouseTransactions ? (
                      <td className="py-3 px-4">
                        {tx.approvalStatus === "รออนุมัติ" ? (
                          <input
                            type="checkbox"
                            checked={!!checkedMap[tx.id]}
                            onChange={() => toggleOne(tx.id)}
                            className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500 cursor-pointer"
                            aria-label={`เลือกรายการ ${tx.code}`}
                          />
                        ) : (
                          <span className="block h-4 w-4" aria-hidden="true" />
                        )}
                      </td>
                    ) : null}
                    <td className="py-3 px-4 text-xs sm:text-sm text-gray-700 font-medium">{tx.code}</td>
                    <td className="py-3 px-4 text-xs sm:text-sm text-gray-700">{tx.type}</td>
                    <td className="py-3 px-4 text-xs sm:text-sm text-gray-700">{tx.itemCode}</td>
                    <td className="py-3 px-4 text-xs sm:text-sm text-gray-800 font-medium">{tx.itemName}</td>
                    <td className="py-3 px-4 text-xs sm:text-sm text-gray-700 text-center">{tx.quantity}</td>
                    <td className="py-3 px-4 text-xs sm:text-sm text-blue-600 underline">
                      <button
                        type="button"
                        onClick={() => setActiveContactName(tx.operator)}
                        className="hover:text-blue-800"
                      >
                        {tx.operator}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-xs sm:text-sm text-gray-700">{tx.date}</td>
                    <td className="py-3 px-4 text-center">
                      {tx.approvalStatus === "รออนุมัติ" ? (
                        <ApprovalBadge status={tx.approvalStatus} />
                      ) : (
                        <button
                          type="button"
                          onClick={() => void openTransactionDetail(tx.id)}
                          className="inline-flex rounded-full"
                          disabled={detailLoadingId === tx.id}
                        >
                          <ApprovalBadge status={tx.approvalStatus} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="px-4 py-4">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      {showApproveModal ? (
        <ApproveTransactionsModal
          count={checkedCount}
          onClose={() => setShowApproveModal(false)}
          onConfirm={handleApprove}
        />
      ) : null}

      {showRejectModal ? (
        <RejectTransactionsModal
          count={checkedCount}
          onClose={() => setShowRejectModal(false)}
          onConfirm={handleReject}
        />
      ) : null}

      {detailTransaction ? (
        <TransactionDetailLogModal
          transaction={detailTransaction}
          onClose={() => setDetailTransaction(null)}
          onContactClick={(name) => setActiveContactName(name)}
        />
      ) : null}

      {activeContactName ? (
        <ContactInformationModal
          contact={resolveContactInfo(activeContactName)}
          onClose={() => setActiveContactName(null)}
        />
      ) : null}
    </div>
  );
}
