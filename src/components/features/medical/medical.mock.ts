// Mock data for Medical feature
export type MedicationStatus = "รอให้" | "ให้ยา" | "งด";
export type TimeSlot = "เช้า" | "กลางวัน" | "เย็น" | "ก่อนนอน";

export interface Medication {
  id: number;
  name: string;
  dosage: string;
  status: MedicationStatus;
}

export interface PatientMedication {
  id: number;
  name: string;
  room: string;
  floor: number;
  profileImage?: string;
  allergies: string[];
  helpLevel: string;
  medications: Medication[];
  pendingCount: number;
}

export interface RoutineMedication {
  id: number;
  name: string;
  dose: string;
  frequency: string;
  note: string;
}

export interface MedicationHistory {
  id: number;
  time: string;
  patientName: string;
  medication: string;
  status: "ให้แล้ว" | "งด";
  note: string;
  givenBy: string;
}

// Mock patients with medications
export const mockPatientMedications: PatientMedication[] = [
  {
    id: 1,
    name: "สมชาย ศรีบุญยิ่ง",
    room: "ห้อง 112 ชั้น 2",
    floor: 2,
    allergies: ["แพ้ยา"],
    helpLevel: "ช่วยเหลือตัวเองได้",
    medications: [
      { id: 1, name: "Metformin 500 mg", dosage: "รอบเช้าหลังอาหาร", status: "รอให้" },
      { id: 2, name: "Amlodipine 5 mg", dosage: "รอบเช้าก่อนอาหาร", status: "รอให้" },
    ],
    pendingCount: 2,
  },
  {
    id: 2,
    name: "สมหญิง คชรีเมือง",
    room: "ห้อง 115 ชั้น 2",
    floor: 2,
    allergies: [],
    helpLevel: "ต้องการความช่วยเหลือ",
    medications: [
      { id: 3, name: "Metformin 500 mg", dosage: "รอบเช้าหลังอาหาร", status: "ให้ยา" },
      { id: 4, name: "Amlodipine 5 mg", dosage: "รอบเช้าก่อนอาหาร", status: "ให้ยา" },
    ],
    pendingCount: 0,
  },
  {
    id: 3,
    name: "สมศรี ใจดีมาก",
    room: "ห้อง 201 ชั้น 3",
    floor: 3,
    allergies: ["แพ้ยา", "Penicillin"],
    helpLevel: "ช่วยเหลือตัวเองได้",
    medications: [
      { id: 5, name: "Metformin 500 mg", dosage: "รอบเช้าหลังอาหาร", status: "รอให้" },
      { id: 6, name: "Amlodipine 5 mg", dosage: "รอบเช้าก่อนอาหาร", status: "งด" },
    ],
    pendingCount: 1,
  },
  {
    id: 4,
    name: "บุญจันทร์ รักษาดี",
    room: "ห้อง 105 ชั้น 1",
    floor: 1,
    allergies: [],
    helpLevel: "ติดเตียง",
    medications: [
      { id: 7, name: "Atorvastatin 20 mg", dosage: "รอบเช้าหลังอาหาร", status: "รอให้" },
      { id: 8, name: "Aspirin 81 mg", dosage: "รอบเช้าหลังอาหาร", status: "รอให้" },
      { id: 9, name: "Omeprazole 20 mg", dosage: "รอบเช้าก่อนอาหาร", status: "รอให้" },
    ],
    pendingCount: 3,
  },
  {
    id: 5,
    name: "วิไล สุขสันต์",
    room: "ห้อง 210 ชั้น 3",
    floor: 3,
    allergies: [],
    helpLevel: "ช่วยเหลือตัวเองได้",
    medications: [
      { id: 10, name: "Metformin 500 mg", dosage: "รอบเช้าหลังอาหาร", status: "ให้ยา" },
    ],
    pendingCount: 0,
  },
  {
    id: 6,
    name: "ประสิทธิ์ มั่งคั่ง",
    room: "ห้อง 108 ชั้น 1",
    floor: 1,
    allergies: ["Sulfa drugs"],
    helpLevel: "ต้องการความช่วยเหลือ",
    medications: [
      { id: 11, name: "Lisinopril 10 mg", dosage: "รอบเช้าก่อนอาหาร", status: "รอให้" },
      { id: 12, name: "Furosemide 40 mg", dosage: "รอบเช้าหลังอาหาร", status: "รอให้" },
    ],
    pendingCount: 2,
  },
];

// Mock routine medications for a specific patient
export const mockRoutineMedications: RoutineMedication[] = [
  { id: 1, name: "Amlodipine", dose: "5mg", frequency: "1 ครั้ง (เช้า)", note: "ภายหลังอาหาร" },
  { id: 2, name: "Metformin", dose: "500mg", frequency: "2 ครั้ง (เช้า-เย็น)", note: "ภายหลังอาหาร" },
  { id: 3, name: "Aspirin", dose: "81mg", frequency: "1 ครั้ง (เช้า)", note: "-" },
  { id: 4, name: "Atorvastatin", dose: "20mg", frequency: "1 ครั้ง (ก่อนนอน)", note: "ก่อนนอน" },
];

// Mock medication history
export const mockMedicationHistory: MedicationHistory[] = [
  {
    id: 1,
    time: "12:30",
    patientName: "วิไล สุขสันต์",
    medication: "Metformin 500 mg",
    status: "ให้แล้ว",
    note: "-",
    givenBy: "สมหมาย",
  },
  {
    id: 2,
    time: "11:30",
    patientName: "วิไล สุขสันต์",
    medication: "Metformin 500 mg",
    status: "ให้แล้ว",
    note: "-",
    givenBy: "สมหมาย",
  },
  {
    id: 3,
    time: "10:30",
    patientName: "วิไล สุขสันต์",
    medication: "Metformin 500 mg",
    status: "ให้แล้ว",
    note: "-",
    givenBy: "สมหมาย",
  },
  {
    id: 4,
    time: "09:30",
    patientName: "วิไล สุขสันต์",
    medication: "Metformin 500 mg",
    status: "งด",
    note: "ผู้สูงอายุขอไม่รับ",
    givenBy: "สมหมาย",
  },
  {
    id: 5,
    time: "09:45",
    patientName: "วิไล สุขสันต์",
    medication: "Metformin 500 mg",
    status: "งด",
    note: "ผู้สูงอายุไม่อยู่",
    givenBy: "สมหมาย",
  },
  {
    id: 6,
    time: "08:30",
    patientName: "วิไล สุขสันต์",
    medication: "Metformin 500 mg",
    status: "งด",
    note: "ซื้อของลงลาคาล",
    givenBy: "สมหมาย",
  },
  {
    id: 7,
    time: "08:30",
    patientName: "วิไล สุขสันต์",
    medication: "Metformin 900 mg",
    status: "ให้แล้ว",
    note: "-",
    givenBy: "สมหมาย",
  },
  {
    id: 8,
    time: "08:30",
    patientName: "วิไล สุขสันต์",
    medication: "Metformin 900 mg",
    status: "งด",
    note: "ป่วย",
    givenBy: "สมหมาย",
  },
  {
    id: 9,
    time: "08:30",
    patientName: "วิไล สุขสันต์",
    medication: "Metformin 900 mg",
    status: "งด",
    note: "ป่วย",
    givenBy: "สมหมาย",
  },
];
