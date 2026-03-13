"use client";

import { AlertTriangle, Stethoscope } from "lucide-react";

interface PatientProfileCardProps {
  name: string;
  room: string;
  birthDate?: string;
  allergies: string[];
  chronicDiseases?: string[];
}

export function PatientProfileCard({
  name,
  room,
  birthDate,
  allergies,
  chronicDiseases = [],
}: PatientProfileCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <div className="flex flex-row items-start gap-6">
        {/* Column 1: Avatar */}
        <div className="w-24 h-24 rounded-full border-4 border-blue-400 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-3xl font-bold shrink-0">
          {name.charAt(0)}
        </div>

        {/* Column 2: Primary Info & Allergies */}
        <div className="flex flex-col gap-4 flex-1">
          {/* Name and Room */}
          <div>
            <h2 className="text-xl font-bold text-gray-800">{name}</h2>
            <p className="text-sm text-gray-500">{room}</p>
            {birthDate && <p className="text-sm text-gray-500">{birthDate}</p>}
          </div>

          {/* Allergies Section */}
          {allergies.length > 0 && (
            <div>
              <div className="flex items-center gap-1 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium text-red-600">แพ้ยา</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {allergies.map((allergy, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-sm font-medium"
                  >
                    {allergy}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Column 3: Chronic Diseases - Align to top to maintain same visual position */}
        <div className="flex flex-col flex-1">
          {/* Spacer to align with row 2 (where allergies are) */}
          <div className="h-[28px]" /> 
          
          {/* Chronic Diseases */}
          {chronicDiseases.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Stethoscope className="w-4 h-4 text-gray-700" />
                <span className="text-sm font-medium text-gray-700">โรคประจำตัว</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {chronicDiseases.map((disease, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-sm font-medium"
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
  );
}
