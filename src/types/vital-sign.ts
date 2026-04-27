import type { ApiPagination } from './drug-plan';

export interface VitalSign {
  vital_sign_id: string;
  resident_id: string;
  measurement_date?: string;
  time_of_day?: string;
  temperature?: number | null;
  heart_rate?: number | null;
  breathing_rate?: number | null;
  blood_pressure_systolic?: number | null;
  blood_pressure_diastolic?: number | null;
  oxygen_saturation?: number | null;
  created_by_staff_id?: string;
  created_at: string;
  updated_at: string;
}

export interface VitalSignOverviewQuery {
  date?: string;
  time_of_day?: string;
  floor?: number;
  label_ids?: string[];
  vitalsign_status?: "all" | "normal" | "abnormal";
  page?: number;
  page_size?: number;
}

export interface UpsertVitalSignRequest {
  resident_id: string;
  date: string;
  time_of_day: string;
  temperature?: number;
  heart_rate?: number;
  breathing_rate?: number;
  blood_pressure_systolic?: number;
  blood_pressure_diastolic?: number;
  oxygen_saturation?: number;
}

export interface UpdateVitalSignRequest {
  temperature?: number;
  heart_rate?: number;
  breathing_rate?: number;
  blood_pressure_systolic?: number;
  blood_pressure_diastolic?: number;
  oxygen_saturation?: number;
}

export interface VitalSignOverviewResult {
  items: VitalSign[];
  pagination: ApiPagination;
}
