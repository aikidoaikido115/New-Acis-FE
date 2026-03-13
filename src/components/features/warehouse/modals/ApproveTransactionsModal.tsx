"use client";

import {
  WarehouseAlertDialog,
  warehouseCancelButtonClassName,
  warehouseSuccessButtonClassName,
} from "../../../shared/warehouse/modal";

interface ApproveTransactionsModalProps {
  count: number;
  onClose: () => void;
  onConfirm: () => void;
}

export function ApproveTransactionsModal({ count, onClose, onConfirm }: ApproveTransactionsModalProps) {
  return (
    <WarehouseAlertDialog
      title="ยืนยันการอนุมัติ"
      description={<p>คุณต้องการอนุมัติ {count} รายการที่เลือกใช่หรือไม่?</p>}
      onClose={onClose}
      iconTone="none"
      actions={
        <>
          <button type="button" onClick={onClose} className={warehouseCancelButtonClassName}>
            ยกเลิก
          </button>
          <button type="button" onClick={onConfirm} className={warehouseSuccessButtonClassName}>
            ยืนยันอนุมัติ
          </button>
        </>
      }
    />
  );
}