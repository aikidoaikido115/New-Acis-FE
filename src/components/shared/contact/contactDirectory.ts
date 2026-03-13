export interface ContactInfo {
  firstName: string;
  lastName: string;
  nickname: string;
  email: string;
  phone: string;
  avatarUrl?: string;
}

const CONTACTS: Record<string, ContactInfo> = {
  "สมหญิง": {
    firstName: "สมหญิง",
    lastName: "สุขใจ",
    nickname: "หญิง",
    email: "somying@nurseeldermis.local",
    phone: "081-234-5678",
  },
  "สมหมาย": {
    firstName: "สมหมาย",
    lastName: "ทองดี",
    nickname: "หมาย",
    email: "sommai@nurseeldermis.local",
    phone: "089-111-2244",
  },
  "ผู้ใช้ปัจจุบัน": {
    firstName: "ผู้ใช้",
    lastName: "ปัจจุบัน",
    nickname: "Current",
    email: "current.user@nurseeldermis.local",
    phone: "-",
  },
};

export function resolveContactInfo(name: string): ContactInfo {
  const trimmedName = name.trim();

  if (CONTACTS[trimmedName]) {
    return CONTACTS[trimmedName];
  }

  return {
    firstName: trimmedName || "ไม่ระบุชื่อ",
    lastName: "",
    nickname: trimmedName || "-",
    email: "-",
    phone: "-",
  };
}
