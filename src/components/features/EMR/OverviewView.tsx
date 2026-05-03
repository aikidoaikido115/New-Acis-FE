"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import { intakeService } from "@/services/intake.service";
import { roomService } from "@/services/room.service";
import { VitalSignsTable } from "./tables/VitalSignsTable";
import { DoctorOrderTable } from "./tables/DoctorOrderTable";
import { NurseNoteTable } from "./tables/NurseNoteTable";
import { WoundCareTable } from "./tables/WoundCareTable";
import { RelativeNoteTable } from "./tables/RelativeNoteTable";
import type { Room } from "@/types/room";
import type { IntakeLabel } from "@/types/intake";

type SubTab = "vital_signs" | "doctor_order" | "nurse_note" | "wound_care" | "relative_note";
type VitalSignStatus = "all" | "normal" | "abnormal";
type HelpLevelFilter = "all" | "self" | "partial" | "bedridden";

function getHelpLevelLabelIds(labels: IntakeLabel[], helpLevel: HelpLevelFilter): string[] {
  if (helpLevel === "all") {
    return [];
  }

  if (helpLevel === "self") {
    return labels
      .filter((item) => item.label_name.includes("ช่วยเหลือตัวเองได้ทั้งหมด"))
      .map((item) => item.label_id);
  }

  if (helpLevel === "partial") {
    return labels
      .filter((item) => item.label_name.includes("ช่วยเหลือตัวเองได้บางส่วน"))
      .map((item) => item.label_id);
  }

  return labels
    .filter((item) => item.label_name.includes("ติดเตียง"))
    .map((item) => item.label_id);
}

export function OverviewView() {
  const [activeTab, setActiveTab] = useState<SubTab>("vital_signs");
  const [selectedFloor, setSelectedFloor] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState<VitalSignStatus>("all");
  const [selectedHelpLevel, setSelectedHelpLevel] = useState<HelpLevelFilter>("all");
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [rooms, setRooms] = useState<Room[]>([]);
  const [intakeLabels, setIntakeLabels] = useState<IntakeLabel[]>([]);

  useEffect(() => {
    const loadFilterData = async () => {
      try {
        const [roomData, labelData] = await Promise.all([roomService.getAll(), intakeService.getAllLabels()]);
        setRooms(roomData || []);
        setIntakeLabels(labelData || []);
      } catch {
        setRooms([]);
        setIntakeLabels([]);
      }
    };

    void loadFilterData();
  }, []);

  const floorOptions = useMemo(() => {
    const uniqueFloors = Array.from(new Set((rooms || []).map((room) => Number(room.floor)).filter((value) => Number.isFinite(value))));
    return uniqueFloors.sort((a, b) => a - b);
  }, [rooms]);

  const selectedLabelIds = useMemo(
    () => getHelpLevelLabelIds(intakeLabels, selectedHelpLevel),
    [intakeLabels, selectedHelpLevel]
  );

  const overviewDatePickerClassName =
    "w-[200px] [&>button]:w-full [&>button]:justify-between [&>button]:border-2 [&>button]:border-blue-500 [&>button]:hover:bg-blue-50";

  const tabs = [
    { id: "vital_signs" as SubTab, label: "สัญญาณชีพ" },
    { id: "doctor_order" as SubTab, label: "คำสั่งแพทย์" },
    { id: "nurse_note" as SubTab, label: "บันทึกพยาบาล" },
    { id: "wound_care" as SubTab, label: "ทำแผล" },
    { id: "relative_note" as SubTab, label: "บันทึกสำหรับญาติ" },
  ];

  return (
    <div className="space-y-4">
      {/* Filters Row */}
      <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-body-small text-gray-600">ชั้น</span>

            {/* Floor Dropdown */}
            <div className="relative">
              <select
                value={selectedFloor}
                onChange={(e) => setSelectedFloor(e.target.value)}
                className="appearance-none pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-body-small bg-white cursor-pointer text-black"
              >
                <option value="all">ทุกชั้น</option>
                {floorOptions.map((floor) => (
                  <option key={floor} value={String(floor)}>
                    ชั้น {floor}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            <span className="text-body-small text-gray-600">การช่วยเหลือตัวเอง</span>

            {/* Help Level Dropdown */}
            <div className="relative">
              <select
                value={selectedHelpLevel}
                onChange={(e) => setSelectedHelpLevel(e.target.value as HelpLevelFilter)}
                className="appearance-none pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-body-small bg-white cursor-pointer text-black"
              >
                <option value="all">ทั้งหมด</option>
                <option value="self">ช่วยเหลือตัวเองได้</option>
                <option value="partial">ต้องการความช่วยเหลือ</option>
                <option value="bedridden">ติดเตียง</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            <span className="text-body-small text-gray-600">สถานะ</span>

            {/* Status Dropdown */}
            <div className="relative">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as VitalSignStatus)}
                className="appearance-none pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-body-small bg-white cursor-pointer text-black"
              >
                <option value="all">ทั้งหมด</option>
                <option value="normal">ปกติ</option>
                <option value="abnormal">ต้องติดตาม</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Date Picker (เฉพาะ Vital Signs) */}
          {activeTab === "vital_signs" ? (
            <DatePicker
              value={selectedDate}
              onChange={setSelectedDate}
              placeholder="เลือกวันที่"
              className={overviewDatePickerClassName}
            />
          ) : null}
      </div>

      {/* Sub-tabs Navigation */}
      <div className="flex bg-gray-100 rounded-full p-1" style={{ border: '1px solid rgba(103, 103, 103, 0.48)' }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-6 py-2.5 text-body-small font-medium transition-all rounded-full ${
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
        {activeTab === "vital_signs" && (
          <VitalSignsTable
            selectedFloor={selectedFloor}
            selectedStatus={selectedStatus}
            selectedLabelIds={selectedLabelIds}
            selectedDate={selectedDate}
          />
        )}
        {activeTab === "doctor_order" && <DoctorOrderTable />}
        {activeTab === "nurse_note" && <NurseNoteTable />}
        {activeTab === "wound_care" && <WoundCareTable />}
        {activeTab === "relative_note" && <RelativeNoteTable />}
      </div>
    </div>
  );
}
