import apiClient, { ApiResponse } from '@/lib/axios.ts/api-client';
import type {
  LaboratoryValue,
  LaboratoryValueOverviewQuery,
  LaboratoryValueOverviewResult,
  UpsertLaboratoryValueRequest,
  UpdateLaboratoryValueRequest,
} from '@/types/laboratory-value';

class LaboratoryValueService {
  private toOverviewResult(result: unknown): LaboratoryValueOverviewResult {
    if (Array.isArray(result)) {
      const items = result as LaboratoryValue[];
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
    const items = Array.isArray(record.items) ? (record.items as LaboratoryValue[]) : [];
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

  async getOverview(query: LaboratoryValueOverviewQuery = {}): Promise<LaboratoryValueOverviewResult> {
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

    if (query.label_ids?.length) {
      query.label_ids.forEach((labelId) => params.append('label_ids', labelId));
    }

    if (query.laboratory_value_status) {
      params.append('laboratory_value_status', query.laboratory_value_status);
    }

    if (typeof query.page === 'number') {
      params.append('page', String(query.page));
    }

    if (typeof query.page_size === 'number') {
      params.append('page_size', String(query.page_size));
    }

    const qs = params.toString();
    const url = qs ? `/api/emr/laboratory-values/overview?${qs}` : '/api/emr/laboratory-values/overview';

    const response = await apiClient.get<ApiResponse<unknown>>(url);
    return this.toOverviewResult(response.data.result);
  }

  async create(payload: UpsertLaboratoryValueRequest): Promise<LaboratoryValue> {
    const response = await apiClient.post<ApiResponse<LaboratoryValue>>('/api/emr/laboratory-values', payload);
    return response.data.result;
  }

  async getHistory(residentId: string): Promise<LaboratoryValue[]> {
    const response = await apiClient.get<ApiResponse<LaboratoryValue[]>>(
      `/api/emr/laboratory-values/history/${encodeURIComponent(residentId)}`
    );
    return response.data.result;
  }

  async updateById(id: string, payload: UpdateLaboratoryValueRequest): Promise<LaboratoryValue> {
    const response = await apiClient.patch<ApiResponse<LaboratoryValue>>(
      `/api/emr/laboratory-values/${encodeURIComponent(id)}`,
      payload
    );
    return response.data.result;
  }
}

export const laboratoryValueService = new LaboratoryValueService();
export default laboratoryValueService;
