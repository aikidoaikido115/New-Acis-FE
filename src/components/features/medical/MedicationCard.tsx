"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronDown, ChevronRight, AlertTriangle, FileText, Clock3 } from "lucide-react";
import { WithholdMedicationModal, GiveAllMedicationsModal } from "./modals";
import type { GiveAllFormData } from "./modals/GiveAllMedicationsModal";
import type { WithholdFormData } from "./modals/WithholdMedicationModal";
import type { Medication, PatientMedication } from "./medical.types";

interface MedicationCardProps {
  patient: PatientMedication;
  onViewDetails: (patientId: string) => void;
  onGiveAllMeds: (patientId: string, payload: GiveAllFormData) => Promise<void>;
  onGiveMedication: (medication: Medication) => Promise<void>;
  onWithholdMedication: (medication: Medication, payload: WithholdFormData) => Promise<void>;
  onPendingCountChange?: (patientId: string, count: number) => void;
  isCompleted?: boolean;
}

export function MedicationCard({
  patient,
  onViewDetails,
  onGiveAllMeds,
  onGiveMedication,
  onWithholdMedication,
  onPendingCountChange,
  isCompleted = false,
}: MedicationCardProps) {
  const GIVE_DELAY_SECONDS = 5;

  type PendingEntry = {
    id: string;
    type: "single" | "all";
    remainingSeconds: number;
    medicationId?: string;
  };

  const [isExpanded, setIsExpanded] = useState(true);
  const [showWithholdModal, setShowWithholdModal] = useState(false);
  const [showGiveAllModal, setShowGiveAllModal] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);
  const [activeRequests, setActiveRequests] = useState(0);
  const [pendingEntries, setPendingEntries] = useState<PendingEntry[]>([]);
  const timersRef = useRef(new Map<string, { timeoutId: number; intervalId: number }>());

  const clearPendingTimer = useCallback((id: string) => {
    const timers = timersRef.current.get(id);
    if (!timers) return;
    window.clearTimeout(timers.timeoutId);
    window.clearInterval(timers.intervalId);
    timersRef.current.delete(id);
  }, []);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((timers) => {
        window.clearTimeout(timers.timeoutId);
        window.clearInterval(timers.intervalId);
      });
      timersRef.current.clear();
      onPendingCountChange?.(patient.id, 0);
    };
  }, [onPendingCountChange, patient.id]);

  useEffect(() => {
    onPendingCountChange?.(patient.id, pendingEntries.length);
  }, [onPendingCountChange, patient.id, pendingEntries.length]);

  const startPendingAction = useCallback(
    (
      id: string,
      nextAction: () => Promise<void>,
      pending: { type: "single"; medicationId: string } | { type: "all" }
    ) => {
      if (timersRef.current.has(id)) {
        return;
      }

      setPendingEntries((prev) => [
        ...prev,
        {
          id,
          type: pending.type,
          medicationId: pending.type === "single" ? pending.medicationId : undefined,
          remainingSeconds: GIVE_DELAY_SECONDS,
        },
      ]);

      const intervalId = window.setInterval(() => {
        setPendingEntries((current) =>
          current.map((entry) =>
            entry.id === id
              ? { ...entry, remainingSeconds: Math.max(entry.remainingSeconds - 1, 0) }
              : entry
          )
        );
      }, 1000);

      const timeoutId = window.setTimeout(() => {
        clearPendingTimer(id);
        setPendingEntries((current) => current.filter((entry) => entry.id !== id));
        void (async () => {
          setActiveRequests((count) => count + 1);
          try {
            await nextAction();
          } finally {
            setActiveRequests((count) => Math.max(0, count - 1));
          }
        })();
      }, GIVE_DELAY_SECONDS * 1000);

      timersRef.current.set(id, { timeoutId, intervalId });
    },
    [GIVE_DELAY_SECONDS, clearPendingTimer]
  );

  const cancelPendingAction = useCallback(
    (id: string) => {
      clearPendingTimer(id);
      setPendingEntries((current) => current.filter((entry) => entry.id !== id));
    },
    [clearPendingTimer]
  );

  const handleGiveMedication = useCallback(
    (med: Medication) => {
      startPendingAction(
        `med:${med.id}`,
        () => onGiveMedication(med),
        { type: "single", medicationId: med.id }
      );
    },
    [onGiveMedication, startPendingAction]
  );

  const handleWithholdMedication = (med: Medication) => {
    setSelectedMedication(med);
    setShowWithholdModal(true);
  };

  const handleGiveAllClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowGiveAllModal(true);
  };

  const pendingMedications = patient.medications.filter((med) => med.status === "รอให้");
  const pendingCount = pendingMedications.length;
  const isGiveAllPending = pendingEntries.some((entry) => entry.type === "all");
  const allPendingEntry = pendingEntries.find((entry) => entry.type === "all");

  return (
    <>
      <div
        className={`rounded-lg border shadow-sm overflow-hidden transition-colors ${
          isCompleted
            ? "bg-gray-50 border-gray-200 text-gray-500"
            : "bg-white border-gray-200"
        }`}
      >
        {/* Card Header */}
        <div className="flex flex-wrap items-center gap-3 p-3.5 lg:p-4 transition-colors">
          {/* Avatar */}
          {patient.profileImage ? (
            <Image
              src={patient.profileImage}
              alt={patient.name}
              width={64}
              height={64}
              className="w-14 h-14 lg:w-16 lg:h-16 rounded-full border-2 border-blue-400 object-cover shrink-0"
            />
          ) : (
            <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-full border-2 border-blue-400 bg-linear-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-lg font-bold shrink-0">
              {patient.name.charAt(0)}
            </div>
          )}

          {/* Patient Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm lg:text-base font-semibold text-gray-800 truncate">{patient.name}</h3>
            <p className="text-xs text-gray-700 mt-0.5">{patient.room}</p>
          </div>

          {/* Badges */}
          <div className="order-4 flex w-full items-center gap-2 flex-wrap sm:order-none sm:w-auto">
            {patient.allergies.length > 0 && (
              <div className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-600 rounded-full text-xs font-medium">
                <AlertTriangle className="w-3 h-3" />
                <span>{patient.allergies[0]}</span>
              </div>
            )}
            {pendingCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-yellow-50 text-yellow-600 border border-yellow-200 rounded-full text-xs font-medium">
                <Clock3 className="w-3.5 h-3.5" />
                รอ {pendingCount} รายการ
              </span>
            )}
            {pendingCount === 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-600 border border-gray-200 rounded-full text-xs font-medium">
                ให้ยาครบแล้ว
              </span>
            )}
          </div>

          {/* Expand/Collapse Toggle */}
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="p-1 text-black hover:text-gray-700 transition-colors shrink-0"
            aria-label={isExpanded ? "ย่อการ์ดผู้ป่วย" : "ขยายการ์ดผู้ป่วย"}
          >
            {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
        </div>

        {/* Expandable Content */}
        {isExpanded ? (
          <div className="border-t border-gray-200 p-3.5 space-y-2.5">
            {/* Medication List */}
            {pendingMedications.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-200 bg-white px-4 py-3 text-xs text-gray-500">
                ให้ยาครบแล้ว ไม่มีรายการค้างในช่วงเวลานี้
              </div>
            ) : (
              pendingMedications.map((med) => {
              const medPending = pendingEntries.some(
                (entry) => entry.type === "single" && entry.medicationId === med.id
              );
              const pendingEntry = pendingEntries.find(
                (entry) => entry.type === "single" && entry.medicationId === med.id
              );

              return (
              <div key={med.id} className="space-y-2">
                <div className="flex flex-col gap-2 py-1.5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{med.name}</p>
                    <p className="text-[11px] text-gray-500">{med.dosage}</p>
                  </div>

                  {/* Status Buttons */}
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    {med.status === "รอให้" && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleGiveMedication(med);
                          }}
                          disabled={medPending}
                          className="px-2.5 py-1 bg-blue-500 text-white rounded-full text-xs font-medium hover:bg-blue-600 transition-colors disabled:opacity-60"
                        >
                          ให้ยา
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleWithholdMedication(med);
                          }}
                          disabled={medPending}
                          className="px-2.5 py-1 bg-white text-red-600 border border-red-300 rounded-full text-xs font-medium hover:bg-red-50 transition-colors disabled:opacity-60"
                        >
                          งด
                        </button>
                      </>
                    )}
                    {med.status === "ให้ยา" && (
                      <span className="px-2.5 py-1 bg-blue-500 text-white rounded-full text-xs font-medium">
                        ให้ยา
                      </span>
                    )}
                    {med.status === "งด" && (
                      <span className="px-2.5 py-1 bg-white text-red-600 border border-red-300 rounded-full text-xs font-medium">
                        งด
                      </span>
                    )}
                  </div>
                </div>

                {pendingEntry ? (
                  <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700">
                    <span>จะบันทึกการให้ยาใน {pendingEntry.remainingSeconds} วินาที</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        cancelPendingAction(pendingEntry.id);
                      }}
                      className="text-blue-700 underline hover:text-blue-900"
                    >
                      ยกเลิก
                    </button>
                  </div>
                ) : null}
              </div>
            );
            })
            )}

            {/* Footer Actions */}
            <div className="flex flex-col gap-2 pt-2.5 border-t border-gray-100 sm:flex-row sm:items-center sm:justify-between">
              <button
                onClick={() => onViewDetails(patient.id)}
                className="inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 font-medium transition-colors"
              >
                <FileText className="w-4 h-4" />
                ตรวจสอบและแก้ไขข้อมูลการให้ยา
              </button>
              {pendingCount > 0 && (
                <button
                  onClick={handleGiveAllClick}
                  disabled={isGiveAllPending}
                  className="w-full px-3 py-1.5 bg-blue-500 text-white rounded-lg text-xs font-medium hover:bg-blue-600 transition-colors disabled:opacity-60 sm:w-auto"
                >
                  ให้ยาทั้งหมด ({pendingCount})
                </button>
              )}
            </div>
            {allPendingEntry ? (
              <div className="mt-2 flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700">
                <span>จะบันทึกการให้ยาทั้งหมดใน {allPendingEntry.remainingSeconds} วินาที</span>
                <button
                  type="button"
                  onClick={() => {
                    cancelPendingAction(allPendingEntry.id);
                  }}
                  className="text-blue-700 underline hover:text-blue-900"
                >
                  ยกเลิก
                </button>
              </div>
            ) : null}
          </div>
        ) : (
          <>
            <div className="border-t border-gray-200 px-3.5 py-3.5">
              <div className="flex flex-wrap gap-2.5">
                {pendingMedications.map((med) => (
                  <div
                    key={med.id}
                    className="inline-flex items-center gap-2.5 rounded-full border border-gray-300 bg-white pl-3 pr-2 py-1"
                  >
                    <span className="text-xs text-gray-800">{med.name}</span>
                    <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-600">
                      รอให้
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2 px-3.5 py-2.5 border-t border-gray-200 sm:flex-row sm:items-center sm:justify-between">
              <button
                onClick={() => onViewDetails(patient.id)}
                className="inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 font-medium transition-colors"
              >
                <FileText className="w-4 h-4" />
                ตรวจสอบและแก้ไขข้อมูลการให้ยา
              </button>
              {pendingCount > 0 && (
                <button
                  onClick={handleGiveAllClick}
                  disabled={isGiveAllPending}
                  className="w-full px-3 py-1.5 bg-blue-500 text-white rounded-lg text-xs font-medium hover:bg-blue-600 transition-colors disabled:opacity-60 sm:w-auto"
                >
                  ให้ยาทั้งหมด ({pendingCount})
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      {selectedMedication && (
          <WithholdMedicationModal
            isOpen={showWithholdModal}
            onClose={() => {
              setShowWithholdModal(false);
              setSelectedMedication(null);
            }}
            onSubmit={(data) => {
              void (async () => {
                setActiveRequests((count) => count + 1);
                try {
                  await onWithholdMedication(selectedMedication, data);
                  setShowWithholdModal(false);
                  setSelectedMedication(null);
                } finally {
                  setActiveRequests((count) => Math.max(0, count - 1));
                }
              })();
            }}
            patientName={patient.name}
            patientRoom={patient.room}
            medicationName={selectedMedication.name}
            medicationDosage={selectedMedication.dosage}
          />
      )}

      <GiveAllMedicationsModal
        isOpen={showGiveAllModal}
        onClose={() => setShowGiveAllModal(false)}
        onSubmit={(data) => {
          setShowGiveAllModal(false);
          if (timersRef.current.has("all")) {
            return;
          }
          startPendingAction("all", () => onGiveAllMeds(patient.id, data), { type: "all" });
        }}
        patientName={patient.name}
        patientRoom={patient.room}
        medications={patient.medications}
      />
    </>
  );
}
