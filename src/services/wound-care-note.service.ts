import apiClient, { ApiResponse } from '@/lib/axios.ts/api-client';
import type { WoundCareNote } from '@/types/emr-notes';

export interface CreateWoundCareNoteRequest {
  resident_id: string;
  location: string;
  wound_type: string;
  size?: string;
  treatment?: string;
  supplies?: string;
  status?: string;
  image_url?: string;
  note?: string;
}

export interface UpdateWoundCareNoteRequest {
  location?: string;
  wound_type?: string;
  size?: string;
  treatment?: string;
  supplies?: string;
  status?: string;
  image_url?: string;
  note?: string;
}

class WoundCareNoteService {
  async getOverview(): Promise<WoundCareNote[]> {
    const response = await apiClient.get<ApiResponse<WoundCareNote[]>>('/api/emr/wound-care-notes/overview');
    return response.data.result;
  }

  async getByResidentAll(residentId: string): Promise<WoundCareNote[]> {
    const response = await apiClient.get<ApiResponse<WoundCareNote[]>>(
      `/api/emr/wound-care-notes/resident/all?resident_id=${encodeURIComponent(residentId)}`
    );
    return response.data.result;
  }

  async create(payload: CreateWoundCareNoteRequest): Promise<WoundCareNote> {
    const response = await apiClient.post<ApiResponse<WoundCareNote>>('/api/emr/wound-care-notes', payload);
    return response.data.result;
  }

  async updateById(id: string, payload: UpdateWoundCareNoteRequest): Promise<WoundCareNote> {
    const response = await apiClient.patch<ApiResponse<WoundCareNote>>(`/api/emr/wound-care-notes/${id}`, payload);
    return response.data.result;
  }

  async deleteById(id: string): Promise<void> {
    await apiClient.delete<ApiResponse<null>>(`/api/emr/wound-care-notes/${id}`);
  }
}

export const woundCareNoteService = new WoundCareNoteService();
export default woundCareNoteService;
