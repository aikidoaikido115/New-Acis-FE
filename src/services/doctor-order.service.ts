import apiClient, { ApiResponse } from '@/lib/axios.ts/api-client';
import type { DoctorOrder } from '@/types/emr-notes';

function buildDateQuery(dateInput?: string): string {
  return dateInput ? `?date=${encodeURIComponent(dateInput)}` : '';
}

export interface CreateDoctorOrderRequest {
  resident_id: string;
  order_date?: string;
  order_type?: string;
  title: string;
  details?: string;
  start_date?: string;
  end_date?: string;
  frequency?: string;
  ordered_by?: string;
}

export interface UpdateDoctorOrderRequest {
  order_date?: string;
  order_type?: string;
  title?: string;
  details?: string;
  start_date?: string;
  end_date?: string;
  frequency?: string;
  ordered_by?: string;
}

class DoctorOrderService {
  async getOverview(dateInput?: string): Promise<DoctorOrder[]> {
    const response = await apiClient.get<ApiResponse<DoctorOrder[]>>(`/api/emr/doctor-orders/overview${buildDateQuery(dateInput)}`);
    return response.data.result;
  }

  async getByResidentAll(residentId: string, dateInput?: string): Promise<DoctorOrder[]> {
    const response = await apiClient.get<ApiResponse<DoctorOrder[]>>(
      `/api/emr/doctor-orders/resident/all?resident_id=${encodeURIComponent(residentId)}${dateInput ? `&date=${encodeURIComponent(dateInput)}` : ''}`
    );
    return response.data.result;
  }

  async create(payload: CreateDoctorOrderRequest): Promise<DoctorOrder> {
    const response = await apiClient.post<ApiResponse<DoctorOrder>>('/api/emr/doctor-orders', payload);
    return response.data.result;
  }

  async updateById(id: string, payload: UpdateDoctorOrderRequest): Promise<DoctorOrder> {
    const response = await apiClient.patch<ApiResponse<DoctorOrder>>(`/api/emr/doctor-orders/${id}`, payload);
    return response.data.result;
  }

  async deleteById(id: string): Promise<void> {
    await apiClient.delete<ApiResponse<null>>(`/api/emr/doctor-orders/${id}`);
  }
}

export const doctorOrderService = new DoctorOrderService();
export default doctorOrderService;
