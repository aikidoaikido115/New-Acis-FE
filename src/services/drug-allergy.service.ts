import apiClient, { ApiResponse } from "@/lib/axios.ts/api-client";

export interface ResidentDrugAllergyItem {
  allergy_name?: string;
  note_text?: string | null;
  drug_allergy?: {
    allergy_name?: string;
  };
}

export interface CreateDrugAllergyByResidentRequest {
  resident_id: string;
  drug_allergies: Array<{ allergy_name: string; note_text?: string }>;
}

class DrugAllergyService {
  async getByResident(residentId: string): Promise<ResidentDrugAllergyItem[]> {
    const response = await apiClient.get<ApiResponse<ResidentDrugAllergyItem[]>>(
      `/api/emr/drug-allergies?resident_id=${encodeURIComponent(residentId)}`
    );
    return response.data.result || [];
  }

  async createByResident(residentId: string, drugAllergies: Array<{ allergy_name: string; note_text?: string }>) {
    const payload: CreateDrugAllergyByResidentRequest = { resident_id: residentId, drug_allergies: drugAllergies };
    const response = await apiClient.post<ApiResponse<ResidentDrugAllergyItem[]>>("/api/emr/drug-allergies", payload);
    return response.data.result || [];
  }
}

export const drugAllergyService = new DrugAllergyService();
export default drugAllergyService;
