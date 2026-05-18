"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "full";
  scrollable?: boolean;
  disableBackdropClose?: boolean;
  printable?: boolean;
  zIndexClassName?: string;
}

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
  "5xl": "max-w-5xl",
  full: "max-w-[95vw]",
};

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  scrollable = false,
  disableBackdropClose = false,
  printable = false,
  zIndexClassName = "z-50",
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (!disableBackdropClose && modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 flex items-center justify-center bg-black/50 p-4",
        zIndexClassName,
        scrollable && "overflow-y-auto",
        printable && "print-modal-root"
      )}
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className={cn(
          "w-full rounded-2xl bg-white shadow-xl animate-in fade-in zoom-in-95 duration-200",
          sizeClasses[size],
          scrollable && "my-8 max-h-[90vh] overflow-y-auto",
          printable && "print-modal-content"
        )}
      >
        {title && (
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 rounded-t-2xl">
            <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            >
              <X size={20} />
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
