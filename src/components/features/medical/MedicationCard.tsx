"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, AlertTriangle, FileText, Clock3 } from "lucide-react";
import { PatientMedication, Medication } from "./medical.mock";
import { WithholdMedicationModal, GiveAllMedicationsModal } from "./modals";

interface MedicationCardProps {
  patient: PatientMedication;
  onViewDetails: (patientId: number) => void;
  onGiveAllMeds: (patientId: number) => void;
}

export function MedicationCard({ patient, onViewDetails, onGiveAllMeds }: MedicationCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showWithholdModal, setShowWithholdModal] = useState(false);
  const [showGiveAllModal, setShowGiveAllModal] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);
  const [medications, setMedications] = useState<Medication[]>(patient.medications);

  const handleGiveMedication = (med: Medication) => {
    setMedications((prev) =>
      prev.map((item) =>
        item.id === med.id
          ? {
              ...item,
              status: "ให้ยา" }
          : item
      )
    );
  };

  const handleWithholdMedication = (med: Medication) => {
    setSelectedMedication(med);
    setShowWithholdModal(true);
  };

  const handleGiveAllClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowGiveAllModal(true);
  };

  const pendingMedications = medications.filter((med) => med.status === "รอให้");
  const pendingCount = pendingMedications.length;

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {/* Card Header */}
        <div className="flex items-center gap-4 p-4 lg:p-5 transition-colors">
          {/* Avatar */}
          {patient.profileImage ? (
            <img
              src={patient.profileImage}
              alt={patient.name}
              className="w-16 h-16 lg:w-20 lg:h-20 rounded-full border-2 border-blue-400 object-cover shrink-0"
            />
          ) : (
            <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-full border-2 border-blue-400 bg-linear-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-headline-5 font-bold shrink-0">
              {patient.name.charAt(0)}
            </div>
          )}

          {/* Patient Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-body-large font-semibold text-gray-800 truncate">{patient.name}</h3>
            <p className="text-body-small text-gray-700 mt-1">{patient.room}</p>
          </div>

          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            {patient.allergies.length > 0 && (
              <div className="flex items-center gap-1 px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-xs sm:text-sm font-medium">
                <AlertTriangle className="w-3 h-3" />
                <span>{patient.allergies[0]}</span>
              </div>
            )}
            {pendingCount > 0 && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-50 text-yellow-600 border border-yellow-200 rounded-full text-xs sm:text-sm font-medium">
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
            {isExpanded ? <ChevronDown className="w-6 h-6" /> : <ChevronRight className="w-6 h-6" />}
          </button>
        </div>

        {/* Expandable Content */}
        {isExpanded ? (
          <div className="border-t border-gray-200 p-4 space-y-3">
            {/* Medication List */}
            {medications.map((med) => (
              <div key={med.id} className="flex items-center justify-between py-2">
                <div className="flex-1">
                  <p className="text-body-small font-medium text-gray-800">{med.name}</p>
                  <p className="text-overline text-gray-500">{med.dosage}</p>
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
                        className="px-3 py-1 bg-blue-500 text-white rounded-full text-body-small font-medium hover:bg-blue-600 transition-colors"
                      >
                        ให้ยา
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleWithholdMedication(med);
                        }}
                        className="px-3 py-1 bg-white text-red-600 border border-red-300 rounded-full text-body-small font-medium hover:bg-red-50 transition-colors"
                      >
                        งด
                      </button>
                    </>
                  )}
                  {med.status === "ให้ยา" && (
                    <span className="px-3 py-1 bg-blue-500 text-white rounded-full text-body-small font-medium">
                      ให้ยา
                    </span>
                  )}
                  {med.status === "งด" && (
                    <span className="px-3 py-1 bg-white text-red-600 border border-red-300 rounded-full text-body-small font-medium">
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
                className="inline-flex items-center gap-1 text-body-small text-blue-500 hover:text-blue-700 font-medium transition-colors"
              >
                <FileText className="w-4 h-4" />
                ตรวจสอบและแก้ไขข้อมูลการให้ยา
              </button>
              {pendingCount > 0 && (
                <button
                  onClick={handleGiveAllClick}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg text-body-small font-medium hover:bg-blue-600 transition-colors"
                >
                  ให้ยาทั้งหมด ({pendingCount})
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="border-t border-gray-200 px-4 py-4">
              {pendingMedications.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {pendingMedications.map((med) => (
                    <div
                      key={med.id}
                      className="inline-flex items-center gap-3 rounded-full border border-gray-300 bg-white pl-4 pr-2 py-1.5"
                    >
                      <span className="text-body-small text-gray-800">{med.name}</span>
                      <span className="rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs sm:text-sm font-medium text-yellow-600">
                        รอให้
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-body-small text-gray-500">ไม่มียาที่รอดำเนินการ</p>
              )}
            </div>

            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
              <button
                onClick={() => onViewDetails(patient.id)}
                className="inline-flex items-center gap-1 text-body-small text-blue-500 hover:text-blue-700 font-medium transition-colors"
              >
                <FileText className="w-4 h-4" />
                ตรวจสอบและแก้ไขข้อมูลการให้ยา
              </button>
              {pendingCount > 0 && (
                <button
                  onClick={handleGiveAllClick}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg text-body-small font-medium hover:bg-blue-600 transition-colors"
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
              console.log("Withhold medication:", data);
              setMedications((prev) =>
                prev.map((item) =>
                  item.id === selectedMedication.id
                    ? {
                        ...item,
                        status: "งด" }
                    : item
                )
              );
              setShowWithholdModal(false);
              setSelectedMedication(null);
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
          console.log("Give all medications:", data);
          setMedications((prev) =>
            prev.map((item) =>
              item.status === "รอให้"
                ? {
                    ...item,
                    status: "ให้ยา" }
                : item
            )
          );
          setShowGiveAllModal(false);
          onGiveAllMeds(patient.id);
        }}
        patientName={patient.name}
        patientRoom={patient.room}
        medications={medications}
      />
    </>
  );
}
