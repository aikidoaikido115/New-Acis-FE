import apiClient, { ApiResponse } from '@/lib/axios.ts/api-client';
import type { Resident, CreateResidentRequest } from '@/types/resident';

class ResidentService {
  /**
   * Get all residents
   * GET /api/emr/residents/all
   */
  async getAll(): Promise<Resident[]> {
    const response = await apiClient.get<ApiResponse<Resident[]>>('/api/emr/residents/all');
    return response.data.result;
  }

  /**
   * Get residents by room ID
   * GET /api/emr/residents?room_id={id}
   */
  async getByRoom(roomId: string): Promise<Resident[]> {
    const response = await apiClient.get<ApiResponse<Resident[]>>(
      `/api/emr/residents?room_id=${encodeURIComponent(roomId)}`
    );
    return response.data.result;
  }

  /**
   * Get resident by ID
   * GET /api/emr/residents/{id}
   */
  async getById(id: string): Promise<Resident> {
    const response = await apiClient.get<ApiResponse<Resident>>(`/api/emr/residents/${id}`);
    return response.data.result;
  }

  /**
   * Create a new resident
   * POST /api/emr/residents
   */
  async create(data: CreateResidentRequest | FormData): Promise<Resident> {
    const isFormData = data instanceof FormData;
    const response = await apiClient.post<ApiResponse<Resident>>(
      '/api/emr/residents',
      data,
      isFormData
        ? {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        : undefined
    );
    return response.data.result;
  }

  /**
   * Update resident
   * PATCH /api/emr/residents/{id}
   */
  async update(id: string, data: Partial<CreateResidentRequest> | FormData): Promise<Resident> {
    const isFormData = data instanceof FormData;
    const response = await apiClient.patch<ApiResponse<Resident>>(
      `/api/emr/residents/${id}`,
      data,
      isFormData
        ? {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        : undefined
    );
    return response.data.result;
  }
}

export const residentService = new ResidentService();
export default residentService;
