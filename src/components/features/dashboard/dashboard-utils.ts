import type { GenderStats, ResidentStats } from "@/types/dashboard";
import type { Resident } from "@/types/resident";

export type InventoryStatKey = "lowStock" | "pendingWithdraw" | "pendingRestock";

export const DAYS_SHORT = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
export const MONTHS_TH = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];

export const DEFAULT_VITAL_STATS = [
  { label: "ปกติ", value: 0, variant: "normal" as const },
  { label: "เสี่ยงสูง", value: 0, variant: "warning" as const },
  { label: "ผิดปกติ", value: 0, variant: "danger" as const },
];

export type ResidentSnapshot = Pick<
  Resident,
  "gender" | "check_in_date" | "expected_check_out_date" | "status" | "floor" | "resident_labels"
> & {
  resident_id?: string;
  intake_labels?: string[];
};

export const SCHEDULE_ITEMS = [
  { time: "09:00-10:30", title: "กิจกรรมประจำวัน", detail: "กิจกรรมฟื้นฟูสมรรถภาพ", location: "ห้องกิจกรรม" },
  { time: "14:00-15:30", title: "กิจกรรมประจำสัปดาห์", detail: "กิจกรรมพัฒนากล้ามเนื้อ", location: "โถงกิจกรรม" },
];

export const INVENTORY_ITEMS: Array<{ key: InventoryStatKey; label: string; href: string }> = [
  { key: "lowStock", label: "รายการสินค้าใกล้หมด", href: "/warehouse" },
  { key: "pendingWithdraw", label: "รายการเบิกของรออนุมัติ", href: "/warehouse?tab=history" },
  { key: "pendingRestock", label: "รายการเติมของรออนุมัติ", href: "/warehouse?tab=history" },
];

export const toDateInputValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

export const isSameDay = (a: Date, b: Date) => startOfDay(a).getTime() === startOfDay(b).getTime();

export const parseDateSafe = (value?: string | null) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const formatThaiDate = (date: Date) => `${date.getDate()} ${MONTHS_TH[date.getMonth()]} ${date.getFullYear() + 543}`;

export const formatThaiMonthYear = (date: Date) => `${MONTHS_TH[date.getMonth()]} ${date.getFullYear() + 543}`;

export const isResidentActiveOnDate = (resident: ResidentSnapshot, date: Date) => {
  const admitDate = parseDateSafe(resident.check_in_date);
  const dischargeDate = parseDateSafe(resident.expected_check_out_date);
  const target = startOfDay(date);

  if (admitDate && admitDate > target) return false;
  if (dischargeDate && dischargeDate < target) return false;
  if (resident.status && resident.status.toLowerCase() !== "active") return false;
  return true;
};

export const filterResidents = (residents: ResidentSnapshot[], floor: number | undefined, date: Date) =>
  residents.filter((resident) => {
    if (typeof floor === "number" && resident.floor !== floor) {
      return false;
    }
    return isResidentActiveOnDate(resident, date);
  });

export const computeResidentAndGenderStats = (residents: ResidentSnapshot[]) => {
  const stats: ResidentStats = { total: 0, general: 0, partial_assist: 0, bedridden: 0 };
  const gender: GenderStats = { male: 0, female: 0 };

  const resolveCareLevelKey = (resident: ResidentSnapshot): "general" | "partial_assist" | "bedridden" => {
    const labelName = resident.intake_labels?.find((name) => name.includes("ช่วยเหลือตัวเอง") || name === "ติดเตียง")
      || resident.resident_labels
        ?.map((label) => label.intake_label?.label_name || "")
        .find((name) => name.includes("ช่วยเหลือตัวเอง") || name === "ติดเตียง")
        ?.trim();

    if (labelName === "ช่วยเหลือตัวเองได้บางส่วน") return "partial_assist";
    if (labelName === "ติดเตียง") return "bedridden";
    return "general";
  };

  residents.forEach((resident) => {
    const level = resolveCareLevelKey(resident);
    stats.total += 1;
    if (level === "partial_assist") stats.partial_assist += 1;
    else if (level === "bedridden") stats.bedridden += 1;
    else stats.general += 1;

    if (resident.gender === "male") gender.male += 1;
    else if (resident.gender === "female") gender.female += 1;
  });

  return { residentStats: stats, genderStats: gender };
};

export const filterByDate = <T extends { created_at: string }>(items: T[], date: Date) => {
  const target = startOfDay(date).getTime();
  return items.filter((item) => {
    const created = parseDateSafe(item.created_at);
    return created ? startOfDay(created).getTime() === target : false;
  });
};

// เพิ่ม/แก้ไขฟังก์ชันนี้ใน dashboard-util.ts
export const resolveTimeOfDayKeys = (value?: string | null): string[] => {
  if (!value) return [];
  const normalized = value.toLowerCase();
  const keys: string[] = [];
  
  // ใช้ .includes เพื่อให้รองรับค่าที่มีหลายมื้อ เช่น "morning,evening"
  if (normalized.includes("morning") || normalized.includes("เช้า")) keys.push("morning");
  if (normalized.includes("noon") || normalized.includes("กลางวัน")) keys.push("noon");
  if (normalized.includes("evening") || normalized.includes("เย็น")) keys.push("evening");
  if (normalized.includes("bedtime") || normalized.includes("ก่อนนอน")) keys.push("bedtime");
  
  return keys;
};

// แก้ไข DEFAULT_MEDICINE_STATUS ให้มี 4 มื้อตามจริง
export const DEFAULT_MEDICINE_STATUS = [
  { label: "มื้อเช้า", value: "ไม่มีข้อมูล" },
  { label: "มื้อกลางวัน", value: "ไม่มีข้อมูล" },
  { label: "มื้อเย็น", value: "ไม่มีข้อมูล" },
  { label: "ก่อนนอน", value: "ไม่มีข้อมูล" },
];

export const buildMedicineValue = (total: number, taken: number) => {
  if (total <= 0) return "ไม่มีข้อมูล";
  if (taken >= total) return "ให้ครบ";
  return `${taken}/${total} ยังไม่ครบ`;
};

export const getScheduleItemsForDate = (date: Date) => {
  return isSameDay(date, new Date()) ? SCHEDULE_ITEMS : [];
};
