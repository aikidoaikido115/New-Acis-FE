"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, Filter, Plus, PackagePlus, PackageMinus, Edit, Trash2, Check } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { useToast } from "@/components/ui/toast";
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

export function InventoryTable() {
  const { showToast } = useToast();
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
      setError("ไม่สามารถโหลดรายการสินค้าได้");
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
        message: "ส่งคำขอเพิ่มสินค้าใหม่แล้ว รอการอนุมัติ",
      });
    } catch {
      alert("ไม่สามารถเพิ่มรายการสินค้าได้");
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
        message: "แก้ไขข้อมูลสินค้าเรียบร้อยแล้ว",
      });
    } catch {
      alert("ไม่สามารถแก้ไขรายการสินค้าได้");
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
        message: "ส่งคำขอนำรายการสินค้าออกแล้ว รอการอนุมัติ",
      });
    } catch {
      alert("ไม่สามารถลบรายการสินค้าได้");
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
            ? "ส่งคำขอเติมสินค้าแล้ว รอการอนุมัติ"
            : "ส่งคำขอเบิกสินค้าแล้ว รอการอนุมัติ",
      });
    } catch {
      alert(
        adjustMode === "restock"
          ? "ไม่สามารถเติมสินค้าได้"
          : "ไม่สามารถเบิกสินค้าได้"
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
      for (const [itemId, amount] of entries) {
        const item = items.find((candidate) => candidate.id === itemId);
        if (!item) {
          continue;
        }

        if (adjustMode === "withdraw" && amount > item.quantity) {
          continue;
        }

        await warehouseService.adjustItem(itemId, {
          mode: adjustMode,
          quantity: amount,
        });
      }

      setPendingAdjustments({});
      await loadItems();
      showToast({
        type: "success",
        title: "ส่งคำขอสำเร็จ",
        message:
          adjustMode === "restock"
            ? `ส่งคำขอเติมสินค้า ${entries.length} รายการแล้ว รอการอนุมัติ`
            : `ส่งคำขอเบิกสินค้า ${entries.length} รายการแล้ว รอการอนุมัติ`,
      });
    } catch {
      alert(
        adjustMode === "restock"
          ? "ไม่สามารถบันทึกการเติมสินค้าได้"
          : "ไม่สามารถบันทึกการเบิกสินค้าได้"
      );
    }
  };

  const columnActionTitle =
    adjustMode === "restock"
      ? "เติมของ"
      : adjustMode === "withdraw"
        ? "เบิกของ"
        : "แก้ไขข้อมูล";

  const saveButtonLabel =
    adjustMode === "restock" ? "ส่งคำขอเติมของ" : "ส่งคำขอเบิกของ";

  const isSaveAllDisabled = !hasPendingAdjustments || (adjustMode === "withdraw" && hasInvalidWithdraw);

  const isWithdrawInvalid = (item: WarehouseItem) => {
    const amount = pendingAdjustments[item.id] ?? 0;
    return adjustMode === "withdraw" && amount > item.quantity;
  };

  const getPendingRequestCount = (item: WarehouseItem) => pendingRequestCountByItemCode[item.code] ?? 0;

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div>
        <div className="flex flex-wrap items-center gap-3 rounded-lg bg-[rgba(204,204,204,0.14)] p-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหาสินค้า..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                resetPage();
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-400 bg-white shadow-sm rounded-lg placeholder:text-[#CCCCCC] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-body-small text-black"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilter((v) => !v)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-body-small font-medium transition-colors ${
              showFilter
                ? "border-blue-500 text-blue-600 bg-blue-50"
                : "text-gray-700 hover:bg-gray-50"
            }`}
            style={showFilter ? undefined : { borderColor: "rgba(204, 204, 204, 1)", backgroundColor: "rgba(204, 204, 204, 0.16)" }}
          >
            <Filter className="w-4 h-4" />
            ตัวกรอง
          </button>

          <div className="flex-1" />

          {/* Action Buttons */}
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg text-body-small font-medium hover:bg-blue-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            เพิ่มรายการสินค้า
          </button>
          <button
            onClick={() => setMode("restock")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-body-small font-medium transition-colors ${
              adjustMode === "restock"
                ? "bg-emerald-700 text-white"
                : "bg-emerald-600 text-white hover:bg-emerald-700"
            }`}
          >
            <PackagePlus className="w-4 h-4" />
            เติมของ
          </button>
          <button
            onClick={() => setMode("withdraw")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-body-small font-medium transition-colors ${
              adjustMode === "withdraw"
                ? "bg-red-600 text-white"
                : "bg-red-500 text-white hover:bg-red-600"
            }`}
          >
            <PackageMinus className="w-4 h-4" />
            เบิกของ
          </button>
        </div>

        {/* Filter Panel */}
        {showFilter && (
          <div className="mt-4 rounded-lg bg-[rgba(204,204,204,0.14)] p-3 flex flex-wrap items-center gap-3">
            <span className="text-body-small text-gray-600 font-medium">ประเภทสินค้า:</span>
            {(["all", "MED", "EQU", "CON"] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  resetPage();
                }}
                className={`px-3 py-1.5 rounded-full text-body-small font-medium transition-colors ${
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

      {/* Table */}
      <div className="overflow-hidden rounded-lg" style={{ border: '1px solid rgba(103, 103, 103, 0.48)' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: 'rgba(239, 242, 247, 1)', borderBottom: '1px solid rgba(103, 103, 103, 0.48)' }}>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 w-32">
                  รหัสสินค้า
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 w-48">
                  ชื่อสินค้า
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
                  <td colSpan={6} className="py-12 px-4 text-center text-sm text-gray-500">
                    กำลังโหลดข้อมูล...
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
                    <div className="text-sm text-gray-600">ไม่พบรายการสินค้า</div>
                    <div className="text-xs text-gray-400 mt-1">ลองเปลี่ยนคำค้นหา หรือเพิ่มรายการสินค้าใหม่</div>
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
                      <div className="flex flex-col">
                        <span className="text-xs sm:text-sm text-gray-800 font-medium">{item.name}</span>
                        {getPendingRequestCount(item) > 0 ? (
                          <span className="mt-1 inline-flex w-fit rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-semibold text-yellow-700">
                            รออนุมัติ {getPendingRequestCount(item)} รายการ
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs sm:text-sm text-gray-500 max-w-xs truncate">
                      {item.description}
                    </td>
                    <td className="py-3 px-4 text-xs sm:text-sm text-gray-700 text-center">{item.quantity}</td>
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
                              className={`h-10 w-34 rounded-lg border bg-white px-3 text-center text-headline-6 font-medium text-gray-700 outline-none ${
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
      {showAdd && (
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
