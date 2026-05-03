import React, { useRef } from "react";

interface AvatarUploadProps {
  src: string | null;
  onUpload: (file: File) => void;
  inputKey: number;
}

export const AvatarUpload: React.FC<AvatarUploadProps> = ({ src, onUpload, inputKey }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
  };

  return (
    <div className="relative">
      <div className="w-40 h-40 sm:w-34 sm:h-34 rounded-full bg-white border border-blue-300 flex items-center justify-center overflow-hidden">
        {src ? (
          <img src={src} alt="avatar" className="w-full h-full object-cover" />
        ) : (
          <svg width="130" height="130" viewBox="0 0 80 80" fill="none" className="w-full h-full">
            <circle cx="40" cy="40" r="40" fill="#9CA3AF" />
            <circle cx="40" cy="40" r="12" fill="#E5E7EB" />
            <path d="M40 50C28 50 18 58 18 68H62C62 58 52 50 40 50Z" fill="#E5E7EB" />
          </svg>
        )}
      </div>
      <input
        key={inputKey}
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="absolute bottom-0 right-0 bg-gray-600 rounded-full p-1.5 sm:p-2 shadow-md hover:bg-gray-700"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
      </button>
    </div>
  );
};
