export interface NurseNote {
  id?: string;
  nurse_note_id?: string;
  resident_id: string;
  category: string;
  content: string;
  priority: "normal" | "urgent";
  send_note: boolean;
  created_by_staff_id?: string;
  created_at: string;
  updated_at: string;
}

export interface WoundCareNote {
  id?: string;
  wound_care_note_id?: string;
  resident_id: string;
  location: string;
  wound_type: string;
  size?: string | null;
  treatment?: string | null;
  supplies?: string | null;
  status?: string | null;
  image_url?: string | null;
  note?: string | null;
  created_by_staff_id?: string;
  created_at: string;
  updated_at: string;
}

export interface RelativeNote {
  id?: string;
  relative_note_id?: string;
  resident_id: string;
  relation: string;
  content: string;
  send_note: boolean;
  created_by_staff_id?: string;
  created_at: string;
  updated_at: string;
}
