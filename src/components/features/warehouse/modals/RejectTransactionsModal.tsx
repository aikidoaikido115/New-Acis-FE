"use client";

import { useState } from "react";
import {
  WarehouseModalFooter,
  WarehouseModalFrame,
  WarehouseModalHeader,
  warehouseCancelButtonClassName,
  warehouseDangerButtonClassName,
  warehouseDisabledButtonClassName,
  warehouseLabelClassName,
  warehouseTextareaClassName,
} from "../../../shared/warehouse/modal";

interface RejectTransactionsModalProps {
  count: number;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

export function RejectTransactionsModal({ count, onClose, onConfirm }: RejectTransactionsModalProps) {
  const [reason, setReason] = useState("");
  const [showValidation, setShowValidation] = useState(false);

  const canSubmit = reason.trim().length > 0;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setShowValidation(true);
    if (!canSubmit) {
      return;
    }

    onConfirm(reason.trim());
  };

  return (
    <WarehouseModalFrame onClose={onClose} maxWidthClassName="max-w-[440px]">
      <WarehouseModalHeader title="ไม่อนุมัติรายการ" onClose={onClose} />
      <form onSubmit={handleSubmit}>
        <div className="space-y-5 px-7 py-5">
          <p className="text-[15px] leading-6 text-[#262626]">
            คุณไม่อนุมัติ {count} รายการ กรุณาระบุเหตุผล
          </p>

          <div>
            <label htmlFor="reject-reason" className={warehouseLabelClassName}>
              เหตุผลการไม่อนุมัติ <span className="text-[#FF495B]">*</span>
            </label>
            <textarea
              id="reject-reason"
              rows={4}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="กรุณาใส่เหตุผล"
              className={`${warehouseTextareaClassName} ${showValidation && !canSubmit ? "border-[#FF7A7A]" : ""}`}
            />
          </div>
        </div>

        <WarehouseModalFooter>
          <button type="button" onClick={onClose} className={warehouseCancelButtonClassName}>
            ยกเลิก
          </button>
          <button
            type="submit"
            className={canSubmit ? warehouseDangerButtonClassName : warehouseDisabledButtonClassName}
          >
            ยืนยันไม่อนุมัติ
          </button>
        </WarehouseModalFooter>
      </form>
    </WarehouseModalFrame>
  );
}