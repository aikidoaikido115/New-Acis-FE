import type { PersonalDrug } from "@/services/personal-drug.service";
import { formatDose, formatFrequency, formatMealType } from "../utils/formatters";

interface MedicationTableProps {
  medications: PersonalDrug[];
}

export function MedicationTable({ medications }: MedicationTableProps) {
  if (medications.length === 0) {
    return <div className="mt-2 text-sm text-slate-500">ไม่มีข้อมูลยา</div>;
  }

  return (
    <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
      <table className="w-full text-sm">
        <thead className="bg-slate-100 text-xs font-semibold text-slate-600">
          <tr>
            <th className="w-8 px-3 py-2 text-center">#</th>
            <th className="px-3 py-2 text-left">ชื่อยา</th>
            <th className="w-32 px-3 py-2 text-left">ปริมาณ/ขนาด</th>
            <th className="w-40 px-3 py-2 text-left">ความถี่/วัน</th>
            <th className="w-32 px-3 py-2 text-left">ประเภท</th>
          </tr>
        </thead>
        <tbody>
          {medications.map((med, index) => (
            <tr key={`${med.id || med.pd_id || "med"}-${index}`} className="border-t border-slate-200 bg-white">
              <td className="px-3 py-2 text-center text-slate-600">{index + 1}</td>
              <td className="px-3 py-2 text-slate-600">{med.DrugMaster?.name || "-"}</td>
              <td className="px-3 py-2 text-slate-600">{formatDose(med)}</td>
              <td className="px-3 py-2 text-slate-600">{formatFrequency(med)}</td>
              <td className="px-3 py-2 text-slate-600">{formatMealType(med)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
