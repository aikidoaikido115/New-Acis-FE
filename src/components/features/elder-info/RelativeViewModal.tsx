"use client";
import { X } from "lucide-react";
import { RelativeDashboardContent } from "@/components/features/relative/dashboard-content";

interface RelativeViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  residentName: string | null;
  residentId?: string | null;
}

export function RelativeViewModal({ isOpen, onClose, residentName, residentId }: RelativeViewModalProps) {
  if (!isOpen) return null;

  const handleDateChange = (date: string) => {
    // TODO: Fetch data for the selected date
    console.log('Selected date:', date);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-6xl max-h-[95vh] bg-gray-50 rounded-2xl shadow-xl overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-60 p-2 text-slate-500 hover:text-slate-700 bg-white hover:bg-slate-100 rounded-full shadow-lg transition"
          aria-label="ปิด"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Main Content */}
        <div className="overflow-y-auto max-h-[95vh]">
          <div className="p-6 md:p-8">
            <RelativeDashboardContent
              residentName={residentName || undefined}
              residentId={residentId || undefined}
              onDateChange={handleDateChange}
              showPreviewBanner={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
