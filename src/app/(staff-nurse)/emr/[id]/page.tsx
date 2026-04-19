"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Calendar, ArrowLeft, AlertTriangle, Stethoscope, ChevronDown } from "lucide-react";
import { VitalSignsDetailTable } from "@/components/features/EMR/detail/VitalSignsDetailTable";
import { GraphView } from "@/components/features/EMR/detail/GraphView";
import { DoctorOrderDetailTable } from "@/components/features/EMR/detail/DoctorOrderDetailTable";
import { NurseNoteDetailTable } from "@/components/features/EMR/detail/NurseNoteDetailTable";
import { WoundCareDetailTable } from "@/components/features/EMR/detail/WoundCareDetailTable";
import { RelativeNoteDetailTable } from "@/components/features/EMR/detail/RelativeNoteDetailTable";
import { residentService } from "@/services/resident.service";
import { roomService } from "@/services/room.service";
import apiClient, { ApiResponse } from "@/lib/axios.ts/api-client";
import type { Resident } from "@/types/resident";
import type { Room } from "@/types/room";

interface AllergyItem {
  allergy_id?: string;
  drug_allergy_id?: string;
  allergy_name: string;
  note_text?: string | null;
}

type SubTab = "vital_signs" | "graph" | "doctor_order" | "nurse_note" | "wound_care" | "relative_note";

