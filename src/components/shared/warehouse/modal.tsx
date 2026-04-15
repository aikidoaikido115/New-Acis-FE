"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

export const warehouseLabelClassName =
  "mb-2 block text-sm font-semibold text-[#262626]";

export const warehouseInputClassName =
  "h-8 w-full rounded-[4px] border border-[#B9B9B9] bg-white px-3 text-sm text-[#262626] outline-none transition placeholder:text-[#BBBBBB] focus:border-[#8C8C8C]";

export const warehouseReadOnlyInputClassName =
  "h-8 w-full rounded-[4px] border border-[#B9B9B9] bg-[#EEF1F5] px-3 text-sm text-[#4B4B4B] outline-none";

export const warehouseTextareaClassName =
  "min-h-[64px] w-full rounded-[4px] border border-[#B9B9B9] bg-white px-3 py-2 text-sm text-[#262626] outline-none transition placeholder:text-[#BBBBBB] focus:border-[#8C8C8C]";

export const warehouseHintClassName = "mt-1 text-xs leading-4 text-[#8E8E8E]";

export const warehouseCancelButtonClassName =
  "inline-flex min-w-[102px] items-center justify-center rounded-[4px] bg-[#B6B6B6] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#9F9F9F]";

export const warehouseSuccessButtonClassName =
  "inline-flex min-w-[118px] items-center justify-center rounded-[4px] bg-[#4F9966] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#418357]";

export const warehouseDangerButtonClassName =
  "inline-flex min-w-[118px] items-center justify-center rounded-[4px] bg-[#FF495B] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#E23E50]";

export const warehouseDisabledButtonClassName =
  "inline-flex min-w-[118px] cursor-not-allowed items-center justify-center rounded-[4px] bg-[#B6B6B6] px-5 py-2 text-sm font-semibold text-white";

interface WarehouseModalFrameProps {
  children: ReactNode;
  onClose: () => void;
  maxWidthClassName?: string;
  panelClassName?: string;
  closeOnEscape?: boolean;
}

export function WarehouseModalFrame({
  children,
  onClose,
  maxWidthClassName = "max-w-[744px]",
  panelClassName = "",
  closeOnEscape = true }: WarehouseModalFrameProps) {
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  useEffect(() => {
    if (!closeOnEscape) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [closeOnEscape, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`w-full overflow-hidden rounded-[18px] bg-white shadow-[0_24px_60px_rgba(0,0,0,0.28)] ${maxWidthClassName} ${panelClassName}`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

interface WarehouseModalHeaderProps {
  title: string;
  onClose: () => void;
}

export function WarehouseModalHeader({ title, onClose }: WarehouseModalHeaderProps) {
  return (
    <div className="flex items-start justify-between border-b border-[#D8D8D8] px-7 py-4">
      <h2 className="pr-4 text-lg font-semibold leading-none text-[#1E1E1E]">{title}</h2>
      <button
        type="button"
        onClick={onClose}
        className="-mr-1 -mt-1 rounded-md p-1 text-[#707070] transition hover:bg-[#F3F3F3] hover:text-[#4A4A4A]"
        aria-label="ปิด"
      >
        <X className="h-8 w-8 stroke-[2.25]" />
      </button>
    </div>
  );
}

interface WarehouseModalFooterProps {
  children: ReactNode;
  className?: string;
}

export function WarehouseModalFooter({ children, className = "" }: WarehouseModalFooterProps) {
  return (
    <div className={`flex items-center justify-end gap-3 border-t border-[#D8D8D8] bg-[#FAFAFA] px-7 py-4 ${className}`}>
      {children}
    </div>
  );
}

interface WarehouseAlertDialogProps {
  title: string;
  description: ReactNode;
  onClose: () => void;
  actions: ReactNode;
  iconTone?: "warning" | "none";
  maxWidthClassName?: string;
  align?: "center" | "left";
  bodyClassName?: string;
}

export function WarehouseAlertDialog({
  title,
  description,
  onClose,
  actions,
  iconTone = "warning",
  maxWidthClassName = "max-w-[420px]",
  align = "center",
  bodyClassName = "" }: WarehouseAlertDialogProps) {
  const isCentered = align === "center";

  return (
    <WarehouseModalFrame onClose={onClose} maxWidthClassName={maxWidthClassName}>
      <div className="relative px-7 pb-7 pt-6">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-md p-1 text-[#707070] transition hover:bg-[#F3F3F3] hover:text-[#4A4A4A]"
          aria-label="ปิด"
        >
          <X className="h-8 w-8 stroke-[2.25]" />
        </button>

        <div className={`${isCentered ? "text-center" : "text-left"} ${bodyClassName}`}>
          {iconTone === "warning" ? (
            <div className={`mb-7 flex ${isCentered ? "justify-center" : "justify-start"}`}>
              <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[#EDC643] text-headline-3 font-semibold leading-none text-white">
                !
              </div>
            </div>
          ) : null}

          <h2 className="text-lg font-semibold text-[#1E1E1E]">{title}</h2>
          <div className="mt-3 text-sm leading-6 text-[#2B2B2B]">{description}</div>
        </div>

        <div className={`mt-8 flex items-center gap-4 ${isCentered ? "justify-center" : "justify-end"}`}>
          {actions}
        </div>
      </div>
    </WarehouseModalFrame>
  );
}
