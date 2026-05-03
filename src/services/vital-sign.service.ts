import apiClient, { ApiResponse } from '@/lib/axios.ts/api-client';
import type {
  UpsertVitalSignRequest,
  UpdateVitalSignRequest,
  VitalSign,
  VitalSignOverviewQuery,
  VitalSignOverviewResult,
} from '@/types/vital-sign';

class VitalSignService {
  private toOverviewResult(result: unknown): VitalSignOverviewResult {
    if (Array.isArray(result)) {
      const items = result as VitalSign[];
      return {
        items,
        pagination: {
          page: 1,
          page_size: Math.max(items.length, 1),
          total_items: items.length,
          total_pages: items.length > 0 ? 1 : 0,
        },
      };
    }

    const record = result && typeof result === 'object'
      ? (result as Record<string, unknown>)
      : {};
    const items = Array.isArray(record.items) ? (record.items as VitalSign[]) : [];
    const rawPagination = record.pagination && typeof record.pagination === 'object'
      ? (record.pagination as Record<string, unknown>)
      : {};

    return {
      items,
      pagination: {
        page: typeof rawPagination.page === 'number' ? rawPagination.page : 1,
        page_size: typeof rawPagination.page_size === 'number' ? rawPagination.page_size : Math.max(items.length, 1),
        total_items: typeof rawPagination.total_items === 'number' ? rawPagination.total_items : items.length,
        total_pages: typeof rawPagination.total_pages === 'number' ? rawPagination.total_pages : (items.length > 0 ? 1 : 0),
      },
    };
  }

  async getOverview(query: VitalSignOverviewQuery = {}): Promise<VitalSignOverviewResult> {
    const params = new URLSearchParams();

    if (query.date) {
      params.append('date', query.date);
    }

    if (query.time_of_day) {
      params.append('time_of_day', query.time_of_day);
    }

    if (typeof query.floor === 'number') {
      params.append('floor', String(query.floor));
    }

    if (query.vitalsign_status) {
      params.append('vitalsign_status', query.vitalsign_status);
    }

    if (query.label_ids?.length) {
      query.label_ids.forEach((labelId) => params.append('label_ids', labelId));
    }

    if (typeof query.page === 'number') {
      params.append('page', String(query.page));
    }

    if (typeof query.page_size === 'number') {
      params.append('page_size', String(query.page_size));
    }

    const qs = params.toString();
    const url = qs ? `/api/emr/vital-signs/overview?${qs}` : '/api/emr/vital-signs/overview';

    const response = await apiClient.get<ApiResponse<unknown>>(url);
    return this.toOverviewResult(response.data.result);
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

  async create(payload: UpsertVitalSignRequest): Promise<VitalSign> {
    const response = await apiClient.post<ApiResponse<VitalSign>>('/api/emr/vital-signs', payload);
    return response.data.result;
  }

  async updateById(id: string, payload: UpdateVitalSignRequest): Promise<VitalSign> {
    const response = await apiClient.patch<ApiResponse<VitalSign>>(
      `/api/emr/vital-signs/${encodeURIComponent(id)}`,
      payload
    );
    return response.data.result;
  }
}

export const vitalSignService = new VitalSignService();
export default vitalSignService;
