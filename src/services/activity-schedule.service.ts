import apiClient, { ApiResponse } from '@/lib/axios.ts/api-client';
import type {
  ActivitySchedule,
  CreateActivityScheduleRequest,
  UpdateActivityScheduleRequest,
} from '@/types/activity-schedule';

const toLocalDate = (value?: string) => {
  if (!value) return null;
  if (value.includes('T')) {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

const toLocalIsoDate = (value?: string) => {
  const date = toLocalDate(value);
  if (!date) return value;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();
};

const toLocalIsoDateTime = (dateValue?: string, timeValue?: string) => {
  if (!timeValue) return timeValue;
  if (timeValue.includes('T')) return timeValue;
  const baseDate = toLocalDate(dateValue);
  if (!baseDate) return timeValue;
  const [hoursRaw, minutesRaw, secondsRaw] = timeValue.split(':');
  const hours = Number(hoursRaw);
  const minutes = Number(minutesRaw || 0);
  const seconds = Number(secondsRaw || 0);
  if (Number.isNaN(hours) || Number.isNaN(minutes) || Number.isNaN(seconds)) {
    return timeValue;
  }
  const localDateTime = new Date(
    baseDate.getFullYear(),
    baseDate.getMonth(),
    baseDate.getDate(),
    hours,
    minutes,
    seconds
  );
  return localDateTime.toISOString();
};

const toDateKey = (value?: string) => {
  if (!value) return '';
  if (!value.includes('T')) return value;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const buildSchedulePayload = <T extends CreateActivityScheduleRequest | UpdateActivityScheduleRequest>(payload: T) => ({
  ...payload,
  ...(payload.date ? { date: toLocalIsoDate(payload.date) } : {}),
  ...(payload.start_time
    ? { start_time: toLocalIsoDateTime(payload.date, payload.start_time) }
    : {}),
  ...(payload.end_time ? { end_time: toLocalIsoDateTime(payload.date, payload.end_time) } : {}),
});

class ActivityScheduleService {
  /**
   * Get all activity schedules
   * GET /api/activity-schedules
   */
  async getAll(): Promise<ActivitySchedule[]> {
    const response = await apiClient.get<ApiResponse<ActivitySchedule[]>>('/api/activity-schedules');
    return response.data.result;
  }

  /**
   * Get activity schedules (optional date filter)
   * GET /api/activity-schedules
   */
  async getByDate(date?: string): Promise<ActivitySchedule[]> {
    const response = await this.getAll();
    if (!date) return response;
    return response.filter((item) => toDateKey(item.date) === date);
  }

  /**
   * Create activity schedule
   * POST /api/activity-schedules
   */
  async create(payload: CreateActivityScheduleRequest): Promise<ActivitySchedule> {
    const response = await apiClient.post<ApiResponse<ActivitySchedule>>(
      '/api/activity-schedules',
      buildSchedulePayload(payload)
    );
    return response.data.result;
  }

  /**
   * Update activity schedule
   * PATCH /api/activity-schedules/{id}
   */
  async update(id: string, payload: UpdateActivityScheduleRequest): Promise<ActivitySchedule> {
    const response = await apiClient.patch<ApiResponse<ActivitySchedule>>(
      `/api/activity-schedules/${id}`,
      buildSchedulePayload(payload)
    );
    return response.data.result;
  }

  /**
   * Delete activity schedule
   * DELETE /api/activity-schedules/{id}
   */
  async remove(id: string): Promise<void> {
    await apiClient.delete<ApiResponse<null>>(`/api/activity-schedules/${id}`);
  }

  /**
   * Get activity schedule by ID
    * GET /api/activity-schedules/{id}
   */
  async getById(id: string): Promise<ActivitySchedule> {
    const response = await apiClient.get<ApiResponse<ActivitySchedule>>(`/api/activity-schedules/${id}`);
    return response.data.result;
  }
}

export const activityScheduleService = new ActivityScheduleService();
export default activityScheduleService;
