import type { Medication, EmergencyContact, ResidentFormState } from "@/types/resident";

// ── Initial values ────────────────────────────────────────────────
export const INITIAL_MEDICATION: Medication = { name: "", dose: "", frequency: "", time: "", note: "" };
export const INITIAL_EMERGENCY_CONTACT: EmergencyContact = { name: "", relation: "", phone: "" };

export const INITIAL_FORM_STATE: ResidentFormState = {
  status: "",
  firstName: "",
  lastName: "",
  nickname: "",
  gender: "",
  dateOfBirth: "",
  idCardNumber: "",
  purpose: "",
  admitDate: "",
  expectedDischargeDate: "",
  roomId: "",
  floor: "",
  profileImage: null,
  profileImagePreview: "",
  chronicDiseases: "",
  chronicDiseasesNote: "",
  medications: [{ ...INITIAL_MEDICATION }],
  surgicalHistory: "",
  drugAllergies: "",
  foodAllergies: "",
  adlScore: "",
  careLevel: "",
  cprStatus: "",
  emergencyHospital: "",
  emergencyHospitalPhone: "",
  emergencyContacts: [{ ...INITIAL_EMERGENCY_CONTACT }],
};

// ── Dropdown option lists ─────────────────────────────────────────
export const STATUS_OPTIONS = [
  { value: "active",    label: "พักอยู่ในศูนย์" },
  { value: "inactive",  label: "ออกจากศูนย์" },
];

export const GENDER_OPTIONS = [
  { value: "male",   label: "ชาย" },
  { value: "female", label: "หญิง" },
  { value: "other",  label: "อื่นๆ" },
];

export const FLOOR_OPTIONS = [
  { value: "1", label: "ชั้น 1" },
  { value: "2", label: "ชั้น 2" },
  { value: "3", label: "ชั้น 3" },
  { value: "4", label: "ชั้น 4" },
];

export const CARE_LEVEL_OPTIONS = [
  { value: "general",        label: "ผู้สูงอายุทั่วไป" },
  { value: "partial_assist", label: "ช่วยเหลือตัวเองได้บางส่วน" },
  { value: "bedridden",      label: "ผู้สูงอายุติดเตียง" },
];

export const MEDICATION_NAME_OPTIONS = [
  { value: "metformin",        label: "Metformin" },
  { value: "amlodipine",       label: "Amlodipine" },
  { value: "atorvastatin",     label: "Atorvastatin" },
  { value: "losartan",         label: "Losartan" },
  { value: "omeprazole",       label: "Omeprazole" },
  { value: "aspirin",          label: "Aspirin" },
  { value: "clopidogrel",      label: "Clopidogrel" },
  { value: "furosemide",       label: "Furosemide" },
  { value: "warfarin",         label: "Warfarin" },
  { value: "glipizide",        label: "Glipizide" },
  { value: "carvedilol",       label: "Carvedilol" },
  { value: "levothyroxine",    label: "Levothyroxine" },
  { value: "prednisolone",     label: "Prednisolone" },
];

export const MEDICATION_FREQUENCY_OPTIONS = [
  { value: "morning",            label: "เช้า (1 ครั้ง)" },
  { value: "morning_noon",       label: "เช้า/กลางวัน (2 ครั้ง)" },
  { value: "morning_noon_evening", label: "เช้า/กลางวัน/เย็น (3 ครั้ง)" },
  { value: "four_times",         label: "เช้า/กลางวัน/เย็น/ก่อนนอน (4 ครั้ง)" },
];
