import apiClient, { ApiResponse } from '@/lib/axios.ts/api-client';
import type { RelativeNote } from '@/types/emr-notes';

export interface CreateRelativeNoteRequest {
  resident_id: string;
  relation: string;
  content: string;
  send_note?: boolean;
}

export interface UpdateRelativeNoteRequest {
  relation?: string;
  content?: string;
  send_note?: boolean;
}

class RelativeNoteService {
  async getOverview(): Promise<RelativeNote[]> {
    const response = await apiClient.get<ApiResponse<RelativeNote[]>>('/api/emr/relative-notes/overview');
    return response.data.result;
  }

  async getByResidentAll(residentId: string): Promise<RelativeNote[]> {
    const response = await apiClient.get<ApiResponse<RelativeNote[]>>(
      `/api/emr/relative-notes/resident/all?resident_id=${encodeURIComponent(residentId)}`
    );
    return response.data.result;
  }

  async create(payload: CreateRelativeNoteRequest): Promise<RelativeNote> {
    const response = await apiClient.post<ApiResponse<RelativeNote>>('/api/emr/relative-notes', payload);
    return response.data.result;
  }

  async updateById(id: string, payload: UpdateRelativeNoteRequest): Promise<RelativeNote> {
    const response = await apiClient.patch<ApiResponse<RelativeNote>>(`/api/emr/relative-notes/${id}`, payload);
    return response.data.result;
  }

  async deleteById(id: string): Promise<void> {
    await apiClient.delete<ApiResponse<null>>(`/api/emr/relative-notes/${id}`);
  }
}

export const relativeNoteService = new RelativeNoteService();
export default relativeNoteService;
