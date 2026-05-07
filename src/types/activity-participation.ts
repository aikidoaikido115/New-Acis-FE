import type { ActivitySchedule } from './activity-schedule';

export type ParticipationImage = {
  url: string;
};

export interface ActivityParticipation {
  resident_id: string;
  as_id: string;
  is_participating: boolean;
  img_urls?: ParticipationImage[];
  activity_schedule?: ActivitySchedule;
}

export interface CreateActivityParticipationRequest {
  resident_id: string;
  as_id: string;
  is_participating?: boolean;
}

export interface UpdateActivityParticipationRequest {
  is_participating?: boolean;
}

export interface BulkUpdateParticipationRequest {
  as_id: string;
  resident_ids: string[];
  is_participating: boolean;
}

export interface ResidentByScheduleResponse {
  resident_id: string;
  first_name: string;
  last_name: string;
  nickname?: string | null;
  room_number: string;
  floor: number;
  intake_labels: string[];
  is_participating: boolean;
}

export interface ResidentsByScheduleQuery {
  search?: string;
  floor?: number;
  label_ids?: string[];
}
