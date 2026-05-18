"use client";

import { useState } from "react";
import type { WarehouseItem } from "@/services/warehouse.service";
import {
  WarehouseAlertDialog,
  warehouseCancelButtonClassName,
  warehouseDangerButtonClassName,
} from "../../../shared/warehouse/modal";

interface DeleteItemModalProps {
  item: WarehouseItem;
  onClose: () => void;
  onConfirm: (itemId: string) => Promise<void> | void;
}

export function DeleteItemModal({ item, onClose, onConfirm }: DeleteItemModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onConfirm(item.id);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <WarehouseAlertDialog
      title="ยืนยันการนำรายการออก"
      description={
        <>
          <p>คุณต้องการส่งคำขอนำรายการออกสำหรับ &quot;{item.name}&quot; หรือไม่?</p>
          <p className="text-sm leading-5 text-[#555555]">รายการจะยังไม่ถูกนำออกจนกว่าจะได้รับอนุมัติ</p>
        </>
      }
      onClose={onClose}
      actions={
        <>
          <button type="button" onClick={handleConfirm} disabled={isSubmitting} className={warehouseDangerButtonClassName}>
            {isSubmitting ? "กำลังส่งคำขอ..." : "นำรายการออก"}
          </button>
          <button type="button" onClick={onClose} disabled={isSubmitting} className={warehouseCancelButtonClassName}>
            ยกเลิก
          </button>
        </>
      }
    />
  );
}
