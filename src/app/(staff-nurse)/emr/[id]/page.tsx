"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Calendar, ArrowLeft, AlertTriangle, Stethoscope, ChevronDown } from "lucide-react";
import { VitalSignsDetailTable } from "@/components/features/EMR/detail/VitalSignsDetailTable";
import { GraphView } from "@/components/features/EMR/detail/GraphView";
import { DoctorOrderDetailTable } from "@/components/features/EMR/detail/DoctorOrderDetailTable";
import { NurseNoteDetailTable } from "@/components/features/EMR/detail/NurseNoteDetailTable";
import { WoundCareDetailTable } from "@/components/features/EMR/detail/WoundCareDetailTable";
import { RelativeNoteDetailTable } from "@/components/features/EMR/detail/RelativeNoteDetailTable";

type SubTab = "vital_signs" | "graph" | "doctor_order" | "nurse_note" | "wound_care" | "relative_note";

const mockPatient = {
  id: "1",
  name: "สมชาย ศรีบุญญมเมือง",
  room: "ห้อง 112 ชั้น 2",
  birthDate: "น.ศ.1956.03.01(67ปี)",
  status: "ติดเตียง",
  statusColor: "bg-pink-100 text-pink-600",
  profileImage: "/placeholder-profile.jpg",
  allergies: ["Penicillin", "Sulfa drugs"],
  chronicDiseases: ["ความดันโลหิตสูง", "โรคหัวใจ", "เบาหวาน Type 2"],
  surgicalHistory: "ผ่าตัดนายพาศรีขวัวใจ (2567), เปลี่ยนข้อเข่าซ้าย (2563)",
  alertStatus: "แพ้ยา",
};

export default function PatientDetailPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<SubTab>("vital_signs");
  const selectedDate = "31/12/2568";

  const tabs = [
    { id: "vital_signs" as SubTab, label: "สัญญาณชีพ" },
    { id: "graph" as SubTab, label: "กราฟ" },
    { id: "doctor_order" as SubTab, label: "คำสั่งแพทย์" },
    { id: "nurse_note" as SubTab, label: "บันทึกพยาบาล" },
    { id: "wound_care" as SubTab, label: "ทำแผล" },
    { id: "relative_note" as SubTab, label: "โน๊ตญาติ" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-[1400px] mx-auto space-y-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-blue-500 hover:text-blue-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">ย้อนกลับ</span>
        </button>

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">เวชระเบียน</h1>

          <div className="flex items-center gap-2 px-4 py-2 border-2 border-blue-500 rounded-lg bg-white">
            <span className="text-sm font-medium text-blue-500">{selectedDate}</span>
            <Calendar className="w-4 h-4 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 relative">
          <div className="flex flex-row items-start gap-6">
            <div className="w-24 h-24 rounded-full border-4 border-blue-400 bg-linear-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-3xl font-bold shrink-0">
              {mockPatient.name.charAt(0)}
            </div>

            <div className="flex flex-col gap-4 flex-1">
              <div>
                <h2 className="text-xl font-bold text-gray-800">{mockPatient.name}</h2>
                <p className="text-sm text-gray-500">{mockPatient.room}</p>
              </div>

              {mockPatient.alertStatus && (
                <div>
                  <div className="flex items-center gap-1 mb-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span className="text-sm font-medium text-red-600">{mockPatient.alertStatus}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {mockPatient.allergies.map((allergy, index) => (
                      <span key={index} className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-sm font-medium">
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
                  <span className="text-base">✂️</span>
                  <span className="text-sm font-medium text-gray-700">ประวัติการผ่าตัด</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {mockPatient.surgicalHistory.split(",").map((surgery, index) => (
                    <span key={index} className="px-3 py-1 bg-transparent border border-green-500 text-green-600 rounded-full text-sm">
                      {surgery.trim()}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Stethoscope className="w-4 h-4 text-gray-700" />
                  <span className="text-sm font-medium text-gray-700">โรคประจำตัว</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {mockPatient.chronicDiseases.map((disease, index) => (
                    <span key={index} className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-sm font-medium">
                      {disease}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="absolute top-4 right-4">
              <button className="flex items-center gap-2 bg-orange-100 text-orange-600 rounded-full px-3 py-1 text-sm font-medium hover:bg-orange-200 transition-colors">
                <span>{mockPatient.status}</span>
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex bg-gray-100 rounded-full p-1" style={{ border: "1px solid rgba(103, 103, 103, 0.48)" }}>
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

        <div>
          {activeTab === "vital_signs" && <VitalSignsDetailTable patientId={mockPatient.id} />}
          {activeTab === "graph" && <GraphView patientId={mockPatient.id} />}
          {activeTab === "doctor_order" && <DoctorOrderDetailTable patientId={mockPatient.id} />}
          {activeTab === "nurse_note" && <NurseNoteDetailTable patientId={mockPatient.id} />}
          {activeTab === "wound_care" && <WoundCareDetailTable patientId={mockPatient.id} />}
          {activeTab === "relative_note" && <RelativeNoteDetailTable patientId={mockPatient.id} />}
        </div>
      </div>
    </div>
  );
}
