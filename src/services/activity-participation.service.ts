import apiClient, { ApiResponse } from '@/lib/axios.ts/api-client';
import type {
  ActivityParticipation,
  BulkUpdateParticipationRequest,
  CreateActivityParticipationRequest,
  ResidentByScheduleResponse,
  ResidentsByScheduleQuery,
  UpdateActivityParticipationRequest,
} from '@/types/activity-participation';

const buildResidentsQuery = (query?: ResidentsByScheduleQuery) => {
  if (!query) return '';
  const params = new URLSearchParams();
  if (query.search) params.set('search', query.search);
  if (typeof query.floor === 'number') params.set('floor', String(query.floor));
  if (query.label_ids && query.label_ids.length > 0) {
    query.label_ids.forEach((labelId) => params.append('label_ids', labelId));
  }
  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
};

const buildParticipationFormData = (
  payload: CreateActivityParticipationRequest | UpdateActivityParticipationRequest,
  files?: File[],
  includeKeys?: { residentId?: string; asId?: string }
) => {
  const formData = new FormData();
  if (includeKeys?.residentId) {
    formData.append('resident_id', includeKeys.residentId);
  }
  if (includeKeys?.asId) {
    formData.append('as_id', includeKeys.asId);
  }
  if (typeof payload.is_participating === 'boolean') {
    formData.append('is_participating', String(payload.is_participating));
  }
  if (files && files.length > 0) {
    files.forEach((file) => formData.append('file', file));
  }
  return formData;
};

class ActivityParticipationService {
  /**
   * Get all participations
   * GET /api/activity-participations
   */
  async getAll(): Promise<ActivityParticipation[]> {
    const response = await apiClient.get<ApiResponse<ActivityParticipation[]>>('/api/activity-participations');
    return response.data.result;
  }

  /**
   * Get participation by resident ID and schedule ID
   * GET /api/activity-participations/{resident_id}/{as_id}
   */
  async getByCompositeKey(residentId: string, scheduleId: string): Promise<ActivityParticipation> {
    const response = await apiClient.get<ApiResponse<ActivityParticipation>>(
      `/api/activity-participations/${residentId}/${scheduleId}`
    );
    return response.data.result;
  }

  /**
   * Create participation
   * POST /api/activity-participations
   */
  async create(
    payload: CreateActivityParticipationRequest,
    files?: File[]
  ): Promise<ActivityParticipation> {
    const hasFiles = Boolean(files && files.length > 0);
    const body = hasFiles
      ? buildParticipationFormData(payload, files, { residentId: payload.resident_id, asId: payload.as_id })
      : payload;
    const response = await apiClient.post<ApiResponse<ActivityParticipation>>('/api/activity-participations', body);
    return response.data.result;
  }

  /**
   * Update participation by resident ID and schedule ID
   * PATCH /api/activity-participations/{resident_id}/{as_id}
   */
  async update(
    residentId: string,
    scheduleId: string,
    payload: UpdateActivityParticipationRequest,
    files?: File[]
  ): Promise<ActivityParticipation> {
    const hasFiles = Boolean(files && files.length > 0);
    const body = hasFiles
      ? buildParticipationFormData(payload, files)
      : payload;
    const response = await apiClient.patch<ApiResponse<ActivityParticipation>>(
      `/api/activity-participations/${residentId}/${scheduleId}`,
      body
    );
    return response.data.result;
  }

  /**
   * Delete participation by resident ID and schedule ID
   * DELETE /api/activity-participations/{resident_id}/{as_id}
   */
  async remove(residentId: string, scheduleId: string): Promise<void> {
    await apiClient.delete<ApiResponse<null>>(`/api/activity-participations/${residentId}/${scheduleId}`);
  }

  /**
   * Bulk update is_participating by resident IDs
   * PATCH /api/activity-participations/is-participating/bulk
   */
  async bulkUpdateIsParticipating(payload: BulkUpdateParticipationRequest): Promise<ActivityParticipation[]> {
    const response = await apiClient.patch<ApiResponse<ActivityParticipation[]>>(
      '/api/activity-participations/is-participating/bulk',
      payload
    );
    return response.data.result;
  }

  /**
   * Get residents by schedule ID
   * GET /api/activity-schedules/{id}/residents
   */
  async getResidentsByScheduleId(
    scheduleId: string,
    query?: ResidentsByScheduleQuery
  ): Promise<ResidentByScheduleResponse[]> {
    const queryString = buildResidentsQuery(query);
    const response = await apiClient.get<ApiResponse<ResidentByScheduleResponse[]>>(
      `/api/activity-schedules/${scheduleId}/residents${queryString}`
    );
    return response.data.result || [];
  }
}

export const activityParticipationService = new ActivityParticipationService();
export default activityParticipationService;
