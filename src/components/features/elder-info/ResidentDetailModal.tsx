"use client";

import { useCallback, useEffect, useMemo, useState, type ComponentType } from "react";
import {
  Calendar,
  CreditCard,
  Home,
  Phone,
  Pill,
  Printer,
  User,
  UserRound,
  X,
  Heart,
  Scissors,
  AlertTriangle,
  Activity,
  ShieldCheck,
  Building2,
  Users,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { residentService } from "@/services/resident.service";
import { roomService } from "@/services/room.service";
import { allergyService } from "@/services/allergy.service";
import { drugAllergyService } from "@/services/drug-allergy.service";
import { personalDrugService } from "@/services/personal-drug.service";
import type { Resident as ApiResident } from "@/types/resident";
import type { Room } from "@/types/room";
import type { PersonalDrug } from "@/services/personal-drug.service";

interface ResidentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  residentId: string | null;
}

const thaiMonths = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear() + 543;
  return `${day}/${month}/${year}`;
};

const formatThaiDate = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const day = date.getDate();
  const monthName = thaiMonths[date.getMonth()] || "";
  const year = date.getFullYear() + 543;
  return `${day} ${monthName} ${year}`.trim() || "-";
};

const calculateAge = (value?: string | null) => {
  if (!value) return null;
  const birthDate = new Date(value);
  if (Number.isNaN(birthDate.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }
  return age < 0 ? null : age;
};

const formatDateRange = (start?: string | null, end?: string | null) => {
  const startText = formatDate(start);
  const endText = formatDate(end);
  if (startText === "-" && endText === "-") return "-";
  return `${startText} - ${endText}`;
};

const formatPrintDateTime = (date: Date) => {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear() + 543;
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
};

const resolveCareLabel = (resident?: ApiResident | null) => {
  const labelName = resident?.resident_labels
    ?.map((label) => label.intake_label?.label_name || "")
    .find((name) => name.includes("ช่วยเหลือตัวเอง") || name === "ติดเตียง")
    ?.trim();

  if (labelName === "ช่วยเหลือตัวเองได้บางส่วน") return "ช่วยเหลือตัวเองได้บางส่วน";
  if (labelName === "ติดเตียง") return "ผู้สูงอายุติดเตียง";
  if (labelName === "ช่วยเหลือตัวเองได้ทั้งหมด") return "ผู้สูงอายุทั่วไป";
  return resident?.status || "-";
};

const splitTags = (value?: string | null) =>
  (value || "")
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);

const timeOfDayLabelMap: Record<string, string> = {
  morning: "เช้า",
  noon: "กลางวัน",
  evening: "เย็น",
  bedtime: "ก่อนนอน",
};

const formatTimeOfDay = (value?: string | null) => {
  if (!value) return "";
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => timeOfDayLabelMap[item.toLowerCase()] || item)
    .join("-");
};

const formatFrequency = (med: PersonalDrug) => {
  const timeText = formatTimeOfDay(med.time_of_day);
  if (med.frequency && timeText) return `${med.frequency} ครั้ง (${timeText})`;
  if (med.frequency) return `${med.frequency} ครั้ง`;
  if (timeText) return timeText;
  return "-";
};

const formatMealType = (med: PersonalDrug) => {
  if (med.timing) return med.timing;
  if (med.take_type === "regular") return "ประจำ";
  if (med.take_type === "as_needed") return "ตามอาการ";
  return "-";
};

const formatDose = (med: PersonalDrug) => {
  if (med.amount) return `${med.amount}${med.amount_unit || ""}`.trim();
  if (med.DrugMaster?.dose) return med.DrugMaster.dose;
  return "-";
};

const toTelHref = (value?: string | null) => {
  const sanitized = (value || "").replace(/[^0-9+]/g, "");
  return sanitized ? `tel:${sanitized}` : "";
};

interface InfoItemProps {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  className?: string;
}

const InfoItem = ({ icon: Icon, label, value, className }: InfoItemProps) => (
  <div className={`flex gap-3 ${className || ""}`.trim()}>
    <div className="mt-1 text-slate-400">
      <Icon className="h-5 w-5" />
    </div>
    <div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-sm font-medium text-slate-800">{value}</div>
    </div>
  </div>
);

