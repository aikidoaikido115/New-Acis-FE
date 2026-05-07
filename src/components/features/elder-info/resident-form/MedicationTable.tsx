"use client";
import { Plus, Trash2 } from "lucide-react";
import { SearchableDropdown } from "@/components/ui/searchable-dropdown";
import { Dropdown } from "@/components/ui/dropdown";
import { Input } from "@/components/ui/input";
import type { Medication } from "@/types/resident";
import { MEDICATION_FREQUENCY_OPTIONS, MEDICATION_MEAL_TYPE_OPTIONS } from "./constants";

const cellClass = "px-2 py-1.5";
const inputCell = "h-9 w-full rounded border border-slate-200 bg-white px-2 text-sm text-black placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20";

interface MedicationTableProps {
  medications: Medication[];
  medicationOptions: Array<{ value: string; label: string; name: string; dose?: string }>;
  onUpdate: (idx: number, patch: Partial<Medication>) => void;
  onAdd: () => void;
  onRemove: (idx: number) => void;
  onCreateMedication?: (idx: number, name: string) => void;
}

export function MedicationTable({ medications, medicationOptions, onUpdate, onAdd, onRemove, onCreateMedication }: MedicationTableProps) {
  return (
    <div className="rounded-lg border border-slate-200">
      <div className="overflow-x-auto overflow-y-visible">
        <table className="min-w-180 text-sm">
          <thead className="bg-slate-50 text-xs font-medium text-slate-600">
            <tr>
              <th className="w-8 px-2 py-2 text-center">#</th>
              <th className="px-2 py-2 text-left">ชื่อยา</th>
              <th className="w-32 px-2 py-2 text-left">ปริมาณ/ขนาด</th>
              <th className="w-40 px-2 py-2 text-left">ความถี่/วัน</th>
              <th className="w-32 px-2 py-2 text-left">ประเภท</th>
              <th className="w-10 px-2 py-2" />
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {medications.map((med, idx) => {
              const selected = medicationOptions.find(
                (opt) => opt.value === med.dmId || opt.name === med.name
              );
              const dropdownValue = selected?.value || med.dmId || "";

              return (
                <tr key={idx} className="bg-white hover:bg-slate-50/50">
                  <td className={`${cellClass} text-center text-slate-400`}>{idx + 1}</td>

                  <td className={cellClass}>
                    <SearchableDropdown
                      options={medicationOptions.map(({ value, label }) => ({ value, label }))}
                      value={dropdownValue}
                      onChange={(val) => {
                        const option = medicationOptions.find((opt) => opt.value === val);
                        if (!option) return;
                        onUpdate(idx, {
                          dmId: option.value,
                          name: option.name,
                          dose: med.dose || option.dose || "",
                        });
                      }}
                      onCreate={(name) => onCreateMedication?.(idx, name)}
                      allowCreate
                      createLabel="เพิ่มยาใหม่"
                      placeholder="ค้นหาชื่อยา"
                      className="w-full text-black"
                    />
                  </td>

                  <td className={cellClass}>
                    <Input
                      type="text"
                      value={med.dose}
                      onChange={(e) => onUpdate(idx, { dose: e.target.value })}
                      placeholder="เช่น 500mg"
                      className={inputCell}
                    />
                  </td>

                  <td className={cellClass}>
                    <div className="flex items-center">
                      <Dropdown
                        options={MEDICATION_FREQUENCY_OPTIONS}
                        value={med.frequency}
                        onChange={(val) => onUpdate(idx, { frequency: val })}
                        placeholder="เลือก"
                        className="w-full"
                      />
                    </div>
                  </td>

                  <td className={cellClass}>
                    <Dropdown
                      options={MEDICATION_MEAL_TYPE_OPTIONS}
                      value={med.mealType || ""}
                      onChange={(val) => onUpdate(idx, { mealType: val as Medication["mealType"] })}
                      placeholder="เลือก"
                      className="w-full"
                    />
                  </td>

                  <td className={`${cellClass} text-center`}>
                    <button
                      type="button"
                      onClick={() => onRemove(idx)}
                      className="rounded p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}

            {medications.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-sm text-slate-400">
                  ยังไม่มีรายการยา
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="border-t border-slate-200 p-2">
        <button type="button" onClick={onAdd}
          className="flex w-full items-center justify-center gap-1.5 rounded-md py-1.5 text-sm text-emerald-600 hover:bg-emerald-50 transition">
          <Plus size={15} /> เพิ่มรายการยา
        </button>
      </div>
    </div>
  );
}
