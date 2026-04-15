import apiClient, { ApiResponse } from '@/lib/axios.ts/api-client';

export interface PersonalDrug {
  id?: string;
  pd_id?: string;
  resident_id?: string;
  amount?: string;
  amount_unit?: string;
  frequency?: number;
  time_of_day?: string;
  timing?: string;
  take_type?: string;
  description?: string;
  DrugMaster?: {
    id?: string;
    dm_id?: string;
    name?: string;
    dose?: string;
  };
}

class PersonalDrugService {
  async getByResidentAll(residentId: string): Promise<PersonalDrug[]> {
    const response = await apiClient.get<ApiResponse<PersonalDrug[]>>(
      `/api/emr/personal-drugs/resident/all?resident_id=${encodeURIComponent(residentId)}`
    );
    return response.data.result;
  }
}

export const personalDrugService = new PersonalDrugService();
export default personalDrugService;