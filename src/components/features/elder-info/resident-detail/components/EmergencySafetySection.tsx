import { Building2, Phone, Users } from "lucide-react";
import type { Resident as ApiResident } from "@/types/resident";
import { toTelHref } from "../utils/resolvers";

interface EmergencySafetySectionProps {
  resident: ApiResident | null;
}

export function EmergencySafetySection({ resident }: EmergencySafetySectionProps) {
  const emergencyHospitals = resident?.emergency_hospitals && resident.emergency_hospitals.length > 0
    ? resident.emergency_hospitals
    : resident?.preferred_emergency_hospital || resident?.emergency_hospital_phone
      ? [{
          name: resident?.preferred_emergency_hospital || "-",
          phone: resident?.emergency_hospital_phone || "-",
        }]
      : [];

  return (
    <section className="rounded-xl border border-slate-200 border-l-4 border-l-rose-500 bg-white p-5">
      <h3 className="text-sm font-semibold text-slate-700">ความปลอดภัยฉุกเฉิน</h3>
      <div className="mt-4 space-y-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Building2 className="h-4 w-4" />
            <span>โรงพยาบาลกรณีฉุกเฉิน</span>
          </div>
          {emergencyHospitals.length > 0 ? (
            <div className="mt-2 space-y-3">
              {emergencyHospitals.map((hospital, index) => (
                <div
                  key={`${hospital.name}-${index}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-slate-700"
                >
                  <span>{hospital.name || "-"}</span>
                  {toTelHref(hospital.phone) ? (
                    <a
                      href={toTelHref(hospital.phone)}
                      className="flex items-center gap-2 text-sm font-semibold text-rose-600 hover:text-rose-700"
                      aria-label="โทรหาโรงพยาบาลกรณีฉุกเฉิน"
                    >
                      <Phone className="h-4 w-4" />
                      {hospital.phone || "-"}
                    </a>
                  ) : (
                    <span className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                      <Phone className="h-4 w-4" />
                      {hospital.phone || "-"}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-2 text-sm text-slate-500">ไม่มีข้อมูล</div>
          )}
        </div>

        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Users className="h-4 w-4" />
            <span>ผู้ติดต่อฉุกเฉิน</span>
          </div>
          {resident?.emergency_contacts && resident.emergency_contacts.length > 0 ? (
            <div className="mt-2 space-y-3">
              {resident.emergency_contacts.map((contact, index) => (
                <div
                  key={`${contact.name}-${index}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700"
                >
                  <div>
                    <div className="font-medium">{contact.name || "-"}</div>
                    <div className="text-xs text-slate-500">{contact.relation || "-"}</div>
                  </div>
                  {toTelHref(contact.phone) ? (
                    <a
                      href={toTelHref(contact.phone)}
                      className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
                      aria-label={`โทรหา ${contact.name || "ผู้ติดต่อฉุกเฉิน"}`}
                    >
                      <Phone className="h-4 w-4" />
                      {contact.phone || "-"}
                    </a>
                  ) : (
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                      <Phone className="h-4 w-4" />
                      {contact.phone || "-"}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-2 text-sm text-slate-500">ไม่มีข้อมูล</div>
          )}
        </div>
      </div>
    </section>
  );
}
