"use client";
import { Plus, Trash2 } from "lucide-react";
import { Input }               from "@/components/ui/input";
import type { EmergencyContact } from "@/types/resident";
import { Dropdown } from "@/components/ui/dropdown";
import type { ChangeEvent }      from "react";

interface EmergencyContactListProps {
  contacts: EmergencyContact[];
  inputClass: string;
  onUpdate: (idx: number, patch: Partial<EmergencyContact>) => void;
  onUpdatePhone: (idx: number, e: ChangeEvent<HTMLInputElement>) => void;
  onAdd: () => void;
  onRemove: (idx: number) => void;
}

export function EmergencyContactList({ contacts, inputClass, onUpdate, onUpdatePhone, onAdd, onRemove }: EmergencyContactListProps) {
  const RELATION_OPTIONS = [
    { value: "บุตร", label: "บุตร" },
    { value: "คู่สมรส", label: "คู่สมรส" },
    { value: "ญาติ", label: "ญาติ" },
    { value: "เพื่อน", label: "เพื่อน" },
    { value: "อื่นๆ", label: "อื่นๆ" },
  ];
  return (
    <div className="space-y-3">
      {contacts.map((contact, idx) => (
        <div key={idx} className="grid grid-cols-1 items-end gap-3 rounded-lg border border-slate-200 bg-slate-50/50 p-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs text-slate-500">ชื่อ - นามสกุล</label>
            <Input
              type="text"
              value={contact.name}
              onChange={(e) => onUpdate(idx, { name: e.target.value })}
              placeholder="กรอกชื่อ-นามสกุล"
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">ความสัมพันธ์</label>
            <Dropdown
              options={RELATION_OPTIONS}
              value={contact.relation}
              onChange={(val) => onUpdate(idx, { relation: val })}
              placeholder="เลือกสถานะ"
              className="w-full"
            />
          </div>
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="mb-1 block text-xs text-slate-500">เบอร์โทร</label>
              <Input
                type="tel"
                value={contact.phone}
                onChange={(e) => onUpdatePhone(idx, e)}
                placeholder="กรอกเบอร์โทร"
                className={inputClass}
              />
            </div>
            <button
              type="button"
              onClick={() => onRemove(idx)}
              className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500 transition"
              aria-label="ลบผู้ติดต่อฉุกเฉิน"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ))}

      <button type="button" onClick={onAdd}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-300 py-2.5 text-sm text-emerald-600 hover:border-emerald-400 hover:bg-emerald-50 transition">
        <Plus size={15} /> เพิ่มผู้ติดต่อฉุกเฉิน
      </button>
    </div>
  );
}
