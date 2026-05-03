// Intake Types
export interface IntakeLabel {
  label_id: string;
  label_name: string;
}

export interface ResidentLabel {
  resident_id: string;
  label_id: string;
  intake_label?: IntakeLabel;
  note_text?: string;
  noted_at?: string;
}

export interface ResidentIntakeLabelRequest {
  label_name: string;
  note_text?: string;
}

export interface CreateResidentIntakeLabelsRequest {
  resident_id: string;
  labels: ResidentIntakeLabelRequest[];
}
