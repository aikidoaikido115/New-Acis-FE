"use client";
import { useState, useRef, useEffect, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownProps {
  options: DropdownOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function Dropdown({ options, value, onChange, placeholder = "เลือก", className }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (containerRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setIsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  const handleSelect = (optionValue: string) => {
    onChange?.(optionValue);
    setIsOpen(false);
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
      className="rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
    >
      <div className="max-h-60 overflow-y-auto overscroll-contain">
        {options.map((option, idx) => (
          <button
            key={`${option.value ?? "opt"}-${idx}`}
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
        ))}
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
