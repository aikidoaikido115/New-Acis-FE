// ============================================================
// EMR Mock Data
// ============================================================

// ── Residents (IndividualView) ───────────────────────────────
export interface Resident {
  id: number;
  name: string;
  nickname: string;
  room: string;
  status: string;
}

export const mockResidents: Resident[] = [
  { id: 1, name: "คุณยายสมศรี ใจดี", nickname: "แอ๋ว", room: "1", status: "ผู้สูงอายุทั่วไป" },
  { id: 2, name: "คุณตาบรรจง แสนดอน", nickname: "จิ๋ว", room: "2", status: "ผู้สูงอายุทั่วไป" },
  { id: 3, name: "คุณยายสุดใจ ศรีจันทร์", nickname: "นา", room: "3", status: "ผู้สูงอายุทั่วไป" },
  { id: 4, name: "คุณตาสมชาย บุญมาก", nickname: "ชุน", room: "4", status: "ผู้สูงอายุพิเศษ" },
  { id: 5, name: "คุณยายอุดมทรัพย์ คชรี", nickname: "หญิง", room: "5", status: "ผู้สูงอายุทั่วไป" },
  { id: 6, name: "คุณตาบัวจิตร์ คชคึก", nickname: "จ๋า", room: "6", status: "ผู้สูงอายุทั่วไป" },
  { id: 7, name: "คุณยายมยุรีกรรณ คชรี", nickname: "ฟ", room: "7", status: "ผู้สูงอายุพิเศษ" },
  { id: 8, name: "คุณตาสมเกียรติ หอมละมุน", nickname: "สม", room: "8", status: "ผู้สูงอายุพิเศษ" },
  { id: 9, name: "คุณยายรัชภรณ์ หิมปิลัง", nickname: "เสี้ยน", room: "9", status: "ผู้สูงอายุพิเศษ" },
  { id: 10, name: "คุณตาเกรียงไกรงาม ตัวไฟ", nickname: "บูวา", room: "10", status: "ผู้สูงอายุพิเศษและมีทักษะด้านภาษาต่างประเทศ" },
  { id: 11, name: "คุณยายเสงี่ยงมร์ มากจอย", nickname: "กาง", room: "11", status: "ผู้สูงอายุพิเศษและมีทักษะด้านภาษาต่างประเทศ" },
  { id: 12, name: "คุณตาวัฒนา รัตน์ไฟว", nickname: "แดด", room: "12", status: "ผู้สูงอายุพิเศษและมีทักษะด้านภาษาต่างประเทศ" },
  { id: 13, name: "คุณยายบุญจี่ หอมคำคิด", nickname: "วงษ์", room: "13", status: "ผู้สูงอายุทั่วไป" },
  { id: 14, name: "คุณตาสำโรจ์ ตั้งความ", nickname: "หอก", room: "14", status: "ผู้สูงอายุทั่วไป" },
  { id: 15, name: "คุณยายพาทันพี่ม บวยหลอน", nickname: "แมว", room: "15", status: "ผู้สูงอายุทั่วไป" },
];

// ── Vital Signs (VitalSignsTable) ───────────────────────────
export interface VitalSignRow {
  id: number;
  name: string;
  room: string;
  temp: string;
  tempAbnormal: boolean;
  pulse: string;
  bp: string;
  bpAbnormal: boolean;
  o2: string;
  resp: string;
  sugar: string;
  intake: string;
  urine: string;
  feces?: string;
  diaper?: string;
}

export const mockVitalSigns: VitalSignRow[] = [
  { id: 1, name: "คนไข้ ห้อง 12", room: "12", temp: "42.6°C", tempAbnormal: true, pulse: "62 bpm", bp: "145/95", bpAbnormal: true, o2: "96 %", resp: "18", sugar: "180", intake: "-", urine: "300 ml", feces: "-", diaper: "-" },
  { id: 2, name: "คนไข้ ห้อง 12", room: "12", temp: "36.4°C", tempAbnormal: false, pulse: "70 bpm", bp: "130/80", bpAbnormal: false, o2: "96 %", resp: "18", sugar: "120", intake: "-", urine: "300 ml", feces: "1 ครั้ง", diaper: "3 ผืน" },
  { id: 3, name: "คนไข้ ห้อง 12", room: "12", temp: "36.4°C", tempAbnormal: false, pulse: "70 bpm", bp: "135/80", bpAbnormal: false, o2: "96 %", resp: "18", sugar: "-", intake: "-", urine: "-" },
  { id: 4, name: "คนไข้ ห้อง 12", room: "12", temp: "36.4°C", tempAbnormal: false, pulse: "70 bpm", bp: "130/80", bpAbnormal: false, o2: "96 %", resp: "18", sugar: "-", intake: "-", urine: "300 ml" },
  { id: 5, name: "คนไข้ ห้อง 12", room: "12", temp: "36.4°C", tempAbnormal: false, pulse: "70 bpm", bp: "130/80", bpAbnormal: false, o2: "96 %", resp: "18", sugar: "115", intake: "-", urine: "500 ml" },
];

