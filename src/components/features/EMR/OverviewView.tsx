"use client";

import { useState } from "react";
import { ChevronDown, Calendar } from "lucide-react";
import { VitalSignsTable } from "./tables/VitalSignsTable";
import { DoctorOrderTable } from "./tables/DoctorOrderTable";
import { NurseNoteTable } from "./tables/NurseNoteTable";
import { WoundCareTable } from "./tables/WoundCareTable";
import { RelativeNoteTable } from "./tables/RelativeNoteTable";

type SubTab = "vital_signs" | "doctor_order" | "nurse_note" | "wound_care" | "relative_note";

export function OverviewView() {
  const [activeTab, setActiveTab] = useState<SubTab>("vital_signs");
  const [selectedFloor, setSelectedFloor] = useState("ทุกชั้น");
  const [selectedStatus, setSelectedStatus] = useState("ทุกสถานะ");
  const [selectedHelpLevel, setSelectedHelpLevel] = useState("ทุกช่วย");
  const selectedDate = "31/12/2568"; // Fixed date for now, can be made dynamic later

  const tabs = [
    { id: "vital_signs" as SubTab, label: "สัญญาณชีพ" },
    { id: "doctor_order" as SubTab, label: "คำสั่งแพทย์" },
    { id: "nurse_note" as SubTab, label: "บันทึกพยาบาล" },
    { id: "wound_care" as SubTab, label: "ทำแผล" },
    { id: "relative_note" as SubTab, label: "โน๊ตญาติ" },
  ];

  return (
    <div className="space-y-4">
      {/* Filters Row */}
      <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">ชั้น</span>

            {/* Floor Dropdown */}
            <div className="relative">
              <select
                value={selectedFloor}
                onChange={(e) => setSelectedFloor(e.target.value)}
                className="appearance-none pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white cursor-pointer text-black"
              >
                <option>ทุกชั้น</option>
                <option>ชั้น 1</option>
                <option>ชั้น 2</option>
                <option>ชั้น 3</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            <span className="text-sm text-gray-600">การช่วยเหลือตัวเอง</span>

            {/* Help Level Dropdown */}
            <div className="relative">
              <select
                value={selectedHelpLevel}
                onChange={(e) => setSelectedHelpLevel(e.target.value)}
                className="appearance-none pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white cursor-pointer text-black"
              >
                <option>ทุกช่วย</option>
                <option>ช่วยเหลือตัวเองได้</option>
                <option>ต้องการความช่วยเหลือ</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            <span className="text-sm text-gray-600">สถานะ</span>

            {/* Status Dropdown */}
            <div className="relative">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="appearance-none pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white cursor-pointer text-black"
              >
                <option>ทุกสถานะ</option>
                <option>ปกติ</option>
                <option>ต้องติดตาม</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Date Picker */}
          <button className="flex items-center gap-2 px-4 py-2 border-2 border-blue-500 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors">
            <span className="text-sm font-medium">{selectedDate}</span>
            <Calendar className="w-4 h-4" />
          </button>
      </div>

      {/* Sub-tabs Navigation */}
      <div className="flex bg-gray-100 rounded-full p-1" style={{ border: '1px solid rgba(103, 103, 103, 0.48)' }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-6 py-2.5 text-sm font-medium transition-all rounded-full ${
                activeTab === tab.id
                  ? "bg-white text-gray-900 shadow-sm"
                  : "bg-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
      </div>

      {/* Table Content */}
      <div>
        {activeTab === "vital_signs" && <VitalSignsTable />}
        {activeTab === "doctor_order" && <DoctorOrderTable />}
        {activeTab === "nurse_note" && <NurseNoteTable />}
        {activeTab === "wound_care" && <WoundCareTable />}
        {activeTab === "relative_note" && <RelativeNoteTable />}
      </div>
    </div>
  );
}
