"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Calendar, Pencil, Plus, Trash2, Copy } from "lucide-react";
import { useRouter } from "next/navigation";
import { ActivityCalendar } from "@/components/features/activity/activity-calendar";
import { ActivityFormModal, type ActivityFormData } from "@/components/features/activity/activity-form-modal";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { activityService } from "@/services/activity.service";
import { activityScheduleService } from "@/services/activity-schedule.service";
import { activityParticipationService } from "@/services/activity-participation.service";
import { ContactInformationModal } from "@/components/shared/contact/ContactInformationModal";
import { resolveContactInfo } from "@/components/shared/contact/contactDirectory";
import type { Activity } from "@/types/activity";
import type { ActivitySchedule } from "@/types/activity-schedule";

const DAYS_FULL = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];
const MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];

interface EmptyActivityCardProps {
  selectedDate: Date;
  onAddActivity: () => void;
}

function EmptyActivityCard({ selectedDate, onAddActivity }: EmptyActivityCardProps) {
  const dayName = DAYS_FULL[selectedDate.getDay()];
  const date = selectedDate.getDate();
  const monthName = MONTHS[selectedDate.getMonth()];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-6 py-4">
        <h2 className="text-sm font-semibold text-slate-700">
          กิจกรรมประจำวัน{dayName}ที่ {date} {monthName}
        </h2>
      </div>
      <div className="flex flex-col items-center justify-center gap-4 px-6 py-10 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-slate-200">
          <Calendar className="h-10 w-10 text-slate-300" />
        </div>
        <div>
          <p className="text-lg font-semibold text-slate-700">ไม่มีกิจกรรมในวันนี้</p>
          <p className="text-sm text-slate-500">เริ่มสร้างกิจกรรมของคุณ</p>
        </div>
          <button
            type="button"
            onClick={onAddActivity}
            className="w-full rounded-lg bg-[#0093EF] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 flex items-center justify-center gap-2"
          >
            <Plus className="h-4 w-4" />
            เพิ่มกิจกรรมในวันนี้
          </button>
      </div>
    </div>
  );
}

interface ActivityScheduleCardProps {
  selectedDate: Date;
  items: ActivitySchedule[];
  onAddActivity: () => void;
  onEdit: (schedule: ActivitySchedule) => void;
  onDelete: (schedule: ActivitySchedule) => void;
  onCopy: (schedule: ActivitySchedule, activity?: Activity) => void;
  onCheckIn: (schedule: ActivitySchedule, activity: Activity | undefined, mode: "checkin" | "history") => void;
  resolveActivity: (schedule: ActivitySchedule) => Activity | undefined;
  onOpenContact: (name: string) => void; 
}

