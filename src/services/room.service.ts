import apiClient, { ApiResponse } from '@/lib/axios.ts/api-client';
import type { Room, CreateRoomRequest } from '@/types/room';

class RoomService {
  /**
   * Get all rooms
   * GET /api/emr/rooms
   */
  async getAll(): Promise<Room[]> {
    const response = await apiClient.get<ApiResponse<Room[]>>('/api/emr/rooms');
    return response.data.result;
  }

  /**
   * Get room by ID
   * GET /api/emr/rooms/{id}
   */
  async getById(id: string): Promise<Room> {
    const response = await apiClient.get<ApiResponse<Room>>(`/api/emr/rooms/${id}`);
    return response.data.result;
  }

  /**
   * Create a new room
   * POST /api/emr/rooms
   */
  async create(data: CreateRoomRequest): Promise<Room> {
    const response = await apiClient.post<ApiResponse<Room>>('/api/emr/rooms', data);
    return response.data.result;
  }

  /**
   * Update room
   * PATCH /api/emr/rooms/{id}
   */
  async update(id: string, data: Partial<CreateRoomRequest>): Promise<Room> {
    const response = await apiClient.patch<ApiResponse<Room>>(`/api/emr/rooms/${id}`, data);
    return response.data.result;
  }
}

export const roomService = new RoomService();
export default roomService;
