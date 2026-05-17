"use client";
import { Activity, AlertTriangle, ClipboardList, Heart, Pill, Scissors, ShieldCheck } from "lucide-react";
import type { Resident as ApiResident } from "@/types/resident";
import type { PersonalDrug } from "@/services/personal-drug.service";
import { MedicationTable } from "./MedicationTable";
// 👉 เอา resolveADLLabel, resolveCareLabel ออกไปเลย เพราะเราจะไม่ล็อกค่าตายตัวแล้ว
import { splitTags } from "../utils/resolvers"; 

interface MedicalInfoSectionProps {
  resident: ApiResident | null;
  medications: PersonalDrug[];
  allergies: string[];
  drugAllergies: string[];
}

export function MedicalInfoSection({
  resident,
  medications,
  allergies,
  drugAllergies,
}: MedicalInfoSectionProps) {
  const chronicTags = splitTags(resident?.pre_existing_conditions);
  const surgicalTags = splitTags(resident?.surgical_history);
  
  const getAdlLabel = () => {
    const labelName = resident?.resident_labels?.[0]?.intake_label?.label_name;
    if (labelName) return labelName;
  };

  const adlLabel = getAdlLabel();

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <h3 className="text-sm font-semibold text-slate-700">ข้อมูลทางการแพทย์</h3>
      <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Heart className="h-4 w-4" />
            <span>โรคประจำตัว</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {chronicTags.length === 0 ? (
              <span className="text-sm text-slate-500">ไม่มีข้อมูล</span>
            ) : (
              chronicTags.map((item, index) => (
                <span key={`${item}-${index}`} className="rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-700">
                  {item}
                </span>
              ))
            )}
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Heart className="h-4 w-4" />
            <span>หมายเหตุ</span>
          </div>
          <div className="mt-2 text-sm font-medium text-slate-800">
            {resident?.pre_existing_conditions_notes || "-"}
          </div>
        </div>
      </div>

      <div className="mt-5">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Pill className="h-4 w-4 text-slate-400" />
          <span>ยาที่ใช้ประจำ</span>
        </div>
        <MedicationTable medications={medications} />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ClipboardList className="h-4 w-4" />
            <span>ประวัติการผ่าตัด</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {surgicalTags.length === 0 ? (
              <span className="text-sm text-slate-500">ไม่มีข้อมูล</span>
            ) : (
              surgicalTags.map((item, index) => (
                <span key={`${item}-${index}`} className="rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-700">
                  {item}
                </span>
              ))
            )}
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <AlertTriangle className="h-4 w-4" />
            <span>แพ้ยา</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {drugAllergies.length === 0 ? (
              <span className="text-sm text-slate-500">ไม่มีข้อมูล</span>
            ) : (
              drugAllergies.map((item, index) => (
                <span key={`${item}-${index}`} className="rounded-full bg-rose-600 px-3 py-1 text-xs font-semibold text-white">
                  {item}
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <AlertTriangle className="h-4 w-4 " />
            <span>แพ้อาหาร</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {allergies.length === 0 ? (
              <span className="text-sm text-slate-500">ไม่มีข้อมูล</span>
            ) : (
              allergies.map((item, index) => (
                <span key={`${item}-${index}`} className="rounded-full bg-amber-400 px-3 py-1 text-xs font-semibold text-white">
                  {item}
                </span>
              ))
            )}
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="h-4 w-4" />
            <span>การกู้ชีพกรณีหยุดหายใจ</span>
          </div>
          <div className="mt-2">
            <span
              className={`inline-flex items-center rounded-full px-4 py-1 text-xs font-semibold text-white ${
                resident?.resuscitation_status === "CPR"
                  ? "bg-emerald-500"
                  : resident?.resuscitation_status === "DNR"
                  ? "bg-slate-500"
                  : "bg-slate-400"
              }`}
            >
              {resident?.resuscitation_status || "-"}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-5">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Activity className="h-4 w-4" />
          <span>การประเมินการช่วยเหลือตัวเอง (ADL)</span>
        </div>
        <div className="mt-2">
          <span className="inline-flex items-center rounded-full bg-blue-600 px-4 py-1 text-xs font-semibold text-white">
            {adlLabel}
          </span>
        </div>
      </div>
    </section>
  );
}