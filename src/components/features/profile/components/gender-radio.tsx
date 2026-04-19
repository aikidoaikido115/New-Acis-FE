import React from "react";

interface GenderRadioProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const GenderRadio: React.FC<GenderRadioProps> = ({ value, onChange }) => (
  <div>
    <label className="block text-gray-600 mb-2">เพศ</label>
    <div className="flex flex-wrap gap-6 text-gray-900">
      {["male", "female", "other"].map(gender => (
        <label key={gender} className="flex items-center gap-2">
          <input
            type="radio"
            name="gender"
            value={gender}
            checked={value === gender}
            onChange={onChange}
          />
          {gender === "male" ? "ชาย" : gender === "female" ? "หญิง" : "อื่นๆ"}
        </label>
      ))}
    </div>
  </div>
);
