"use client";

import { Camera, X } from "lucide-react";
import type { RefObject, ChangeEvent } from "react";

interface ProfileImageUploadProps {
  preview: string;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onImageClick: () => void;
  onImageChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
}

export function ProfileImageUpload({ preview, fileInputRef, onImageClick, onImageChange, onRemove }: ProfileImageUploadProps) {
  return (
    <div className="flex flex-col items-center gap-2 lg:items-start">
      <div className="relative">
        <button type="button" onClick={onImageClick}
          className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-slate-300 bg-slate-50 transition hover:border-emerald-500 hover:bg-emerald-50">
          {preview ? (
            <img src={preview} alt="preview" className="h-full w-full rounded-full object-cover" />
          ) : (
            <Camera className="h-8 w-8 text-slate-400" />
          )}
        </button>

        {preview && (
          <button type="button" onClick={onRemove}
            className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow hover:bg-red-600">
            <X size={12} />
          </button>
        )}
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onImageChange} />
      <span className="sm:ml-0 md:ml-0 lg:ml-8 text-xs text-slate-400">รูปโปรไฟล์</span>
    </div>
  );
}
