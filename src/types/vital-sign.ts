import type { ApiPagination } from './drug-plan';

export interface VitalSign {
  vital_sign_id: string;
  resident_id: string;
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
  floor?: number;
  label_ids?: string[];
  vitalsign_status?: "all" | "normal" | "abnormal";
  page?: number;
  page_size?: number;
}

export interface VitalSignOverviewResult {
  items: VitalSign[];
  pagination: ApiPagination;
}
