import type { Resident as ApiResident } from "@/types/resident";

export const resolveCareLabel = (resident?: ApiResident | null) => {
  const labelName = resident?.resident_labels
    ?.map((label) => label.intake_label?.label_name || "")
    .find((name) => name.includes("ช่วยเหลือตัวเอง") || name === "ติดเตียง")
    ?.trim();

  if (labelName === "ช่วยเหลือตัวเองได้บางส่วน") return "ช่วยเหลือตัวเองได้บางส่วน";
  if (labelName === "ติดเตียง") return "ผู้สูงอายุติดเตียง";
  if (labelName === "ช่วยเหลือตัวเองได้ทั้งหมด") return "ผู้สูงอายุทั่วไป";
  return resident?.status || "-";
};

export const splitTags = (value?: string | null) =>
  (value || "")
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);

export const resolveADLLabel = (resident?: ApiResident | null, careLevel?: string) => {
  if (!resident) return "-";
  const labelName = resident.resident_labels
    ?.map((label) => label.intake_label?.label_name || "")
    .find((name) => name.includes("ช่วยเหลือตัวเอง") || name === "ติดเตียง")
    ?.trim();
  if (labelName) return labelName;
  const score = resident.adl_score;
  if (score === undefined || score === null) return careLevel || "-";
  if (score <= 5) return "ต้องการความช่วยเหลือทั้งหมด";
  if (score <= 11) return "ต้องการความช่วยเหลือบางส่วน";
  return "ช่วยเหลือตัวเองได้";
};

export const resolveStatusText = (resident?: ApiResident | null) => {
  const rawStatus = (resident?.status || "").trim();
  if (!rawStatus) return "-";
  const normalized = rawStatus.toLowerCase();
  if (normalized === "active" || rawStatus === "พักอยู่ในศูนย์") return "พักอยู่ในศูนย์";
  if (normalized === "inactive" || normalized === "discharged") return "ออกจากศูนย์";
  return rawStatus;
};

export const toTelHref = (value?: string | null) => {
  const sanitized = (value || "").replace(/[^0-9+]/g, "");
  return sanitized ? `tel:${sanitized}` : "";
};
