"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import { PatientMedication, Medication } from "./medical.mock";
import { ConfirmMedicationModal, WithholdMedicationModal, GiveAllMedicationsModal } from "./modals";

interface MedicationCardProps {
  patient: PatientMedication;
  onViewDetails: (patientId: number) => void;
  onGiveAllMeds: (patientId: number) => void;
}

export function MedicationCard({ patient, onViewDetails, onGiveAllMeds }: MedicationCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showWithholdModal, setShowWithholdModal] = useState(false);
  const [showGiveAllModal, setShowGiveAllModal] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);

  const handleGiveMedication = (med: Medication) => {
    setSelectedMedication(med);
    setShowConfirmModal(true);
  };

  const handleWithholdMedication = (med: Medication) => {
    setSelectedMedication(med);
    setShowWithholdModal(true);
  };

  const handleGiveAllClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowGiveAllModal(true);
  };

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {/* Card Header */}
        <div 
          className="flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {/* Avatar */}
          <div className="w-12 h-12 rounded-full border-2 border-blue-400 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-lg font-bold shrink-0">
            {patient.name.charAt(0)}
          </div>

          {/* Patient Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-gray-800 truncate">{patient.name}</h3>
            <p className="text-sm text-gray-500">{patient.room}</p>
          </div>

          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            {patient.allergies.length > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-600 rounded-full text-xs font-medium">
                <AlertTriangle className="w-3 h-3" />
                <span>{patient.allergies[0]}</span>
              </div>
            )}
            {patient.pendingCount > 0 && (
              <span className="px-3 py-1 bg-yellow-100 text-yellow-600 border border-yellow-300 rounded-full text-sm font-medium">
                รอ {patient.pendingCount} รายการ
              </span>
            )}
          </div>

          {/* Expand Icon */}
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400 shrink-0" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />
          )}
        </div>

        {/* Expandable Content */}
        {isExpanded && (
          <div className="border-t border-gray-200 p-4 space-y-3">
            {/* Medication List */}
            {patient.medications.map((med) => (
              <div key={med.id} className="flex items-center justify-between py-2">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{med.name}</p>
                  <p className="text-xs text-gray-500">{med.dosage}</p>
                </div>

                {/* Status Buttons */}
                <div className="flex items-center gap-2">
                  {med.status === "รอให้" && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGiveMedication(med);
                        }}
                        className="px-3 py-1 bg-blue-500 text-white rounded-full text-sm font-medium hover:bg-blue-600 transition-colors"
                      >
                        ให้ยา
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleWithholdMedication(med);
                        }}
                        className="px-3 py-1 bg-white text-red-600 border border-red-300 rounded-full text-sm font-medium hover:bg-red-50 transition-colors"
                      >
                        งด
                      </button>
                    </>
                  )}
                  {med.status === "ให้ยา" && (
                    <span className="px-3 py-1 bg-blue-500 text-white rounded-full text-sm font-medium">
                      ให้ยา
                    </span>
                  )}
                  {med.status === "งด" && (
                    <span className="px-3 py-1 bg-white text-red-600 border border-red-300 rounded-full text-sm font-medium">
                      งด
                    </span>
                  )}
                </div>
              </div>
            ))}

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <button
                onClick={() => onViewDetails(patient.id)}
                className="text-sm text-blue-500 hover:text-blue-700 font-medium transition-colors"
              >
                ตรวจสอบและแก้ไขข้อมูลการให้ยา
              </button>
              {patient.pendingCount > 0 && (
                <button
                  onClick={handleGiveAllClick}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
                >
                  ให้ยาทั้งหมด
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedMedication && (
        <>
          <ConfirmMedicationModal
            isOpen={showConfirmModal}
            onClose={() => {
              setShowConfirmModal(false);
              setSelectedMedication(null);
            }}
            onSubmit={(data) => {
              console.log("Confirm medication:", data);
              // Handle medication confirmation
            }}
            patientName={patient.name}
            patientRoom={patient.room}
            medicationName={selectedMedication.name}
            medicationDosage={selectedMedication.dosage}
          />

          <WithholdMedicationModal
            isOpen={showWithholdModal}
            onClose={() => {
              setShowWithholdModal(false);
              setSelectedMedication(null);
            }}
            onSubmit={(data) => {
              console.log("Withhold medication:", data);
              // Handle medication withholding
            }}
            patientName={patient.name}
            patientRoom={patient.room}
            medicationName={selectedMedication.name}
            medicationDosage={selectedMedication.dosage}
          />
        </>
      )}

      <GiveAllMedicationsModal
        isOpen={showGiveAllModal}
        onClose={() => setShowGiveAllModal(false)}
        onSubmit={(data) => {
          console.log("Give all medications:", data);
          onGiveAllMeds(patient.id);
        }}
        patientName={patient.name}
        patientRoom={patient.room}
        medications={patient.medications}
      />
    </>
  );
}
