import apiClient, { ApiResponse } from "@/lib/axios.ts/api-client";

export interface ResidentAllergyItem {
  allergy_name?: string;
  note_text?: string | null;
  allergy?: {
    allergy_name?: string;
  };
}

export interface CreateAllergyByResidentRequest {
  resident_id: string;
  allergies: Array<{ allergy_name: string; note_text?: string }>;
}

class AllergyService {
  async getByResident(residentId: string): Promise<ResidentAllergyItem[]> {
    const response = await apiClient.get<ApiResponse<ResidentAllergyItem[]>>(
      `/api/emr/allergies?resident_id=${encodeURIComponent(residentId)}`
    );
    return response.data.result || [];
  }

  async createByResident(residentId: string, allergies: Array<{ allergy_name: string; note_text?: string }>) {
    const payload: CreateAllergyByResidentRequest = { resident_id: residentId, allergies };
    const response = await apiClient.post<ApiResponse<ResidentAllergyItem[]>>("/api/emr/allergies", payload);
    return response.data.result || [];
  }
}

export const allergyService = new AllergyService();
export default allergyService;
