import { thaiMonths, timeOfDayLabelMap } from "./constants";
import type { PersonalDrug } from "@/services/personal-drug.service";

export const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear() + 543;
  return `${day}/${month}/${year}`;
};

export const formatThaiDate = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const day = date.getDate();
  const monthName = thaiMonths[date.getMonth()] || "";
  const year = date.getFullYear() + 543;
  return `${day} ${monthName} ${year}`.trim() || "-";
};

export const formatDateRange = (start?: string | null, end?: string | null) => {
  const startText = formatDate(start);
  const endText = formatDate(end);
  if (startText === "-" && endText === "-") return "-";
  return `${startText} - ${endText}`;
};

export const formatPrintDateTime = (date: Date) => {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear() + 543;
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
};

export const formatTimeOfDay = (value?: string | null) => {
  if (!value) return "";
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => timeOfDayLabelMap[item.toLowerCase()] || item)
    .join("-");
};

export const formatFrequency = (med: PersonalDrug) => {
  const timeText = formatTimeOfDay(med.time_of_day);
  if (med.frequency && timeText) return `${med.frequency} ครั้ง (${timeText})`;
  if (med.frequency) return `${med.frequency} ครั้ง`;
  if (timeText) return timeText;
  return "-";
};

export const formatMealType = (med: PersonalDrug) => {
  if (med.timing) return med.timing;
  if (med.take_type === "regular") return "ประจำ";
  if (med.take_type === "as_needed") return "ตามอาการ";
  return "-";
};

export const formatDose = (med: PersonalDrug) => {
  if (med.amount) return `${med.amount}${med.amount_unit || ""}`.trim();
  if (med.DrugMaster?.dose) return med.DrugMaster.dose;
  return "-";
};
