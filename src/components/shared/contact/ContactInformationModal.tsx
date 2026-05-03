"use client";

import { useEffect, useMemo, useState } from "react";
import { UserCircle2, X } from "lucide-react";
import Image from "next/image";
import apiClient, { ApiResponse } from "@/lib/axios.ts/api-client";
import { resolveProfileImage } from "@/lib/profile-image";
import type { User } from "@/types/auth";
import { ContactInfo } from "./contactDirectory";

interface ContactInformationModalProps {
  contact: ContactInfo;
  onClose: () => void;
}

type ContactDetails = ContactInfo & {
  username?: string;
};

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[140px_1fr] items-start gap-4">
      <p className="text-body-large font-semibold text-[#2A2A2A]">{label}</p>
      <p className="text-body-large text-[#2E2E2E]">{value}</p>
    </div>
  );
}

export function ContactInformationModal({ contact, onClose }: ContactInformationModalProps) {
  const [fetchedContact, setFetchedContact] = useState<{ key: string; value: ContactDetails } | null>(null);

  const searchTerms = useMemo(() => {
    const trimmedFirstName = contact.firstName.trim();
    const trimmedLastName = contact.lastName.trim();

    if (trimmedFirstName && trimmedLastName) {
      return { first_name: trimmedFirstName, last_name: trimmedLastName };
    }

    const combinedName = [trimmedFirstName, trimmedLastName].filter(Boolean).join(" ").trim();
    const combinedTokens = combinedName.split(/\s+/).filter(Boolean);
    if (combinedTokens.length >= 2) {
      return {
        first_name: combinedTokens[0],
        last_name: combinedTokens.slice(1).join(" "),
      };
    }

    const nicknameTokens = contact.nickname.trim().split(/\s+/).filter(Boolean);
    if (nicknameTokens.length >= 2) {
      return {
        first_name: nicknameTokens[0],
        last_name: nicknameTokens.slice(1).join(" "),
      };
    }

    return null;
  }, [contact.firstName, contact.lastName, contact.nickname]);

  const contactSearchKey = searchTerms ? `${searchTerms.first_name}::${searchTerms.last_name}` : null;

  const contactDetails: ContactDetails = fetchedContact?.key === contactSearchKey ? fetchedContact.value : contact;

  useEffect(() => {
    let isActive = true;

    if (!searchTerms) {
      return () => {
        isActive = false;
      };
    }

    void apiClient
      .get<ApiResponse<User[]>>("/api/user/search", { params: searchTerms })
      .then((response) => {
        if (!isActive) {
          return;
        }

        const matchedUser = response.data.result?.[0];
        if (!matchedUser) {
          return;
        }

        setFetchedContact({
          key: contactSearchKey ?? "",
          value: {
            firstName: matchedUser.first_name?.trim() || contact.firstName,
            lastName: matchedUser.last_name?.trim() || contact.lastName,
            nickname: matchedUser.nickname?.trim() || contact.nickname,
            email: matchedUser.email?.trim() || contact.email,
            phone: matchedUser.phone?.trim() || contact.phone,
            avatarUrl: resolveProfileImage(matchedUser.profile_image) || contact.avatarUrl,
            username: matchedUser.username?.trim(),
          },
        });
      })
      .catch(() => {
        if (!isActive) {
          return;
        }
      })

    return () => {
      isActive = false;
    };
  }, [contact, contactSearchKey, searchTerms]);

  const displayName = [contactDetails.firstName, contactDetails.lastName].filter(Boolean).join(" ") || "ไม่ระบุชื่อ";

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
            {contactDetails.avatarUrl ? (
              <Image
                src={contactDetails.avatarUrl}
                alt={displayName}
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
              <p className="text-headline-5 font-bold text-[#1F1F1F]">{displayName}</p>
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
          <h3 className="text-headline-7 font-semibold text-[#262626]">ข้อมูลผู้ใช้</h3>
          <InfoRow label="ชื่อจริง" value={contactDetails.firstName || "-"} />
          <InfoRow label="นามสกุล" value={contactDetails.lastName || "-"} />
          <InfoRow label="ชื่อผู้ใช้" value={contactDetails.username || "-"} />
          <InfoRow label="อีเมล" value={contactDetails.email || "-"} />
          <InfoRow label="เบอร์โทรศัพท์" value={contactDetails.phone || "-"} />
        </div>
      </div>
    </div>
  );
}
