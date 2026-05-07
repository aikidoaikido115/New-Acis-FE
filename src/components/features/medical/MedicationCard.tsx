"use client";

import { useState } from "react";
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
}

export function MedicationCard({
  patient,
  onViewDetails,
  onGiveAllMeds,
  onGiveMedication,
  onWithholdMedication,
}: MedicationCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showWithholdModal, setShowWithholdModal] = useState(false);
  const [showGiveAllModal, setShowGiveAllModal] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGiveMedication = async (med: Medication) => {
    setIsSubmitting(true);
    try {
      await onGiveMedication(med);
    } finally {
      setIsSubmitting(false);
    }
  };

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

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {/* Card Header */}
        <div className="flex items-center gap-3 p-3.5 lg:p-4 transition-colors">
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
          <div className="flex items-center gap-2 flex-wrap">
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
            {pendingMedications.map((med) => (
              <div key={med.id} className="flex items-center justify-between py-1.5">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{med.name}</p>
                  <p className="text-[11px] text-gray-500">{med.dosage}</p>
                </div>

                {/* Status Buttons */}
                <div className="flex items-center gap-2">
                  {med.status === "รอให้" && (
                    <>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          await handleGiveMedication(med);
                        }}
                        disabled={isSubmitting}
                        className="px-2.5 py-1 bg-blue-500 text-white rounded-full text-xs font-medium hover:bg-blue-600 transition-colors"
                      >
                        ให้ยา
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleWithholdMedication(med);
                        }}
                        disabled={isSubmitting}
                        className="px-2.5 py-1 bg-white text-red-600 border border-red-300 rounded-full text-xs font-medium hover:bg-red-50 transition-colors"
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
            ))}

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-2.5 border-t border-gray-100">
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
                  disabled={isSubmitting}
                  className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-xs font-medium hover:bg-blue-600 transition-colors"
                >
                  ให้ยาทั้งหมด ({pendingCount})
                </button>
              )}
            </div>
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

            <div className="flex items-center justify-between px-3.5 py-2.5 border-t border-gray-200">
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
                  disabled={isSubmitting}
                  className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-xs font-medium hover:bg-blue-600 transition-colors"
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
                setIsSubmitting(true);
                try {
                  await onWithholdMedication(selectedMedication, data);
                  setShowWithholdModal(false);
                  setSelectedMedication(null);
                } finally {
                  setIsSubmitting(false);
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
          void (async () => {
            setIsSubmitting(true);
            try {
              await onGiveAllMeds(patient.id, data);
              setShowGiveAllModal(false);
            } finally {
              setIsSubmitting(false);
            }
          })();
        }}
        patientName={patient.name}
        patientRoom={patient.room}
        medications={patient.medications}
      />
    </>
  );
}
