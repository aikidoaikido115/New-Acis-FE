import apiClient, { ApiResponse } from '@/lib/axios.ts/api-client';
import type { NurseNote } from '@/types/emr-notes';

function buildDateQuery(dateInput?: string): string {
  return dateInput ? `?date=${encodeURIComponent(dateInput)}` : '';
}

export interface CreateNurseNoteRequest {
  resident_id: string;
  category: string;
  content: string;
  priority: 'normal' | 'urgent';
  send_note?: boolean;
}

export interface UpdateNurseNoteRequest {
  category?: string;
  content?: string;
  priority?: 'normal' | 'urgent';
  send_note?: boolean;
}

class NurseNoteService {
  async getOverview(dateInput?: string): Promise<NurseNote[]> {
    const response = await apiClient.get<ApiResponse<NurseNote[]>>(`/api/emr/nurse-notes/overview${buildDateQuery(dateInput)}`);
    return response.data.result;
  }

  async getByResidentAll(residentId: string, dateInput?: string): Promise<NurseNote[]> {
    const response = await apiClient.get<ApiResponse<NurseNote[]>>(
      `/api/emr/nurse-notes/resident/all?resident_id=${encodeURIComponent(residentId)}${dateInput ? `&date=${encodeURIComponent(dateInput)}` : ''}`
    );
    return response.data.result;
  }

  async create(payload: CreateNurseNoteRequest): Promise<NurseNote> {
    const response = await apiClient.post<ApiResponse<NurseNote>>('/api/emr/nurse-notes', payload);
    return response.data.result;
  }

  async updateById(id: string, payload: UpdateNurseNoteRequest): Promise<NurseNote> {
    const response = await apiClient.patch<ApiResponse<NurseNote>>(`/api/emr/nurse-notes/${id}`, payload);
    return response.data.result;
  }

  async deleteById(id: string): Promise<void> {
    await apiClient.delete<ApiResponse<null>>(`/api/emr/nurse-notes/${id}`);
  }
}

export const nurseNoteService = new NurseNoteService();
export default nurseNoteService;
