"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, Filter, Plus, PackagePlus, PackageMinus, Edit, Trash2, Check } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { useToast } from "@/components/ui/toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAuth } from "@/hooks/useAuth";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import {
  warehouseService,
  type WarehouseCategory as ItemCategory,
  type WarehouseItem } from "@/services/warehouse.service";
import {
  AddItemModal,
  EditItemModal,
  DeleteItemModal } from "./modals";

const ITEMS_PER_PAGE = 15;

const CATEGORY_LABELS: Record<ItemCategory, string> = {
  MED: "ยาและเวชภัณฑ์",
  EQU: "อุปกรณ์",
  CON: "ของใช้ประจำวัน" };

type InventoryAdjustMode = "restock" | "withdraw";

function isSuperuserOrHigher(role?: string): boolean {
  if (!role) return false;
  const normalizedRole = role.toLowerCase();
  return (
    normalizedRole.includes("superuser") ||
    normalizedRole.includes("super user") ||
    normalizedRole.includes("super_user") ||
    normalizedRole.includes("admin")
  );
}

export function InventoryTable() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const canAddWarehouseItems = isSuperuserOrHigher(user?.role_name);
  const [items, setItems] = useState<WarehouseItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingRequestCountByItemCode, setPendingRequestCountByItemCode] = useState<Record<string, number>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"all" | ItemCategory>("all");
  const [showFilter, setShowFilter] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [adjustMode, setAdjustMode] = useState<InventoryAdjustMode | null>(null);
  const [pendingAdjustments, setPendingAdjustments] = useState<Record<string, number>>({});
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 400);

  // Modals
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState<WarehouseItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<WarehouseItem | null>(null);

  const loadItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await warehouseService.getItems({
        search: debouncedSearchTerm.trim() || undefined,
        category: selectedCategory === "all" ? undefined : selectedCategory,
      });
      setItems(data);

      try {
        const pendingTransactions = await warehouseService.getTransactions({
          status: "รออนุมัติ",
        });

        const pendingCountByCode = pendingTransactions.reduce<Record<string, number>>((acc, transaction) => {
          const itemCode = transaction.itemCode?.trim();
          if (!itemCode) {
            return acc;
          }

          acc[itemCode] = (acc[itemCode] ?? 0) + 1;
          return acc;
        }, {});

        setPendingRequestCountByItemCode(pendingCountByCode);
      } catch {
        setPendingRequestCountByItemCode({});
      }
    } catch {
      setError("ไม่สามารถโหลดรายการเวชภัณฑ์ได้");
      setPendingRequestCountByItemCode({});
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearchTerm, selectedCategory]);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  const filtered = useMemo(() => items, [items]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const resetPage = () => setCurrentPage(1);

  // Handlers
  const handleAddItem = async (newItemData: Omit<WarehouseItem, "id">) => {
    if (!canAddWarehouseItems) {
      showToast({
        type: "error",
        title: "ไม่มีสิทธิ์ดำเนินการ",
        message: "เฉพาะผู้ใช้ระดับ Superuser ขึ้นไปเท่านั้น",
      });
      return;
    }

    try {
      await warehouseService.createItem({
        name: newItemData.name,
        description: newItemData.description,
        quantity: newItemData.quantity,
        minimumQuantity: newItemData.minimumQuantity ?? 0,
        unit: newItemData.unit,
        category: newItemData.category,
      });
      resetPage();
      await loadItems();
      showToast({
        type: "success",
        title: "ส่งคำขอสำเร็จ",
        message: "ส่งคำขอเพิ่มเวชภัณฑ์ใหม่แล้ว รอการอนุมัติ",
      });
    } catch {
      alert("ไม่สามารถเพิ่มรายการเวชภัณฑ์ได้");
    }
  };

  const handleEditItem = async (updated: WarehouseItem) => {
    try {
      await warehouseService.updateItem(updated.id, {
        code: updated.code,
        name: updated.name,
        description: updated.description,
        minimumQuantity: updated.minimumQuantity ?? 0,
        unit: updated.unit,
        category: updated.category,
      });
      await loadItems();
      showToast({
        type: "success",
        title: "บันทึกสำเร็จ",
        message: "แก้ไขข้อมูลเวชภัณฑ์เรียบร้อยแล้ว",
      });
    } catch {
      alert("ไม่สามารถแก้ไขรายการเวชภัณฑ์ได้");
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      await warehouseService.deleteItem(itemId);
      resetPage();
      await loadItems();
      showToast({
        type: "success",
        title: "ส่งคำขอสำเร็จ",
        message: "ส่งคำขอนำรายการเวชภัณฑ์ออกแล้ว รอการอนุมัติ",
      });
    } catch {
      alert("ไม่สามารถลบรายการเวชภัณฑ์ได้");
    }
  };

  const setMode = (mode: InventoryAdjustMode) => {
    setAdjustMode((prevMode) => (prevMode === mode ? null : mode));
    setPendingAdjustments({});
  };

  const setAdjustmentValue = (itemId: string, value: number) => {
    setPendingAdjustments((prev) => ({ ...prev, [itemId]: Math.max(0, value) }));
  };

  const clearAdjustmentValue = (itemId: string) => {
    setPendingAdjustments((prev) => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
  };

  const applyAdjustmentToItem = async (itemId: string, amount: number) => {
    if (!adjustMode || amount <= 0) {
      return;
    }

    const currentItem = items.find((item) => item.id === itemId);
    if (!currentItem) {
      return;
    }

    if (adjustMode === "withdraw" && amount > currentItem.quantity) {
      return;
    }

    try {
      const updated = await warehouseService.adjustItem(itemId, {
        mode: adjustMode,
        quantity: amount,
      });

      setItems((prev) => prev.map((i) => (i.id === itemId ? updated : i)));
      clearAdjustmentValue(itemId);
      showToast({
        type: "success",
        title: "ส่งคำขอสำเร็จ",
        message:
          adjustMode === "restock"
            ? "ส่งคำขอเติมเวชภัณฑ์แล้ว รอการอนุมัติ"
            : "ส่งคำขอเบิกเวชภัณฑ์แล้ว รอการอนุมัติ",
      });
    } catch {
      alert(
        adjustMode === "restock"
          ? "ไม่สามารถเติมเวชภัณฑ์ได้"
          : "ไม่สามารถเบิกเวชภัณฑ์ได้"
      );
    }
  };

  const hasPendingAdjustments = Object.values(pendingAdjustments).some((value) => value > 0);

  const hasInvalidWithdraw =
    adjustMode === "withdraw" &&
    paginated.some((item) => (pendingAdjustments[item.id] ?? 0) > item.quantity);

  const saveAllAdjustments = async () => {
    if (!adjustMode) {
      return;
    }

    const entries = Object.entries(pendingAdjustments).filter(([, amount]) => amount > 0);
    if (entries.length === 0) {
      return;
    }

    try {
      const validEntries = entries.filter(([itemId, amount]) => {
        const item = items.find((candidate) => candidate.id === itemId);
        if (!item) {
          return false;
        }

        if (adjustMode === "withdraw" && amount > item.quantity) {
          return false;
        }

        return true;
      });

      await Promise.all(
        validEntries.map(([itemId, amount]) =>
          warehouseService.adjustItem(itemId, {
            mode: adjustMode,
            quantity: amount,
          })
        )
      );

      setPendingAdjustments({});
      await loadItems();
      showToast({
        type: "success",
        title: "ส่งคำขอสำเร็จ",
        message:
          adjustMode === "restock"
            ? `ส่งคำขอเติมเวชภัณฑ์ ${validEntries.length} รายการแล้ว รอการอนุมัติ`
            : `ส่งคำขอเบิกเวชภัณฑ์ ${validEntries.length} รายการแล้ว รอการอนุมัติ`,
      });
    } catch {
      alert(
        adjustMode === "restock"
          ? "ไม่สามารถบันทึกการเติมเวชภัณฑ์ได้"
          : "ไม่สามารถบันทึกการเบิกเวชภัณฑ์ได้"
      );
    }
  };

  const columnActionTitle =
    adjustMode === "restock" ? (
      <><span className="sm:hidden">เติม</span><span className="hidden sm:inline">เติมของ</span></>
    ) : adjustMode === "withdraw" ? (
      <><span className="sm:hidden">เบิก</span><span className="hidden sm:inline">เบิกของ</span></>
    ) : (
      <><span className="sm:hidden">แก้ไข</span><span className="hidden sm:inline">แก้ไขข้อมูล</span></>
    );

  const saveButtonLabel =
    adjustMode === "restock" ? "ส่งคำขอเติมของ" : "ส่งคำขอเบิกของ";

  const isSaveAllDisabled = !hasPendingAdjustments || (adjustMode === "withdraw" && hasInvalidWithdraw);

  const isWithdrawInvalid = (item: WarehouseItem) => {
    const amount = pendingAdjustments[item.id] ?? 0;
    return adjustMode === "withdraw" && amount > item.quantity;
  };

  const getPendingRequestCount = (item: WarehouseItem) => pendingRequestCountByItemCode[item.code] ?? 0;
  const getQuantityState = (item: WarehouseItem) => {
    const minimum = item.minimumQuantity ?? 0;
    const nearThreshold = minimum > 0 ? minimum + Math.max(1, Math.floor(minimum * 0.2)) : 0;
    const isBelow = minimum > 0 && item.quantity <= minimum;
    const isNear = minimum > 0 && !isBelow && item.quantity <= nearThreshold;

    if (isBelow) {
      return { className: "text-red-600", label: "ต่ำกว่าจำนวนขั้นต่ำ" };
    }

    if (isNear) {
      return { className: "text-amber-500", label: "ใกล้จำนวนขั้นต่ำ" };
    }

    return null;
  };

  return (
    <div className="w-full min-w-0 space-y-4 grid grid-cols-1">
      
      {/* Action Bar */}
      <div className="w-full min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-[rgba(204,204,204,0.14)] p-3 w-full min-w-0">
          
          {/* กลุ่มซ้าย: ค้นหา และ ตัวกรอง */}
          <div className="flex flex-row items-center gap-2 w-full md:w-auto flex-1 min-w-0">
            <div className="relative w-full md:max-w-[320px] min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="ค้นหา..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  resetPage();
                }}
                className="w-full pl-8 pr-2 py-2 border border-gray-400 bg-white shadow-sm rounded-lg placeholder:text-[#CCCCCC] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-body-small text-black min-w-0"
              />
            </div>

            <button
              onClick={() => setShowFilter((v) => !v)}
              className={`flex justify-center items-center gap-1 sm:gap-2 px-3 py-2 border rounded-lg text-xs sm:text-body-small font-medium transition-colors shrink-0 ${
                showFilter
                  ? "border-blue-500 text-blue-600 bg-blue-50"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
              style={showFilter ? undefined : { borderColor: "rgba(204, 204, 204, 1)", backgroundColor: "rgba(204, 204, 204, 0.16)" }}
            >
              <Filter className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
              <span className="sm:hidden">กรอง</span>
              <span className="hidden sm:inline">ตัวกรอง</span>
            </button>
          </div>

          {/* กลุ่มขวา: ปุ่ม เพิ่ม, เติม, เบิก */}
          <div className="flex flex-row items-center gap-1 sm:gap-2 w-full md:w-auto shrink-0 mt-1 md:mt-0 min-w-0">
            {canAddWarehouseItems && (
              <button
                onClick={() => setShowAdd(true)}
                className="flex-1 md:flex-none flex items-center justify-center gap-1 sm:gap-2 px-1 sm:px-4 py-2 bg-blue-500 text-white rounded-lg text-xs sm:text-body-small font-medium hover:bg-blue-600 transition-colors min-w-0"
              >
                <Plus className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                <span className="sm:hidden truncate">เพิ่ม</span>
                <span className="hidden sm:inline whitespace-nowrap">เพิ่มรายการเวชภัณฑ์</span>
              </button>
            )}

            <button
              onClick={() => setMode("restock")}
              className={`flex-1 md:flex-none flex items-center justify-center gap-1 sm:gap-2 px-1 sm:px-4 py-2 rounded-lg text-xs sm:text-body-small font-medium transition-colors min-w-0 ${
                adjustMode === "restock"
                  ? "bg-emerald-700 text-white"
                  : "bg-emerald-600 text-white hover:bg-emerald-700"
              }`}
            >
              <PackagePlus className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
              <span className="sm:hidden truncate">เติม</span>
              <span className="hidden sm:inline whitespace-nowrap">เติมของ</span>
            </button>
            
            <button
              onClick={() => setMode("withdraw")}
              className={`flex-1 md:flex-none flex items-center justify-center gap-1 sm:gap-2 px-1 sm:px-4 py-2 rounded-lg text-xs sm:text-body-small font-medium transition-colors min-w-0 ${
                adjustMode === "withdraw"
                  ? "bg-red-600 text-white"
                  : "bg-red-500 text-white hover:bg-red-600"
              }`}
            >
              <PackageMinus className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
              <span className="sm:hidden truncate">เบิก</span>
              <span className="hidden sm:inline whitespace-nowrap">เบิกของ</span>
            </button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilter && (
          <div className="mt-3 rounded-lg bg-[rgba(204,204,204,0.14)] p-3 flex flex-wrap items-center gap-2 w-full">
            <span className="text-xs sm:text-body-small text-gray-600 font-medium w-full sm:w-auto">ประเภทเวชภัณฑ์:</span>
            {(["all", "MED", "EQU", "CON"] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  resetPage();
                }}
                className={`px-3 py-1.5 rounded-full text-xs sm:text-body-small font-medium transition-colors whitespace-nowrap ${
                  selectedCategory === cat
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {cat === "all" ? "ทั้งหมด" : CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="w-full min-w-0">
        <div className="w-full overflow-hidden rounded-lg" style={{ border: '1px solid rgba(103, 103, 103, 0.48)' }}>
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr style={{ backgroundColor: 'rgba(239, 242, 247, 1)', borderBottom: '1px solid rgba(103, 103, 103, 0.48)' }}>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 w-32 whitespace-nowrap">
                    <span className="sm:hidden">รหัส</span>
                    <span className="hidden sm:inline">รหัสเวชภัณฑ์</span>
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 w-48 whitespace-nowrap">
                    <span className="sm:hidden">ชื่อ</span>
                    <span className="hidden sm:inline">ชื่อเวชภัณฑ์</span>
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700">
                    รายละเอียด
                  </th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-gray-700 w-24">
                    จำนวน
                  </th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-gray-700 w-24">
                    หน่วย
                  </th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-gray-700 w-28">
                    <span
                      style={{
                        color:
                          adjustMode === "restock"
                            ? "rgba(63, 140, 100, 1)"
                            : adjustMode === "withdraw"
                              ? "rgba(248, 63, 84, 1)"
                              : "rgba(126, 143, 164, 1)" }}
                    >
                      {columnActionTitle}
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 px-4 text-center">
                      <LoadingSpinner />
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={6} className="py-12 px-4 text-center text-sm text-red-500">
                      {error}
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 px-4 text-center">
                      <div className="text-sm text-gray-600">ไม่พบรายการเวชภัณฑ์</div>
                      <div className="text-xs text-gray-400 mt-1">ลองเปลี่ยนคำค้นหา หรือเพิ่มรายการเวชภัณฑ์ใหม่</div>
                    </td>
                  </tr>
                ) : (
                  paginated.map((item) => (
                    <tr
                      key={item.id}
                      className="bg-white hover:bg-gray-50 transition-colors align-middle"
                      style={{ borderBottom: '1px solid rgba(103, 103, 103, 0.48)' }}
                    >
                      <td className="py-3 px-4 text-xs sm:text-sm text-gray-700 font-medium">{item.code}</td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col w-max">
                          <span className="text-xs sm:text-sm text-gray-800 font-medium">{item.name}</span>
                          {getPendingRequestCount(item) > 0 ? (
                            <span className="mt-1 inline-flex w-fit rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-semibold text-yellow-700">
                              รออนุมัติ {getPendingRequestCount(item)} รายการ
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs sm:text-sm text-gray-500 max-w-[120px] sm:max-w-xs truncate">
                        {item.description}
                      </td>
                      <td className="py-3 px-4 text-xs sm:text-sm text-gray-700 text-center">
                        {(() => {
                          const quantityState = getQuantityState(item);

                          return (
                            <span className={`font-semibold ${quantityState?.className ?? "text-gray-700"}`} title={quantityState?.label}>
                              {item.quantity}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="py-3 px-4 text-xs sm:text-sm text-gray-700 text-center">{item.unit}</td>
                      <td className="py-3 px-4">
                        {adjustMode ? (
                          <div className="flex flex-col items-center gap-1">
                            <div className="flex items-center justify-center gap-2">
                              <input
                                type="number"
                                min={0}
                                value={pendingAdjustments[item.id] ?? 0}
                                onChange={(e) => setAdjustmentValue(item.id, Number(e.target.value || 0))}
                                className={`h-10 w-24 min-w-[80px] rounded-lg border bg-white px-3 text-center text-headline-6 font-medium text-gray-700 outline-none ${
                                  isWithdrawInvalid(item)
                                    ? "border-red-400 text-red-600"
                                    : "border-gray-300"
                                }`}
                              />

                              {(pendingAdjustments[item.id] ?? 0) > 0 ? (
                                <button
                                  type="button"
                                  onClick={() => applyAdjustmentToItem(item.id, pendingAdjustments[item.id] ?? 0)}
                                  disabled={isWithdrawInvalid(item)}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                                  title="ยืนยัน"
                                >
                                  <Check className="h-4 w-4" />
                                </button>
                              ) : null}
                            </div>

                            {isWithdrawInvalid(item) ? (
                              <p className="text-overline text-red-500">เบิกของเกินจำนวนที่มีในคลัง</p>
                            ) : null}
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => setEditItem(item)}
                              className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                              title="แก้ไข"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteItem(item)}
                              className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                              title="ลบ"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {adjustMode ? (
        <div className="flex justify-center pb-2">
          <button
            type="button"
            onClick={saveAllAdjustments}
            disabled={isSaveAllDisabled}
            className={`rounded-lg px-8 py-2 text-body-small font-semibold text-white transition ${
              isSaveAllDisabled
                ? "cursor-not-allowed bg-gray-300"
                : adjustMode === "restock"
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-red-500 hover:bg-red-600"
            }`}
          >
            {saveButtonLabel}
          </button>
        </div>
      ) : null}

      {/* Pagination */}
      <div className="px-4 py-4">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Modals */}
      {showAdd && canAddWarehouseItems && (
        <AddItemModal
          existingItems={items}
          onClose={() => setShowAdd(false)}
          onConfirm={handleAddItem}
        />
      )}
      {editItem && (
        <EditItemModal
          item={editItem}
          onClose={() => setEditItem(null)}
          onConfirm={handleEditItem}
        />
      )}
      {deleteItem && (
        <DeleteItemModal
          item={deleteItem}
          onClose={() => setDeleteItem(null)}
          onConfirm={handleDeleteItem}
        />
      )}
    </div>
  );
}