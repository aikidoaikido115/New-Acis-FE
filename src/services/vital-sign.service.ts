import apiClient, { ApiResponse } from '@/lib/axios.ts/api-client';
import type { VitalSign, VitalSignOverviewQuery } from '@/types/vital-sign';

class VitalSignService {
  async getOverview(query: VitalSignOverviewQuery = {}): Promise<VitalSign[]> {
    const params = new URLSearchParams();

    if (typeof query.floor === 'number') {
      params.append('floor', String(query.floor));
    }

    if (query.vitalsign_status) {
      params.append('vitalsign_status', query.vitalsign_status);
    }

    if (query.label_ids?.length) {
      query.label_ids.forEach((labelId) => params.append('label_ids', labelId));
    }

    const qs = params.toString();
    const url = qs ? `/api/emr/vital-signs/overview?${qs}` : '/api/emr/vital-signs/overview';

    const response = await apiClient.get<ApiResponse<VitalSign[]>>(url);
    return response.data.result;
  }

  async getByResidentToday(residentId: string, isLatest = false): Promise<VitalSign[]> {
    const response = await apiClient.get<ApiResponse<VitalSign[]>>(
      `/api/emr/vital-signs/resident?resident_id=${encodeURIComponent(residentId)}&is_latest=${String(isLatest)}`
    );
    return response.data.result;
  }

  async getHistory(residentId: string): Promise<VitalSign[]> {
    const response = await apiClient.get<ApiResponse<VitalSign[]>>(
      `/api/emr/vital-signs/history/${encodeURIComponent(residentId)}`
    );
    return response.data.result;
  }
}

export const vitalSignService = new VitalSignService();
export default vitalSignService;