function ActivityScheduleCard({
  selectedDate,
  items,
  onAddActivity,
  onEdit,
  onDelete,
  onCopy,
  onCheckIn,
  resolveActivity,
  onOpenContact,
}: ActivityScheduleCardProps) {
  const isSmallScreen = typeof window !== "undefined" ? window.innerWidth < 640 : false;
  const dayName = DAYS_FULL[selectedDate.getDay()];
  const date = selectedDate.getDate();
  const monthName = MONTHS[selectedDate.getMonth()];
  
  const resolveCheckInState = (schedule: ActivitySchedule) => {
    const rawStart = schedule.start_time || schedule.date;
    if (!rawStart) return "active";
    const start = new Date(rawStart);
    if (Number.isNaN(start.getTime())) return "active";

    const windowStart = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const windowEnd = new Date(windowStart);
    windowEnd.setDate(windowEnd.getDate() + 1);
    windowEnd.setHours(23, 59, 59, 999);

    const now = new Date();
    if (now < windowStart) return "upcoming";
    if (now > windowEnd) return "expired";
    return "active";
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-6 py-4">
        <h2 className="text-sm font-semibold text-slate-700">
          กิจกรรมประจำวัน{dayName}ที่ {date} {monthName}
        </h2>
      </div>
      <div className="px-6">
        <div className="max-h-[42vh] overflow-y-auto pr-2 lg:max-h-[56vh] divide-y divide-slate-100">
        {items.map((item, index) => {
          const activity = resolveActivity(item);
          const isLast = index === items.length - 1;
          const description = activity?.description && activity.description.trim() ? activity.description : "-";
          const location = activity?.location && activity.location.trim() ? activity.location : "-";
          
          const resolveUpdatedBy = () => {
          const staffObj = (activity as any)?.staff || (activity as any)?.Staff;
          
          if (staffObj) {
            const userObj = staffObj.user || staffObj.User;
            if (userObj) {
              const fullName = `${userObj.first_name || ""} ${userObj.last_name || ""}`.trim();
              if (fullName !== "") return fullName;
              
              const nickname = userObj.nickname || userObj.name;
              if (nickname && nickname !== "") return nickname;
            }

            const staffFullName = `${staffObj.first_name || ""} ${staffObj.last_name || ""}`.trim();
            if (staffFullName !== "") return staffFullName;
          }

          const staffName = (activity as any)?.staff_name
            || (activity as any)?.created_by_staff_name
            || (activity as any)?.updated_by_staff_name;
          if (staffName) return staffName;

          const finalFallback = activity?.staff_id || "-";
          return finalFallback.length > 20 ? "ไม่ระบุชื่อ" : finalFallback;
        };
          const updatedByName = resolveUpdatedBy();
          const checkInState = resolveCheckInState(item);
          
          return (
            <div key={item.as_id} className="flex gap-4 py-4">
              {!isSmallScreen && (
                <div className="flex w-16 flex-col items-center">
                  <span className="text-xs font-semibold text-slate-600">
                    {formatTime(item.start_time)}
                  </span>
                  <span className="mt-2 h-4 w-4 rounded-full bg-[#0093EF]" />
                  <span className={isLast ? "mt-2 w-px flex-1 bg-transparent" : "mt-2 w-px flex-1 bg-slate-200"} />
                </div>
              )}
              <div className="flex-1 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500">
                      [{formatTime(item.start_time)} - {formatTime(item.end_time)}]
                    </p>
                    <p className="text-base font-semibold text-slate-800">
                      {activity?.activity_name || "-"}
                    </p>
                    <p className="text-sm text-slate-600">รายละเอียด: {description}</p>
                    <p className="text-sm text-slate-500">สถานที่: {location}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="hidden sm:inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                      {activity?.activity_type || "-"}
                    </span>
                    <button
                      type="button"
                      onClick={() => onEdit(item)}
                      className="rounded-lg p-1 text-blue-600 transition hover:bg-slate-100 hover:text-slate-600"
                      aria-label="แก้ไขกิจกรรม"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(item)}
                      className="rounded-lg p-1 text-red-600 transition hover:bg-red-50 hover:text-red-600"
                      aria-label="ลบกิจกรรม"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onCopy(item, activity)}
                      className="rounded-lg p-1 text-slate-600 transition hover:bg-slate-100 hover:text-slate-600"
                      aria-label="คัดลอกข้อมูลกิจกรรม"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <p className="text-xs text-slate-500">
                    อัปเดตล่าสุดโดย:{" "}
                    {updatedByName !== "-" ? (
                      <button
                        type="button"
                        onClick={() => onOpenContact(updatedByName)}
                        className="text-xs text-blue-600 underline hover:text-blue-700"
                      >
                        {updatedByName}
                      </button>
                    ) : (
                      "-"
                    )}
                  </p>
                  {checkInState === "active" ? (
                    <button
                      type="button"
                      className="rounded-md bg-[#0093EF] px-5 py-2 text-xs font-semibold text-white transition hover:bg-blue-500"
                      onClick={() => onCheckIn(item, activity, "checkin")}
                    >
                      เช็คชื่อ
                    </button>
                  ) : checkInState === "expired" ? (
                    <button
                      type="button"
                      className="rounded-md bg-slate-300 px-5 py-2 text-xs font-semibold text-slate-600"
                      onClick={() => onCheckIn(item, activity, "history")}
                    >
                      ดูประวัติ
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="rounded-md bg-slate-200 px-5 py-2 text-xs font-semibold text-slate-500 cursor-not-allowed"
                      aria-disabled="true"
                      title="ยังไม่ถึงวันจัดกิจกรรม"
                    >
                      ยังไม่ถึงวันกิจกรรม
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        </div>
      </div>
      <div className="border-t border-slate-200 px-6 py-4 flex justify-center">
        <button
          type="button"
          onClick={onAddActivity}
          className="inline-flex items-center gap-2 rounded-lg bg-[#0093EF] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500"
        >
          <Plus className="h-4 w-4" />
          เพิ่มกิจกรรมในวันนี้
        </button>
      </div>
    </div>
  );
}

const toDateKey = (date: Date) => {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${year}-${month}-${day}`;
};

const toDateKeyFromValue = (value?: string) => {
  if (!value) return "";
  if (!value.includes("T")) return value;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return toDateKey(parsed);
};

const parseLocalDate = (value?: string) => {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

const formatTime = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};

export default function ActivityPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [scheduleItems, setScheduleItems] = useState<ActivitySchedule[]>([]);
  const [schedulesByMonth, setSchedulesByMonth] = useState<Record<string, number>>({}); 
  const [editingSchedule, setEditingSchedule] = useState<ActivitySchedule | null>(null);
  const [prefillValues, setPrefillValues] = useState<Partial<ActivityFormData> | undefined>(undefined);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ActivitySchedule | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  
  const [activeContactName, setActiveContactName] = useState<string | null>(null);

  // ⭐️ แก้ไขให้โหลดข้อมูลกิจกรรมในทุกๆ เดือน "ทั้งหมด" เข้ามาเก็บตั้งแต่ตอนเปิดเว็บ
  useEffect(() => {
    let mounted = true;
    const loadAllMonthSchedules = async () => {
      try {
        const schedules = await activityScheduleService.getAll();
        if (!mounted) return;
        const schedulesMap: Record<string, number> = {};
        
        schedules.forEach((schedule) => {
          const dateKey = toDateKeyFromValue(schedule.date);
          if (!dateKey) return;
          // นับจำนวนกิจกรรมทุกวันที่เจอ
          schedulesMap[dateKey] = (schedulesMap[dateKey] ?? 0) + 1;
        });
        
        setSchedulesByMonth(schedulesMap);
      } catch {
        // ignore
      }
    };
    loadAllMonthSchedules();
    
    return () => { mounted = false; };
  }, []); // รันครั้งเดียวตอนโหลด

  const loadActivities = useCallback(async () => {
    try {
      const data = await activityService.getAll();
      setActivities(data);
    } catch (error: any) {
      showToast({
        type: "error",
        title: "โหลดกิจกรรมไม่สำเร็จ",
        message: error?.message || "ไม่สามารถโหลดรายการกิจกรรมจากระบบได้",
      });
    }
  }, [showToast]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  const loadSchedules = useCallback(
    async (dateKey: string) => {
      try {
        const data = await activityScheduleService.getByDate(dateKey);
        setScheduleItems(data);
      } catch (error: any) {
        const status = error?.response?.status ?? error?.status_code ?? error?.status;
        if (status === 404) {
          setScheduleItems([]);
          return;
        }
        showToast({
          type: "error",
          title: "โหลดตารางกิจกรรมไม่สำเร็จ",
          message: error?.message || "ไม่สามารถโหลดตารางกิจกรรมได้",
        });
      }
    },
    [showToast]
  );

  useEffect(() => {
    loadSchedules(toDateKey(selectedDate));
  }, [selectedDate, loadSchedules]);

  useEffect(() => {
    let mounted = true;
    const enrich = async () => {
      try {
        const items = scheduleItems || [];
        const indices = items.map((it, i) => ({ it, i })).filter(({ it }) => typeof it.can_check_in === "undefined").map(({ i }) => i);
        if (indices.length === 0) return;
        const nextItems = items.map((it) => ({ ...it }));
        
        await Promise.all(indices.map(async (idx) => {
          const item = items[idx];
          try {
            const residents = await activityParticipationService.getResidentsByScheduleId(item.as_id);
            if (!mounted) return;
            nextItems[idx].has_attendance = residents.some((resident) => resident.is_participating);
            nextItems[idx].can_check_in = true;
          } catch (err) {
            nextItems[idx].has_attendance = false;
            nextItems[idx].can_check_in = true;
          }
        }));
        if (!mounted) return;
        setScheduleItems(nextItems);
      } catch (err) {
        // ignore enrichment errors
      }
    };
    void enrich();
    return () => { mounted = false; };
  }, [scheduleItems]);

  const handleAddActivity = () => {
    setEditingSchedule(null);
    setPrefillValues(undefined);
    setIsModalOpen(true);
  };

  const handleCreateActivityOption = useCallback(
    async (payload: {
      activity_name: string;
      activity_type: string;
      description?: string | null;
      location?: string | null;
    }) => {
      try {
        const created = await activityService.create(payload);
        setActivities((prev) => [created, ...prev]);
        showToast({ type: "success", title: "เพิ่มกิจกรรมใหม่สำเร็จ", message: created.activity_name });
        return created;
      } catch (error: any) {
        showToast({
          type: "error",
          title: "เพิ่มกิจกรรมไม่สำเร็จ",
          message: error?.message || "ไม่สามารถเพิ่มกิจกรรมได้",
        });
        return null;
      }
    },
    [showToast]
  );

  const handleSubmitActivity = async (data: ActivityFormData) => {
  const payload = {
    activity_name: data.name.trim(),
    activity_type: data.type.trim(),
    description: data.description.trim() ? data.description.trim() : null,
    location: data.location.trim() ? data.location.trim() : null,
  };

  try {
    let activityId = data.activityId;

    if (activityId) {
      await activityService.update(activityId, payload);
    } else {
      const newActivity = await activityService.create(payload);
      activityId = newActivity.activity_id;
    }

    const schedulePayload = {
      activity_id: activityId,
      date: data.date,
      start_time: data.startTime,
      end_time: data.endTime,
    };

    if (editingSchedule) {
      await activityScheduleService.update(editingSchedule.as_id, schedulePayload);
    } else {
      await activityScheduleService.create(schedulePayload);
    }

    const nextDate = parseLocalDate(data.date) || selectedDate;
    const dateKey = toDateKey(nextDate);

    await Promise.all([
      loadActivities(),        // โหลดรายการกิจกรรมทั้งหมดใหม่ (เพื่อให้ได้ชื่อ Staff ล่าสุด)
      loadSchedules(dateKey)   // โหลดตารางของวันนั้นใหม่
    ]);

    try {
      const freshSchedules = await activityScheduleService.getAll();
      const schedulesMap: Record<string, number> = {};
      freshSchedules.forEach((s) => {
        const k = toDateKey(new Date(s.date));
        schedulesMap[k] = (schedulesMap[k] ?? 0) + 1;
      });
      setSchedulesByMonth(schedulesMap);
    } catch { /* ignore */ }

    showToast({ 
      type: "success", 
      title: editingSchedule ? "แก้ไขสำเร็จ" : "บันทึกสำเร็จ" 
    });

    if (nextDate.getTime() !== selectedDate.getTime()) {
      setSelectedDate(nextDate);
    }
    
    setIsModalOpen(false);
    setEditingSchedule(null);

  } catch (error: any) {
    showToast({
      type: "error",
      title: "บันทึกไม่สำเร็จ",
      message: error?.message || "เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์",
    });
  }
};
  const resolveActivity = useCallback(
    (schedule: ActivitySchedule) => schedule.activity || activities.find((activity) => activity.activity_id === schedule.activity_id),
    [activities]
  );

  const handleEditSchedule = (schedule: ActivitySchedule) => {
    setPrefillValues(undefined);
    setEditingSchedule(schedule);
    setIsModalOpen(true);
  };

  const handleCopySchedule = (schedule: ActivitySchedule, activity?: Activity) => {
    setEditingSchedule(null);
    setPrefillValues({
      activityId: schedule.activity_id,
      name: activity?.activity_name || "",
      type: activity?.activity_type || "",
      description: activity?.description || "",
      location: activity?.location || "",
      date: "",
      startTime: "",
      endTime: "",
    });
    setIsModalOpen(true);
  };

  const handleRequestDelete = (schedule: ActivitySchedule) => {
    setDeleteTarget(schedule);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDelete = () => {
    setIsDeleteModalOpen(false);
    setDeleteTarget(null);
    setDeleteConfirmText("");
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.has_attendance) {
      if (deleteConfirmText.trim() !== "ลบ") {
        showToast({ type: "error", title: "ต้องพิมพ์ 'ลบ' เพื่อยืนยันการลบกิจกรรมที่มีข้อมูลการบันทึก", message: "" });
        return;
      }
    }
    try {
      try {
        const participations = await activityParticipationService.getAll();
        const scheduleParts = (participations || []).filter(p => p.as_id === deleteTarget.as_id);
        for (const part of scheduleParts) {
          await activityParticipationService.remove(part.resident_id, deleteTarget.as_id);
        }
      } catch (err) {
        console.log("No participations to delete or error deleting them:", err);
      }

      await activityScheduleService.remove(deleteTarget.as_id);
      showToast({ type: "success", title: "ลบกำหนดการสำเร็จ", message: "", });
      
      const deletedDateKey = toDateKey(new Date(deleteTarget.date));
      await loadSchedules(toDateKey(selectedDate));
      
      // ลบจุดออกจากปฏิทิน หากไม่มีกิจกรรมเหลือในวันนั้นแล้ว
      try {
        const freshSchedules = await activityScheduleService.getByDate(deletedDateKey);
        setSchedulesByMonth((prev) => ({
          ...prev,
          [deletedDateKey]: freshSchedules?.length ?? 0,
        }));
      } catch {
        setSchedulesByMonth((prev) => ({
          ...prev,
          [deletedDateKey]: Math.max(0, (prev[deletedDateKey] ?? 1) - 1),
        }));
      }
      
      handleCloseDelete();
    } catch (error: any) {
      showToast({
        type: "error",
        title: "ลบกำหนดการไม่สำเร็จ",
        message: error?.message || "ไม่สามารถลบกำหนดการได้",
      });
    }
  };

  const dailyScheduleItems = scheduleItems
    .filter((item) => item.date)
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  const displayScheduleItems = dailyScheduleItems;

  const modalInitialValues = useMemo<Partial<ActivityFormData> | undefined>(() => {
    if (prefillValues) return prefillValues;
    if (!editingSchedule) return undefined;
    const activity = resolveActivity(editingSchedule);
    return {
      activityId: editingSchedule.activity_id,
      name: editingSchedule.activity?.activity_name || activity?.activity_name || "",
      type: editingSchedule.activity?.activity_type || activity?.activity_type || "",
      description: editingSchedule.activity?.description || activity?.description || "",
      location: editingSchedule.activity?.location || activity?.location || "",
      date: toDateKey(new Date(editingSchedule.date)),
      startTime: formatTime(editingSchedule.start_time),
      endTime: formatTime(editingSchedule.end_time),
    };
  }, [prefillValues, editingSchedule, resolveActivity]);

  const deleteActivity = deleteTarget ? resolveActivity(deleteTarget) : undefined;

  const handleCheckIn = (schedule: ActivitySchedule, activity: Activity | undefined, mode: "checkin" | "history") => {
    const title = activity?.activity_name || schedule.activity?.activity_name || "กิจกรรม";
    const query = new URLSearchParams({
      title,
      date: schedule.date,
      start: schedule.start_time,
      end: schedule.end_time,
    });
    if (mode === "history") {
      router.push(`/activity/check-in/${schedule.as_id}?${query.toString()}&mode=history`);
      return;
    }
    router.push(`/activity/check-in/${schedule.as_id}?${query.toString()}`);
  };

  return (
    <>
      <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
        <div>
          <h2 className="text-headline-5 font-bold text-gray-800">ตารางกิจกรรม</h2>
        </div>

        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <ActivityCalendar 
            selectedDate={selectedDate} 
            onSelectDate={setSelectedDate}
            schedulesByMonth={schedulesByMonth}
          />
          {displayScheduleItems.length === 0 ? (
            <EmptyActivityCard selectedDate={selectedDate} onAddActivity={handleAddActivity} />
          ) : (
            <ActivityScheduleCard
              selectedDate={selectedDate}
              items={displayScheduleItems}
              onAddActivity={handleAddActivity}
              onEdit={handleEditSchedule}
              onDelete={handleRequestDelete}
              onCopy={handleCopySchedule}
              onCheckIn={handleCheckIn}
              resolveActivity={resolveActivity}
              onOpenContact={setActiveContactName} 
            />
          )}
        </div>
      </div>

      <Modal isOpen={isDeleteModalOpen} onClose={handleCloseDelete} title="ลบกิจกรรม" size="md">
        <div className="space-y-4">
          <p className="text-slate-700">คุณต้องการลบกิจกรรมที่เลือกใช่หรือไม่?</p>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-sm font-semibold text-slate-800">{deleteActivity?.activity_name || "-"}</p>
            <p className="text-xs text-slate-500">{deleteActivity?.activity_type || "-"}</p>
          </div>
          {deleteTarget?.has_attendance && (
            <div className="mt-2">
              <p className="text-xs text-slate-500">กิจกรรมนี้มีข้อมูลการบันทึก หากต้องการลบกรุณาพิมพ์ <strong>ลบ</strong> ลงในช่องด้านล่างเพื่อยืนยัน</p>
              <input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="mt-2 w-full rounded-md border border-slate-200 text-sm text-black px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="พิมพ์ ลบ เพื่อยืนยัน"
              />
            </div>
          )}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleCloseDelete}
              className="rounded-lg bg-slate-200 px-6 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-300"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              disabled={deleteTarget?.has_attendance && deleteConfirmText.trim() !== "ลบ"}
              className={`rounded-lg px-6 py-2 text-sm font-semibold text-white transition ${
                deleteTarget?.has_attendance && deleteConfirmText.trim() !== "ลบ" ? "bg-slate-300 text-slate-400" : "bg-red-500 hover:bg-red-600"
              }`}
            >
              ลบกิจกรรม
            </button>
          </div>
        </div>
      </Modal>

      <ActivityFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingSchedule(null);
          setPrefillValues(undefined);
        }}
        onSubmit={handleSubmitActivity}
        defaultDate={selectedDate}
        activityOptions={activities}
        onCreateActivityOption={handleCreateActivityOption}
        mode={editingSchedule ? "edit" : "create"}
        initialValues={modalInitialValues}
      />

      {activeContactName ? (
        <ContactInformationModal
          contact={resolveContactInfo(activeContactName)}
          onClose={() => setActiveContactName(null)}
        />
      ) : null}
    </>
  );
}