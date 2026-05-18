"use client";

import { useState } from "react";
import {
  WarehouseAlertDialog,
  warehouseCancelButtonClassName,
  warehouseSuccessButtonClassName,
} from "../../../shared/warehouse/modal";

interface ApproveTransactionsModalProps {
  count: number;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
}

export function ApproveTransactionsModal({
  count,
  onClose,
  onConfirm,
}: ApproveTransactionsModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onConfirm();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <WarehouseAlertDialog
      title="ยืนยันการอนุมัติ"
      description={<p>คุณต้องการอนุมัติ {count} รายการที่เลือกใช่หรือไม่?</p>}
      onClose={onClose}
      iconTone="none"
      actions={
        <>
          <button type="button" onClick={onClose} disabled={isSubmitting} className={warehouseCancelButtonClassName}>
            ยกเลิก
          </button>
          <button type="button" onClick={handleConfirm} disabled={isSubmitting} className={warehouseSuccessButtonClassName}>
            {isSubmitting ? "กำลังอนุมัติ..." : "ยืนยันอนุมัติ"}
          </button>
        </>
      }
    />
  );
}
