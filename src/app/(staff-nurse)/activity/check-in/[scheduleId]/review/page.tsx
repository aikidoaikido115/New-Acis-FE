"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Camera, Trash2, X } from "lucide-react";
import { BackButton } from "@/components/features/relative/back-button";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import {
  clearCheckInSession,
  loadCheckInSession,
  saveCheckInRecord,
  saveCheckInSession,
  type CheckInResident,
  type CheckInSession,
} from "@/components/features/activity/check-in/checkin-storage";
import { activityAttendanceService } from "@/services/activity-attendance.service";
import { residentService } from "@/services/resident.service";
import type { ActivityAttendance } from "@/types/activity-attendance";

type ReviewItem = CheckInResident & { photo?: string; rejected?: boolean };

export default function ActivityCheckInReviewPage() {
  const { showToast } = useToast();
  const router = useRouter();
  const params = useParams();
  const scheduleId = String(params?.scheduleId || "");

  const [session, setSession] = useState<CheckInSession | null>(null);
  const [selected, setSelected] = useState<ReviewItem | null>(null);
  const [isHistory, setIsHistory] = useState(false);
  const [attendance, setAttendance] = useState<ActivityAttendance | null>(null);

  useEffect(() => {
    const stored = loadCheckInSession(scheduleId);
    const urlParams = new URL(window.location.href).searchParams;
    const view = urlParams.get("view");
    if (stored) {
      setSession(stored);
      return;
    }

    // If no session in storage or explicitly viewing history, try to load attendance from API
    const loadAttendance = async () => {
      try {
        const att = await activityAttendanceService.getByScheduleId(scheduleId);
        if (!att) return;
        setAttendance(att);
        setIsHistory(view === "history" || !att.can_edit);

        // load resident names
        const ids = Array.from(new Set([...(att.selected_resident_ids || []), ...(att.rejected_resident_ids || [])]));
        const residents = await Promise.all(ids.map((id) => residentService.getById(id).catch(() => null)));
        const residentMap = new Map<string, string>();
        residents.forEach((r) => {
          if (!r) return;
          const id = (r as any).resident_id || (r as any).id || "";
          residentMap.set(String(id), `${r.first_name} ${r.last_name}`.trim());
        });

        const items = ids.map((id) => ({
          id,
          name: residentMap.get(id) || id,
          nickname: "-",
          roomNumber: "-",
          careType: "-",
          photo: att.photos?.[id],
          rejected: (att.rejected_resident_ids || []).includes(id),
        }));

        // set as pseudo-session for UI rendering
        setSession({
          scheduleId,
          activityTitle: undefined,
          date: undefined,
          startTime: undefined,
          endTime: undefined,
          residents: items.map((it) => ({ id: it.id, name: it.name, nickname: it.nickname, roomNumber: it.roomNumber, careType: it.careType })),
          selectedIds: (att.selected_resident_ids || []),
          photos: att.photos || {},
          rejectedIds: att.rejected_resident_ids || [],
          updatedAt: att.updated_at || new Date().toISOString(),
        });
      } catch (err) {
        // no attendance yet or network error
      }
    };

    void loadAttendance();
  }, [scheduleId]);

  const reviewItems = useMemo<ReviewItem[]>(() => {
    if (!session) return [];
    const rejectedSet = new Set(session.rejectedIds || []);
    return session.residents.map((resident) => ({
      ...resident,
      photo: session.photos[resident.id],
      rejected: rejectedSet.has(resident.id),
    }));
  }, [session]);

  const handleDeletePhoto = () => {
    if (!session || !selected) return;
    const nextPhotos = { ...session.photos };
    delete nextPhotos[selected.id];
    const nextSession = {
      ...session,
      photos: nextPhotos,
      updatedAt: new Date().toISOString(),
    };
    saveCheckInSession(nextSession);
    setSession(nextSession);
    setSelected(null);
  };

  const handleRetake = () => {
    if (!session || !selected) return;
    const nextPhotos = { ...session.photos };
    delete nextPhotos[selected.id];
    const nextRejected = (session.rejectedIds || []).filter((id) => id !== selected.id);
    const nextSession = {
      ...session,
      photos: nextPhotos,
      rejectedIds: nextRejected,
      updatedAt: new Date().toISOString(),
    };
    saveCheckInSession(nextSession);
    setSelected(null);
    router.push(`/activity/check-in/${scheduleId}/camera?retake=${selected.id}`);
  };

  const handleSaveAll = () => {
    if (!session) return;
    const payload = {
      selected_resident_ids: session.selectedIds || [],
      rejected_resident_ids: session.rejectedIds || [],
      photos: session.photos || {},
    };
    (async () => {
      try {
        await activityAttendanceService.upsert(scheduleId, payload);
        clearCheckInSession(scheduleId);
        showToast({ type: "success", title: "บันทึกภาพถ่ายสำเร็จ" , message: ""});
        router.push("/activity");
      } catch (err) {
        showToast({ type: "error", title: "บันทึกไม่สำเร็จ", message: String(err) });
      }
    })();
  };

  return (
    <div className="flex flex-col bg-slate-50 px-4 py-6 sm:px-6 lg:px-10">
      <BackButton text="ย้อนกลับ" href={`/activity/check-in/${scheduleId}`} />

      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-800">
          ตรวจสอบภาพถ่าย ({reviewItems.length}/{reviewItems.length})
        </h1>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {reviewItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setSelected(item)}
            className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
          >
            {item.photo ? (
              <img
                src={item.photo}
                alt={item.name}
                className="h-44 w-full object-cover"
              />
            ) : (
              <div className="flex h-44 w-full items-center justify-center bg-slate-200 text-slate-500">
                <Camera className="h-8 w-8" />
              </div>
            )}
            <div className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
              {item.name}
            </div>
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition group-hover:opacity-100">
              <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700">
                ดูรูป
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* ปุ่มบันทึกภาพทั้งหมด - ปรับ margin ให้อยู่เหนือ footer พอดี */}
      {!isHistory && (
        <div className="mt-8 mb-4">
          <button
            type="button"
            onClick={handleSaveAll}
            className="w-full rounded-lg bg-emerald-600 px-6 py-4 text-base font-semibold text-white shadow-sm transition hover:bg-emerald-700"
          >
            บันทึกภาพทั้งหมด
          </button>
        </div>
      )}

      <Modal isOpen={Boolean(selected)} onClose={() => setSelected(null)} size="lg">
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">{selected.name}</h2>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
                aria-label="ปิด"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {selected.photo ? (
              <img
                src={selected.photo}
                alt={selected.name}
                className="w-full rounded-xl object-cover"
              />
            ) : (
              <div className="flex h-64 items-center justify-center rounded-xl bg-slate-200 text-slate-500">
                <Camera className="h-10 w-10" />
              </div>
            )}

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleDeletePhoto}
                disabled={!selected.photo || isHistory}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold ${
                  selected.photo && !isHistory
                    ? "bg-red-500 text-white"
                    : "bg-slate-200 text-slate-400"
                }`}
              >
                <Trash2 className="h-4 w-4" />
                ลบรูป
              </button>
              <button
                type="button"
                onClick={handleRetake}
                disabled={isHistory}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold ${
                  isHistory ? "bg-slate-200 text-slate-400" : "bg-[#0093EF] text-white"
                }`}
              >
                <Camera className="h-4 w-4" />
                ถ่ายใหม่
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}