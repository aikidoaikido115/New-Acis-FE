"use client";
import { X } from "lucide-react";
import { useState, useEffect } from "react";
import { residentService } from '@/services/resident.service';
import { type RelativeDashboardData } from '@/services/relative-portal.service';
import { RelativeDashboardContent } from "@/components/features/relative/dashboard-content";

interface RelativeViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  residentName: string | null;
  residentId?: string | null;
}

export function RelativeViewModal({ isOpen, onClose, residentName, residentId }: RelativeViewModalProps) {
  const [dashboardData, setDashboardData] = useState<RelativeDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async (date?: string) => {
    if (!residentId || residentId === "undefined") return; 
    
    setIsLoading(true);
    setError(null);
    try {
      const result = await residentService.getRelativeDashboardPreview(residentId, date);
      setDashboardData(result);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || "ไม่สามารถดึงข้อมูลพรีวิวได้";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    if (isOpen) {
      void fetchDashboard();
    }
  }, [isOpen, residentId]);

  const handleDateChange = (date: string) => {
    void fetchDashboard(date);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-6xl max-h-[95vh] bg-gray-50 rounded-2xl shadow-xl overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-60 p-2 text-slate-500 hover:text-slate-700 bg-white hover:bg-slate-100 rounded-full shadow-lg transition"
          aria-label="ปิด"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="overflow-y-auto max-h-[95vh]">
          <div className="p-6 md:p-8">
            <RelativeDashboardContent
              residentName={residentName || undefined}
              residentId={residentId || undefined}
              lastUpdatedAt={dashboardData?.last_updated_at}
              notes={dashboardData?.notes || []}
              participations={dashboardData?.participations || []}
              isLoading={isLoading}
              isInitialLoading={isLoading && !dashboardData}
              error={error}
              onDateChange={handleDateChange}
              showPreviewBanner={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
}