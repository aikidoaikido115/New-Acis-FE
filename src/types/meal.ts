export interface Menu {
  menu_id: string;
  menu_name: string;
  description?: string;
}

export interface MealPlan {
  id: string;
  meal_plan_id?: string;
  menu_id: string;
  backup_menu_id?: string;
  main_amount: number;
  backup_amount?: number;
  meal_type: 'breakfast' | 'lunch' | 'dinner';
  is_allergy?: boolean;
  created_at?: string;
  updated_at?: string;
  created_by_staff_id?: string;
  staff_name?: string;
  menu?: Menu;
}

export interface CreateMealPlanRequest {
  menu_id: string;
  backup_menu_id?: string;
  main_amount: number;
  backup_amount?: number;
  meal_type: 'breakfast' | 'lunch' | 'dinner';
  human_in_the_loop?: boolean;
}

export interface AllergyStatDetail {
  allergy_id: string;
  allergy_name: string;
  resident_count: number;
}

export interface ResidentAllergyStats {
  total_allergic: number;
  total_not_allergic: number;
  allergy_details: AllergyStatDetail[];
}

export interface NumberOfResidents {
  total_residents: number;
}
