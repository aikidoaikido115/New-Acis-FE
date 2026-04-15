"use client";

import { useState, useMemo } from "react";
import { Search, Filter, Plus, PackagePlus, PackageMinus, Edit, Trash2, Check } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import {
  AddItemModal,
  EditItemModal,
  DeleteItemModal,
} from "./modals";
import {
  mockWarehouseItems,
  ITEMS_PER_PAGE,
  type WarehouseItem,
  type ItemCategory,
} from "./warehouse.mock";

const CATEGORY_LABELS: Record<ItemCategory, string> = {
  MED: "ยาและสารละลาย",
  EQU: "อุปกรณ์การแพทย์",
  CON: "สิ่งอุปโภค",
};

type InventoryAdjustMode = "restock" | "withdraw";

export function InventoryTable() {
  const [items, setItems] = useState<WarehouseItem[]>(mockWarehouseItems);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"all" | ItemCategory>("all");
  const [showFilter, setShowFilter] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [adjustMode, setAdjustMode] = useState<InventoryAdjustMode | null>(null);
  const [pendingAdjustments, setPendingAdjustments] = useState<Record<string, number>>({});

  // Modals
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState<WarehouseItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<WarehouseItem | null>(null);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        selectedCategory === "all" || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [items, searchTerm, selectedCategory]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const resetPage = () => setCurrentPage(1);

  // Handlers
  const handleAddItem = (newItemData: Omit<WarehouseItem, "id">) => {
    const newItem: WarehouseItem = {
      ...newItemData,
      id: String(Date.now()),
    };
    setItems((prev) => [newItem, ...prev]);
    resetPage();
  };

  const handleEditItem = (updated: WarehouseItem) => {
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  };

  const handleDeleteItem = (itemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
    resetPage();
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

  const applyAdjustmentToItem = (itemId: string, amount: number) => {
    if (!adjustMode || amount <= 0) {
      return;
    }

    setItems((prev) =>
      prev.map((i) =>
        i.id !== itemId
          ? i
          : {
              ...i,
              quantity:
                adjustMode === "restock"
                  ? i.quantity + amount
                  : Math.max(0, i.quantity - amount),
            }
      )
    );
    clearAdjustmentValue(itemId);
  };

  const hasPendingAdjustments = Object.values(pendingAdjustments).some((value) => value > 0);

  const hasInvalidWithdraw =
    adjustMode === "withdraw" &&
    paginated.some((item) => (pendingAdjustments[item.id] ?? 0) > item.quantity);

  const saveAllAdjustments = () => {
    if (!adjustMode) {
      return;
    }

    setItems((prev) =>
      prev.map((item) => {
        const amount = pendingAdjustments[item.id] ?? 0;
        if (amount <= 0) {
          return item;
        }

        if (adjustMode === "withdraw" && amount > item.quantity) {
          return item;
        }

        return {
          ...item,
          quantity:
            adjustMode === "restock"
              ? item.quantity + amount
              : Math.max(0, item.quantity - amount),
        };
      })
    );
    setPendingAdjustments({});
  };

  const columnActionTitle =
    adjustMode === "restock"
      ? "เติมของ"
      : adjustMode === "withdraw"
        ? "เบิกของ"
        : "แก้ไขข้อมูล";

  const saveButtonLabel =
    adjustMode === "restock" ? "บันทึกการเติมของ" : "บันทึกการเบิกของ";

  const isSaveAllDisabled = !hasPendingAdjustments || (adjustMode === "withdraw" && hasInvalidWithdraw);

  const isWithdrawInvalid = (item: WarehouseItem) => {
    const amount = pendingAdjustments[item.id] ?? 0;
    return adjustMode === "withdraw" && amount > item.quantity;
  };

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
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-[rgba(204,204,204,0.16)]"
              style={{ borderColor: "rgba(204, 204, 204, 1)" }}
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilter((v) => !v)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${
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
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            เพิ่มรายการสินค้า
          </button>
          <button
            onClick={() => setMode("restock")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
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
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
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
            <span className="text-sm text-gray-600 font-medium">ประเภทสินค้า:</span>
            {(["all", "MED", "EQU", "CON"] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  resetPage();
                }}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
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
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 w-32">
                  รหัสสินค้า
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 w-48">
                  ชื่อสินค้า
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  รายละเอียด
                </th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 w-24">
                  จำนวน
                </th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 w-24">
                  หน่วย
                </th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 w-28">
                  <span
                    style={{
                      color:
                        adjustMode === "restock"
                          ? "rgba(63, 140, 100, 1)"
                          : adjustMode === "withdraw"
                            ? "rgba(248, 63, 84, 1)"
                            : "rgba(126, 143, 164, 1)",
                    }}
                  >
                    {columnActionTitle}
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400 text-sm">
                    ไม่พบรายการสินค้า
                  </td>
                </tr>
              ) : (
                paginated.map((item) => (
                  <tr
                    key={item.id}
                    className="bg-white hover:bg-gray-50 transition-colors align-middle"
                    style={{ borderBottom: '1px solid rgba(103, 103, 103, 0.48)' }}
                  >
                    <td className="py-3 px-4 text-sm text-gray-700 font-medium">{item.code}</td>
                    <td className="py-3 px-4 text-sm text-gray-800 font-medium">{item.name}</td>
                    <td className="py-3 px-4 text-sm text-gray-500 max-w-xs truncate">
                      {item.description}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700 text-center">{item.quantity}</td>
                    <td className="py-3 px-4 text-sm text-gray-700 text-center">{item.unit}</td>
                    <td className="py-3 px-4">
                      {adjustMode ? (
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex items-center justify-center gap-2">
                            <input
                              type="number"
                              min={0}
                              value={pendingAdjustments[item.id] ?? 0}
                              onChange={(e) => setAdjustmentValue(item.id, Number(e.target.value || 0))}
                              className={`h-10 w-34 rounded-lg border bg-white px-3 text-center text-[20px] font-medium text-gray-700 outline-none ${
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
                            <p className="text-xs text-red-500">เบิกของเกินจำนวนที่มีในคลัง</p>
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
            className={`rounded-lg px-8 py-2 text-sm font-semibold text-white transition ${
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
