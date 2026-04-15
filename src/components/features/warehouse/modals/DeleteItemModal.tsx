"use client";

import type { WarehouseItem } from "../warehouse.mock";
import {
  WarehouseAlertDialog,
  warehouseCancelButtonClassName,
  warehouseDangerButtonClassName,
} from "../../../shared/warehouse/modal";

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
          <p>คุณต้องการนำ "{item.name}" ออกจากรายการสินค้านี้หรือไม่?</p>
          <p className="text-[13px] leading-5 text-[#555555]">การกระทำนี้ไม่สามารถย้อนกลับได้</p>
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
