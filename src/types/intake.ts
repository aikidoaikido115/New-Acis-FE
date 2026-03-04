// Intake Types
export interface IntakeLabel {
  id: string;
  name: string;
  description?: string;
  color?: string;
  created_at: string;
}

export interface CreateIntakeLabelRequest {
  name: string;
  description?: string;
  color?: string;
  resident_id?: string;
}
