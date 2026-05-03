export type CheckInResident = {
  id: string;
  name: string;
  nickname?: string;
  roomNumber?: string;
  careType?: string;
};

export type CheckInSession = {
  scheduleId: string;
  activityTitle?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  residents: CheckInResident[];
  selectedIds: string[];
  initialSelectedIds?: string[];
  photos: Record<string, string>;
  rejectedIds: string[];
  updatedAt: string;
};

const SESSION_PREFIX = "activity-checkin-session";
const RECORDS_KEY = "activity-checkin-records";

const getSessionKey = (scheduleId: string) => `${SESSION_PREFIX}:${scheduleId}`;

const safeParse = <T>(value: string | null): T | null => {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

export const loadCheckInSession = (scheduleId: string): CheckInSession | null => {
  if (typeof window === "undefined") return null;
  return safeParse<CheckInSession>(window.sessionStorage.getItem(getSessionKey(scheduleId)));
};

export const saveCheckInSession = (session: CheckInSession) => {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(getSessionKey(session.scheduleId), JSON.stringify(session));
};

export const clearCheckInSession = (scheduleId: string) => {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(getSessionKey(scheduleId));
};

export const saveCheckInRecord = (session: CheckInSession) => {
  if (typeof window === "undefined") return;
  const existing = safeParse<CheckInSession[]>(window.localStorage.getItem(RECORDS_KEY)) || [];
  const withoutCurrent = existing.filter((item) => item.scheduleId !== session.scheduleId);
  const nextRecords = [{ ...session, updatedAt: new Date().toISOString() }, ...withoutCurrent];
  window.localStorage.setItem(RECORDS_KEY, JSON.stringify(nextRecords));
};
