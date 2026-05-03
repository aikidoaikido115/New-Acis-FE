import apiClient, { ApiResponse } from '@/lib/axios.ts/api-client';
import type { Activity, CreateActivityRequest, UpdateActivityRequest } from '@/types/activity';

class ActivityService {
  /**
   * Get all activities
   * GET /api/activities
   */
  async getAll(): Promise<Activity[]> {
    const response = await apiClient.get<ApiResponse<Activity[]>>('/api/activities');
    return response.data.result;
  }

  /**
   * Create activity
   * POST /api/activities
   */
  async create(payload: CreateActivityRequest): Promise<Activity> {
    const response = await apiClient.post<ApiResponse<Activity>>('/api/activities', payload);
    return response.data.result;
  }

  /**
   * Update activity
   * PATCH /api/activities/{id}
   */
  async update(id: string, payload: UpdateActivityRequest): Promise<Activity> {
    const response = await apiClient.patch<ApiResponse<Activity>>(`/api/activities/${id}`, payload);
    return response.data.result;
  }

  /**
   * Delete activity
   * DELETE /api/activities/{id}
   */
  async remove(id: string): Promise<void> {
    await apiClient.delete<ApiResponse<null>>(`/api/activities/${id}`);
  }
}

export const activityService = new ActivityService();
export default activityService;
