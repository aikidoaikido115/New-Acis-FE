"use client";

import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, AlertTriangle, Stethoscope } from "lucide-react";
import { VitalSignsDetailTable } from "../../../../components/features/EMR/detail/VitalSignsDetailTable";
import { GraphView } from "@/components/features/EMR/detail/GraphView";
import { DoctorOrderDetailTable } from "@/components/features/EMR/detail/DoctorOrderDetailTable";
import { NurseNoteDetailTable } from "@/components/features/EMR/detail/NurseNoteDetailTable";
import { WoundCareDetailTable } from "@/components/features/EMR/detail/WoundCareDetailTable";
import { RelativeNoteDetailTable } from "@/components/features/EMR/detail/RelativeNoteDetailTable";
import { DatePicker } from "@/components/ui/date-picker";
import { residentService } from "@/services/resident.service";
import { roomService } from "@/services/room.service";
import { intakeService } from "@/services/intake.service";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import apiClient, { ApiResponse } from "@/lib/axios.ts/api-client";
import type { Resident } from "@/types/resident";
import type { Room } from "@/types/room";
import type { IntakeLabel, ResidentLabel } from "@/types/intake";

interface AllergyItem {
  allergy_id?: string;
  drug_allergy_id?: string;
  allergy_name?: string;
  drug_allergy?: { allergy_name?: string };
  allergy?: { allergy_name?: string };
  note_text?: string | null;
}

type SubTab = "vital_signs" | "graph" | "doctor_order" | "nurse_note" | "wound_care" | "relative_note";

const splitTextList = (value?: string | null) => {
  if (!value) return [];

  return value
    .replace(/\r\n/g, "\n")
    .split(/[\n,;]+/)
    .map((text) => text.trim())
    .filter(Boolean);
};

export default function PatientDetailPage() {
  const params = useParams<{ id: string }>();
  const residentId = params?.id || "";
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<SubTab>("vital_signs");
  const [resident, setResident] = useState<Resident | null>(null);
  const [residentLabels, setResidentLabels] = useState<ResidentLabel[]>([]);
  const [intakeLabels, setIntakeLabels] = useState<IntakeLabel[]>([]);
  const [room, setRoom] = useState<Room | null>(null);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

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
        const [residentData, labelMaster] = await Promise.all([
          residentService.getById(residentId),
          intakeService.getAllLabels().catch(() => []),
        ]);
        setResident(residentData);
        setIntakeLabels(labelMaster || []);
        const latestLabels = await intakeService.getLabelsByResident(residentId).catch(
          () => residentData.resident_labels || []
        );
        setResidentLabels(latestLabels);

        const roomId = residentData.room_id;
        if (roomId) {
          const roomData = await roomService.getById(roomId);
          setRoom(roomData);
        }

        const drugAllergyRes = await apiClient
          .get<ApiResponse<AllergyItem[]>>(`/api/emr/drug-allergies?resident_id=${encodeURIComponent(residentId)}`)
          .catch(() => null);

        const drugOnly = ((drugAllergyRes?.data.result || []) as AllergyItem[])
          .map((item) => item?.drug_allergy?.allergy_name || item?.allergy_name || item?.allergy?.allergy_name)
          .filter((v): v is string => Boolean(v));

        setAllergies(Array.from(new Set(drugOnly)));
      } catch {
        setError("ไม่สามารถโหลดข้อมูลผู้พักได้");
        setResidentLabels([]);
        setIntakeLabels([]);
      } finally {
        setIsLoading(false);
      }
    };

    void loadData();
  }, [residentId]);

  const residentName = useMemo(() => {
    if (!resident) return "-";
    return `${resident.first_name || ""} ${resident.last_name || ""}`.trim() || "-";
  }, [resident]);

  const roomDisplay = useMemo(() => {
    if (!room) return "ไม่ระบุห้อง";
    return `ห้อง ${room.room_number} ชั้น ${room.floor}`;
  }, [room]);

  const chronicDiseases = useMemo(() => {
    return splitTextList(resident?.pre_existing_conditions);
  }, [resident]);

  const surgicalHistoryItems = useMemo(() => {
    return splitTextList(resident?.surgical_history);
  }, [resident]);

  const statusText = useMemo(() => {
    const intakeById = new Map((intakeLabels || []).map((label) => [String(label.label_id), label.label_name] as const));
    const labelNames = (residentLabels || [])
      .map((label) => {
        const labelId = label.label_id || label.intake_label?.label_id;
        return labelId ? intakeById.get(String(labelId)) || label.intake_label?.label_name : undefined;
      })
      .filter(Boolean) as string[];

    if (labelNames.some((name) => name.includes("ติดเตียง"))) return "ติดเตียง";
    const selfLabels = labelNames.filter((name) => name.includes("ช่วยเหลือตัวเอง"));
    if (selfLabels.some((name) => name.includes("ทั้งหมด"))) return "ช่วยเหลือตัวเองได้";
    if (selfLabels.some((name) => name.includes("บางส่วน"))) return "ต้องการความช่วยเหลือ";
    if (selfLabels.length > 0) return "ช่วยเหลือตัวเองได้";
    if (labelNames[0]) return labelNames[0];

    return resident?.status || "-";
  }, [resident, residentLabels, intakeLabels]);

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
      <div className="max-w-full space-y-6">
        <button
          onClick={() => router.back()}
          className="print-hide flex items-center gap-2 text-blue-500 hover:text-blue-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-body-small font-medium">ย้อนกลับ</span>
        </button>

        <div className="print-hide flex items-center justify-between">
          <h1 className="text-headline-5 font-bold text-gray-800">เวชระเบียน</h1>

          <div className="w-[220px]">
            <DatePicker
              value={selectedDate}
              onChange={(date) => setSelectedDate(date || new Date())}
              placeholder="เลือกวันที่"
              className="w-full [&>button]:w-full [&>button]:justify-between [&>button]:border-2 [&>button]:border-blue-500 [&>button]:hover:bg-blue-50"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 relative">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : error ? (
            <div className="py-8 text-center text-sm text-red-500">{error}</div>
          ) : (
            <div className="flex flex-row items-start gap-6">
              {/* Avatar */}
              <div className="shrink-0">
                {resident?.profile_image ? (
                  <Image
                    src={resident.profile_image}
                    alt={residentName}
                    width={96}
                    height={96}
                    className="w-24 h-24 rounded-full border-4 border-blue-400 object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full border-4 border-blue-400 bg-linear-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-headline-4 font-bold">
                    {residentName.charAt(0)}
                  </div>
                )}
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
                      <span className="text-body-small font-medium text-red-600">แพ้ยา</span>
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
                <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-600 rounded-full px-3 py-1 text-body-small font-medium">
                  <span>{statusText}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="print-hide flex bg-gray-100 rounded-full p-1" style={{ border: "1px solid rgba(103, 103, 103, 0.48)" }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-6 py-2.5 text-body-small font-medium transition-all rounded-full ${activeTab === tab.id
                  ? "bg-white text-gray-900 shadow-sm"
                  : "bg-transparent text-gray-600 hover:text-gray-900"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div>
          {activeTab === "vital_signs" && (
            <VitalSignsDetailTable
              patientId={residentId}
              selectedDate={selectedDate}
              patientName={residentName}
              patientRoom={roomDisplay}
              patientStatus={statusText}
            />
          )}
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
