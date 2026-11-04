"use client";

import { AlertCircle, Check, Info, X } from "lucide-react";

export type ToastTone = "success" | "error" | "info";

export interface ToastState {
  id: number;
  message: string;
  tone: ToastTone;
}

export function Toast({
  toast,
  onClose,
}: {
  toast: ToastState | null;
  onClose: () => void;
}) {
  if (!toast) return null;
  const Icon = toast.tone === "success" ? Check : toast.tone === "error" ? AlertCircle : Info;
  const tone =
    toast.tone === "success"
      ? "border-[#cfdfc8] bg-[#f8fcf4] text-[#516b4f]"
      : toast.tone === "error"
        ? "border-[#e9cbc3] bg-[#fdf4f1] text-[#93564a]"
        : "border-[#ddd6c9] bg-[#fdfaf4] text-[#66685c]";
  const iconTone =
    toast.tone === "success"
      ? "bg-[#e6f1e1] text-[#5f825f]"
      : toast.tone === "error"
        ? "bg-[#f7e2dc] text-[#a35d50]"
        : "bg-[#f0ebe1] text-[#888377]";

  return (
    <div className="pointer-events-none fixed inset-x-0 top-[82px] z-[100] flex justify-center px-4">
      <div
        role="status"
        aria-live="polite"
        className={`toast pointer-events-auto flex w-auto max-w-[min(420px,calc(100vw-2rem))] items-center gap-2.5 rounded-full border px-3.5 py-2.5 shadow-[0_10px_30px_rgba(40,42,32,0.13)] backdrop-blur ${tone}`}
      >
        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${iconTone}`}>
          <Icon size={13} strokeWidth={2.5} />
        </span>
        <p className="text-[11px] font-semibold leading-snug">{toast.message}</p>
        <button
          type="button"
          onClick={onClose}
          className="ml-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full opacity-55 transition hover:bg-black/5 hover:opacity-90"
          aria-label="Dismiss notification"
        >
          <X size={11} />
        </button>
      </div>
    </div>
  );
}
