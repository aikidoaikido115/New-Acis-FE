"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Pill, Stethoscope } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { GraphView } from "@/components/features/EMR/detail/GraphView";
import { drugPlanService } from "@/services/drug-plan.service";
import { vitalSignService } from "@/services/vital-sign.service";
import type { DrugPlan } from "@/types/drug-plan";
import type { VitalSign } from "@/types/vital-sign";

interface DailyHealthSummaryProps {
  residentId?: string;
  selectedDate?: Date | null;
}

type SummaryState = {
  vitals: VitalSign[];
  plans: DrugPlan[];
};

const timeOfDayLabels: Record<string, string> = {
  morning: "เช้า",
  afternoon: "บ่าย",
  evening: "เย็น",
  night: "กลางคืน",
};

const formatDateToISO = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const normalizeDateKey = (raw?: string | null): string | null => {
  if (!raw) return null;
  const trimmed = raw.trim();
  const isoMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoMatch) return isoMatch[1];
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;
  return formatDateToISO(parsed);
};

const isVitalAbnormal = (vital: VitalSign): boolean => {
  if (Array.isArray(vital.abnormal_list)) {
    return vital.abnormal_list.length > 0;
  }

  const isAbnormalTemperature = typeof vital.temperature === "number" && (vital.temperature < 35 || vital.temperature > 37.5);
  const isAbnormalHeartRate = typeof vital.heart_rate === "number" && (vital.heart_rate < 60 || vital.heart_rate > 100);
  const isAbnormalBreathingRate = typeof vital.breathing_rate === "number" && (vital.breathing_rate < 12 || vital.breathing_rate > 20);
  const isAbnormalSystolic = typeof vital.blood_pressure_systolic === "number" && (vital.blood_pressure_systolic < 90 || vital.blood_pressure_systolic > 140);
  const isAbnormalDiastolic = typeof vital.blood_pressure_diastolic === "number" && (vital.blood_pressure_diastolic < 60 || vital.blood_pressure_diastolic > 90);
  const isAbnormalO2 = typeof vital.oxygen_saturation === "number" && vital.oxygen_saturation < 95;

  return isAbnormalTemperature || isAbnormalHeartRate || isAbnormalBreathingRate || isAbnormalSystolic || isAbnormalDiastolic || isAbnormalO2;
};

const getDateKeyFromPlan = (plan: DrugPlan): string | null => {
  return normalizeDateKey(plan.taken_at || null) || normalizeDateKey(plan.created_at || null);
};

