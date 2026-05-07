import apiClient, { ApiResponse } from '@/lib/axios.ts/api-client';
import type {
  ApiPagination,
  DrugAdministrationHistoryResult,
  DrugAdministrationStatus,
  DrugPlan,
  DrugPlanOverviewQuery,
  DrugPlanOverviewResult,
} from '@/types/drug-plan';

export interface CreateDrugPlanRequest {
  pd_id: string;
  given_by_staff_id: string;
  is_taken?: boolean;
  taken_at?: string;
  is_omitted?: boolean;
  omitted_reason?: string;
  notes?: string;
}

export interface UpdateDrugPlanRequest {
  pd_id?: string;
  given_by_staff_id?: string;
  is_taken?: boolean;
  taken_at?: string;
  is_omitted?: boolean;
  omitted_reason?: string;
  notes?: string;
}

export interface StaffActionRequest {
  staff_first_name: string;
  staff_last_name: string;
  note?: string;
}

export interface OmitDrugPlanRequest extends StaffActionRequest {
  omitted_reason: string;
}

export interface OmitDrugPlansByResidentRequest extends StaffActionRequest {
  omitted_reason: string;
}

export interface DrugAdministrationHistoryQuery {
  date?: string;
  time_of_day?: string;
  status?: DrugAdministrationStatus;
  search?: string;
  page?: number;
  page_size?: number;
}

class DrugPlanService {
  private toPagination(raw: unknown, fallbackTotalItems: number): ApiPagination {
    if (!raw || typeof raw !== 'object') {
      return {
        page: 1,
        page_size: Math.max(fallbackTotalItems, 1),
        total_items: fallbackTotalItems,
        total_pages: fallbackTotalItems > 0 ? 1 : 0,
      };
    }

    const record = raw as Record<string, unknown>;
    const page = typeof record.page === 'number' ? record.page : 1;
    const pageSize = typeof record.page_size === 'number' ? record.page_size : Math.max(fallbackTotalItems, 1);
    const totalItems = typeof record.total_items === 'number' ? record.total_items : fallbackTotalItems;
    const totalPages = typeof record.total_pages === 'number'
      ? record.total_pages
      : (totalItems > 0 ? Math.ceil(totalItems / Math.max(pageSize, 1)) : 0);

    return {
      page,
      page_size: pageSize,
      total_items: totalItems,
      total_pages: totalPages,
    };
  }

  private toOverviewResult(result: unknown): DrugPlanOverviewResult {
    if (Array.isArray(result)) {
      return {
        items: result as DrugPlan[],
        pagination: this.toPagination(undefined, result.length),
      };
    }

    const record = (result && typeof result === 'object')
      ? (result as Record<string, unknown>)
      : {};
    const items = Array.isArray(record.items) ? (record.items as DrugPlan[]) : [];

    return {
      items,
      pagination: this.toPagination(record.pagination, items.length),
    };
  }

  private toHistoryResult(result: unknown): DrugAdministrationHistoryResult {
    const record = (result && typeof result === 'object')
      ? (result as Record<string, unknown>)
      : {};
    const items = Array.isArray(record.items)
      ? (record.items as DrugAdministrationHistoryResult['items'])
      : [];

    return {
      items,
      pagination: this.toPagination(record.pagination, items.length),
    };
  }

  async getOverview(query: DrugPlanOverviewQuery = {}): Promise<DrugPlan[]> {
    const overview = await this.getOverviewPaginated(query);
    return overview.items;
  }

