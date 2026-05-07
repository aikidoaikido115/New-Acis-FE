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
  saveCheckInSession,
  type CheckInResident,
  type CheckInSession,
} from "@/components/features/activity/check-in/checkin-storage";
import { activityParticipationService } from "@/services/activity-participation.service";

type ReviewItem = CheckInResident & { photo?: string; rejected?: boolean };

const buildPhotoFile = async (photoData: string, filename: string) => {
  if (!photoData) return null;

  const createFile = (mime: string, dataBytes: Uint8Array) => {
    const ext = mime.includes("png") ? "png" : "jpg";
    return new File([dataBytes.buffer as ArrayBuffer], `${filename}.${ext}`, { type: mime });
  };

  if (photoData.startsWith("data:")) {
    const [header, data] = photoData.split(",");
    if (!header || !data) return null;

    const match = header.match(/data:(.*?);base64/);
    const mime = match?.[1] || "image/jpeg";
    const binary = atob(data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return createFile(mime, bytes as unknown as Uint8Array);
  }

  try {
    const response = await fetch(photoData);
    if (!response.ok) return null;
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    return new File([arrayBuffer], `${filename}.${blob.type.includes("png") ? "png" : "jpg"}`, { type: blob.type || "image/jpeg" });
  } catch {
    return null;
  }
};

const getErrorStatus = (error: any) => error?.response?.status ?? error?.status_code ?? error?.status;

export default function ActivityCheckInReviewPage() {
  const { showToast } = useToast();
  const router = useRouter();
  const params = useParams();
  const scheduleId = String(params?.scheduleId || "");

  const [session, setSession] = useState<CheckInSession | null>(null);
  const [selected, setSelected] = useState<ReviewItem | null>(null);
  const [isHistory, setIsHistory] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const stored = loadCheckInSession(scheduleId);
    const urlParams = new URL(window.location.href).searchParams;
    const mode = urlParams.get("mode");
    if (stored) {
      setSession(stored);
      setIsHistory(mode === "history");
      return;
    }

    const loadParticipations = async () => {
      try {
        const residents = await activityParticipationService.getResidentsByScheduleId(scheduleId);
        const participating = residents.filter((resident) => resident.is_participating);
        setIsHistory(mode === "history");

       const photoEntries = await Promise.all(
          participating.map(async (resident) => {
            try {
              const participation = await activityParticipationService.getByCompositeKey(resident.resident_id, scheduleId);
              
              let firstUrl = null;
              const rawImg = participation.img_urls;
              
              if (Array.isArray(rawImg) && rawImg.length > 0) {
                 firstUrl = rawImg[0]?.url || rawImg[0]; 
              } else if (typeof rawImg === 'string') {
                 try {
                   const parsed = JSON.parse(rawImg);
                   firstUrl = parsed?.[0]?.url || parsed?.[0];
                 } catch (e) {
                   firstUrl = rawImg;
                 }
              }

              return firstUrl ? [resident.resident_id, firstUrl] : null;
            } catch {
              return null;
            }
          })
        );

        const photos = photoEntries.reduce<Record<string, string>>((acc, entry) => {
          if (entry) {
            acc[entry[0]] = entry[1];
          }
          return acc;
        }, {});

        const items = participating.map((resident) => ({
          id: resident.resident_id,
          name: `${resident.first_name} ${resident.last_name}`.trim(),
          nickname: resident.nickname || "-",
          roomNumber: resident.room_number || "-",
          careType: "-",
          photo: photos[resident.resident_id],
        }));

        setSession({
          scheduleId,
          activityTitle: undefined,
          date: undefined,
          startTime: undefined,
          endTime: undefined,
          residents: items.map((it) => ({
            id: it.id,
            name: it.name,
            nickname: it.nickname,
            roomNumber: it.roomNumber,
            careType: it.careType,
          })),
          selectedIds: items.map((it) => it.id),
          initialSelectedIds: items.map((it) => it.id),
          photos,
          rejectedIds: [],
          updatedAt: new Date().toISOString(),
        });
      } catch (err) {
        // no participation yet or network error
      }
    };

    void loadParticipations();
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
    if (!session || isSaving) return;
    setIsSaving(true);

    const selectedSet = new Set(session.selectedIds || []);
    const initialSelectedSet = new Set(session.initialSelectedIds || session.selectedIds || []);
    const deselectedIds = Array.from(initialSelectedSet).filter((id) => !selectedSet.has(id));

    const upsertParticipation = async (residentId: string, isParticipating: boolean, photoData?: string) => {
      const file = photoData ? await buildPhotoFile(photoData, `activity-${residentId}`) : null;
      const files = file ? [file] : undefined;
      try {
        await activityParticipationService.create(
          {
            resident_id: residentId,
            as_id: scheduleId,
            is_participating: isParticipating,
          },
          files
        );
      } catch (error: any) {
        const status = getErrorStatus(error);
        if (status === 409) {
          await activityParticipationService.update(
            residentId,
            scheduleId,
            { is_participating: isParticipating },
            files
          );
          return;
        }
        throw error;
      }
    };

    const updateToNotParticipating = async (residentId: string) => {
      try {
        await activityParticipationService.update(residentId, scheduleId, { is_participating: false });
      } catch (error: any) {
        const status = getErrorStatus(error);
        if (status !== 404) throw error;
      }
    };
    (async () => {
      try {
        await Promise.all(
          Array.from(selectedSet).map((residentId) =>
            upsertParticipation(residentId, true, session.photos?.[residentId])
          )
        );
        await Promise.all(deselectedIds.map((residentId) => updateToNotParticipating(residentId)));
        clearCheckInSession(scheduleId);
        showToast({ type: "success", title: "บันทึกภาพถ่ายสำเร็จ" , message: ""});
        router.push("/activity");
      } catch (err) {
        showToast({ type: "error", title: "บันทึกไม่สำเร็จ", message: String(err) });
        setIsSaving(false);
      }
    })();
  };

  const [canEdit, setCanEdit] = useState(false);
  useEffect(() => {
    const urlParams = new URL(window.location.href).searchParams;
    const startTimeStr = urlParams.get("start");
    if (!startTimeStr) {
      setCanEdit(true);
      return;
    }
    const startDate = new Date(startTimeStr);
    const now = new Date();
    const windowStart = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const windowEnd = new Date(windowStart);
    windowEnd.setDate(windowEnd.getDate() + 1);
    windowEnd.setHours(23, 59, 59, 999);

    setCanEdit(now >= windowStart && now <= windowEnd);
  }, []);

  return (
    <div className="flex flex-col bg-slate-50 px-4 py-6 sm:px-6 lg:px-10">
      <BackButton 
        text="ย้อนกลับ" 
        href={`/activity/check-in/${scheduleId}${isHistory ? '?mode=history' : ''}`} 
      />
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

      {!isHistory && (
        <div className="mt-8 mb-4">
          <button
            type="button"
            onClick={handleSaveAll}
            disabled={isSaving}
            className={`w-full rounded-lg px-6 py-4 text-base font-semibold text-white shadow-sm transition ${
              isSaving
                ? "bg-slate-400 cursor-not-allowed opacity-80"
                : "bg-emerald-600 hover:bg-emerald-700"
            }`}
          >
            {isSaving ? "กำลังบันทึกภาพ..." : "บันทึกภาพทั้งหมด"}
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
                disabled={canEdit}
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