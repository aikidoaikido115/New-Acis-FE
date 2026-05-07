"use client";
import { useState, useRef, useEffect, type CSSProperties } from "react";
import { createPortal } from "react-dom";
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
  allowCreate?: boolean;
  onCreate?: (value: string) => void;
  createLabel?: string;
}

export function SearchableDropdown({ 
  options, 
  value, 
  onChange, 
  placeholder = "เลือก", 
  className,
  allowCreate = false,
  onCreate,
  createLabel = "เพิ่มรายการ"
}: SearchableDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (containerRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setIsOpen(false);
      setSearchQuery("");
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

  const sortedOptions = [...options].sort((a, b) => {
    return a.label.localeCompare(b.label, 'th', { numeric: true });
  });

  // Filter options based on search query (ใช้ sortedOptions แทน options)
  const filteredOptions = sortedOptions.filter((option) =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    option.value.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (optionValue: string) => {
    onChange?.(optionValue);
    setIsOpen(false);
    setSearchQuery("");
  };

  const normalizedQuery = searchQuery.trim();
  const hasExactMatch = normalizedQuery
    ? options.some(
        (option) =>
          option.label.toLowerCase() === normalizedQuery.toLowerCase() ||
          option.value.toLowerCase() === normalizedQuery.toLowerCase()
      )
    : false;

  const handleCreate = () => {
    if (!normalizedQuery) return;
    onCreate?.(normalizedQuery);
    setIsOpen(false);
    setSearchQuery("");
  };

  const updateMenuPosition = () => {
    const button = buttonRef.current;
    if (!button) return;
    const rect = button.getBoundingClientRect();
    const width = rect.width;
    const safeLeft = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8));
    const top = rect.bottom + 8;
    setMenuStyle({
      position: "fixed",
      top,
      left: safeLeft,
      width,
      zIndex: 60,
    });
  };

  useEffect(() => {
    if (!isOpen) return;
    updateMenuPosition();

    const handleScroll = () => updateMenuPosition();
    const handleResize = () => updateMenuPosition();

    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleResize);
    };
  }, [isOpen]);

  const menu = (
    <div
      ref={menuRef}
      style={menuStyle}
      className="rounded-xl border border-slate-200 bg-white shadow-lg"
    >
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
            className="w-full rounded-sm border border-slate-200 py-1.5 pl-8 pr-3 text-sm text-black focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
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

        {allowCreate && normalizedQuery && !hasExactMatch && (
          <button
            type="button"
            onClick={handleCreate}
            className="flex w-full items-center px-4 py-2 text-left text-sm text-emerald-600 hover:bg-emerald-50"
          >
              {createLabel}: “{normalizedQuery}”
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      <button
        type="button"
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex w-full items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
      >
        <span className={cn(!selectedOption && "text-slate-400")}>
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 transition", isOpen && "rotate-180")} />
      </button>

      {isOpen && typeof document !== "undefined" ? createPortal(menu, document.body) : null}
    </div>
  );
}