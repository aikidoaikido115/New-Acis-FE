import apiClient, { ApiResponse } from '@/lib/axios.ts/api-client';
import type { ResidentStats, GenderStats } from '@/types/dashboard';

class DashboardService {
  /**
   * Get resident count stats for dashboard
   * GET /api/emr/dashboard/residents
   */
  async getResidentStats(): Promise<ResidentStats> {
    const response = await apiClient.get<ApiResponse<ResidentStats>>(
      '/api/emr/dashboard/residents'
    );
    return response.data.result;
  }

  /**
   * Get gender stats for dashboard pie chart
   * GET /api/emr/dashboard/resident-gender-stats
   */
  async getGenderStats(): Promise<GenderStats> {
    const response = await apiClient.get<ApiResponse<GenderStats>>(
      '/api/emr/dashboard/resident-gender-stats'
    );
    return response.data.result;
  }
}

export const dashboardService = new DashboardService();
export default dashboardService;
