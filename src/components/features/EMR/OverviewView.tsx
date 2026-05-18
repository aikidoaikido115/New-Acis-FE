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
    <div className="space-y-4 w-full min-w-0 ">
      
      <style>{`
        body, html, main, #__next, .layout-wrapper, footer {
          background-color: #ffffff !important;
        }
      `}</style>

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-row lg:items-center gap-4 w-full min-w-0 pb-2 border-b border-gray-100 mb-2">
            
            {/* ชั้น */}
            <div className="flex items-center gap-2 min-w-0 w-full lg:w-auto">
              <span className="text-body-small text-gray-600 font-medium shrink-0">ชั้น</span>
              <div className="flex-1 lg:w-[120px] min-w-0">
                <Dropdown
                  options={[
                    { value: "all", label: "ทุกชั้น" },
                    ...floorOptions.map((floor) => ({ value: String(floor), label: `ชั้น ${floor}` })),
                  ]}
                  value={selectedFloor}
                  onChange={(value) => setSelectedFloor(value)}
                  placeholder="ชั้น"
                />
              </div>
            </div>

            {/* ประเภท */}
            <div className="flex items-center gap-2 min-w-0 w-full lg:w-auto">
              <span className="text-body-small text-gray-600 font-medium shrink-0">ประเภท</span>
              <div className="flex-1 lg:w-[140px] min-w-0">
                <Dropdown
                  options={[
                    { value: "all", label: "ทั้งหมด" },
                    ...intakeLabels.map((label) => ({ value: label.label_id, label: label.label_name })),
                  ]}
                  value={selectedLabelId}
                  onChange={(value) => setSelectedLabelId(value)}
                  placeholder="เลือก"
                />
              </div>
            </div>

            {/* สถานะ */}
            <div className="flex items-center gap-2 min-w-0 w-full lg:w-auto">
              <span className="text-body-small text-gray-600 font-medium shrink-0">สถานะ</span>
              <div className="flex-1 lg:w-[140px] min-w-0">
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
            </div>

            {/* วันที่ */}
            {activeTab === "vital_signs" ? (
              <div className="flex items-center gap-2 min-w-0 w-full lg:w-auto lg:ml-auto">
                <div className="flex-1 lg:w-[180px] min-w-0">
                  <DatePicker
                    value={selectedDate}
                    onChange={setSelectedDate}
                    placeholder="เลือกวันที่"
                  />
                </div>
              </div>
            ) : null}
          </div>

          <div className="w-full overflow-x-auto scrollbar-none mb-2">
            <div className="flex w-max min-w-full bg-gray-100 rounded-full p-1" style={{ border: '1px solid rgba(103, 103, 103, 0.48)' }}>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 shrink-0 px-4 sm:px-6 py-2.5 max-sm:text-[10px] text-body-small font-medium transition-all rounded-full whitespace-nowrap ${
                    activeTab === tab.id
                      ? "bg-white text-gray-900 shadow-sm"
                      : "bg-transparent text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {tab.id === "relative_note" ? (
                    <>
                      <span className="hidden lg:inline">บันทึกสำหรับญาติ</span>
                      <span className="lg:hidden">บันทึกญาติ</span>
                    </>
                  ) : (
                    tab.label
                  )}
                </button>
              ))}
            </div>
          </div>

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