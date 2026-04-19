import type { Activity } from './activity';

export interface ActivitySchedule {
  as_id: string;
  activity_id: string;
  date: string;
  start_time: string;
  end_time: string;
  created_at?: string;
  updated_at?: string;
  activity?: Activity;
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
