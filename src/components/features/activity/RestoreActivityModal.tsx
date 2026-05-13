"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { activityScheduleService } from "@/services/activity-schedule.service";

interface RestoreActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  scheduleId: string;
  activityName?: string;
  onRestored?: (updated: number) => void;
}

export function RestoreActivityModal({
  isOpen,
  onClose,
  scheduleId,
  activityName,
  onRestored,
}: RestoreActivityModalProps) {
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!scheduleId || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const result = await activityScheduleService.restore({ activity_id: scheduleId });
      onRestored?.(result.updated);
      onClose();
    } catch (err) {
      showToast({
        type: "error",
        title: "ยกเลิกงดไม่สำเร็จ",
        message: (err as { message?: string })?.message || "ไม่สามารถยกเลิกงดกิจกรรมได้",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="ยกเลิกงดกิจกรรม"
      size="sm"
      disableBackdropClose={isSubmitting}
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-700">
          ต้องการยกเลิกงดกิจกรรม{activityName ? ` ${activityName}` : ""} ใช่หรือไม่?
        </p>
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
            className="h-9 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting}
          >
            ยืนยัน
          </button>
        </div>
      </div>
    </Modal>
  );
}
