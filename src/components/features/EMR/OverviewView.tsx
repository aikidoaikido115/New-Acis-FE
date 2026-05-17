"use client";

import { useEffect, useMemo, useState } from "react";
import { DatePicker } from "@/components/ui/date-picker";
import { Dropdown } from "@/components/ui/dropdown";
import { intakeService } from "@/services/intake.service";
import { roomService } from "@/services/room.service";
import { VitalSignsTable } from "./tables/VitalSignsTable";
import { DoctorOrderTable } from "./tables/DoctorOrderTable";
import { NurseNoteTable } from "./tables/NurseNoteTable";
import { WoundCareTable } from "./tables/WoundCareTable";
import { RelativeNoteTable } from "./tables/RelativeNoteTable";
import { Skeleton, SkeletonTable } from "@/components/ui/skeleton";
import type { Room } from "@/types/room";
import type { IntakeLabel } from "@/types/intake";

type SubTab = "vital_signs" | "doctor_order" | "nurse_note" | "wound_care" | "relative_note";
type VitalSignStatus = "all" | "normal" | "abnormal";

export function OverviewView() {
  const [activeTab, setActiveTab] = useState<SubTab>("vital_signs");
  const [selectedFloor, setSelectedFloor] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState<VitalSignStatus>("all");
  const [selectedLabelId, setSelectedLabelId] = useState("all");
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [rooms, setRooms] = useState<Room[]>([]);
  const [intakeLabels, setIntakeLabels] = useState<IntakeLabel[]>([]);
  const [isLoadingFilters, setIsLoadingFilters] = useState(true);

  useEffect(() => {
    const loadFilterData = async () => {
      setIsLoadingFilters(true);
      try {
        const [roomData, labelData] = await Promise.all([roomService.getAll(), intakeService.getAllLabels()]);
        setRooms(roomData || []);
        setIntakeLabels(labelData || []);
      } catch {
        setRooms([]);
        setIntakeLabels([]);
      } finally {
        setIsLoadingFilters(false);
      }
    };

    void loadFilterData();
  }, []);

  const floorOptions = useMemo(() => {
    const uniqueFloors = Array.from(new Set((rooms || []).map((room) => Number(room.floor)).filter((value) => Number.isFinite(value))));
    return uniqueFloors.sort((a, b) => a - b);
  }, [rooms]);

  const selectedLabelIds = useMemo(() => {
    if (selectedLabelId === "all") {
      return [];
    }
    return [selectedLabelId];
  }, [selectedLabelId]);

  const tabs = [
    { id: "vital_signs" as SubTab, label: "สัญญาณชีพ" },
    { id: "doctor_order" as SubTab, label: "คำสั่งแพทย์" },
    { id: "nurse_note" as SubTab, label: "บันทึกพยาบาล" },
    { id: "wound_care" as SubTab, label: "ทำแผล" },
    { id: "relative_note" as SubTab, label: "บันทึกสำหรับญาติ" },
  ];

  return (
    <div className="space-y-4 w-full">
      {isLoadingFilters ? (
        <div className="space-y-4 w-full">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-10 w-28" />
              <Skeleton className="h-4 w-14" />
              <Skeleton className="h-10 w-28" />
              <Skeleton className="h-4 w-14" />
              <Skeleton className="h-10 w-28" />
            </div>
            <Skeleton className="h-10 w-[200px]" />
          </div>

          <div className="flex gap-2 rounded-full p-1 bg-gray-100 border border-gray-200 w-full">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-10 flex-1 rounded-full" />
            ))}
          </div>

          <SkeletonTable columns={4} rows={6} />
        </div>
      ) : (
        <>
      {/* Filters Row */}
      <div className="flex flex-wrap items-center justify-between gap-4 w-full">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-body-small text-gray-600">ชั้น</span>

            {/* Floor Dropdown */}
            <Dropdown
              options={[
                { value: "all", label: "ทุกชั้น" },
                ...floorOptions.map((floor) => ({
                  value: String(floor),
                  label: `ชั้น ${floor}`,
                })),
              ]}
              value={selectedFloor}
              onChange={(value) => setSelectedFloor(value)}
              placeholder="เลือกชั้น"
            />

            <span className="text-body-small text-gray-600">ประเภท</span>

            {/* Help Level Dropdown */}
            <Dropdown
              options={[
                { value: "all", label: "ทั้งหมด" },
                ...intakeLabels.map((label) => ({
                  value: label.label_id,
                  label: label.label_name,
                })),
              ]}
              value={selectedLabelId}
              onChange={(value) => setSelectedLabelId(value)}
              placeholder="เลือก"
            />

            <span className="text-body-small text-gray-600">สถานะ</span>

            {/* Status Dropdown */}
            <Dropdown
              options={[
                { value: "all", label: "ทั้งหมด" },
                { value: "normal", label: "ปกติ" },
                { value: "abnormal", label: "ต้องติดตาม" },
              ]}
              value={selectedStatus}
              onChange={(value) => setSelectedStatus(value as VitalSignStatus)}
              placeholder="เลือก"
            />
          </div>

          {/* Date Picker (เฉพาะ Vital Signs) ดันไปขวาสุดด้วย ml-auto */}
          {activeTab === "vital_signs" ? (
            <div className="w-[200px] ml-auto shrink-0">
              <DatePicker
                value={selectedDate}
                onChange={setSelectedDate}
                placeholder="เลือกวันที่"
                className="w-full"
              />
            </div>
          ) : null}
      </div>

      {/* Sub-tabs Navigation */}
      <div className="w-full">
        <div className="flex flex-nowrap overflow-x-auto bg-gray-100 rounded-full p-1 scrollbar-none w-full" style={{ border: '1px solid rgba(103, 103, 103, 0.48)' }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 shrink-0 px-4 sm:px-6 py-2.5 text-xs sm:text-body-small font-medium transition-all rounded-full whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-white text-gray-900 shadow-sm"
                    : "bg-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
        </div>
      </div>

      {/* Table Content */}
      <div className="w-full min-w-0">
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
        </>
      )}
    </div>
  );
}