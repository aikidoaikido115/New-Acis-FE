"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { activityScheduleService } from "@/services/activity-schedule.service";

interface CancelActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  scheduleId: string;
  seriesId?: string | null;
  activityName?: string;
  onCancelled?: (updated: number) => void;
}

type CancelMode = "single" | "following";

export function CancelActivityModal({
  isOpen,
  onClose,
  scheduleId,
  seriesId,
  activityName,
  onCancelled,
}: CancelActivityModalProps) {
  const { showToast } = useToast();
  const [cancelMode, setCancelMode] = useState<CancelMode>("single");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!seriesId) {
      setCancelMode("single");
    }
  }, [seriesId]);

  const handleSubmit = async () => {
    if (!scheduleId || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const result = await activityScheduleService.cancel({
        activity_id: scheduleId,
        cancel_mode: seriesId ? cancelMode : "single",
      });
      onCancelled?.(result.updated);
      onClose();
    } catch (err) {
      showToast({
        type: "error",
        title: "งดกิจกรรมไม่สำเร็จ",
        message: (err as { message?: string })?.message || "ไม่สามารถงดกิจกรรมได้",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="งดกิจกรรม"
      size="sm"
      disableBackdropClose={isSubmitting}
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-700">
          ต้องการงดกิจกรรม{activityName ? ` ${activityName}` : ""} ใช่หรือไม่?
        </p>

        {seriesId ? (
          <div className="space-y-2 text-sm text-slate-600">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="cancelMode"
                value="single"
                checked={cancelMode === "single"}
                onChange={() => setCancelMode("single")}
              />
              งดเฉพาะวันนี้
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="cancelMode"
                value="following"
                checked={cancelMode === "following"}
                onChange={() => setCancelMode("following")}
              />
              งดตั้งแต่วันนี้เป็นต้นไป
            </label>
          </div>
        ) : (
          <p className="text-xs text-slate-500">กิจกรรมนี้ไม่ได้อยู่ในชุดที่ทำซ้ำ</p>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 text-sm text-slate-600 hover:text-slate-800"
            disabled={isSubmitting}
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="h-9 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting}
          >
            ยืนยันการงด
          </button>
        </div>
      </div>
    </Modal>
  );
}
