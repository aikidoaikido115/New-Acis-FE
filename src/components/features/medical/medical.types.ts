export type MedicationStatus = 'รอให้' | 'ให้ยา' | 'งด';
export type TimeSlot = 'เช้า' | 'กลางวัน' | 'เย็น' | 'ก่อนนอน';

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  status: MedicationStatus;
  drugPlanId: string;
  personalDrugId: string;
}

export interface PatientMedication {
  id: string;
  name: string;
  room: string;
  floor: number;
  profileImage?: string;
  allergies: string[];
  drugAllergies: string[];
  helpLevel: string;
  medications: Medication[];
  pendingCount: number;
}

export interface RoutineMedication {
  id: string;
  pdId: string;
  name: string;
  dose: string;
  frequency: string;
  note: string;
  takeType: 'regular' | 'as_needed';
  timeOfDay: string;
  timing: string;
  frequencyPerDay: number;
  amount: string;
  amountUnit: string;
  description?: string;
  dmId: string;
  startDate?: string;
  endDate?: string;
}

export interface MedicationHistory {
  id: string;
  time: string;
  actionAt?: string;
  patientName: string;
  medication: string;
  status: 'ให้แล้ว' | 'งด' | 'รอให้';
  note: string;
  givenBy: string;
}
