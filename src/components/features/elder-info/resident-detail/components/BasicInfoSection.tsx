import { Calendar, CreditCard, Home, User, UserRound } from "lucide-react";
import type { Resident as ApiResident } from "@/types/resident";
import type { Room } from "@/types/room";
import { InfoItem } from "./InfoItem";
import { formatDateRange, formatThaiDate } from "../utils/formatters";
import { calculateAge } from "../utils/calculators";
import { resolveStatusText } from "../utils/resolvers";

interface BasicInfoSectionProps {
  resident: ApiResident | null;
  room: Room | null;
}

export function BasicInfoSection({ resident, room }: BasicInfoSectionProps) {
  const fullName = resident
    ? `${resident.first_name || ""} ${resident.last_name || ""}`.trim() || "-"
    : "-";
  const genderText = resident?.gender === "male" ? "ชาย" : resident?.gender === "female" ? "หญิง" : "-";
  const roomText = room ? `ห้อง ${room.room_number} ชั้น ${room.floor}` : "ไม่ระบุห้อง";
  const statusText = resolveStatusText(resident);
  const birthDateText = resident
    ? (() => {
        const baseText = formatThaiDate(resident.date_of_birth);
        const age = calculateAge(resident.date_of_birth);
        if (baseText === "-" || age === null) return baseText;
        return `${baseText} (${age} ปี)`;
      })()
    : "-";

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-sm font-semibold text-slate-700">ข้อมูลพื้นฐาน</h3>
        <span className="rounded-full bg-emerald-50 px-4 py-1 text-xs font-medium text-emerald-700">
          {statusText}
        </span>
      </div>
      <div className="mt-5 flex flex-col gap-6 lg:flex-row">
        <div className="flex flex-col items-center gap-3 lg:w-56">
          {resident?.profile_image ? (
            <img
              src={resident.profile_image}
              alt={fullName}
              className="h-28 w-28 rounded-full border-4 border-blue-200 object-cover"
            />
          ) : (
            <div className="flex h-28 w-28 items-center justify-center rounded-full bg-blue-100 text-3xl font-semibold text-blue-700">
              {fullName.charAt(0) || "-"}
            </div>
          )}
          <div className="text-sm font-medium text-slate-600">{roomText}</div>
        </div>
        <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
          <InfoItem icon={User} label="ชื่อ - สกุล" value={fullName} />
          <InfoItem icon={UserRound} label="เพศ" value={genderText} />
          <InfoItem icon={Calendar} label="วันเกิด" value={birthDateText} />
          <InfoItem icon={CreditCard} label="เลขบัตรประชาชน" value={resident?.id_card_number || "-"} />
          <InfoItem
            icon={Home}
            label="จุดประสงค์การเข้าพัก"
            value={resident?.purpose_of_stay || "-"}
          />
          <InfoItem
            icon={Calendar}
            label="วันที่เข้าพัก - วันที่คาดว่าจะออก"
            value={formatDateRange(resident?.check_in_date, resident?.expected_check_out_date)}
          />
        </div>
      </div>
    </section>
  );
}
