import apiClient, { ApiResponse } from '@/lib/axios.ts/api-client';
import type { ApiPagination } from '@/types/drug-plan';

export interface PersonalDrug {
  id?: string;
  pd_id?: string;
  resident_id?: string;
  dm_id?: string;
  amount?: string;
  amount_unit?: string;
  frequency?: number;
  time_of_day?: string;
  timing?: string;
  take_type?: string;
  description?: string;
  start_date?: string | null;
  end_date?: string | null;
  created_at?: string;
  updated_at?: string;
  Resident?: {
    resident_id?: string;
    first_name?: string;
    last_name?: string;
  };
  DrugMaster?: {
    id?: string;
    dm_id?: string;
    name?: string;
    dose?: string;
  };
}

export interface PersonalDrugOverviewQuery {
  time_of_day?: string;
  take_type?: 'regular' | 'as_needed';
  search?: string;
  page?: number;
  page_size?: number;
}

export interface PersonalDrugOverviewResult {
  items: PersonalDrug[];
  pagination: ApiPagination;
}

export interface CreatePersonalDrugRequest {
  resident_id: string;
  dm_id: string;
  amount: string;
  amount_unit: string;
  frequency: number;
  time_of_day: string;
  timing: string;
  description?: string;
  take_type: 'regular' | 'as_needed';
  start_date?: string;
  end_date?: string;
}

export interface UpdatePersonalDrugRequest {
  resident_id?: string;
  dm_id?: string;
  amount?: string;
  amount_unit?: string;
  frequency?: number;
  time_of_day?: string;
  timing?: string;
  description?: string;
  take_type?: 'regular' | 'as_needed';
  start_date?: string;
  end_date?: string;
}

class PersonalDrugService {
  private toOverviewResult(result: unknown): PersonalDrugOverviewResult {
    const record = (result && typeof result === 'object')
      ? (result as Record<string, unknown>)
      : {};
    const items = Array.isArray(record.items) ? (record.items as PersonalDrug[]) : [];
    const rawPagination = (record.pagination && typeof record.pagination === 'object')
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

  async getOverview(query: PersonalDrugOverviewQuery = {}): Promise<PersonalDrugOverviewResult> {
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
    const url = qs ? `/api/emr/personal-drugs/overview?${qs}` : '/api/emr/personal-drugs/overview';
    const response = await apiClient.get<ApiResponse<PersonalDrugOverviewResult>>(url);
    return this.toOverviewResult(response.data.result);
  }

  async getByResidentToday(residentId: string): Promise<PersonalDrug[]> {
    const response = await apiClient.get<ApiResponse<PersonalDrug[]>>(
      `/api/emr/personal-drugs/resident?resident_id=${encodeURIComponent(residentId)}`
    );
    return response.data.result;
  }

  async getByResidentAll(residentId: string): Promise<PersonalDrug[]> {
    const response = await apiClient.get<ApiResponse<PersonalDrug[]>>(
      `/api/emr/personal-drugs/resident/all?resident_id=${encodeURIComponent(residentId)}`
    );
    return response.data.result;
  }

  async getById(id: string): Promise<PersonalDrug> {
    const response = await apiClient.get<ApiResponse<PersonalDrug>>(`/api/emr/personal-drugs/${id}`);
    return response.data.result;
  }

  async create(payload: CreatePersonalDrugRequest): Promise<PersonalDrug> {
    const response = await apiClient.post<ApiResponse<PersonalDrug>>('/api/emr/personal-drugs', payload);
    return response.data.result;
  }

  async updateById(id: string, payload: UpdatePersonalDrugRequest): Promise<PersonalDrug> {
    const response = await apiClient.patch<ApiResponse<PersonalDrug>>(`/api/emr/personal-drugs/${id}`, payload);
    return response.data.result;
  }

  async deleteById(id: string): Promise<void> {
    await apiClient.delete<ApiResponse<null>>(`/api/emr/personal-drugs/${id}`);
  }
}

export const personalDrugService = new PersonalDrugService();
export default personalDrugService;