export function ResidentDetailModal({ isOpen, onClose, residentId }: ResidentDetailModalProps) {
  const [resident, setResident] = useState<ApiResident | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [drugAllergies, setDrugAllergies] = useState<string[]>([]);
  const [medications, setMedications] = useState<PersonalDrug[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [printDateTime, setPrintDateTime] = useState<string>("");

  const fetchData = useCallback(async () => {
    if (!residentId) return;
    setIsLoading(true);
    setError(null);
    try {
      const residentData = await residentService.getById(residentId);
      setResident(residentData);

      const roomId = residentData.room_id;
      if (roomId) {
        const roomData = await roomService.getById(roomId);
        setRoom(roomData);
      } else {
        setRoom(null);
      }

      const [foodAllergyItems, drugAllergyItems, drugs] = await Promise.all([
        allergyService.getByResident(residentId),
        drugAllergyService.getByResident(residentId),
        personalDrugService.getByResidentAll(residentId),
      ]);

      const foodNames = (foodAllergyItems || [])
        .map((item) => item.allergy?.allergy_name || item.allergy_name)
        .filter(Boolean) as string[];

      const drugNames = (drugAllergyItems || [])
        .map((item) => item.drug_allergy?.allergy_name || item.allergy_name)
        .filter(Boolean) as string[];

      setAllergies(Array.from(new Set(foodNames)));
      setDrugAllergies(Array.from(new Set(drugNames)));
      setMedications(drugs || []);
    } catch {
      setError("ไม่สามารถโหลดข้อมูลผู้สูงอายุได้");
      setResident(null);
      setRoom(null);
      setAllergies([]);
      setDrugAllergies([]);
      setMedications([]);
    } finally {
      setIsLoading(false);
    }
  }, [residentId]);

  useEffect(() => {
    if (!isOpen) return;
    void fetchData();
  }, [isOpen, fetchData]);

  useEffect(() => {
    const handleBeforePrint = () => {
      const now = new Date();
      setPrintDateTime(formatPrintDateTime(now));
      setIsPrinting(true);
      document.body.classList.add("print-resident-modal");
    };
    const handleAfterPrint = () => {
      document.body.classList.remove("print-resident-modal");
      setIsPrinting(false);
    };
    window.addEventListener("beforeprint", handleBeforePrint);
    window.addEventListener("afterprint", handleAfterPrint);
    return () => {
      window.removeEventListener("beforeprint", handleBeforePrint);
      window.removeEventListener("afterprint", handleAfterPrint);
    };
  }, []);

  const fullName = useMemo(() => {
    if (!resident) return "-";
    return `${resident.first_name || ""} ${resident.last_name || ""}`.trim() || "-";
  }, [resident]);

  const genderText = resident?.gender === "male" ? "ชาย" : resident?.gender === "female" ? "หญิง" : "-";
  const roomText = room ? `ห้อง ${room.room_number} ชั้น ${room.floor}` : "ไม่ระบุห้อง";
  const careLevel = resolveCareLabel(resident);
  const statusText = useMemo(() => {
    const rawStatus = (resident?.status || "").trim();
    if (!rawStatus) return "-";
    const normalized = rawStatus.toLowerCase();
    if (normalized === "active" || rawStatus === "พักอยู่ในศูนย์") return "พักอยู่ในศูนย์";
    if (normalized === "inactive" || normalized === "discharged") return "ออกจากศูนย์";
    return rawStatus;
  }, [resident]);
  const birthDateText = useMemo(() => {
    const baseText = formatThaiDate(resident?.date_of_birth);
    const age = calculateAge(resident?.date_of_birth);
    if (baseText === "-" || age === null) return baseText;
    return `${baseText} (${age} ปี)`;
  }, [resident?.date_of_birth]);
  const adlLabel = useMemo(() => {
    if (!resident) return "-";
    const labelName = resident.resident_labels
      ?.map((label) => label.intake_label?.label_name || "")
      .find((name) => name.includes("ช่วยเหลือตัวเอง") || name === "ติดเตียง")
      ?.trim();
    if (labelName) return labelName;
    const score = resident.adl_score;
    if (score === undefined || score === null) return careLevel;
    if (score <= 5) return "ต้องการความช่วยเหลือทั้งหมด";
    if (score <= 11) return "ต้องการความช่วยเหลือบางส่วน";
    return "ช่วยเหลือตัวเองได้";
  }, [resident, careLevel]);
  const chronicTags = useMemo(() => splitTags(resident?.pre_existing_conditions), [resident?.pre_existing_conditions]);
  const surgicalTags = useMemo(() => splitTags(resident?.surgical_history), [resident?.surgical_history]);

  const handleExport = () => {
    const now = new Date();
    setPrintDateTime(formatPrintDateTime(now));
    setIsPrinting(true);
    document.body.classList.add("print-resident-modal");
    setTimeout(() => {
      window.print();
    }, 50);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="5xl" scrollable={false} printable>
      <div className="resident-detail-print overflow-y-auto max-h-[85vh] print:max-h-none print:overflow-visible">
        <div className="print-header sticky top-0 z-20 -mx-6 -mt-6 mb-6 flex items-center justify-between border-b border-slate-200 bg-white/95 px-6 py-4 backdrop-blur-sm">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">แฟ้มข้อมูลผู้สูงอายุ</h2>
            <p className="text-sm text-slate-500">ข้อมูลล่าสุดจากระบบ</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="print-only text-right text-sm font-semibold text-slate-700">
              {printDateTime}
            </div>
            <button
              type="button"
              onClick={handleExport}
              className="print-hide inline-flex items-center gap-2 rounded-lg bg-[#0093EF] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#0080D0]"
            >
              <Printer className="h-4 w-4" />
              พิมพ์ / Export PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="print-hide inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label="ปิด"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-sm text-slate-500">กำลังโหลดข้อมูล...</div>
        ) : error ? (
          <div className="py-12 text-center text-sm text-red-500">{error}</div>
        ) : (
          <div className="space-y-6 pt-6">
            <section className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-sm font-semibold text-slate-700">ข้อมูลพื้นฐาน</h3>
                <span className="rounded-full bg-emerald-50 px-4 py-1 text-xs font-medium text-emerald-700">
                  {statusText}
                </span>
              </div>
              <div className="mt-5 flex flex-col gap-6 lg:flex-row">
                <div className="flex flex-col items-center gap-3 lg:w-56">
                  {resident?.profile_image ? (
                    <img
                      src={resident.profile_image}
                      alt={fullName}
                      className="h-28 w-28 rounded-full border-4 border-blue-200 object-cover"
                    />
                  ) : (
                    <div className="flex h-28 w-28 items-center justify-center rounded-full bg-blue-100 text-3xl font-semibold text-blue-700">
                      {fullName.charAt(0) || "-"}
                    </div>
                  )}
                  <div className="text-sm font-medium text-slate-600">{roomText}</div>
                </div>
                <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
                  <InfoItem icon={User} label="ชื่อ - สกุล" value={fullName} />
                  <InfoItem icon={UserRound} label="เพศ" value={genderText} />
                  <InfoItem icon={Calendar} label="วันเกิด" value={birthDateText} />
                  <InfoItem icon={CreditCard} label="เลขบัตรประชาชน" value={resident?.id_card_number || "-"} />
                  <InfoItem
                    icon={Home}
                    label="จุดประสงค์การเข้าพัก"
                    value={resident?.purpose_of_stay || "-"}
                  />
                  <InfoItem
                    icon={Calendar}
                    label="วันที่เข้าพัก - วันที่คาดว่าจะออก"
                    value={formatDateRange(resident?.check_in_date, resident?.expected_check_out_date)}
                  />
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="text-sm font-semibold text-slate-700">ข้อมูลทางการแพทย์</h3>
              <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_1fr]">
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
                    <Heart className="h-4 w-4" /><span>โรคประจำตัว</span>
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
                {medications.length === 0 ? (
                  <div className="mt-2 text-sm text-slate-500">ไม่มีข้อมูลยา</div>
                ) : (
                  <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-100 text-xs font-semibold text-slate-600">
                        <tr>
                          <th className="w-8 px-3 py-2 text-center">#</th>
                          <th className="px-3 py-2 text-left">ชื่อยา</th>
                          <th className="w-32 px-3 py-2 text-left">ปริมาณ/ขนาด</th>
                          <th className="w-40 px-3 py-2 text-left">ความถี่/วัน</th>
                          <th className="w-32 px-3 py-2 text-left">ประเภท</th>
                        </tr>
                      </thead>
                      <tbody>
                        {medications.map((med, index) => (
                          <tr key={`${med.id || med.pd_id || "med"}-${index}`} className="border-t border-slate-200 bg-white">
                            <td className="px-3 py-2 text-center text-slate-600">{index + 1}</td>
                            <td className="px-3 py-2 text-slate-600">{med.DrugMaster?.name || "-"}</td>
                            <td className="px-3 py-2 text-slate-600">{formatDose(med)}</td>
                            <td className="px-3 py-2 text-slate-600">{formatFrequency(med)}</td>
                            <td className="px-3 py-2 text-slate-600">{formatMealType(med)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Scissors className="h-4 w-4" />
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

            <section className="rounded-xl border border-slate-200 border-l-4 border-l-rose-500 bg-white p-5">
              <h3 className="text-sm font-semibold text-slate-700">ความปลอดภัยฉุกเฉิน</h3>
              <div className="mt-4 space-y-5">
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Building2 className="h-4 w-4" />
                    <span>โรงพยาบาลกรณีฉุกเฉิน</span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-slate-700">
                    <span>{resident?.preferred_emergency_hospital || "-"}</span>
                    {toTelHref(resident?.emergency_hospital_phone) ? (
                      <a
                        href={toTelHref(resident?.emergency_hospital_phone)}
                        className="flex items-center gap-2 text-sm font-semibold text-rose-600 hover:text-rose-700"
                        aria-label="โทรหาโรงพยาบาลกรณีฉุกเฉิน"
                      >
                        <Phone className="h-4 w-4" />
                        {resident?.emergency_hospital_phone || "-"}
                      </a>
                    ) : (
                      <span className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                        <Phone className="h-4 w-4" />
                        {resident?.emergency_hospital_phone || "-"}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Users className="h-4 w-4" />
                    <span>ผู้ติดต่อฉุกเฉิน</span>
                  </div>
                  {resident?.emergency_contacts && resident.emergency_contacts.length > 0 ? (
                    <div className="mt-2 space-y-3">
                      {resident.emergency_contacts.map((contact, index) => (
                        <div
                          key={`${contact.name}-${index}`}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700"
                        >
                          <div>
                            <div className="font-medium">{contact.name || "-"}</div>
                            <div className="text-xs text-slate-500">{contact.relation || "-"}</div>
                          </div>
                          {toTelHref(contact.phone) ? (
                            <a
                              href={toTelHref(contact.phone)}
                              className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
                              aria-label={`โทรหา ${contact.name || "ผู้ติดต่อฉุกเฉิน"}`}
                            >
                              <Phone className="h-4 w-4" />
                              {contact.phone || "-"}
                            </a>
                          ) : (
                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                              <Phone className="h-4 w-4" />
                              {contact.phone || "-"}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-2 text-sm text-slate-500">ไม่มีข้อมูล</div>
                  )}
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
      <style jsx>{`
        .print-only {
          display: none;
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 5mm;
          }

          :global(html, body) {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            display: block !important;
          }

          :global(body.print-resident-modal *) {
            visibility: hidden !important;
          }
          :global(body.print-resident-modal .resident-detail-print),
          :global(body.print-resident-modal .resident-detail-print *) {
            visibility: visible !important;
          }

          :global(.print-modal-root),
          :global(.print-modal-content),
          :global(.print-modal-content > div),
          :global([role="dialog"]) {
            position: static !important;
            display: block !important;
            transform: none !important;
            inset: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            max-width: none !important;
            height: auto !important;
            border: none !important;
            box-shadow: none !important;
          }

          .resident-detail-print {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            max-height: none !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .print-header {
            position: relative !important;
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            margin: 0 0 5mm 0 !important;
            padding: 0 0 3mm 0 !important;
            border-bottom: 1px solid #e2e8f0 !important;
          }

          .print-hide {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }

          section {
            page-break-inside: avoid;
          }
        }
      `}</style>
    </Modal>
  );
}