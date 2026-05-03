import apiClient, { ApiResponse } from '@/lib/axios.ts/api-client';
import type { ActivityAttendance, UpsertActivityAttendanceRequest } from '@/types/activity-attendance';

class ActivityAttendanceService {
  /**
   * Get attendance by schedule ID
   * GET /api/activities/schedules/{schedule_id}/attendance
   */
  async getByScheduleId(scheduleId: string): Promise<ActivityAttendance> {
    const response = await apiClient.get<ApiResponse<ActivityAttendance>>(
      `/api/activities/schedules/${scheduleId}/attendance`
    );
    return response.data.result;
  }

  /**
   * Upsert attendance by schedule ID
   * POST /api/activities/schedules/{schedule_id}/attendance
   */
  async upsert(scheduleId: string, payload: UpsertActivityAttendanceRequest): Promise<ActivityAttendance> {
    const response = await apiClient.post<ApiResponse<ActivityAttendance>>(
      `/api/activities/schedules/${scheduleId}/attendance`,
      payload
    );
    return response.data.result;
  }
}

export const activityAttendanceService = new ActivityAttendanceService();
export default activityAttendanceService;
