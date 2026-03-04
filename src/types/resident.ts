// Resident Types
// Medication entry for the medications table
export interface Medication {
  name: string;
  dose: string;
  frequency: string;
  time: string;
  note?: string;
}

// Emergency contact entry
export interface EmergencyContact {
  name: string;
  relation: string;
  phone: string;
}

export interface Resident {
  id: string;
  // Some BE responses use resident_id instead of id
  resident_id?: string;
  // Basic Info
  first_name: string;
  last_name: string;
  nickname?: string;
  gender: string;
  date_of_birth: string;
  id_card_number?: string;
  purpose?: string; // จุดประสงค์การเข้าพัก
  admit_date: string;
  expected_discharge_date?: string; // วันที่คาดว่าจะออก
  room_id?: string;
  floor?: number;
  profile_image?: string;

  // Medical Info
  chronic_diseases?: string; // โรคประจำตัว
  chronic_diseases_note?: string; // หมายเหตุโรคประจำตัว
  medications?: Medication[]; // ยาที่ใช้ประจำ
  surgical_history?: string; // ประวัติการผ่าตัด
  drug_allergies?: string; // แพ้ยา
  food_allergies?: string; // แพ้อาหาร
  adl_score?: number; // ADL score
  cpr_status?: "CPR" | "DNR"; // CPR/DNR

  // Emergency Info
  emergency_hospital?: string; // โรงพยาบาลกรณีฉุกเฉิน
  emergency_hospital_phone?: string;
  emergency_contacts?: EmergencyContact[];

  // Legacy fields
  phone_number?: string;
  address?: string;
  blood_type?: string;
  allergies?: string; // combined allergies (legacy)
  medical_conditions?: string; // (legacy)
  care_level: "general" | "partial_assist" | "bedridden";
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateResidentRequest {
  // Basic Info
  first_name: string;
  last_name: string;
  nickname?: string;
  gender: string;
  date_of_birth: string;
  age?: number;
  id_card_number?: string;
  purpose?: string;
  admit_date: string;
  expected_discharge_date?: string;
  room_id?: string;
  floor?: number;
  profile_image?: string;

  // Medical Info
  chronic_diseases?: string;
  chronic_diseases_note?: string;
  medications?: Medication[];
  surgical_history?: string;
  drug_allergies?: string;
  food_allergies?: string;
  adl_score?: number;
  cpr_status?: "CPR" | "DNR";

  // Emergency Info
  emergency_hospital?: string;
  emergency_hospital_phone?: string;
  emergency_contacts?: EmergencyContact[];

  // Legacy
  care_level: "general" | "partial_assist" | "bedridden";
  notes?: string;
}

// Form state for the intake form
export interface ResidentFormState {
  // Basic Info
  status: string;
  firstName: string;
  lastName: string;
  nickname: string;
  gender: string;
  dateOfBirth: string;
  idCardNumber: string;
  purpose: string;
  admitDate: string;
  expectedDischargeDate: string;
  roomId: string;
  floor: string;
  profileImage: File | null;
  profileImagePreview: string;

  // Medical Info
  chronicDiseases: string;
  chronicDiseasesNote: string;
  medications: Medication[];
  surgicalHistory: string;
  drugAllergies: string;
  foodAllergies: string;
  adlScore: string;
  careLevel: string;
  cprStatus: "CPR" | "DNR" | "";

  // Emergency Info
  emergencyHospital: string;
  emergencyHospitalPhone: string;
  emergencyContacts: EmergencyContact[];
}
