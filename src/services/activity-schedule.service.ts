import apiClient, { ApiResponse } from '@/lib/axios.ts/api-client';
import type {
  ActivitySchedule,
  CancelActivityScheduleRequest,
  CreateActivityScheduleRequest,
  CreateRecurringActivityScheduleRequest,
  RestoreActivityScheduleRequest,
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

const parseDateKey = (value: string) => {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

const formatDateKeyLocal = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const toDayOfWeekNumber = (date: Date) => {
  const jsDay = date.getDay();
  return jsDay === 0 ? 7 : jsDay;
};

const listRecurringDateKeys = (startDate: string, endDate: string, repeatDays: number[]) => {
  const start = parseDateKey(startDate);
  const end = parseDateKey(endDate);
  if (!start || !end || end < start) return [] as string[];

  const repeatSet = new Set(repeatDays.filter((day) => day >= 1 && day <= 7));
  if (repeatSet.size === 0) return [] as string[];

  const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const endDateOnly = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  const result: string[] = [];

  while (cursor <= endDateOnly) {
    if (repeatSet.has(toDayOfWeekNumber(cursor))) {
      result.push(formatDateKeyLocal(cursor));
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return result;
};

// ปรับให้เป็น any เพื่อให้แนบ activity_name, description ผ่านไปที่ /sync ได้
const buildSchedulePayload = (payload: any) => ({
  ...payload,
  ...(payload.date ? { date: toLocalIsoDate(payload.date) } : {}),
  ...(payload.start_time
    ? { start_time: toLocalIsoDateTime(payload.date, payload.start_time) }
    : {}),
  ...(payload.end_time ? { end_time: toLocalIsoDateTime(payload.date, payload.end_time) } : {}),
});

class ActivityScheduleService {
  /**
   * ดึงข้อมูลผ่าน /sync เพื่อให้ได้ข้อมูล Activity แนบมาด้วย
   */
  async getAll(): Promise<any[]> {
    const response = await apiClient.get<ApiResponse<any[]>>('/api/activity-schedules/sync');
    return response.data.result;
  }

  async getByDate(date?: string): Promise<any[]> {
    const url = date ? `/api/activity-schedules/sync?date=${date}` : '/api/activity-schedules/sync';
    const response = await apiClient.get<ApiResponse<any[]>>(url);
    return response.data.result;
  }

  async getById(id: string): Promise<any> {
    const response = await apiClient.get<ApiResponse<any>>(`/api/activity-schedules/sync/${id}`);
    return response.data.result;
  }

  /**
   * บันทึกข้อมูลผ่าน /sync (รับข้อมูลทั้งเวลาและชื่อกิจกรรม)
   */
  async create(payload: any): Promise<ActivitySchedule> {
    const response = await apiClient.post<ApiResponse<ActivitySchedule>>(
      '/api/activity-schedules/sync',
      buildSchedulePayload(payload)
    );
    return response.data.result;
  }

  /**
   * อัปเดตข้อมูลผ่าน /sync (รับข้อมูลทั้งเวลาและชื่อกิจกรรม)
   */
  async update(id: string, payload: any): Promise<ActivitySchedule> {
    const response = await apiClient.patch<ApiResponse<ActivitySchedule>>(
      `/api/activity-schedules/sync/${id}`,
      buildSchedulePayload(payload)
    );
    return response.data.result;
  }

  async remove(id: string): Promise<void> {
    await apiClient.delete<ApiResponse<null>>(`/api/activity-schedules/${id}`);
  }

  async createRecurring(payload: CreateRecurringActivityScheduleRequest): Promise<ActivitySchedule[]> {
    try {
      const response = await apiClient.post<ApiResponse<ActivitySchedule[]>>(
        '/api/activity-schedules/recurring',
        payload
      );
      return response.data.result;
    } catch (error: any) {
      const status = error?.response?.status ?? error?.status;
      if (status !== 404 && status !== 405) {
        throw error;
      }

      const dateKeys = listRecurringDateKeys(payload.start_date, payload.end_date, payload.repeat_days);
      if (dateKeys.length === 0) {
        throw new Error('ไม่พบวันที่ตรงกับรูปแบบการทำซ้ำ');
      }

      const created = await Promise.all(
        dateKeys.map((date) =>
          this.create({
            activity_name: (payload as any).activity_name,
            activity_type: (payload as any).activity_type,
            date,
            start_time: payload.start_time,
            end_time: payload.end_time,
          })
        )
      );
      return created;
    }
  }

  async cancel(payload: CancelActivityScheduleRequest): Promise<{ updated: number }> {
    const response = await apiClient.patch<ApiResponse<{ updated: number }>>(
      '/api/activity-schedules/cancel',
      payload
    );
    return response.data.result;
  }

  async restore(payload: RestoreActivityScheduleRequest): Promise<{ updated: number }> {
    const response = await apiClient.patch<ApiResponse<{ updated: number }>>(
      '/api/activity-schedules/restore',
      payload
    );
    return response.data.result;
  }
}

export const activityScheduleService = new ActivityScheduleService();
export default activityScheduleService;