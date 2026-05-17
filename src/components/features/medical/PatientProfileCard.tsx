"use client";

import Image from "next/image";
import { AlertTriangle, Stethoscope } from "lucide-react";

interface PatientProfileCardProps {
  name: string;
  room: string;
  allergies: string[];
  drugAllergies?: string[];
  chronicDiseases?: string[];
  surgicalHistory?: string[];
  profileImage?: string;
  status?: string;
}

export function PatientProfileCard({
  name,
  room,
  allergies,
  drugAllergies = [],
  chronicDiseases = [],
  surgicalHistory = [],
  profileImage,
  status,
}: PatientProfileCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6 relative">
      <div className="flex flex-col items-start gap-4 sm:gap-6 lg:flex-row">
        {/* Avatar */}
        <div className="shrink-0">
          {profileImage ? (
            <Image
              src={profileImage}
              alt={name}
              width={96}
              height={96}
              className="h-20 w-20 rounded-full border-4 border-blue-400 object-cover sm:h-24 sm:w-24"
            />
          ) : (
            <div className="h-20 w-20 rounded-full border-4 border-blue-400 bg-linear-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-headline-4 font-bold sm:h-24 sm:w-24">
              {name.charAt(0)}
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <div>
            <h2 className="text-headline-6 font-bold text-gray-800">{name}</h2>
            <p className="text-body-small text-gray-500">{room}</p>
          </div>

          {drugAllergies.length > 0 && (
            <div>
              <div className="flex items-center gap-1 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span className="text-body-small font-medium text-red-600">แพ้ยา</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {drugAllergies.map((allergy, index) => (
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

          {allergies.length > 0 && (
            <div>
              <div className="flex items-center gap-1 mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span className="text-body-small font-medium text-amber-600">แพ้อาหาร</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {allergies.map((allergy, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-amber-100 text-amber-600 rounded-full text-body-small font-medium"
                  >
                    {allergy}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          {surgicalHistory.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-body-large">✂️</span>
                <span className="text-body-small font-medium text-gray-700">ประวัติการผ่าตัด</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {surgicalHistory.map((surgery, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-transparent border border-green-500 text-green-600 rounded-full text-body-small"
                  >
                    {surgery}
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

        {status && (
          <div className="absolute right-3 top-3 sm:right-4 sm:top-4">
            <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-600 rounded-full px-3 py-1 text-body-small font-medium">
              <span>{status}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
