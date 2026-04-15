"use client";

import { useMemo, useState } from "react";
import type { ItemCategory, WarehouseItem } from "../warehouse.mock";
import {
  WarehouseAlertDialog,
  WarehouseModalFooter,
  WarehouseModalFrame,
  WarehouseModalHeader,
  warehouseCancelButtonClassName,
  warehouseDangerButtonClassName,
  warehouseDisabledButtonClassName,
  warehouseHintClassName,
  warehouseInputClassName,
  warehouseLabelClassName,
  warehouseReadOnlyInputClassName,
  warehouseSuccessButtonClassName,
  warehouseTextareaClassName,
} from "../../../shared/warehouse/modal";

interface AddItemModalProps {
  existingItems: WarehouseItem[];
  onClose: () => void;
  onConfirm: (item: {
    code: string;
    name: string;
    description: string;
    quantity: number;
    minimumQuantity?: number;
    unit: string;
    category: ItemCategory;
  }) => void;
}

function getNextItemCode(category: ItemCategory, items: WarehouseItem[]) {
  const nextNumber =
    items
      .filter((item) => item.category === category)
      .map((item) => Number(item.code.split("-")[1] ?? 0))
      .reduce((maxValue, value) => Math.max(maxValue, value), 0) + 1;

  return `${category}-${String(nextNumber).padStart(3, "0")}`;
}

export function AddItemModal({ existingItems, onClose, onConfirm }: AddItemModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    quantity: 0,
    minimumQuantity: 0,
    unit: "",
    category: "MED" as ItemCategory,
  });
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [showValidation, setShowValidation] = useState(false);

  const code = useMemo(
    () => getNextItemCode(formData.category, existingItems),
    [existingItems, formData.category]
  );

  const isDirty =
    formData.category !== "MED" ||
    formData.name.trim().length > 0 ||
    formData.description.trim().length > 0 ||
    formData.unit.trim().length > 0 ||
    formData.minimumQuantity > 0 ||
    formData.quantity > 0;

  const canSubmit =
    formData.name.trim().length > 0 &&
    formData.unit.trim().length > 0 &&
    formData.minimumQuantity >= 0 &&
    formData.quantity > 0;

  const nameHasError = showValidation && formData.name.trim().length === 0;
  const unitHasError = showValidation && formData.unit.trim().length === 0;
  const minimumQuantityHasError = showValidation && formData.minimumQuantity < 0;
  const quantityHasError = showValidation && formData.quantity <= 0;

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
      code,
      name: formData.name.trim(),
      description: formData.description.trim(),
      quantity: formData.quantity,
      minimumQuantity: formData.minimumQuantity,
      unit: formData.unit.trim(),
      category: formData.category,
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
        <WarehouseModalHeader title="เพิ่มรายการสินค้า" onClose={handleRequestClose} />
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 px-7 py-5">
            <div>
              <label htmlFor="add-category" className={warehouseLabelClassName}>
                หมวดหมู่ <span className="text-[#FF495B]">*</span>
              </label>
              <select
                id="add-category"
                value={formData.category}
                onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value as ItemCategory }))}
                className={warehouseInputClassName}
              >
                <option value="MED">ยาและเวชภัณฑ์</option>
                <option value="EQU">อุปกรณ์การแพทย์</option>
                <option value="CON">ของใช้ประจำวัน</option>
              </select>
            </div>

            <div>
              <label htmlFor="add-code" className={warehouseLabelClassName}>
                รหัสสินค้า <span className="text-[#FF495B]">*</span>
              </label>
              <input id="add-code" type="text" value={code} readOnly className={warehouseReadOnlyInputClassName} />
            </div>

            <div>
              <label htmlFor="add-name" className={warehouseLabelClassName}>
                ชื่อสินค้า <span className="text-[#FF495B]">*</span>
              </label>
              <input
                id="add-name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="กรอกชื่อสินค้า"
                className={`${warehouseInputClassName} ${nameHasError ? "border-[#FF7A7A]" : ""}`}
              />
              {nameHasError ? (
                <p className="mt-1 text-[10px] text-[#FF6C6C]">จำเป็นต้องกรอกชื่อสินค้า</p>
              ) : null}
            </div>

            <div>
              <label htmlFor="add-description" className={warehouseLabelClassName}>
                รายละเอียด
              </label>
              <textarea
                id="add-description"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="เพิ่มรายละเอียดสินค้า"
                className={warehouseTextareaClassName}
              />
            </div>

            <div>
              <label htmlFor="add-unit" className={warehouseLabelClassName}>
                หน่วย <span className="text-[#FF495B]">*</span>
              </label>
              <input
                id="add-unit"
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData((prev) => ({ ...prev, unit: e.target.value }))}
                placeholder="เช่น กล่อง, ผืน, ขวด"
                className={`${warehouseInputClassName} ${unitHasError ? "border-[#FF7A7A]" : ""}`}
              />
            </div>

            <div>
              <label htmlFor="add-minimum-quantity" className={warehouseLabelClassName}>
                จำนวนขั้นต่ำ <span className="text-[#FF495B]">*</span>
              </label>
              <input
                id="add-minimum-quantity"
                type="number"
                min={0}
                value={formData.minimumQuantity}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    minimumQuantity: Number(e.target.value || 0),
                  }))
                }
                placeholder="0"
                className={`${warehouseInputClassName} ${minimumQuantityHasError ? "border-[#FF7A7A]" : ""}`}
              />
            </div>

            <div>
              <label htmlFor="add-quantity" className={warehouseLabelClassName}>
                จำนวนเริ่มต้น <span className="text-[#FF495B]">*</span>
              </label>
              <input
                id="add-quantity"
                type="number"
                min={1}
                value={formData.quantity || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, quantity: Number(e.target.value || 0) }))}
                placeholder="0"
                className={`${warehouseInputClassName} ${quantityHasError ? "border-[#FF7A7A]" : ""}`}
              />
              <p className={warehouseHintClassName}>จำนวนที่พร้อมใช้งานทันทีหลังสร้างรายการสินค้า</p>
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
              สร้างสินค้า
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
              <button
                type="button"
                onClick={onClose}
                className={warehouseDangerButtonClassName}
              >
                ไม่บันทึก
              </button>
              <button
                type="button"
                onClick={submitAndClose}
                className={warehouseSuccessButtonClassName}
              >
                บันทึกและออก
              </button>
            </>
          }
        />
      ) : null}
    </>
  );
}
