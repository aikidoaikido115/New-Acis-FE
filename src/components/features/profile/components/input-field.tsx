import React from "react";
import { Input } from "@/components/ui/input";

interface InputFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
}

export const InputField: React.FC<InputFieldProps> = ({ label, name, value, onChange, placeholder, type = "text" }) => {
  const inputProps: any = { type, name, placeholder, value, onChange, className: "w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 text-gray-900" };
  if (name === "phone") {
    inputProps.inputMode = "numeric";
    inputProps.pattern = "[0-9]*";
    inputProps.maxLength = 10;
  }
  return (
    <div>
      <label className="block text-gray-600 mb-1">{label}</label>
      <Input {...inputProps} />
    </div>
  );
};
