"use client";

import type { WarehouseItem } from "@/services/warehouse.service";
import {
  WarehouseAlertDialog,
  warehouseCancelButtonClassName,
  warehouseDangerButtonClassName } from "../../../shared/warehouse/modal";

interface DeleteItemModalProps {
  item: WarehouseItem;
  onClose: () => void;
  onConfirm: (itemId: string) => void;
}

export function DeleteItemModal({ item, onClose, onConfirm }: DeleteItemModalProps) {
  const handleConfirm = () => {
    onConfirm(item.id);
    onClose();
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
          <button type="button" onClick={handleConfirm} className={warehouseDangerButtonClassName}>
            นำรายการออก
          </button>
          <button type="button" onClick={onClose} className={warehouseCancelButtonClassName}>
            ยกเลิก
          </button>
        </>
      }
    />
  );
}
