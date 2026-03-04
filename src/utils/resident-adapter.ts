/**
 * Adapter สำหรับแปลง payload จาก Frontend format เป็น Backend format
 * ใช้ชั่วคราวจนกว่า Backend จะรองรับ fields เพิ่มเติม
 */

import type { CreateResidentRequest } from '@/types/resident';

// Backend format (ตามที่ BE รองรับตอนนี้)
interface BackendResidentRequest {
  room_id?: string; // Optional in UX, BE อาจรับ empty string หรือ undefined
  first_name: string;
  last_name: string;
  age: number;
  gender: string;
  floor?: number;
}

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
  // Validate required fields (room_id now optional per UX)
  if (!frontendData.first_name) {
    throw new Error('first_name is required');
  }
  if (!frontendData.last_name) {
    throw new Error('last_name is required');
  }
  if (!frontendData.gender) {
    throw new Error('gender is required');
  }

  // ใช้ age ที่คำนวณมาแล้ว หรือคำนวณจากวันเกิด
  const age = frontendData.age ?? (frontendData.date_of_birth ? calculateAge(frontendData.date_of_birth) : undefined);
  if (age === undefined) {
    throw new Error('age is required (provide date_of_birth)');
  }

  const payload: BackendResidentRequest = {
    first_name: frontendData.first_name,
    last_name: frontendData.last_name,
    age,
    gender: frontendData.gender,
    floor: frontendData.floor,
  };

  // เพิ่ม room_id เฉพาะเมื่อมีค่า (UX ให้ optional)
  if (frontendData.room_id) {
    payload.room_id = frontendData.room_id;
  }

  // Log fields ที่ไม่ได้ส่งไป (แสดงเฉพาะ development mode)
  if (process.env.NODE_ENV === 'development') {
    const unusedFields = {
      nickname: frontendData.nickname,
      id_card_number: frontendData.id_card_number,
      purpose: frontendData.purpose,
      admit_date: frontendData.admit_date,
      expected_discharge_date: frontendData.expected_discharge_date,
      chronic_diseases: frontendData.chronic_diseases,
      medications: frontendData.medications,
      drug_allergies: frontendData.drug_allergies,
      food_allergies: frontendData.food_allergies,
      adl_score: frontendData.adl_score,
      cpr_status: frontendData.cpr_status,
      emergency_hospital: frontendData.emergency_hospital,
      emergency_contacts: frontendData.emergency_contacts,
    };
    
    const filledFields = Object.keys(unusedFields).filter(key => unusedFields[key as keyof typeof unusedFields]);
    if (filledFields.length > 0) {
      console.info('[Resident Adapter] Backend ยังไม่รองรับ fields:', filledFields);
    }
  }

  return payload;
}

/**
 * TODO: ลบ adapter นี้เมื่อ Backend รองรับ fields ครบแล้ว
 * 
 * Fields ที่รอ Backend เพิ่ม:
 * - nickname, id_card_number, purpose
 * - admit_date, expected_discharge_date
 * - chronic_diseases, chronic_diseases_note
 * - medications (ต้องสร้างตารางแยก)
 * - surgical_history, drug_allergies, food_allergies
 * - adl_score, cpr_status
 * - emergency_hospital, emergency_hospital_phone
 * - emergency_contacts (ต้องสร้างตารางแยก)
 */