export function DailyHealthSummary({ residentId, selectedDate }: DailyHealthSummaryProps) {
  const [summary, setSummary] = useState<SummaryState>({ vitals: [], plans: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedDateKey = useMemo(() => formatDateToISO(selectedDate ?? new Date()), [selectedDate]);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      if (!residentId) {
        if (isMounted) {
          setSummary({ vitals: [], plans: [] });
          setError(null);
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const [vitalHistory, planHistory] = await Promise.all([
          vitalSignService.getHistory(residentId),
          drugPlanService.getByResidentAll(residentId),
        ]);

        if (!isMounted) return;

        const vitalsForDate = (vitalHistory || []).filter((record) => {
          const dateKey = normalizeDateKey(record.measurement_date || record.created_at);
          return dateKey === selectedDateKey;
        });
        const plansForDate = (planHistory || []).filter((plan) => getDateKeyFromPlan(plan) === selectedDateKey);

        setSummary({ vitals: vitalsForDate, plans: plansForDate });
      } catch {
        if (isMounted) {
          setError("ไม่สามารถโหลดสรุปสุขภาพได้");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, [residentId, selectedDateKey]);

  const medicationSummary = useMemo(() => {
    const total = summary.plans.length;
    const taken = summary.plans.filter((plan) => plan.is_taken).length;
    const omitted = summary.plans.filter((plan) => plan.is_omitted).length;
    const pending = Math.max(0, total - taken - omitted);

    const pendingSlots = summary.plans
      .filter((plan) => !plan.is_taken && !plan.is_omitted)
      .map((plan) => plan.PersonalDrug?.time_of_day)
      .filter(Boolean)
      .map((slot) => timeOfDayLabels[String(slot)] || String(slot));

    const uniquePendingSlots = Array.from(new Set(pendingSlots));

    const slotKeys = ["morning", "afternoon", "evening", "night"];
    const slotSummary = slotKeys.map((key) => {
      const plans = summary.plans.filter((plan) => String(plan.PersonalDrug?.time_of_day || "") === key);
      const slotTaken = plans.filter((plan) => plan.is_taken).length;
      const slotOmitted = plans.filter((plan) => plan.is_omitted).length;
      const slotPending = Math.max(0, plans.length - slotTaken - slotOmitted);
      return {
        key,
        label: timeOfDayLabels[key],
        total: plans.length,
        taken: slotTaken,
        omitted: slotOmitted,
        pending: slotPending,
      };
    });

    return { total, taken, omitted, pending, pendingSlots: uniquePendingSlots, slotSummary };
  }, [summary.plans]);

  const vitalSummary = useMemo(() => {
    const abnormalVitals = summary.vitals.filter(isVitalAbnormal).length;
    const normalVitals = Math.max(0, summary.vitals.length - abnormalVitals);
    return {
      totalVitals: summary.vitals.length,
      abnormalVitals,
      normalVitals,
    };
  }, [summary.vitals]);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-4">
        <div className="flex items-center gap-2">
          <Stethoscope className="text-blue-600" size={20} />
          <h2 className="text-xl font-semibold text-gray-800">สรุปสุขภาพประจำวัน</h2>
        </div>
        <span className="text-xs text-gray-500">ข้อมูลสำหรับอ่านอย่างเดียว</span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <div className="py-8 text-sm text-red-500">{error}</div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700">สัญญาณชีพ</span>
                {vitalSummary.abnormalVitals > 0 ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700">
                    <AlertTriangle size={14} />
                    ต้องติดตาม
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                    <CheckCircle2 size={14} />
                    ปกติ
                  </span>
                )}
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 text-sm">
                <div className="rounded-lg bg-slate-50 px-3 py-2">
                  <div className="text-xs text-slate-500">บันทึกวันนี้</div>
                  <div className="text-base font-semibold text-slate-800">{vitalSummary.totalVitals} ครั้ง</div>
                </div>
                <div className="rounded-lg bg-rose-50 px-3 py-2">
                  <div className="text-xs text-rose-600">ผิดปกติ</div>
                  <div className="text-base font-semibold text-rose-700">{vitalSummary.abnormalVitals} ครั้ง</div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700">การรับประทานยา</span>
                <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                  <Pill size={14} />
                  {medicationSummary.total} มื้อ
                </span>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-3 text-sm">
                <div className="rounded-lg bg-emerald-50 px-3 py-2">
                  <div className="text-xs text-emerald-700">รับยาแล้ว</div>
                  <div className="text-base font-semibold text-emerald-800">{medicationSummary.taken}</div>
                </div>
                <div className="rounded-lg bg-rose-50 px-3 py-2">
                  <div className="text-xs text-rose-700">งด</div>
                  <div className="text-base font-semibold text-rose-800">{medicationSummary.omitted}</div>
                </div>
                <div className="rounded-lg bg-slate-50 px-3 py-2">
                  <div className="text-xs text-slate-500">เหลืออีก</div>
                  <div className="text-base font-semibold text-slate-800">{medicationSummary.pending}</div>
                </div>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 text-xs">
                {medicationSummary.slotSummary.map((slot) => (
                  <div key={slot.key} className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="font-semibold text-slate-700">{slot.label}</span>
                      <span>{slot.total} มื้อ</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-emerald-600">รับแล้ว {slot.taken}</span>
                      <span className="text-rose-600">งด {slot.omitted}</span>
                      <span className="text-slate-600">เหลือ {slot.pending}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50">
            <div className="border-b border-slate-200 px-4 py-3">
              <div className="text-sm font-semibold text-slate-700">กราฟแนวโน้ม (ชีพจร/อุณหภูมิ)</div>
              <div className="text-xs text-slate-500">แสดงข้อมูลของวันที่เลือกจากเวชระเบียน</div>
            </div>
            <div className="p-0">
              {residentId ? (
                <div className="overflow-x-auto">
                  <GraphView patientId={residentId} dateKey={selectedDateKey} />
                </div>
              ) : (
                <div className="p-6 text-sm text-slate-500">ยังไม่พบประวัติผู้สูงอายุ</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
