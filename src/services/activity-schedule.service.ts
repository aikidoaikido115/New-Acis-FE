import apiClient, { ApiResponse } from '@/lib/axios.ts/api-client';
import type {
  ActivitySchedule,
  CreateActivityScheduleRequest,
  UpdateActivityScheduleRequest,
} from '@/types/activity-schedule';

class ActivityScheduleService {
  /**
   * Get activity schedules (optional date filter)
   * GET /api/activities/schedules?date=YYYY-MM-DD
   */
  async getByDate(date?: string): Promise<ActivitySchedule[]> {
    const url = date ? `/api/activities/schedules?date=${encodeURIComponent(date)}` : '/api/activities/schedules';
    const response = await apiClient.get<ApiResponse<ActivitySchedule[]>>(url);
    return response.data.result;
  }

  /**
   * Create activity schedule
   * POST /api/activity-schedules
   */
  async create(payload: CreateActivityScheduleRequest): Promise<ActivitySchedule> {
    const response = await apiClient.post<ApiResponse<ActivitySchedule>>('/api/activities/schedules', payload);
    return response.data.result;
  }

  /**
   * Update activity schedule
   * PATCH /api/activity-schedules/{id}
   */
  async update(id: string, payload: UpdateActivityScheduleRequest): Promise<ActivitySchedule> {
    const response = await apiClient.patch<ApiResponse<ActivitySchedule>>(`/api/activities/schedules/${id}`, payload);
    return response.data.result;
  }

  /**
   * Delete activity schedule
   * DELETE /api/activity-schedules/{id}
   */
  async remove(id: string): Promise<void> {
    await apiClient.delete<ApiResponse<null>>(`/api/activities/schedules/${id}`);
  }

  /**
   * Get activity schedule by ID
   * GET /api/activities/schedules/{id}
   */
  async getById(id: string): Promise<ActivitySchedule> {
    const response = await apiClient.get<ApiResponse<ActivitySchedule>>(`/api/activities/schedules/${id}`);
    return response.data.result;
  }
}

export const activityScheduleService = new ActivityScheduleService();
export default activityScheduleService;
