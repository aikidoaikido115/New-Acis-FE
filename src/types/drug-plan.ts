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