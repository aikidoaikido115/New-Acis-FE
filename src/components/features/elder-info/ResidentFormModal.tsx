"use client";
import { useEffect, useMemo, useState } from "react";
import { Modal }             from "@/components/ui/modal";
import { DatePicker }        from "@/components/ui/date-picker";
import { Dropdown }          from "@/components/ui/dropdown";
import { SearchableDropdown } from "@/components/ui/searchable-dropdown";
import { Input }             from "@/components/ui/input";
import { Button }            from "@/components/ui/button";
import { Textarea }          from "@/components/ui/textarea";
import {
  Calendar, CreditCard, Heart, Home, Layers, Pill,
  Scissors, AlertTriangle, Activity, ShieldCheck,
  Building2, Phone, Users, User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ResidentFormState } from "@/types/resident";
import type { Room } from "@/types/room";

import { useResidentForm }      from "./resident-form/useResidentForm";
import { ProfileImageUpload }   from "./resident-form/ProfileImageUpload";
import { MedicationTable }      from "./resident-form/MedicationTable";
import { EmergencyContactList } from "./resident-form/EmergencyContactList";
import {
  STATUS_OPTIONS, GENDER_OPTIONS, FLOOR_OPTIONS, CARE_LEVEL_OPTIONS, EMERGENCY_HOSPITAL_MASTERS,
} from "./resident-form/constants";

// ── Shared styles ─────────────────────────────────────────────────
const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-black " +
  "placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20";
const labelClass = "flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1.5";

// ── Small helper components ───────────────────────────────────────
const Req = () => <span className="text-red-500">*</span>;

function Label({ icon, text, required }: { icon: React.ReactNode; text: string; required?: boolean }) {
  return (
    <label className={labelClass}>
      {icon} {text} {required && <Req />}
    </label>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 md:p-6">
      <h3 className="mb-4 text-base font-semibold text-slate-800">{title}</h3>
      {children}
    </section>
  );
}

const parseLocalDate = (value?: string) => {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

// ── Props ─────────────────────────────────────────────────────────
interface ResidentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ResidentFormState) => Promise<void>;
  isLoading?: boolean;
  rooms?: Room[];
  initialValues?: ResidentFormState;
  mode?: "create" | "edit";
  medicationOptions: Array<{ value: string; label: string; name: string; dose?: string }>;
  onCreateMedicationOption?: (name: string, dose: string) => Promise<{ value: string; label: string; name: string; dose?: string } | null>;
  onCreateRoomOption?: (roomNumber: string, floor: string) => Promise<{ value: string; label: string } | null>;
}