export default function PatientDetailPage() {
  const params = useParams<{ id: string }>();
  const residentId = params?.id || "";
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<SubTab>("vital_signs");
  const [resident, setResident] = useState<Resident | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!residentId) {
        setError("ไม่พบรหัสผู้พัก");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const residentData = await residentService.getById(residentId);
        setResident(residentData);

        const roomId = residentData.room_id;
        if (roomId) {
          const roomData = await roomService.getById(roomId);
          setRoom(roomData);
        }

        const [foodAllergyRes, drugAllergyRes] = await Promise.all([
          apiClient.get<ApiResponse<AllergyItem[]>>(`/api/emr/allergies?resident_id=${encodeURIComponent(residentId)}`).catch(() => null),
          apiClient.get<ApiResponse<AllergyItem[]>>(`/api/emr/drug-allergies?resident_id=${encodeURIComponent(residentId)}`).catch(() => null),
        ]);

        const combined = [
          ...(foodAllergyRes?.data.result || []),
          ...(drugAllergyRes?.data.result || []),
        ]
          .map((item: any) => item?.allergy?.allergy_name || item?.drug_allergy?.allergy_name || item?.allergy_name)
          .filter(Boolean);

        setAllergies(Array.from(new Set(combined)));
      } catch {
        setError("ไม่สามารถโหลดข้อมูลผู้พักได้");
      } finally {
        setIsLoading(false);
      }
    };

    void loadData();
  }, [residentId]);

  const selectedDate = new Date().toLocaleDateString("th-TH");

  const residentName = useMemo(() => {
    if (!resident) return "-";
    return `${resident.first_name || ""} ${resident.last_name || ""}`.trim() || "-";
  }, [resident]);

  const roomDisplay = useMemo(() => {
    if (!room) return "ไม่ระบุห้อง";
    return `ห้อง ${room.room_number} ชั้น ${room.floor}`;
  }, [room]);

  const chronicDiseases = useMemo(() => {
    if (!resident?.pre_existing_conditions) return [];
    return resident.pre_existing_conditions
      .split(/[;,]/)
      .map((text) => text.trim())
      .filter(Boolean);
  }, [resident]);

  const surgicalHistoryItems = useMemo(() => {
    if (!resident?.surgical_history) return [];
    return resident.surgical_history
      .split(/[;,]/)
      .map((text) => text.trim())
      .filter(Boolean);
  }, [resident]);

  const statusText = useMemo(() => {
    const labelName = resident?.resident_labels
      ?.map((label) => label.intake_label?.label_name || "")
      .find((name) => name.includes("ช่วยเหลือตัวเอง") || name === "ติดเตียง")
      ?.trim();
    if (labelName === "ช่วยเหลือตัวเองได้ทั้งหมด") return "ช่วยเหลือตัวเองได้";
    if (labelName === "ช่วยเหลือตัวเองได้บางส่วน") return "ต้องการความช่วยเหลือ";
    if (labelName === "ติดเตียง") return "ติดเตียง";
    return resident?.status || "-";
  }, [resident]);

  const tabs = [
    { id: "vital_signs" as SubTab, label: "สัญญาณชีพ" },
    { id: "graph" as SubTab, label: "กราฟ" },
    { id: "doctor_order" as SubTab, label: "คำสั่งแพทย์" },
    { id: "nurse_note" as SubTab, label: "บันทึกพยาบาล" },
    { id: "wound_care" as SubTab, label: "ทำแผล" },
    { id: "relative_note" as SubTab, label: "บันทึกสำหรับญาติ" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-screen-2xl mx-auto space-y-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-blue-500 hover:text-blue-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-body-small font-medium">ย้อนกลับ</span>
        </button>

        <div className="flex items-center justify-between">
          <h1 className="text-headline-5 font-bold text-gray-800">เวชระเบียน</h1>

          <div className="flex items-center gap-2 px-4 py-2 border-2 border-blue-500 rounded-lg bg-white">
            <span className="text-body-small font-medium text-blue-500">{selectedDate}</span>
            <Calendar className="w-4 h-4 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 relative">
          {isLoading ? (
            <div className="py-8 text-center text-sm text-gray-500">กำลังโหลดข้อมูล...</div>
          ) : error ? (
            <div className="py-8 text-center text-sm text-red-500">{error}</div>
          ) : (
          <div className="flex flex-row items-start gap-6">
            <div className="w-24 h-24 rounded-full border-4 border-blue-400 bg-linear-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-headline-4 font-bold shrink-0">
              {residentName.charAt(0)}
            </div>

            <div className="flex flex-col gap-4 flex-1">
              <div>
                <h2 className="text-headline-6 font-bold text-gray-800">{residentName}</h2>
                <p className="text-body-small text-gray-500">{roomDisplay}</p>
              </div>

              {allergies.length > 0 && (
                <div>
                  <div className="flex items-center gap-1 mb-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span className="text-body-small font-medium text-red-600">แพ้ยา/อาหาร</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {allergies.map((allergy, index) => (
                      <span key={index} className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-body-small font-medium">
                        {allergy}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-4 flex-1">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-body-large">✂️</span>
                  <span className="text-body-small font-medium text-gray-700">ประวัติการผ่าตัด</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {surgicalHistoryItems.length > 0 ? surgicalHistoryItems.map((surgery, index) => (
                    <span key={index} className="px-3 py-1 bg-transparent border border-green-500 text-green-600 rounded-full text-body-small">
                      {surgery}
                    </span>
                  )) : <span className="text-body-small text-gray-500">ไม่มีข้อมูล</span>}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Stethoscope className="w-4 h-4 text-gray-700" />
                  <span className="text-body-small font-medium text-gray-700">โรคประจำตัว</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {chronicDiseases.length > 0 ? chronicDiseases.map((disease, index) => (
                    <span key={index} className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-body-small font-medium">
                      {disease}
                    </span>
                  )) : <span className="text-body-small text-gray-500">ไม่มีข้อมูล</span>}
                </div>
              </div>
            </div>

            <div className="absolute top-4 right-4">
              <button className="flex items-center gap-2 bg-orange-100 text-orange-600 rounded-full px-3 py-1 text-body-small font-medium hover:bg-orange-200 transition-colors">
                <span>{statusText}</span>
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>
          )}
        </div>

        <div className="flex bg-gray-100 rounded-full p-1" style={{ border: "1px solid rgba(103, 103, 103, 0.48)" }}>
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

        <div>
          {activeTab === "vital_signs" && <VitalSignsDetailTable patientId={residentId} />}
          {activeTab === "graph" && <GraphView patientId={residentId} />}
          {activeTab === "doctor_order" && <DoctorOrderDetailTable patientId={residentId} />}
          {activeTab === "nurse_note" && <NurseNoteDetailTable patientId={residentId} />}
          {activeTab === "wound_care" && <WoundCareDetailTable patientId={residentId} />}
          {activeTab === "relative_note" && <RelativeNoteDetailTable patientId={residentId} />}
        </div>
      </div>
    </div>
  );
}
