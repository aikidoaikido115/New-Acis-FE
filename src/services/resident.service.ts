import apiClient, { ApiResponse } from '@/lib/axios.ts/api-client';
import type {
  Resident,
  CreateResidentRequest,
  ResidentOverviewListResponse,
} from '@/types/resident';

const parseDateValue = (value?: string | null): Date | null => {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const isResidentStatusActive = (status?: string | null): boolean => {
  const normalized = String(status || '').trim().toLowerCase();
  if (!normalized) {
    return true;
  }
  return normalized === 'active';
};

type ResidentStatusDates = {
  status?: string | null;
  check_in_date?: string | null;
  expected_check_out_date?: string | null;
};

export const isResidentActive = (resident: ResidentStatusDates): boolean => {
  if (!isResidentStatusActive(resident.status)) {
    return false;
  }

  const now = new Date();
  const checkInDate = parseDateValue(resident.check_in_date);

  if (checkInDate && now < checkInDate) {
    return false;
  }

  return true;
};

export interface ResidentOverviewQuery {
  floor?: number;
  label_ids?: string[];
  status?: string;
  search?: string;
  page?: number;
  page_size?: number;
}

export interface RelativeMagicLinkPayload {
  resident_id: string;
  relative_id: string;
  token: string;
  magic_link: string;
  expires_at: string;
}

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
   * Get resident overview (lightweight list)
   * GET /api/emr/residents/overview
   */
  async getOverview(query: ResidentOverviewQuery = {}): Promise<ResidentOverviewListResponse> {
    const params = new URLSearchParams();
    if (typeof query.floor === 'number') {
      params.append('floor', String(query.floor));
    }
    if (query.label_ids?.length) {
      query.label_ids.forEach((labelId) => params.append('label_ids', labelId));
    }
    if (query.status) {
      params.append('status', query.status);
    }
    if (query.search) {
      params.append('search', query.search);
    }
    if (typeof query.page === 'number') {
      params.append('page', String(query.page));
    }
    if (typeof query.page_size === 'number') {
      params.append('page_size', String(query.page_size));
    }

    const qs = params.toString();
    const url = qs ? `/api/emr/residents/overview?${qs}` : '/api/emr/residents/overview';
    const response = await apiClient.get<ApiResponse<ResidentOverviewListResponse>>(url);
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

  /**
   * Get existing/active relative magic link (used for copy flow)
   * GET /api/emr/relatives/magic-link?resident_id={id}
   */
  async getRelativeMagicLink(residentId: string): Promise<RelativeMagicLinkPayload> {
    const response = await apiClient.get<ApiResponse<RelativeMagicLinkPayload>>(
      `/api/emr/relatives/magic-link?resident_id=${encodeURIComponent(residentId)}`
    );
    return response.data.result;
  }

  /**
   * Issue new relative magic link
   * POST /api/emr/relatives/magic-link/issue
   */
  async issueRelativeMagicLink(residentId: string): Promise<RelativeMagicLinkPayload> {
    const response = await apiClient.post<ApiResponse<RelativeMagicLinkPayload>>(
      "/api/emr/relatives/magic-link/issue",
      { resident_id: residentId }
    );
    return response.data.result;
  }
}

export const residentService = new ResidentService();
export default residentService;