export const timeSlots = [
  { id: "6:00", label: "6:00" },
  { id: "10:00", label: "10:00" },
  { id: "14:00", label: "14:00" },
  { id: "18:00", label: "18:00" },
  { id: "22:00", label: "22:00" },
];

// ── Vital Signs Detail (VitalSignsDetailTable) ───────────────
export interface VitalSignDetailRow {
  id: number;
  date: string;
  time: string;
  temp: string;
  tempAbnormal: boolean;
  pulse: string;
  bp: string;
  bpAbnormal: boolean;
  o2: string;
  resp: string;
  sugar: string;
  sugarAbnormal: boolean;
  intake: string;
  urine: string;
  feces: string;
  diaper: string;
}

export const mockVitalSignsData: VitalSignDetailRow[] = [
  { id: 1, date: "21/01/2569", time: "22:00", temp: "42.6°C", tempAbnormal: true, pulse: "82 bpm", bp: "145/95", bpAbnormal: true, o2: "96 %", resp: "18", sugar: "180", sugarAbnormal: true, intake: "-", urine: "200 ml", feces: "-", diaper: "-" },
  { id: 2, date: "21/01/2569", time: "18:00", temp: "36.4°C", tempAbnormal: false, pulse: "70 bpm", bp: "130/80", bpAbnormal: false, o2: "96 %", resp: "18", sugar: "120", sugarAbnormal: false, intake: "-", urine: "300 ml", feces: "1 ครั้ง", diaper: "3 ครั้ง" },
  { id: 3, date: "21/01/2569", time: "14:00", temp: "36.4°C", tempAbnormal: false, pulse: "70 bpm", bp: "130/80", bpAbnormal: false, o2: "96 %", resp: "18", sugar: "-", sugarAbnormal: false, intake: "-", urine: "-", feces: "-", diaper: "-" },
  { id: 4, date: "21/01/2569", time: "10:00", temp: "36.4°C", tempAbnormal: false, pulse: "70 bpm", bp: "130/80", bpAbnormal: false, o2: "96 %", resp: "18", sugar: "-", sugarAbnormal: false, intake: "-", urine: "300 ml", feces: "-", diaper: "-" },
  { id: 5, date: "21/01/2569", time: "06:00", temp: "36.4°C", tempAbnormal: false, pulse: "70 bpm", bp: "130/80", bpAbnormal: false, o2: "96 %", resp: "18", sugar: "115", sugarAbnormal: false, intake: "200 ml", urine: "-", feces: "-", diaper: "-" },
];

export const mockVitalSignsTotals = {
  intake: "500 ml",
  urine: "500 ml",
  feces: "1 ครั้ง",
  diaper: "3 ครั้ง",
};

// ── Nurse Notes ──────────────────────────────────────────────
export interface NurseNoteRow {
  id: number;
  name: string;
  room: string;
  note: string;
  by: string;
}

export const mockNurseNotes: NurseNoteRow[] = [
  { id: 1, name: "คนไข้ ห้อง 12", room: "12", note: "ผู้สูงอายุมีไข้สูง 22.00 ให้ยาลดไข้ยินดีก่อนนอนงานกว้าง", by: "สมหมาย" },
  { id: 2, name: "คนไข้ ห้อง 12", room: "12", note: "", by: "" },
  { id: 3, name: "คนไข้ ห้อง 12", room: "12", note: "", by: "" },
  { id: 4, name: "คนไข้ ห้อง 12", room: "12", note: "", by: "" },
  { id: 5, name: "คนไข้ ห้อง 12", room: "12", note: "", by: "" },
];

export interface NurseNoteDetail {
  id: number;
  date: string;
  note: string;
  by: string;
}

