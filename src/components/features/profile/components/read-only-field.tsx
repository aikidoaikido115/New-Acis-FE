import React from "react";

interface ReadOnlyFieldProps {
  label: string;
  value: string;
}

export const ReadOnlyField: React.FC<ReadOnlyFieldProps> = ({ label, value }) => (
  <div>
    <label className="block text-gray-600 mb-1">{label}</label>
    <div className="relative">
      <div className="w-full rounded-lg px-3 py-2 border border-gray-300 bg-gray-50 text-gray-900 pr-10">
        {value}
      </div>
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
        <svg data-testid="lock-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      </div>
    </div>
  </div>
);