// ── Component ─────────────────────────────────────────────────────
export function ResidentFormModal({ isOpen, onClose, onSubmit, isLoading = false, rooms = [], initialValues, mode = "create", medicationOptions, onCreateMedicationOption, onCreateRoomOption }: ResidentFormModalProps) {
  const form = useResidentForm(onSubmit, onClose, initialValues);
  const { formData, set, updateMedication, resetForm } = form;

  const [hospitalOptions, setHospitalOptions] = useState(() => [...EMERGENCY_HOSPITAL_MASTERS]);

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen, resetForm]);

  useEffect(() => {
    if (!formData.emergencyHospital) return;
    setHospitalOptions((prev) => {
      if (prev.some((item) => item.value === formData.emergencyHospital)) return prev;
      return [
        ...prev,
        {
          value: formData.emergencyHospital,
          label: formData.emergencyHospital,
          phone: formData.emergencyHospitalPhone || "",
        },
      ];
    });
  }, [formData.emergencyHospital, formData.emergencyHospitalPhone]);

  const roomOptions = rooms.map((room) => {
    const value = (room as { room_id?: string | number; id?: string | number }).room_id ?? room.id ?? "";
    const label = room.room_number || `ห้อง ${value || ""}`;
    return { value: String(value), label };
  }).sort((a, b) => {
    const aNum = parseInt(a.label.replace(/[^\d]/g, ''), 10) || 0;
    const bNum = parseInt(b.label.replace(/[^\d]/g, ''), 10) || 0;
    return aNum - bNum;
  });

  const emergencyHospitalOptions = useMemo(
    () => hospitalOptions.map(({ value, label }) => ({ value, label })),
    [hospitalOptions]
  );

  const handleEmergencyHospitalSelect = (value: string) => {
    const selected = hospitalOptions.find((item) => item.value === value);
    if (!selected) return;
    set({ emergencyHospital: selected.value, emergencyHospitalPhone: selected.phone });
  };

  const handleEmergencyHospitalCreate = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setHospitalOptions((prev) => {
      if (prev.some((item) => item.value === trimmed)) return prev;
      return [...prev, { value: trimmed, label: trimmed, phone: "" }];
    });
    set({ emergencyHospital: trimmed, emergencyHospitalPhone: "" });
  };

  const handleCreateMedication = async (idx: number, name: string) => {
    const dose = formData.medications[idx]?.dose?.trim();
    if (!dose) {
      alert("กรุณากรอกปริมาณ/ขนาดก่อนเพิ่มยาใหม่");
      return;
    }
    const created = await onCreateMedicationOption?.(name, dose);
    if (!created) return;
    updateMedication(idx, {
      dmId: created.value,
      name: created.name,
      dose: formData.medications[idx]?.dose || created.dose || "",
    });
  };

  const handleCreateRoom = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (!formData.floor) {
      alert("กรุณาเลือกชั้นก่อนเพิ่มห้อง");
      return;
    }
    const created = await onCreateRoomOption?.(trimmed, formData.floor);
    if (!created) return;
    set({ roomId: created.value });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={form.handleClose}
      title={mode === "edit" ? "แก้ไขแฟ้มข้อมูลผู้สูงอายุ" : "แฟ้มข้อมูลผู้สูงอายุ"}
      size="4xl"
      scrollable
      disableBackdropClose
    >
      <form onSubmit={form.handleSubmit} className="space-y-6">

        {/* ══ Section 1: ข้อมูลพื้นฐาน ══════════════════════════════ */}
        <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 md:p-6">
          {/* Status selector in header */}
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-base font-semibold text-slate-800">ข้อมูลพื้นฐาน</h3>
            <div className="w-full sm:w-auto sm:min-w-40 "> 
              <Label icon={null} text="สถานะ" required />
              <Dropdown options={STATUS_OPTIONS} value={formData.status} onChange={(val) => set({ status: val })} placeholder="เลือกสถานะ" className="w-full" />
            </div>
          </div>

          <div className="flex flex-col gap-6 lg:flex-row">
            <ProfileImageUpload
              preview={formData.profileImagePreview}
              fileInputRef={form.fileInputRef}
              onImageClick={form.handleImageClick}
              onImageChange={form.handleImageChange}
              onRemove={form.handleRemoveImage}
            />

            <div className="flex-1 space-y-4">
              {/* Row 1: ชื่อ-นามสกุล / ชื่อเล่น */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label icon={<User size={14} />} text="ชื่อ - นามสกุล" required />
                  <Input type="text" value={form.fullNameInput} onChange={form.handleFullNameChange} placeholder="กรอกชื่อ-นามสกุล" className={inputClass} required />
                </div>
                <div>
                  <Label icon={<User size={14} />} text="ชื่อเล่น" />
                  <Input type="text" name="nickname" value={formData.nickname} onChange={form.handleChange} placeholder="กรอกชื่อเล่น" className={inputClass} />
                </div>
              </div>

              {/* Row 2: วันเกิด / เพศ / เลขบัตร */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <Label icon={<Calendar size={14} />} text="วันเกิด" required />
                  <DatePicker value={parseLocalDate(formData.dateOfBirth)} onChange={(d) => form.handleDateChange("dateOfBirth", d)} placeholder="DD/MM/YYYY" />
                </div>
                <div>
                  <Label icon={<User size={14} />} text="เพศ" required />
                  <div className="flex flex-wrap gap-6 text-slate-700">
                    {GENDER_OPTIONS.map((option) => (
                      <label key={option.value} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="gender"
                          value={option.value}
                          checked={formData.gender === option.value}
                          onChange={() => set({ gender: option.value })}
                        />
                        {option.label}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <Label icon={<CreditCard size={14} />} text="เลขบัตรประชาชน" />
                  <Input type="text" name="idCardNumber" value={formData.idCardNumber} onChange={form.handleIdCardChange} placeholder="กรอกเลขบัตรประชาชน (ถ้ามี)" className={inputClass} maxLength={13} />
                </div>
              </div>

              {/* Row 3: จุดประสงค์ / วันที่เข้า–ออก + ห้อง/ชั้น */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label icon={<Home size={14} />} text="จุดประสงค์การเข้าพัก" required />
                  <Textarea name="purpose" value={formData.purpose} onChange={form.handleChange} placeholder="กรอกจุดประสงค์การเข้าพัก" className={cn(inputClass, "h-20 resize-none")} required />
                </div>
                <div>
                  <div className="space-y-4">
                    <div>
                      <Label icon={<Calendar size={14} />} text="วันที่เข้าพัก - วันที่คาดว่าจะออก" />
                      <div className="flex items-center gap-2">
                        <DatePicker value={parseLocalDate(formData.admitDate)} onChange={(d) => form.handleDateChange("admitDate", d)} placeholder="DD/MM/YYYY" />
                        <span className="text-slate-400">-</span>
                        <DatePicker value={parseLocalDate(formData.expectedDischargeDate)} onChange={(d) => form.handleDateChange("expectedDischargeDate", d)} placeholder="DD/MM/YYYY" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <Label icon={<Layers size={14} />} text="ชั้น" />
                        <Dropdown options={FLOOR_OPTIONS} value={formData.floor} onChange={(val) => set({ floor: val })} placeholder="เลือกชั้น" className="w-full" />
                      </div>
                      <div>
                        <Label icon={<Home size={14} />} text="ห้อง" />
                        <SearchableDropdown
                          options={roomOptions}
                          value={formData.roomId}
                          onChange={(val) => {
                            const matchedRoom = rooms.find((room) => {
                              const id = (room as { room_id?: string | number; id?: string | number }).room_id ?? room.id;
                              return String(id || "") === val;
                            });
                            set({
                              roomId: val,
                              floor: matchedRoom ? String(matchedRoom.floor) : formData.floor,
                            });
                          }}
                          placeholder="เลือกห้อง"
                          className="w-full"
                          allowCreate={Boolean(onCreateRoomOption)}
                          onCreate={handleCreateRoom}
                          createLabel="เพิ่มห้อง"
                        />
                      </div>
                      
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══ Section 2: ข้อมูลทางการแพทย์ ══════════════════════════ */}
        <SectionCard title="ข้อมูลทางการแพทย์">
          {/* โรคประจำตัว / หมายเหตุ */}
          <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label icon={<Heart size={14} />} text="โรคประจำตัว (แยกแต่ละบรรทัด)" />
                <Textarea 
                  name="chronicDiseases" 
                  value={formData.chronicDiseases} 
                  onChange={form.handleChange} 
                  placeholder={`กรอกโรคประจำตัว แยกแต่ละบรรทัด เช่น\nเบาหวาน\nความดัน\nโรคหัวใจ`} 
                  className={cn(inputClass, "h-24 resize-none")} 
                />            
              </div>
            <div>
              <Label icon={<Heart size={14} />} text="หมายเหตุ" />
              <Textarea name="chronicDiseasesNote" value={formData.chronicDiseasesNote} onChange={form.handleChange} placeholder="กรอกหมายเหตุ" className={cn(inputClass, "h-24 resize-none")} />
            </div>
          </div>

          {/* ตารางยา */}
          <div className="mb-4">
            <Label icon={<Pill size={14} />} text="ยาที่ใช้ประจำ" />
            <MedicationTable
              medications={formData.medications}
              medicationOptions={medicationOptions}
              onUpdate={form.updateMedication}
              onAdd={form.addMedication}
              onRemove={form.removeMedication}
              onCreateMedication={handleCreateMedication}
            />
          </div>

          {/* ประวัติผ่าตัด */}
          <div className="mb-4">
            <Label icon={<Scissors size={14} />} text="ประวัติการผ่าตัด (แยกแต่ละบรรทัด)" />
            <Textarea
              name="surgicalHistory"
              value={formData.surgicalHistory}
              onChange={form.handleChange}
              placeholder={`กรอกประวัติการผ่าตัด แยกแต่ละบรรทัด เช่น\nผ่าตัดต้อกระจก\nผ่าตัดเข่า\nผ่าตัดไส้ติ่ง`}
              className={cn(inputClass, "h-20 resize-none")}
            />
          </div>

          {/* แพ้ยา / แพ้อาหาร */}
          <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label icon={<AlertTriangle size={14} />} text="แพ้ยา (แยกแต่ละบรรทัด)" />
              <Textarea
                name="drugAllergies"
                value={formData.drugAllergies}
                onChange={form.handleChange}
                placeholder={`กรอกยาที่แพ้ แยกแต่ละบรรทัด เช่น\nเพนิซิลลิน\nซัลฟา\nแอสไพริน`}
                className={cn(inputClass, "h-20 resize-none")}
              />
            </div>
            <div>
              <Label icon={<AlertTriangle size={14} />} text="แพ้อาหาร (แยกแต่ละบรรทัด)" />
              <Textarea
                name="foodAllergies"
                value={formData.foodAllergies}
                onChange={form.handleChange}
                placeholder={`กรอกอาหารที่แพ้ แยกแต่ละบรรทัด เช่น\nกุ้ง\nปู\nถั่วลิสง`}
                className={cn(inputClass, "h-20 resize-none")}
              />
            </div>
          </div>

          {/* ADL / CPR-DNR */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label icon={<Activity size={14} />} text="การประเมินการช่วยเหลือตัวเอง (ADL)" required />
              <Dropdown options={CARE_LEVEL_OPTIONS} value={formData.careLevel} onChange={(val) => set({ careLevel: val })} placeholder="เลือกสถานะ" className="w-full" />
            </div>
            <div>
              <Label icon={<ShieldCheck size={14} />} text="การกู้ชีพกรณีหยุดหายใจ" required />
              <div className="flex gap-2">
                {(["CPR", "DNR"] as const).map((s) => (
                  <button key={s} type="button" onClick={() => set({ cprStatus: s })}
                    className={cn("flex-1 rounded-lg px-5 py-2 text-sm font-medium transition",
                      formData.cprStatus === s
                        ? s === "CPR" ? "bg-emerald-600 text-white" : "bg-slate-700 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    )}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>

        {/* ══ Section 3: ความปลอดภัยฉุกเฉิน ═════════════════════════ */}
        <SectionCard title="ความปลอดภัยฉุกเฉิน">

          <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-10">
            <div className="md:col-span-6">
              <Label icon={<Building2 size={14} />} text="โรงพยาบาลกรณีฉุกเฉิน" required />
              <SearchableDropdown
                options={emergencyHospitalOptions}
                value={formData.emergencyHospital}
                onChange={handleEmergencyHospitalSelect}
                onCreate={handleEmergencyHospitalCreate}
                allowCreate
                createLabel="เพิ่มโรงพยาบาล"
                placeholder="เลือกโรงพยาบาล"
                className="w-full text-black"
              />
            </div>
            <div className="md:col-span-4">
              <Label icon={<Phone size={14} />} text="เบอร์โรงพยาบาลกรณีฉุกเฉิน" />
              <Input type="text" name="emergencyHospitalPhone" value={formData.emergencyHospitalPhone} onChange={form.handlePhoneChange} placeholder="กรอกเบอร์โรงพยาบาล (4-10 หลัก)" className={inputClass} maxLength={10} />
            </div>
          </div>

          <div>
            <Label icon={<Users size={14} />} text="ผู้ติดต่อฉุกเฉิน" required />
            <EmergencyContactList
              contacts={formData.emergencyContacts}
              inputClass={inputClass}
              onUpdate={form.updateContact}
              onUpdatePhone={form.updateContactPhone}
              onAdd={form.addContact}
              onRemove={form.removeContact}
            />
          </div>
        </SectionCard>

        {/* ══ Buttons ══════════════════════════════════════════════ */}
        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-center sm:gap-4">
          <Button type="button" onClick={form.handleClose} disabled={isLoading}
            className="h-11 w-full border border-slate-300 bg-white px-8 text-slate-700 hover:bg-slate-50 sm:w-auto">
            ยกเลิก
          </Button>
          <Button type="submit" disabled={isLoading}
            className="h-11 w-full bg-[#4A8B6A] px-8 text-base font-medium text-white shadow-sm transition-colors hover:bg-[#3d7357] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto">
            {isLoading ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
          </Button>
        </div>

      </form>
    </Modal>
  );
}
