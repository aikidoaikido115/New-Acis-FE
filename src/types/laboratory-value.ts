import type { ApiPagination } from './drug-plan';

export interface LaboratoryValue {
  laboratory_value_id: string;
  resident_id: string;
  measurement_date?: string;
  time_of_day?: string;
  blood_glucose?: number | null;
  fluid_in?: number | null;
  fluid_out?: number | null;
  urine_output?: number | null;
  urine_type?: 'ml' | 'times' | null;
  stool?: number | null;
  diaper_change?: number | null;
  created_by_staff_id?: string;
  created_at: string;
  updated_at: string;
}

export interface LaboratoryValueOverviewQuery {
  date?: string;
  time_of_day?: string;
  floor?: number;
  label_ids?: string[];
  laboratory_value_status?: 'all' | 'normal' | 'abnormal';
  page?: number;
  page_size?: number;
}

export interface LaboratoryValueOverviewResult {
  items: LaboratoryValue[];
  pagination: ApiPagination;
}

export interface UpsertLaboratoryValueRequest {
  resident_id: string;
  date: string;
  time_of_day: string;
  blood_glucose?: number;
  fluid_in?: number;
  fluid_out?: number;
  urine_output?: number;
  urine_type?: 'ml' | 'times';
  stool?: number;
  diaper_change?: number;
}

export interface UpdateLaboratoryValueRequest {
  blood_glucose?: number;
  fluid_in?: number;
  fluid_out?: number;
  urine_output?: number;
  urine_type?: 'ml' | 'times';
  stool?: number;
  diaper_change?: number;
}
