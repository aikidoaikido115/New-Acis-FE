"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { Check, X, Info } from "lucide-react";

export type ToastType = "success" | "error" | "info";

interface Toast {
	id: string;
	title?: string;
	message: string;
	type: ToastType;
	duration: number;
}

interface ShowToastInput {
	title?: string;
	message: string;
	type?: ToastType;
	duration?: number;
}

interface ToastContextValue {
	showToast: (input: ShowToastInput) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const generateId = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString());

const baseStyles: Record<ToastType, { bg: string; border: string; iconColor: string; iconBg: string; title: string; text: string }> = {
	success: {
		bg: "bg-emerald-50",
		border: "border-emerald-500",
		iconColor: "text-white",
		iconBg: "bg-emerald-500",
		title: "text-emerald-900",
		text: "text-emerald-800",
	},
	error: {
		bg: "bg-rose-50",
		border: "border-rose-500",
		iconColor: "text-white",
		iconBg: "bg-rose-500",
		title: "text-rose-900",
		text: "text-rose-800",
	},
	info: {
		bg: "bg-yellow-50",
		border: "border-yellow-500",
		iconColor: "text-white",
		iconBg: "bg-yellow-500",
		title: "text-yellow-900",
		text: "text-yellow-800",
	},
};

export const TOAST_STYLES = baseStyles;

export function ToastProvider({ children }: { children: ReactNode }) {
	const [toasts, setToasts] = useState<Toast[]>([]);

	const removeToast = useCallback((id: string) => {
		setToasts((prev) => prev.filter((toast) => toast.id !== id));
	}, []);

	const showToast = useCallback(
		({ title, message, type = "info", duration = 4000 }: ShowToastInput) => {
			const id = generateId();
			const toast: Toast = { id, title, message, type, duration };
			setToasts((prev) => [...prev, toast]);

			setTimeout(() => removeToast(id), duration);
		},
		[removeToast]
	);

	const value = useMemo(() => ({ showToast }), [showToast]);

	return (
		<ToastContext.Provider value={value}>
			{children}
			<div className="fixed top-4 right-4 z-[250] flex flex-col gap-3 pointer-events-none">
				{toasts.map((toast) => {
					const style = baseStyles[toast.type];
					return (
						<div
							key={toast.id}
							className={`pointer-events-auto w-80 max-w-[90vw] rounded-2xl shadow-lg border-l-4 ${style.bg} ${style.border} p-4 flex gap-3 items-start`}
						>
							<div className={`mt-1 rounded-full p-2 ${style.iconBg} ${style.iconColor}`}>
								{toast.type === "success" ? (
									<Check className="h-5 w-5" />
								) : toast.type === "error" ? (
									<X className="h-5 w-5" />
								) : (
									<span className="font-semibold text-sm">i</span>
								)}
							</div>
							<div className="flex-1 min-w-0">
								{toast.title && <div className={`font-semibold text-base ${style.title}`}>{toast.title}</div>}
								<div className={`text-sm leading-snug ${style.text}`}>{toast.message}</div>
							</div>
							<button
								aria-label="ปิดแจ้งเตือน"
								onClick={() => removeToast(toast.id)}
								className="text-slate-500 hover:text-slate-700 transition"
							>
								<X className="h-4 w-4" />
							</button>
						</div>
					);
				})}
			</div>
		</ToastContext.Provider>
	);
}

export function useToast() {
	const ctx = useContext(ToastContext);
	if (!ctx) {
		throw new Error("useToast must be used within ToastProvider");
	}
	return ctx;
}
