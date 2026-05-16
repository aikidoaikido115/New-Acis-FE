"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { InventoryTable } from "./InventoryTable";
import { TransactionHistoryTable } from "./TransactionHistoryTable";

type TabView = "inventory" | "history";

export function WarehouseView() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "history" ? "history" : "inventory";
  const [activeTab, setActiveTab] = useState<TabView>(initialTab);

  return (
    <div className="min-h-screen bg-gray-50 p-3 md:p-6 w-full overflow-x-hidden">
      {/* ใช้ grid grid-cols-1 ขังเนื้อหาทั้งหมดไม่ให้ทะลุ padding */}
      <div className="w-full min-w-0 grid grid-cols-1 space-y-4 md:space-y-6">
        
        {/* Header */}
        <div className="flex flex-row items-center justify-between gap-2 w-full min-w-0">
          <h1 className="text-headline-6 sm:text-headline-5 font-bold text-gray-800 shrink-0">ยาและเวชภัณฑ์</h1>

          {/* Top-Right Tab Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1 shrink-0" style={{ border: '1px solid rgba(103, 103, 103, 0.48)' }}>
            <button
              onClick={() => setActiveTab("inventory")}
              className={`px-3 sm:px-5 py-1.5 sm:py-2 rounded-md text-xs sm:text-body-small font-medium transition-colors ${
                activeTab === "inventory"
                  ? "bg-blue-500 text-white shadow-sm"
                  : "bg-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <span>รายการเวชภัณฑ์</span>
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`px-3 sm:px-5 py-1.5 sm:py-2 rounded-md text-xs sm:text-body-small font-medium transition-colors ${
                activeTab === "history"
                  ? "bg-blue-500 text-white shadow-sm"
                  : "bg-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <span>ประวัติการทำรายการ</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="w-full min-w-0">
          {activeTab === "inventory" ? (
            <InventoryTable />
          ) : (
            <TransactionHistoryTable />
          )}
        </div>
        
      </div>
    </div>
  );
}