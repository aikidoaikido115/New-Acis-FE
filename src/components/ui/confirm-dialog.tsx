"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Modal } from "@/components/ui/modal";

type ConfirmTone = "default" | "danger";

interface ConfirmDialogOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  tone?: ConfirmTone;
}

interface ConfirmDialogState {
  isOpen: boolean;
  options: Required<ConfirmDialogOptions>;
}

const DEFAULT_OPTIONS: Required<ConfirmDialogOptions> = {
  title: "ยืนยันการทำรายการ",
  message: "คุณต้องการดำเนินการต่อหรือไม่?",
  confirmText: "ยืนยัน",
  cancelText: "ยกเลิก",
  tone: "default",
};

export function useConfirmDialog() {
  const resolverRef = useRef<((result: boolean) => void) | null>(null);
  const [state, setState] = useState<ConfirmDialogState>({
    isOpen: false,
    options: DEFAULT_OPTIONS,
  });

  const closeDialog = useCallback((result: boolean) => {
    resolverRef.current?.(result);
    resolverRef.current = null;
    setState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const confirm = useCallback((options: ConfirmDialogOptions) => {
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
      setState({
        isOpen: true,
        options: {
          ...DEFAULT_OPTIONS,
          ...options,
        },
      });
    });
  }, []);

  const confirmDialog = useMemo(() => {
    const isDanger = state.options.tone === "danger";

    return (
      <Modal
        isOpen={state.isOpen}
        onClose={() => closeDialog(false)}
        title={state.options.title}
        size="sm"
        disableBackdropClose
        zIndexClassName="z-[220]"
      >
        <div className="space-y-5">
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{state.options.message}</p>
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => closeDialog(false)}
              className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-300"
            >
              {state.options.cancelText}
            </button>
            <button
              type="button"
              onClick={() => closeDialog(true)}
              className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors ${
                isDanger ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {state.options.confirmText}
            </button>
          </div>
        </div>
      </Modal>
    );
  }, [closeDialog, state.isOpen, state.options]);

  return {
    confirm,
    confirmDialog,
  };
}
