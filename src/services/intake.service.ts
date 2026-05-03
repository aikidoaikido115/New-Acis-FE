import apiClient, { ApiResponse } from '@/lib/axios.ts/api-client';
import type {
  IntakeLabel,
  ResidentLabel,
  CreateResidentIntakeLabelsRequest,
} from '@/types/intake';

class IntakeService {
  /**
   * Get all intake labels
   * GET /api/emr/intake-labels/all
   */
  async getAllLabels(): Promise<IntakeLabel[]> {
    const response = await apiClient.get<ApiResponse<IntakeLabel[]>>('/api/emr/intake-labels/all');
    return response.data.result;
  }

  /**
   * Get intake labels by resident ID
   * GET /api/emr/intake-labels?resident_id={id}
   */
  async getLabelsByResident(residentId: string): Promise<ResidentLabel[]> {
    const response = await apiClient.get<ApiResponse<ResidentLabel[]>>(
      `/api/emr/intake-labels?resident_id=${residentId}`
    );
    return response.data.result;
  }

  /**
   * Create intake labels for resident
   * POST /api/emr/intake-labels
   */
  async createResidentLabels(data: CreateResidentIntakeLabelsRequest): Promise<ResidentLabel[]> {
    const response = await apiClient.post<ApiResponse<ResidentLabel[]>>('/api/emr/intake-labels', data);
    return response.data.result;
  }

  // Backward-compatible alias
  async createLabel(data: CreateResidentIntakeLabelsRequest): Promise<ResidentLabel[]> {
    return this.createResidentLabels(data);
  }
}

export const intakeService = new IntakeService();
export default intakeService;
