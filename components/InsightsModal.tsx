"use client";

import { useEffect, useRef } from "react";
import { ChartNoAxesColumnIncreasing, X } from "lucide-react";
import {
  ChallengeData,
  ChallengeStats,
  WeeklySummary,
} from "@/lib/challenge";
import { AchievementsSection } from "./AchievementsSection";
import { ProgressSection } from "./ProgressSection";

export function InsightsModal({
  data,
  stats,
  summaries,
  today,
  onOpenDay,
  onClose,
}: {
  data: ChallengeData;
  stats: ChallengeStats;
  summaries: WeeklySummary[];
  today: string;
  onOpenDay: (date: string) => void;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab" || !panelRef.current) return;
      const focusables = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => element.offsetParent !== null);
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <>
      <div className="overlay-backdrop" onClick={onClose} aria-hidden="true" />
      <div className="fixed inset-0 z-[71] flex items-center justify-center p-2 sm:p-5">
        <div
          ref={panelRef}
          className="modal-panel flex max-h-[min(92dvh,980px)] flex-col"
          style={{ width: "min(1180px, calc(100vw - 16px))" }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="insights-title"
        >
          <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[#e9e2d5] px-4 pb-3.5 pt-4 sm:px-6 sm:pb-4 sm:pt-5">
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[#eaf1e4] text-[#5b795f]">
                <ChartNoAxesColumnIncreasing size={15} strokeWidth={2.2} />
              </span>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.13em] text-[#989386]">
                  The bigger picture
                </p>
                <h2
                  id="insights-title"
                  className="mt-0.5 text-[21px] font-bold leading-tight tracking-[-0.04em] text-[#2e3229] sm:text-[24px]"
                >
                  Your progress.
                </h2>
                <p className="mt-1 max-w-2xl text-[10px] leading-relaxed text-[#959084] sm:text-[11px]">
                  Weight trends, honest stats and small wins — built only from what
                  you&apos;ve actually logged.
                </p>
              </div>
            </div>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              className="icon-button shrink-0 !h-9 !w-9"
              aria-label="Close insights"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-4 sm:px-5 sm:py-5">
            <div className="space-y-6">
              <ProgressSection
                data={data}
                stats={stats}
                summaries={summaries}
                today={today}
                onOpenDay={onOpenDay}
                embedded
              />

              <div className="border-t border-[#e9e2d5] pt-5">
                <AchievementsSection data={data} today={today} embedded />
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center justify-between gap-3 border-t border-[#e8e1d5] bg-[#fcfaf5]/94 px-4 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] sm:px-6">
            <p className="text-[9px] font-medium text-[#9e998d]">
              Missing days stay neutral. Nothing here is estimated.
            </p>
            <button type="button" onClick={onClose} className="btn-secondary !min-h-8 !px-3 !py-1 !text-[10px]">
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
