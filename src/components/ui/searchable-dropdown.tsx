"use client";
import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface DropdownOption {
  value: string;
  label: string;
}

interface SearchableDropdownProps {
  options: DropdownOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchableDropdown({ 
  options, 
  value, 
  onChange, 
  placeholder = "เลือก", 
  className 
}: SearchableDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const selectedOption = options.find((opt) => opt.value === value);

  // Filter options based on search query
  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    option.value.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (optionValue: string) => {
    onChange?.(optionValue);
    setIsOpen(false);
    setSearchQuery("");
  };

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex w-full items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
      >
        <span className={cn(!selectedOption && "text-slate-400")}>
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 transition", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 w-full min-w-[200px] rounded-xl border border-slate-200 bg-white shadow-lg">
          {/* Search Input */}
          <div className="border-b border-slate-200 p-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหา..."
                className="w-full rounded-sm border border-slate-200 py-1.5 pl-8 pr-3 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>
          </div>

          {/* Options List with Scroll */}
          <div className="max-h-60 overflow-y-auto py-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={cn(
                    "flex w-full items-center px-4 py-2 text-left text-sm transition",
                    option.value === value
                      ? "bg-blue-50 text-blue-600"
                      : "text-slate-700 hover:bg-slate-50"
                  )}
                >
                  {option.label}
                </button>
              ))
            ) : (
              <div className="px-4 py-3 text-center text-sm text-slate-400">
                ไม่พบรายการที่ค้นหา
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
