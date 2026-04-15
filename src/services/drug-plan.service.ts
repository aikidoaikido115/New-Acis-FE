import apiClient, { ApiResponse } from '@/lib/axios.ts/api-client';
import type { DrugPlan, DrugPlanOverviewQuery } from '@/types/drug-plan';

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

class DrugPlanService {
  async getOverview(query: DrugPlanOverviewQuery = {}): Promise<DrugPlan[]> {
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

    const qs = params.toString();
    const url = qs ? `/api/emr/drug-plans/overview?${qs}` : '/api/emr/drug-plans/overview';
    const response = await apiClient.get<ApiResponse<DrugPlan[]>>(url);
    return response.data.result;
  }

  async getByResidentAll(residentId: string): Promise<DrugPlan[]> {
    const response = await apiClient.get<ApiResponse<DrugPlan[]>>(
      `/api/emr/drug-plans/resident/all?resident_id=${encodeURIComponent(residentId)}`
    );
    return response.data.result;
  }

  async create(payload: CreateDrugPlanRequest): Promise<DrugPlan> {
    const response = await apiClient.post<ApiResponse<DrugPlan>>('/api/emr/drug-plans', payload);
    return response.data.result;
  }

  async updateById(id: string, payload: UpdateDrugPlanRequest): Promise<DrugPlan> {
    const response = await apiClient.patch<ApiResponse<DrugPlan>>(`/api/emr/drug-plans/${id}`, payload);
    return response.data.result;
  }

  async deleteById(id: string): Promise<void> {
    await apiClient.delete<ApiResponse<null>>(`/api/emr/drug-plans/${id}`);
  }
}

export const drugPlanService = new DrugPlanService();
export default drugPlanService;