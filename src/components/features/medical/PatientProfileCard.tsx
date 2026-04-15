"use client";

import { AlertTriangle, Stethoscope } from "lucide-react";

interface PatientProfileCardProps {
  name: string;
  room: string;
  allergies: string[];
  chronicDiseases?: string[];
}

export function PatientProfileCard({
  name,
  room,
  allergies,
  chronicDiseases = [] }: PatientProfileCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <div className="flex flex-row items-start gap-6">
        {/* Avatar */}
        <div className="w-24 h-24 rounded-full border-4 border-blue-400 bg-linear-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-headline-4 font-bold shrink-0">
          {name.charAt(0)}
        </div>

        <div className="flex flex-col gap-4 flex-1">
          <div>
            <h2 className="text-headline-6 font-bold text-gray-800">{name}</h2>
            <p className="text-body-small text-gray-500">{room}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {allergies.length > 0 && (
              <div>
                <div className="flex items-center gap-1 mb-2">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span className="text-body-small font-medium text-red-600">แพ้ยา</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {allergies.map((allergy, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-body-small font-medium"
                    >
                      {allergy}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {chronicDiseases.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Stethoscope className="w-4 h-4 text-gray-700" />
                  <span className="text-body-small font-medium text-gray-700">โรคประจำตัว</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {chronicDiseases.map((disease, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-body-small font-medium"
                    >
                      {disease}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
