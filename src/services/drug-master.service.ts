import apiClient, { ApiResponse } from '@/lib/axios.ts/api-client';

export interface DrugMaster {
  id?: string;
  dm_id?: string;
  name: string;
  dose: string;
}

export interface CreateDrugMasterRequest {
  name: string;
  dose: string;
}

class DrugMasterService {
  async getAll(): Promise<DrugMaster[]> {
    const response = await apiClient.get<ApiResponse<DrugMaster[]>>('/api/emr/drug-masters');
    return response.data.result;
  }

  async create(payload: CreateDrugMasterRequest): Promise<DrugMaster> {
    const response = await apiClient.post<ApiResponse<DrugMaster>>('/api/emr/drug-masters', payload);
    return response.data.result;
  }
}

export const drugMasterService = new DrugMasterService();
export default drugMasterService;
