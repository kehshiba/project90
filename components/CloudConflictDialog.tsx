"use client";

import { useEffect, useRef } from "react";
import {
  ArrowRight,
  Check,
  Cloud,
  Download,
  HardDrive,
  ShieldCheck,
} from "lucide-react";
import { ChallengeData } from "@/lib/challenge";
import { countLoggedDays } from "@/lib/cloud";
import { exportChallengeData } from "@/lib/storage";

function formatCloudTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "recently";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function CloudConflictDialog({
  local,
  cloud,
  cloudUpdatedAt,
  onUseCloud,
  onKeepLocal,
}: {
  local: ChallengeData;
  cloud: ChallengeData;
  cloudUpdatedAt: string;
  onUseCloud: () => void;
  onKeepLocal: () => void;
}) {
  const keepLocalRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    keepLocalRef.current?.focus();
  }, []);

  const localDays = countLoggedDays(local);
  const cloudDays = countLoggedDays(cloud);

  return (
    <>
      <div className="overlay-backdrop !z-[90]" aria-hidden="true" />
      <div className="fixed inset-0 z-[91] flex items-center justify-center p-3 sm:p-6">
        <div
          className="modal-panel w-full max-w-[510px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cloud-conflict-title"
          aria-describedby="cloud-conflict-description"
        >
          <div className="border-b border-[#e9e2d5] px-5 pb-4 pt-5 sm:px-6">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#f9f0dc] text-[#98793e]">
                <Cloud size={15} strokeWidth={2.2} aria-hidden="true" />
              </span>
              <div>
                <p className="eyebrow text-[#989386]">One-time check</p>
                <h2
                  id="cloud-conflict-title"
                  className="mt-0.5 text-[21px] font-bold tracking-[-0.04em] text-[#2e3229]"
                >
                  Which backup should win?
                </h2>
              </div>
            </div>
            <p
              id="cloud-conflict-description"
              className="mt-2.5 text-[11px] leading-relaxed text-[#959084]"
            >
              This browser and your cloud account both have saved data. Choose
              one source of truth before editing further.
            </p>
          </div>

          <div className="space-y-2.5 px-5 py-4 sm:px-6">
            <div className="rounded-[14px] border border-[#e8e1d4] bg-[#fffdf9] p-3.5">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[#42463b]">
                  <Cloud size={12} className="text-[#6a8468]" aria-hidden="true" />
                  Cloud backup
                </span>
                <span className="text-[9px] font-semibold text-[#918d81]">
                  {formatCloudTime(cloudUpdatedAt)}
                </span>
              </div>
              <p className="mt-1 text-[9px] leading-relaxed text-[#9a9589]">
                {cloudDays} logged day{cloudDays === 1 ? "" : "s"} · private to{" "}
                your account
              </p>
            </div>

            <div className="rounded-[14px] border border-[#e8e1d4] bg-[#fffdf9] p-3.5">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[#42463b]">
                  <HardDrive size={12} className="text-[#967c55]" aria-hidden="true" />
                  This browser
                </span>
                <span className="text-[9px] font-semibold text-[#918d81]">
                  local cache
                </span>
              </div>
              <p className="mt-1 text-[9px] leading-relaxed text-[#9a9589]">
                {localDays} logged day{localDays === 1 ? "" : "s"} · only on this
                device
              </p>
            </div>

            <button
              type="button"
              onClick={() => exportChallengeData(local)}
              className="inline-flex items-center gap-1 text-[9px] font-bold text-[#7b826f] underline decoration-[#ccc5b7] underline-offset-4 transition hover:text-[#4f5a47]"
            >
              <Download size={10} aria-hidden="true" />
              Export this browser&apos;s data first
            </button>
          </div>

          <div className="flex flex-col gap-2 border-t border-[#e8e1d5] bg-[#fcfaf5]/94 px-5 py-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="hidden items-center gap-1.5 text-[8.5px] font-medium text-[#9e998d] sm:flex">
              <ShieldCheck size={10} className="text-[#8da087]" aria-hidden="true" />
              Cloud access is protected by RLS
            </p>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <button
                ref={keepLocalRef}
                type="button"
                onClick={onKeepLocal}
                className="btn-secondary justify-center !text-[10px]"
              >
                <Check size={12} aria-hidden="true" />
                Keep this browser
              </button>
              <button
                type="button"
                onClick={onUseCloud}
                className="btn-primary justify-center !text-[10px]"
              >
                Use cloud backup
                <ArrowRight size={12} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
