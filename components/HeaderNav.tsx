"use client";

import { ChartNoAxesColumnIncreasing, Settings2, Sprout } from "lucide-react";
import { CloudStatus } from "@/lib/cloud";
import { CloudStatusButton } from "./CloudStatusButton";
import { ThemeToggle } from "./ThemeToggle";

export function HeaderNav({
  currentDay,
  duration,
  onOpenInsights,
  onOpenSettings,
  cloudStatus,
  cloudLastSyncedAt,
  onSyncNow,
}: {
  currentDay: number;
  duration: number;
  onOpenInsights: () => void;
  onOpenSettings: () => void;
  cloudStatus: CloudStatus;
  cloudLastSyncedAt: string | null;
  onSyncNow: () => void;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-[#e5ded0]/80 bg-[#f6f2e8]/86 backdrop-blur-xl">
      <div className="mx-auto flex h-14 w-full max-w-[1280px] items-center justify-between gap-4 px-3 sm:h-16 sm:px-5 lg:px-6">
        <a
          href="#top"
          className="group flex items-center gap-2.5 rounded-full"
          aria-label="The 90-Day Cut, back to top"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-[11px] bg-[#283b2e] text-[#d7e5d2] shadow-[0_3px_0_#1c2a20] transition-transform group-hover:-rotate-6 sm:h-9 sm:w-9 sm:rounded-[13px]">
            <Sprout size={16} strokeWidth={2.2} />
          </span>
          <span className="leading-none">
            <span className="block text-[11px] font-extrabold tracking-[0.09em] text-[#303229] sm:text-[12px]">
              THE 90-DAY CUT
            </span>
            <span className="mt-1 block text-[9px] font-semibold uppercase tracking-[0.13em] text-[#939084] sm:text-[10px]">
              Day {currentDay || 1} of {duration}
            </span>
          </span>
        </a>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <CloudStatusButton
            status={cloudStatus}
            lastSyncedAt={cloudLastSyncedAt}
            onSyncNow={onSyncNow}
          />
          <ThemeToggle />
          <button
            type="button"
            onClick={onOpenInsights}
            className="hidden min-h-9 items-center gap-1.5 rounded-full border border-[#e2dbcc] bg-[#fbf8f1]/80 px-3.5 text-[11px] font-bold text-[#65685c] transition hover:bg-[#f3eee3] hover:text-[#2c2f26] sm:inline-flex"
          >
            <ChartNoAxesColumnIncreasing size={14} aria-hidden="true" />
            Insights
          </button>
          <button
            type="button"
            onClick={onOpenInsights}
            className="icon-button !h-9 !w-9 sm:hidden"
            aria-label="Open insights"
            title="Insights"
          >
            <ChartNoAxesColumnIncreasing size={16} />
          </button>
          <button
            type="button"
            onClick={onOpenSettings}
            className="icon-button !h-9 !w-9 sm:!h-[38px] sm:!w-[38px]"
            aria-label="Open settings"
            title="Settings & backups"
          >
            <Settings2 size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
