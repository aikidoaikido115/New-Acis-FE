import type { Activity } from './activity';

export interface ActivitySchedule {
  as_id: string;
  activity_id: string;
  activity_name?: string;
  activity_type?: string;
  date: string;
  start_time: string;
  end_time: string;
  series_id?: string | null;
  status?: string;
  created_at?: string;
  updated_at?: string;
  description?: string | null;
  location?: string | null;
  activity?: Activity;
  has_attendance?: boolean;
  can_check_in?: boolean;
}

export interface CreateActivityScheduleRequest {
  activity_id: string;
  date: string;
  start_time: string;
  end_time: string;
}

export interface UpdateActivityScheduleRequest {
  activity_id?: string;
  date?: string;
  start_time?: string;
  end_time?: string;
}

export interface CreateRecurringActivityScheduleRequest {
  activity_id: string;
  activity_name?: string;
  activity_type?: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  repeat_days: number[];
}

export interface CancelActivityScheduleRequest {
  activity_id: string;
  cancel_mode: "single" | "following";
}

export interface RestoreActivityScheduleRequest {
  activity_id: string;
}