  async getOverviewPaginated(query: DrugPlanOverviewQuery & { page?: number; page_size?: number } = {}): Promise<DrugPlanOverviewResult> {
    const params = new URLSearchParams();

    if (query.time_of_day) {
      params.append('time_of_day', query.time_of_day);
    }
    if (query.take_type) {
      params.append('take_type', query.take_type);
    }
    if (query.search) {
      params.append('search', query.search);
    }
    if (typeof query.page === 'number') {
      params.append('page', String(query.page));
    }
    if (typeof query.page_size === 'number') {
      params.append('page_size', String(query.page_size));
    }

    const qs = params.toString();
    const url = qs ? `/api/emr/drug-plans/overview?${qs}` : '/api/emr/drug-plans/overview';
    const response = await apiClient.get<ApiResponse<DrugPlan[] | DrugPlanOverviewResult>>(url);
    return this.toOverviewResult(response.data.result);
  }

  async getByResidentAll(residentId: string): Promise<DrugPlan[]> {
    const response = await apiClient.get<ApiResponse<DrugPlan[]>>(
      `/api/emr/drug-plans/resident/all?resident_id=${encodeURIComponent(residentId)}`
    );
    return response.data.result;
  }

  async getByResidentToday(residentId: string): Promise<DrugPlan[]> {
    const response = await apiClient.get<ApiResponse<DrugPlan[]>>(
      `/api/emr/drug-plans/resident?resident_id=${encodeURIComponent(residentId)}`
    );
    return response.data.result;
  }

  async getAdministrationHistory(query: DrugAdministrationHistoryQuery = {}): Promise<DrugAdministrationHistoryResult> {
    const params = new URLSearchParams();

    if (query.date) {
      params.append('date', query.date);
    }
    if (query.time_of_day) {
      params.append('time_of_day', query.time_of_day);
    }
    if (query.status) {
      params.append('status', query.status);
    }
    if (query.search) {
      params.append('search', query.search);
    }
    if (typeof query.page === 'number') {
      params.append('page', String(query.page));
    }
    if (typeof query.page_size === 'number') {
      params.append('page_size', String(query.page_size));
    }

    const qs = params.toString();
    const url = qs ? `/api/emr/drug-plans/history?${qs}` : '/api/emr/drug-plans/history';
    const response = await apiClient.get<ApiResponse<DrugAdministrationHistoryResult>>(url);
    return this.toHistoryResult(response.data.result);
  }

  async create(payload: CreateDrugPlanRequest): Promise<DrugPlan> {
    const response = await apiClient.post<ApiResponse<DrugPlan>>('/api/emr/drug-plans', payload);
    return response.data.result;
  }

  async updateById(id: string, payload: UpdateDrugPlanRequest): Promise<DrugPlan> {
    const response = await apiClient.patch<ApiResponse<DrugPlan>>(`/api/emr/drug-plans/${id}`, payload);
    return response.data.result;
  }

  async takeById(id: string, payload: StaffActionRequest): Promise<DrugPlan> {
    const response = await apiClient.patch<ApiResponse<DrugPlan>>(`/api/emr/drug-plans/${id}/take`, payload);
    return response.data.result;
  }

  async omitById(id: string, payload: OmitDrugPlanRequest): Promise<DrugPlan> {
    const response = await apiClient.patch<ApiResponse<DrugPlan>>(`/api/emr/drug-plans/${id}/omit`, payload);
    return response.data.result;
  }

  async takeByResidentToday(residentId: string, payload: StaffActionRequest): Promise<DrugPlan[]> {
    const response = await apiClient.patch<ApiResponse<DrugPlan[]>>(
      `/api/emr/drug-plans/resident/${encodeURIComponent(residentId)}/take`,
      payload
    );
    return response.data.result;
  }

  async omitByResidentToday(residentId: string, payload: OmitDrugPlansByResidentRequest): Promise<DrugPlan[]> {
    const response = await apiClient.patch<ApiResponse<DrugPlan[]>>(
      `/api/emr/drug-plans/resident/${encodeURIComponent(residentId)}/omit`,
      payload
    );
    return response.data.result;
  }

  async deleteById(id: string): Promise<void> {
    await apiClient.delete<ApiResponse<null>>(`/api/emr/drug-plans/${id}`);
  }
}

export const drugPlanService = new DrugPlanService();
export default drugPlanService;