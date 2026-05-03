export interface Activity {
  activity_id: string;
  staff_id: string;
  activity_name: string;
  activity_type: string;
  description?: string | null;
  location?: string | null;
}

export interface CreateActivityRequest {
  activity_name: string;
  activity_type: string;
  description?: string | null;
  location?: string | null;
}

export interface UpdateActivityRequest {
  activity_name?: string;
  activity_type?: string;
  description?: string | null;
  location?: string | null;
}
