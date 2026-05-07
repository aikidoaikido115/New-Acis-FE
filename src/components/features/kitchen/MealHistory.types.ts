export interface MealHistoryRow {
  id: string;
  date: string;
  time: string;
  menu: string;
  servings: string;
  notes: string;
  createdBy: string;
}

export interface TimeOption {
  value: string;
  label: string;
}
