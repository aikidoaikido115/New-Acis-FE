"use client";

import { useCallback, useEffect, useState } from "react";
import { Copy, Printer, X } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { residentService } from "@/services/resident.service";
import { roomService } from "@/services/room.service";
import { allergyService } from "@/services/allergy.service";
import { drugAllergyService } from "@/services/drug-allergy.service";
import { personalDrugService } from "@/services/personal-drug.service";
import type { Resident as ApiResident } from "@/types/resident";
import type { Room } from "@/types/room";
import type { PersonalDrug } from "@/services/personal-drug.service";
import { BasicInfoSection } from "./components/BasicInfoSection";
import { MedicalInfoSection } from "./components/MedicalInfoSection";
import { EmergencySafetySection } from "./components/EmergencySafetySection";
import { formatPrintDateTime } from "./utils/formatters";
import { useToast } from "@/components/ui/toast";

interface ResidentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  residentId: string | null;
}

export function ResidentDetailModal({ isOpen, onClose, residentId }: ResidentDetailModalProps) {
  const { showToast } = useToast();
  const [resident, setResident] = useState<ApiResident | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [drugAllergies, setDrugAllergies] = useState<string[]>([]);
  const [medications, setMedications] = useState<PersonalDrug[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [printDateTime, setPrintDateTime] = useState<string>("");

  const fetchData = useCallback(async () => {
    if (!residentId) return;
    setIsLoading(true);
    setError(null);
    try {
      const residentData = await residentService.getById(residentId);
      setResident(residentData);

      const roomId = residentData.room_id;
      if (roomId) {
        const roomData = await roomService.getById(roomId);
        setRoom(roomData);
      } else {
        setRoom(null);
      }

      const [foodAllergyItems, drugAllergyItems, drugs] = await Promise.all([
        allergyService.getByResident(residentId),
        drugAllergyService.getByResident(residentId),
        personalDrugService.getByResidentAll(residentId),
      ]);

      const foodNames = (foodAllergyItems || [])
        .map((item) => item.allergy?.allergy_name || item.allergy_name)
        .filter(Boolean) as string[];

      const drugNames = (drugAllergyItems || [])
        .map((item) => item.drug_allergy?.allergy_name || item.allergy_name)
        .filter(Boolean) as string[];

      setAllergies(Array.from(new Set(foodNames)));
      setDrugAllergies(Array.from(new Set(drugNames)));
      setMedications(drugs || []);
    } catch {
      setError("ไม่สามารถโหลดข้อมูลผู้สูงอายุได้");
      setResident(null);
      setRoom(null);
      setAllergies([]);
      setDrugAllergies([]);
      setMedications([]);
    } finally {
      setIsLoading(false);
    }
  }, [residentId]);

  useEffect(() => {
    if (!isOpen) return;
    void fetchData();
  }, [isOpen, fetchData]);

  useEffect(() => {
    const handleBeforePrint = () => {
      const now = new Date();
      setPrintDateTime(formatPrintDateTime(now));
      document.body.classList.add("print-resident-modal");
    };
    const handleAfterPrint = () => {
      document.body.classList.remove("print-resident-modal");
    };
    window.addEventListener("beforeprint", handleBeforePrint);
    window.addEventListener("afterprint", handleAfterPrint);
    return () => {
      window.removeEventListener("beforeprint", handleBeforePrint);
      window.removeEventListener("afterprint", handleAfterPrint);
    };
  }, []);

  const handleExport = () => {
    const now = new Date();
    setPrintDateTime(formatPrintDateTime(now));
    document.body.classList.add("print-resident-modal");
    setTimeout(() => {
      window.print();
    }, 50);
  };

  const handleCopyRelativeMagicLink = async () => {
    if (!residentId) return;
    try {
      const linkData = await residentService.getRelativeMagicLink(residentId);
      const absoluteLink = new URL(linkData.magic_link, window.location.origin).toString();
      await navigator.clipboard.writeText(absoluteLink);
      showToast({
        type: "success",
        title: "คัดลอกลิงก์สำเร็จ",
        message: "ลิงก์สำหรับญาติถูกคัดลอกไปยังคลิปบอร์ดแล้ว",
      });
    } catch {
      showToast({
        type: "error",
        title: "คัดลอกไม่สำเร็จ",
        message: "ไม่สามารถคัดลอกลิงก์สำหรับญาติได้",
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="5xl" scrollable={false} printable>
      <div className="resident-detail-print overflow-y-auto max-h-[85vh] print:max-h-none print:overflow-visible">
        <div className="print-header sticky top-0 z-20 -mx-6 -mt-6 mb-6 flex items-center justify-between border-b border-slate-200 bg-white/95 px-6 py-4 backdrop-blur-sm">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">แฟ้มข้อมูลผู้สูงอายุ</h2>
            <p className="text-sm text-slate-500">ข้อมูลล่าสุดจากระบบ</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="print-only text-right text-sm font-semibold text-slate-700">
              {printDateTime}
            </div>
            <button
              type="button"
              onClick={handleExport}
              className="print-hide inline-flex items-center gap-2 rounded-lg bg-[#0093EF] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#0080D0]"
            >
              <Printer className="h-4 w-4" />
              พิมพ์ / Export PDF
            </button>
            <button
              type="button"
              onClick={handleCopyRelativeMagicLink}
              className="print-hide inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm hover:bg-emerald-100"
            >
              <Copy className="h-4 w-4" />
              คัดลอกลิงก์ญาติ
            </button>
            <button
              type="button"
              onClick={onClose}
              className="print-hide inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label="ปิด"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-sm text-slate-500">กำลังโหลดข้อมูล...</div>
        ) : error ? (
          <div className="py-12 text-center text-sm text-red-500">{error}</div>
        ) : (
          <div className="space-y-6 pt-6">
            <BasicInfoSection resident={resident} room={room} />
            <MedicalInfoSection
              resident={resident}
              medications={medications}
              allergies={allergies}
              drugAllergies={drugAllergies}
            />
            <EmergencySafetySection resident={resident} />
          </div>
        )}
      </div>
      <style>{`
        .print-only {
          display: none;
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 5mm;
          }

          :global(html, body) {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            display: block !important;
          }

          :global(body.print-resident-modal *) {
            visibility: hidden !important;
          }
          :global(body.print-resident-modal .resident-detail-print),
          :global(body.print-resident-modal .resident-detail-print *) {
            visibility: visible !important;
          }

          :global(.print-modal-root),
          :global(.print-modal-content),
          :global(.print-modal-content > div),
          :global([role="dialog"]) {
            position: static !important;
            display: block !important;
            transform: none !important;
            inset: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            max-width: none !important;
            height: auto !important;
            border: none !important;
            box-shadow: none !important;
          }

          .resident-detail-print {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            max-height: none !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .print-header {
            position: relative !important;
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            margin: 0 0 5mm 0 !important;
            padding: 0 0 3mm 0 !important;
            border-bottom: 1px solid #e2e8f0 !important;
          }

          .print-hide {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }

          section {
            page-break-inside: avoid;
          }
        }
      `}</style>
    </Modal>
  );
}
