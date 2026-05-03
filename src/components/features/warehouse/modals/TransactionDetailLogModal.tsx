"use client";

import type { WarehouseTransaction as Transaction } from "@/services/warehouse.service";
import {
  WarehouseModalFrame,
  WarehouseModalHeader,
  warehouseCancelButtonClassName } from "../../../shared/warehouse/modal";

interface TransactionDetailLogModalProps {
  transaction: Transaction;
  onClose: () => void;
  onContactClick?: (name: string) => void;
}

function getApprovalBadgeClass(status: Transaction["approvalStatus"]) {
  if (status === "อนุมัติ") {
    return "bg-[#4F9966] text-white";
  }

  if (status === "ไม่อนุมัติ") {
    return "bg-[#FF495B] text-white";
  }

  return "bg-[#E6E6E6] text-[#444444]";
}

function formatWarehouseTransactionType(type: string) {
  return type.replace(/สินค้า/g, "เวชภัณฑ์");
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[130px_1fr] items-start gap-2">
      <p className="text-sm font-semibold text-[#1F1F1F]">{label}</p>
      <div className="text-sm text-[#2E2E2E]">{value}</div>
    </div>
  );
}

export function TransactionDetailLogModal({
  transaction,
  onClose,
  onContactClick }: TransactionDetailLogModalProps) {
  const isApproved = transaction.approvalStatus === "อนุมัติ";

  const renderPerson = (name?: string) => {
    if (!name || name === "-") {
      return <span>{name ?? "-"}</span>;
    }

    return (
      <button
        type="button"
        onClick={() => onContactClick?.(name)}
        className="text-blue-600 underline hover:text-blue-700"
      >
        {name}
      </button>
    );
  };

  return (
    <WarehouseModalFrame onClose={onClose} maxWidthClassName="max-w-[520px]">
      <WarehouseModalHeader title="รายละเอียดการทำรายการ" onClose={onClose} />

      <div className="space-y-3 px-6 py-4">
        <DetailRow label="รหัสการแก้ไข" value={transaction.code} />
        <DetailRow label="ประเภทรายการ" value={formatWarehouseTransactionType(transaction.type)} />
        <DetailRow label="รหัสเวชภัณฑ์" value={transaction.itemCode} />
        <DetailRow label="ชื่อเวชภัณฑ์" value={transaction.itemName} />
        <DetailRow label="จำนวน" value={String(transaction.quantity)} />
        <DetailRow label="ผู้ทำรายการ" value={renderPerson(transaction.operator)} />
        <DetailRow label="วันที่แก้ไข" value={transaction.date} />

        <div className="grid grid-cols-[130px_1fr] items-center gap-2">
          <p className="text-sm font-semibold text-[#1F1F1F]">การอนุมัติ</p>
          <div>
            <span className={`inline-flex min-w-[78px] items-center justify-center rounded-md px-3 py-1 text-sm font-semibold ${getApprovalBadgeClass(transaction.approvalStatus)}`}>
              {transaction.approvalStatus}
            </span>
          </div>
        </div>

        {isApproved ? (
          <>
            <DetailRow label="ผู้อนุมัติ" value={renderPerson(transaction.approvedBy)} />
            <DetailRow label="วันที่อนุมัติ" value={transaction.approvedAt ?? "-"} />
          </>
        ) : (
          <>
            <DetailRow label="เหตุผลที่ไม่อนุมัติ" value={transaction.rejectionReason ?? "-"} />
            <DetailRow label="ผู้ไม่อนุมัติ" value={renderPerson(transaction.rejectedBy)} />
            <DetailRow label="วันที่ไม่อนุมัติ" value={transaction.rejectedAt ?? "-"} />
          </>
        )}
      </div>

      <div className="flex justify-center border-t border-[#D8D8D8] bg-[#FAFAFA] px-6 py-4">
        <button type="button" onClick={onClose} className={warehouseCancelButtonClassName}>
          ปิด
        </button>
      </div>
    </WarehouseModalFrame>
  );
}