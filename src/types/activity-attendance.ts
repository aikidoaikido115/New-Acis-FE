export interface ActivityAttendance {
  attendance_id: string;
  schedule_id: string;
  can_edit: boolean;
  selected_resident_ids: string[];
  rejected_resident_ids: string[];
  photos: Record<string, string>;
  updated_at?: string;
}

export interface UpsertActivityAttendanceRequest {
  selected_resident_ids: string[];
  rejected_resident_ids: string[];
  photos: Record<string, string>;
}
