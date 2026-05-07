export interface DrugMasterRef {
  id?: string;
  dm_id?: string;
  name?: string;
  dose?: string;
}

export interface PersonalDrugRef {
  id?: string;
  pd_id?: string;
  resident_id?: string;
  time_of_day?: string;
  timing?: string;
  take_type?: string;
  amount?: string;
  amount_unit?: string;
  description?: string;
  Resident?: {
    resident_id?: string;
    first_name?: string;
    last_name?: string;
  };
  DrugMaster?: DrugMasterRef;
}

export interface DrugPlan {
  id?: string;
  dpln_id?: string;
  pd_id: string;
  is_taken: boolean;
  taken_at?: string | null;
  given_by_staff_id?: string;
  is_omitted?: boolean | null;
  omitted_reason?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  PersonalDrug?: PersonalDrugRef;
}

export interface DrugPlanOverviewQuery {
  time_of_day?: string;
  take_type?: "regular" | "as_needed";
  search?: string;
}

export interface ApiPagination {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
}

export interface DrugPlanOverviewResult {
  items: DrugPlan[];
  pagination: ApiPagination;
}

export type DrugAdministrationStatus = "taken" | "omitted" | "pending";

export interface DrugAdministrationHistoryItem {
  drug_plan_id: string;
  action_at?: string | null;
  resident_name: string;
  drug_name: string;
  drug_dose: string;
  status: DrugAdministrationStatus;
  note?: string | null;
  given_by_staff_name?: string | null;
  time_of_day: string;
}

export interface DrugAdministrationHistoryResult {
  items: DrugAdministrationHistoryItem[];
  pagination: ApiPagination;
}