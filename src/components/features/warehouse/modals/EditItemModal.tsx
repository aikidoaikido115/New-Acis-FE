"use client";

import { useMemo, useState } from "react";
import type { WarehouseItem } from "../warehouse.mock";
import {
  WarehouseAlertDialog,
  WarehouseModalFooter,
  WarehouseModalFrame,
  WarehouseModalHeader,
  warehouseCancelButtonClassName,
  warehouseDangerButtonClassName,
  warehouseDisabledButtonClassName,
  warehouseInputClassName,
  warehouseLabelClassName,
  warehouseReadOnlyInputClassName,
  warehouseSuccessButtonClassName,
  warehouseTextareaClassName,
} from "../../../shared/warehouse/modal";

interface EditItemModalProps {
  item: WarehouseItem;
  onClose: () => void;
  onConfirm: (updated: WarehouseItem) => void;
}

export function EditItemModal({ item, onClose, onConfirm }: EditItemModalProps) {
  const [formData, setFormData] = useState<WarehouseItem>({ ...item });
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [showValidation, setShowValidation] = useState(false);

  const isDirty = useMemo(
    () => JSON.stringify(formData) !== JSON.stringify(item),
    [formData, item]
  );

  const canSubmit =
    formData.name.trim().length > 0 &&
    formData.unit.trim().length > 0 &&
    (formData.minimumQuantity ?? 0) >= 0 &&
    formData.quantity >= 0;

  const handleRequestClose = () => {
    if (isDirty) {
      setShowDiscardModal(true);
      return;
    }

    onClose();
  };

  const submitAndClose = () => {
    setShowValidation(true);
    if (!canSubmit) {
      return;
    }

    onConfirm({
      ...formData,
      name: formData.name.trim(),
      description: formData.description.trim(),
      unit: formData.unit.trim(),
      minimumQuantity: formData.minimumQuantity ?? 0,
    });
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitAndClose();
  };

  return (
    <>
      <WarehouseModalFrame onClose={handleRequestClose} closeOnEscape={!showDiscardModal}>
        <WarehouseModalHeader title="แก้ไขรายการสินค้า" onClose={handleRequestClose} />
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 px-7 py-5">
            <div>
              <label htmlFor="edit-category" className={warehouseLabelClassName}>
                หมวดหมู่ <span className="text-[#FF495B]">*</span>
              </label>
              <select
                id="edit-category"
                value={formData.category}
                onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value as WarehouseItem["category"] }))}
                className={warehouseInputClassName}
              >
                <option value="MED">ยาและเวชภัณฑ์</option>
                <option value="EQU">อุปกรณ์การแพทย์</option>
                <option value="CON">ของใช้ประจำวัน</option>
              </select>
            </div>

            <div>
              <label htmlFor="edit-code" className={warehouseLabelClassName}>
                รหัสสินค้า <span className="text-[#FF495B]">*</span>
              </label>
              <input id="edit-code" type="text" value={formData.code} readOnly className={warehouseReadOnlyInputClassName} />
            </div>

            <div>
              <label htmlFor="edit-name" className={warehouseLabelClassName}>
                ชื่อสินค้า <span className="text-[#FF495B]">*</span>
              </label>
              <input
                id="edit-name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                className={`${warehouseInputClassName} ${showValidation && formData.name.trim().length === 0 ? "border-[#FF7A7A]" : ""}`}
              />
            </div>

            <div>
              <label htmlFor="edit-description" className={warehouseLabelClassName}>
                รายละเอียด
              </label>
              <textarea
                id="edit-description"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                className={warehouseTextareaClassName}
              />
            </div>

            <div>
              <label htmlFor="edit-unit" className={warehouseLabelClassName}>
                หน่วย <span className="text-[#FF495B]">*</span>
              </label>
              <input
                id="edit-unit"
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData((prev) => ({ ...prev, unit: e.target.value }))}
                className={`${warehouseInputClassName} ${showValidation && formData.unit.trim().length === 0 ? "border-[#FF7A7A]" : ""}`}
              />
            </div>

            <div>
              <label htmlFor="edit-minimum-quantity" className={warehouseLabelClassName}>
                จำนวนขั้นต่ำ <span className="text-[#FF495B]">*</span>
              </label>
              <input
                id="edit-minimum-quantity"
                type="number"
                min={0}
                value={formData.minimumQuantity ?? 0}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    minimumQuantity: Number(e.target.value || 0),
                  }))
                }
                className={`${warehouseInputClassName} ${showValidation && (formData.minimumQuantity ?? 0) < 0 ? "border-[#FF7A7A]" : ""}`}
              />
            </div>

            <div>
              <label htmlFor="edit-quantity" className={warehouseLabelClassName}>
                จำนวน <span className="text-[#FF495B]">*</span>
              </label>
              <input
                id="edit-quantity"
                type="number"
                min={0}
                value={formData.quantity}
                onChange={(e) => setFormData((prev) => ({ ...prev, quantity: Number(e.target.value || 0) }))}
                className={warehouseInputClassName}
              />
            </div>
          </div>

          <WarehouseModalFooter>
            <button type="button" onClick={handleRequestClose} className={warehouseCancelButtonClassName}>
              ยกเลิก
            </button>
            <button
              type="submit"
              className={canSubmit ? warehouseSuccessButtonClassName : warehouseDisabledButtonClassName}
              disabled={!canSubmit && showValidation}
            >
              แก้ไข
            </button>
          </WarehouseModalFooter>
        </form>
      </WarehouseModalFrame>

      {showDiscardModal ? (
        <WarehouseAlertDialog
          title="มีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก"
          description={
            <>
              คุณต้องการบันทึกข้อมูลก่อนออกจากหน้าต่างนี้หรือไม่
            </>
          }
          onClose={() => setShowDiscardModal(false)}
          actions={
            <>
              <button type="button" onClick={onClose} className={warehouseDangerButtonClassName}>
                ไม่บันทึก
              </button>
              <button type="button" onClick={submitAndClose} className={warehouseSuccessButtonClassName}>
                บันทึกและออก
              </button>
            </>
          }
        />
      ) : null}
    </>
  );
}
