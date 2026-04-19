// Resident Types
// Medication entry for the medications table
export interface Medication {
  pdId?: string;
  dmId?: string;
  name: string;
  dose: string;
  frequency: string;
  time: string;
  mealType?: 'before_meal' | 'after_meal' | '';
  note?: string;
}

// Emergency contact entry
export interface EmergencyContact {
  name: string;
  relation: string;
  phone: string;
}

export interface IntakeLabel {
  label_id: string;
  label_name: string;
}

export interface ResidentLabel {
  resident_id: string;
  label_id: string;
  intake_label?: IntakeLabel;
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
  purpose_of_stay?: string; // จุดประสงค์การเข้าพัก
  check_in_date: string;
  expected_check_out_date?: string; // วันที่คาดว่าจะออก
  room_id?: string;
  floor?: number;
  profile_image?: string;

  // Medical Info
  pre_existing_conditions?: string; // โรคประจำตัว
  pre_existing_conditions_notes?: string; // หมายเหตุโรคประจำตัว
  medications?: Medication[]; // ยาที่ใช้ประจำ
  surgical_history?: string; // ประวัติการผ่าตัด
  adl_score?: number; // ADL score
  resuscitation_status?: "CPR" | "DNR"; // CPR/DNR

  // Emergency Info
  preferred_emergency_hospital?: string; // โรงพยาบาลกรณีฉุกเฉิน
  emergency_hospital_phone?: string;
  emergency_contacts?: EmergencyContact[];
  resident_labels?: ResidentLabel[];

  // Legacy fields
  phone_number?: string;
  address?: string;
  blood_type?: string;
  allergies?: string; // combined allergies (legacy)
  medical_conditions?: string; // (legacy)
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
  purpose_of_stay?: string;
  check_in_date: string;
  expected_check_out_date?: string;
  status: string;
  room_id: string;
  floor?: number;
  profile_image?: string;

  // Medical Info
  pre_existing_conditions?: string;
  pre_existing_conditions_notes?: string;
  medications?: Medication[];
  surgical_history?: string;
  adl_score?: number;
  resuscitation_status?: "CPR" | "DNR";

  // Emergency Info
  preferred_emergency_hospital?: string;
  emergency_hospital_phone?: string;
  emergency_contacts?: EmergencyContact[];

  // Legacy
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
