/**
 * Adapter สำหรับแปลง payload จาก Frontend format เป็น Backend format
 * ใช้ชั่วคราวจนกว่า Backend จะรองรับ fields เพิ่มเติม
 */

import type { CreateResidentRequest } from '@/types/resident';

// Backend format (ตามที่ BE รองรับตอนนี้)
type BackendResidentRequest = CreateResidentRequest;

/**
 * คำนวณอายุจากวันเกิด
 */
export function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  // ถ้ายังไม่ถึงวันเกิดในปีนี้ ให้ลบอายุ 1
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

/**
 * แปลง Frontend payload เป็น Backend format
 * @param frontendData - ข้อมูลจาก form (format ของ Frontend)
 * @returns Backend-compatible payload
 */
export function adaptResidentPayload(frontendData: CreateResidentRequest): BackendResidentRequest {
  return frontendData;
}

/**
 * TODO: ลบ adapter นี้เมื่อไม่มีการใช้งานแล้ว
 */
