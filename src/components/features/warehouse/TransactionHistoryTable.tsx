"use client";

import { useMemo, useState } from "react";
import { Calendar, Search, ChevronDown } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import {
  ApproveTransactionsModal,
  RejectTransactionsModal,
  TransactionDetailLogModal,
} from "./modals";
import { ContactInformationModal } from "@/components/shared/contact/ContactInformationModal";
import { resolveContactInfo } from "@/components/shared/contact/contactDirectory";
import {
  mockTransactions,
  ITEMS_PER_PAGE,
  type Transaction,
  type ApprovalStatus,
  type TransactionType,
} from "./warehouse.mock";

const STATUS_STYLES: Record<ApprovalStatus, string> = {
  รออนุมัติ: "bg-yellow-100 text-yellow-700 border border-yellow-300",
  อนุมัติ: "bg-green-100 text-green-700",
  ไม่อนุมัติ: "bg-red-100 text-red-600",
};

function ApprovalBadge({ status }: { status: ApprovalStatus }) {
  return (
    <span
      className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {status}
    </span>
  );
}

// Checkbox state for bulk actions
type CheckedMap = Record<string, boolean>;

export function TransactionHistoryTable() {
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
  const [checkedMap, setCheckedMap] = useState<CheckedMap>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [detailTransaction, setDetailTransaction] = useState<Transaction | null>(null);
  const [activeContactName, setActiveContactName] = useState<string | null>(null);

  // Filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startDateInputType, setStartDateInputType] = useState<"text" | "date">("text");
  const [endDateInputType, setEndDateInputType] = useState<"text" | "date">("text");
  const [searchItem, setSearchItem] = useState("");
  const [searchUser, setSearchUser] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<"" | ApprovalStatus>("");
  const [selectedType, setSelectedType] = useState<"" | TransactionType>("");

  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      const matchesItem =
        tx.itemName.toLowerCase().includes(searchItem.toLowerCase()) ||
        tx.itemCode.toLowerCase().includes(searchItem.toLowerCase());
      const matchesUser = tx.operator.toLowerCase().includes(searchUser.toLowerCase());
      const matchesStatus = selectedStatus === "" || tx.approvalStatus === selectedStatus;
      const matchesType = selectedType === "" || tx.type === selectedType;
      return matchesItem && matchesUser && matchesStatus && matchesType;
    });
  }, [transactions, searchItem, searchUser, selectedStatus, selectedType]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const resetPage = () => setCurrentPage(1);

  // Checkbox logic
  const pageIds = paginated.map((tx) => tx.id);
  const allChecked = pageIds.length > 0 && pageIds.every((id) => checkedMap[id]);
  const someChecked = pageIds.some((id) => checkedMap[id]);

  const toggleAll = () => {
    if (allChecked) {
      setCheckedMap((prev) => {
        const next = { ...prev };
        pageIds.forEach((id) => delete next[id]);
        return next;
      });
    } else {
      setCheckedMap((prev) => {
        const next = { ...prev };
        pageIds.forEach((id) => (next[id] = true));
        return next;
      });
    }
  };

  const toggleOne = (id: string) => {
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

  const checkedCount = Object.values(checkedMap).filter(Boolean).length;

  const selectedIds = Object.entries(checkedMap)
    .filter(([, isChecked]) => isChecked)
    .map(([id]) => id);

  const formatDetailDate = (date: Date) => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hour = String(date.getHours()).padStart(2, "0");
    const minute = String(date.getMinutes()).padStart(2, "0");

    return `${day}/${month}/${year} ${hour}:${minute}`;
  };

  const applyApprovalStatus = (approvalStatus: ApprovalStatus, reason?: string) => {
    if (selectedIds.length === 0) {
      return;
    }

    const nowText = formatDetailDate(new Date());

    setTransactions((prev) =>
      prev.map((transaction) =>
        selectedIds.includes(transaction.id)
          ? {
              ...transaction,
              approvalStatus,
              approvedBy: approvalStatus === "อนุมัติ" ? "สมหญิง" : undefined,
              approvedAt: approvalStatus === "อนุมัติ" ? nowText : undefined,
              rejectedBy: approvalStatus === "ไม่อนุมัติ" ? "สมหญิง" : undefined,
              rejectedAt: approvalStatus === "ไม่อนุมัติ" ? nowText : undefined,
              rejectionReason: approvalStatus === "ไม่อนุมัติ" ? reason : undefined,
            }
          : transaction
      )
    );
    setCheckedMap({});
  };

  const handleApprove = () => {
    applyApprovalStatus("อนุมัติ");
    setShowApproveModal(false);
  };

  const handleReject = (reason: string) => {
    if (!reason.trim()) {
      return;
    }

    applyApprovalStatus("ไม่อนุมัติ", reason);
    setShowRejectModal(false);
  };

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div>
        <div className="flex flex-wrap items-center gap-3 rounded-lg bg-[rgba(204,204,204,0.14)] p-3">
          {/* Start Date */}
          <div className="relative">
            <input
              type={startDateInputType}
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); resetPage(); }}
              onFocus={() => setStartDateInputType("date")}
              onBlur={() => {
                if (!startDate) setStartDateInputType("text");
              }}
              className="pl-3 pr-9 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-700 bg-[rgba(204,204,204,0.16)]"
              style={{ borderColor: "rgba(204, 204, 204, 1)" }}
              placeholder="วันที่เริ่มต้น"
            />
            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          {/* End Date */}
          <div className="relative">
            <input
              type={endDateInputType}
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); resetPage(); }}
              onFocus={() => setEndDateInputType("date")}
              onBlur={() => {
                if (!endDate) setEndDateInputType("text");
              }}
              className="pl-3 pr-9 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-700 bg-[rgba(204,204,204,0.16)]"
              style={{ borderColor: "rgba(204, 204, 204, 1)" }}
              placeholder="วันที่สิ้นสุด"
            />
            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Search Item */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหาชื่อสินค้า..."
              value={searchItem}
              onChange={(e) => { setSearchItem(e.target.value); resetPage(); }}
              className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-44 bg-[rgba(204,204,204,0.16)]"
              style={{ borderColor: "rgba(204, 204, 204, 1)" }}
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
              className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-44 bg-[rgba(204,204,204,0.16)]"
              style={{ borderColor: "rgba(204, 204, 204, 1)" }}
            />
          </div>

          {/* Status Dropdown */}
          <div className="relative">
            <select
              value={selectedStatus}
              onChange={(e) => { setSelectedStatus(e.target.value as "" | ApprovalStatus); resetPage(); }}
              className="appearance-none pl-4 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-[rgba(204,204,204,0.16)] text-gray-700 cursor-pointer"
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
              className="appearance-none pl-4 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-[rgba(204,204,204,0.16)] text-gray-700 cursor-pointer"
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
      {checkedCount > 0 && (
        <div className="rounded-lg px-4 py-2 flex items-center gap-3" style={{ backgroundColor: 'rgba(103, 103, 103, 0.24)' }}>
          <span className="text-sm text-black font-medium">
            เลือก {checkedCount} รายการ
          </span>
          <div className="flex-1" />
          <button
            type="button"
            onClick={() => setShowApproveModal(true)}
            className="px-3 py-1 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600 transition-colors"
          >
            อนุมัติ ({checkedCount})
          </button>
          <button
            type="button"
            onClick={() => setShowRejectModal(true)}
            className="px-3 py-1 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600 transition-colors"
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
                <th className="py-3 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={allChecked}
                    ref={(el) => {
                      if (el) el.indeterminate = someChecked && !allChecked;
                    }}
                    onChange={toggleAll}
                    className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500 cursor-pointer"
                    aria-label="เลือกทั้งหมด"
                  />
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 w-36">
                  รหัสการแก้ไข
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 w-36">
                  ประเภท
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 w-28">
                  รหัสสินค้า
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  ชื่อสินค้า
                </th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 w-24">
                  จำนวน
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 w-28">
                  ผู้ทำรายการ
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 w-40">
                  วันที่แก้ไข
                </th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 w-28">
                  การอนุมัติ
                </th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-400 text-sm">
                    ไม่พบประวัติการทำรายการ
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
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={!!checkedMap[tx.id]}
                        onChange={() => toggleOne(tx.id)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500 cursor-pointer"
                        aria-label={`เลือกรายการ ${tx.code}`}
                      />
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700 font-medium">{tx.code}</td>
                    <td className="py-3 px-4 text-sm text-gray-700">{tx.type}</td>
                    <td className="py-3 px-4 text-sm text-gray-700">{tx.itemCode}</td>
                    <td className="py-3 px-4 text-sm text-gray-800 font-medium">{tx.itemName}</td>
                    <td className="py-3 px-4 text-sm text-gray-700 text-center">{tx.quantity}</td>
                    <td className="py-3 px-4 text-sm text-blue-600 underline">
                      <button
                        type="button"
                        onClick={() => setActiveContactName(tx.operator)}
                        className="hover:text-blue-800"
                      >
                        {tx.operator}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700">{tx.date}</td>
                    <td className="py-3 px-4 text-center">
                      {tx.approvalStatus === "รออนุมัติ" ? (
                        <ApprovalBadge status={tx.approvalStatus} />
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDetailTransaction(tx)}
                          className="inline-flex rounded-full"
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