export const mockNurseNotesDetail: NurseNoteDetail[] = [
  { id: 1, date: "21/01/2569", note: "ผู้สูงอายุกรีดสูง 22.00 ให้ยาลดไข้แล้วเป็นปกติวางของกว้าง", by: "สมหมาย" },
];

// ── Doctor Orders ────────────────────────────────────────────
export interface DoctorOrderRow {
  id: number;
  name: string;
  room: string;
  order: string;
  by: string;
}

export const mockDoctorOrdersTable: DoctorOrderRow[] = [
  { id: 1, name: "คนไข้ ห้อง 12", room: "12", order: "ผู้สูงอายุมีไข้สูง 22.00 ให้ยาลดไข้ยินดีก่อนนอนงานกว้างและรักษาอาการปวดหัว", by: "สมหมาย" },
  { id: 2, name: "คนไข้ ห้อง 12", room: "12", order: "", by: "" },
  { id: 3, name: "คนไข้ ห้อง 12", room: "12", order: "", by: "" },
  { id: 4, name: "คนไข้ ห้อง 12", room: "12", order: "", by: "" },
  { id: 5, name: "คนไข้ ห้อง 12", room: "12", order: "", by: "" },
];

export interface DoctorOrderDetail {
  id: number;
  date: string;
  note: string;
  details: string;
  by: string;
}

export const mockDoctorOrdersDetail: DoctorOrderDetail[] = [
  { id: 1, date: "21/01/2569", note: "เจ็บหนัก ยา", details: "Paracetamol 500mg ชนิด ๆ กิน เสร็จยา 21/01/2569 เริ่มยา 24/01/2569", by: "สมหมาย" },
];

// ── Wound Care ───────────────────────────────────────────────
export interface WoundCareRow {
  id: number;
  name: string;
  room: string;
  note: string;
  image: string | null;
  by: string;
}

export const mockWoundCareTable: WoundCareRow[] = [
  { id: 1, name: "คนไข้ ห้อง 12", room: "12", note: "ทำแผลเท้า ที่เท้าขวา", image: "/placeholder-wound.jpg", by: "สมหมาย" },
  { id: 2, name: "คนไข้ ห้อง 12", room: "12", note: "", image: null, by: "" },
  { id: 3, name: "คนไข้ ห้อง 12", room: "12", note: "", image: null, by: "" },
  { id: 4, name: "คนไข้ ห้อง 12", room: "12", note: "", image: null, by: "" },
  { id: 5, name: "คนไข้ ห้อง 12", room: "12", note: "", image: null, by: "" },
];

export interface WoundCareDetail {
  id: number;
  date: string;
  note: string;
  image: string;
  by: string;
}

export const mockWoundCareDetail: WoundCareDetail[] = [
  { id: 1, date: "21/01/2569", note: "ทำแผลทางเขางม์วงแสน", image: "/placeholder-wound.jpg", by: "สมหมาย" },
];

// ── Relative Notes ───────────────────────────────────────────
export interface RelativeNoteRow {
  id: number;
  name: string;
  room: string;
  note: string;
  by: string;
}

export const mockRelativeNotesTable: RelativeNoteRow[] = [
  { id: 1, name: "คนไข้ ห้อง 12", room: "12", note: "เจ็บแขน Paracetamol 500mg ชนิด ๆ กิน เสร็จยา 21/01/2569 เริ่มยา 24/01/2569", by: "สมหมาย" },
  { id: 2, name: "คนไข้ ห้อง 12", room: "12", note: "", by: "" },
  { id: 3, name: "คนไข้ ห้อง 12", room: "12", note: "", by: "" },
  { id: 4, name: "คนไข้ ห้อง 12", room: "12", note: "", by: "" },
  { id: 5, name: "คนไข้ ห้อง 12", room: "12", note: "", by: "" },
];

export interface RelativeNoteDetail {
  id: number;
  date: string;
  note: string;
  by: string;
}

export const mockRelativeNotesDetail: RelativeNoteDetail[] = [
  { id: 1, date: "21/01/2569", note: "ผู้สูงอายุหนาวอากาศเวลาเสร็จเอื้อไม่ใส่", by: "สมหมาย" },
];

// ── Graph ────────────────────────────────────────────────────
export interface GraphData {
  dates: string[];
  heartRate: number[];
  temperature: number[];
}

export const mockGraphData: GraphData = {
  dates: ["6:00", "10:00", "14:00", "18:00", "22:00"],
  heartRate: [92, 95, 88, 95, 100],
  temperature: [38.2, 38.5, 38.3, 38.6, 37.5],
};
