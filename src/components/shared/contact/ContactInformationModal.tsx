"use client";

import { UserCircle2, X } from "lucide-react";
import Image from "next/image";
import { ContactInfo } from "./contactDirectory";

interface ContactInformationModalProps {
  contact: ContactInfo;
  onClose: () => void;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[140px_1fr] items-start gap-4">
      <p className="text-[16px] font-semibold text-[#2A2A2A]">{label}</p>
      <p className="text-[16px] text-[#2E2E2E]">{value}</p>
    </div>
  );
}

export function ContactInformationModal({ contact, onClose }: ContactInformationModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-label="contact information"
    >
      <div
        className="w-full max-w-[520px] overflow-hidden rounded-[28px] bg-white shadow-[0_20px_45px_rgba(0,0,0,0.25)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-[#D5D5D5] px-8 py-5">
          <div className="flex items-center gap-4">
            {contact.avatarUrl ? (
              <Image
                src={contact.avatarUrl}
                alt={`${contact.firstName} ${contact.lastName}`}
                width={64}
                height={64}
                className="h-16 w-16 rounded-full border border-[#D1D1D1] object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#D1D1D1] bg-[#F0F0F0] text-[#A1A1A1]">
                <UserCircle2 className="h-12 w-12" />
              </div>
            )}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <p className="text-[24px] font-bold text-[#1F1F1F]">{contact.firstName}</p>
              <p className="text-[24px] font-bold text-[#1F1F1F]">{contact.lastName || "-"}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-[#7B7B7B] transition hover:bg-[#F3F3F3]"
            aria-label="ปิด"
          >
            <X className="h-7 w-7" />
          </button>
        </div>

        <div className="space-y-5 px-12 py-7">
          <h3 className="text-[18px] font-semibold text-[#262626]">ข้อมูลผู้ใช้</h3>
          <InfoRow label="ชื่อเล่น" value={contact.nickname} />
          <InfoRow label="อีเมล" value={contact.email} />
          <InfoRow label="เบอร์โทรศัพท์" value={contact.phone} />
        </div>
      </div>
    </div>
  );
}
