"use client";

import { useState } from "react";
import { InventoryTable } from "./InventoryTable";
import { TransactionHistoryTable } from "./TransactionHistoryTable";

type TabView = "inventory" | "history";

export function WarehouseView() {
  const [activeTab, setActiveTab] = useState<TabView>("inventory");

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">สินค้าคงคลัง</h1>

          {/* Top-Right Tab Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1" style={{ border: '1px solid rgba(103, 103, 103, 0.48)' }}>
            <button
              onClick={() => setActiveTab("inventory")}
              className={`px-5 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "inventory"
                  ? "bg-blue-500 text-white shadow-sm"
                  : "bg-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              รายการสินค้า
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`px-5 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "history"
                  ? "bg-blue-500 text-white shadow-sm"
                  : "bg-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              ประวัติการทำรายการ
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "inventory" ? (
          <InventoryTable />
        ) : (
          <TransactionHistoryTable />
        )}
      </div>
    </div>
  );
}
