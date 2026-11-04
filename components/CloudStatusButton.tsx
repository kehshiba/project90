"use client";

import { Cloud, CloudCheck, CloudOff, RefreshCw } from "lucide-react";
import { CloudStatus } from "@/lib/cloud";

function statusCopy(
  status: CloudStatus,
  lastSyncedAt: string | null,
): { label: string; title: string; tone: string; icon: typeof Cloud } {
  const saved = lastSyncedAt
    ? new Date(lastSyncedAt).toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
      })
    : null;

  if (status === "conflict") {
    return {
      label: "Review sync",
      title: "This browser and the cloud both have data. Choose one.",
      tone: "border-[#ead9b9] bg-[#fcf6e6] text-[#856f3e]",
      icon: Cloud,
    };
  }
  if (status === "error") {
    return {
      label: "Retry sync",
      title: "Cloud sync is paused. Your changes are still saved in this browser.",
      tone: "border-[#eccbc3] bg-[#faeae5] text-[#96594d]",
      icon: CloudOff,
    };
  }
  if (status === "saving") {
    return {
      label: "Saving…",
      title: "Saving a private copy to your cloud backup.",
      tone: "border-[#e5ded1] bg-[#f8f4ec] text-[#8b887d]",
      icon: RefreshCw,
    };
  }
  if (status === "loading") {
    return {
      label: "Syncing…",
      title: "Checking your private cloud backup.",
      tone: "border-[#e5ded1] bg-[#f8f4ec] text-[#8b887d]",
      icon: Cloud,
    };
  }
  return {
    label: "Cloud saved",
    title: saved ? `Last cloud save at ${saved}. Click to back up now.` : "Private cloud backup is active.",
    tone: "border-[#d5e4cf] bg-[#f2f8ee] text-[#5a7558]",
    icon: CloudCheck,
  };
}

export function CloudStatusButton({
  status,
  lastSyncedAt,
  onSyncNow,
}: {
  status: CloudStatus;
  lastSyncedAt: string | null;
  onSyncNow: () => void;
}) {
  if (status === "disabled") return null;

  const copy = statusCopy(status, lastSyncedAt);
  const Icon = copy.icon;
  const busy = status === "loading" || status === "saving" || status === "conflict";

  return (
    <>
      <button
        type="button"
        onClick={onSyncNow}
        disabled={busy}
        title={copy.title}
        aria-label={copy.title}
        className={`hidden min-h-9 items-center gap-1.5 rounded-full border px-3 text-[9px] font-bold transition hover:brightness-[0.98] disabled:cursor-default sm:inline-flex ${copy.tone}`}
      >
        <Icon
          size={12}
          className={status === "saving" || status === "loading" ? "animate-spin" : ""}
          aria-hidden="true"
        />
        {copy.label}
      </button>
      <button
        type="button"
        onClick={onSyncNow}
        disabled={busy}
        title={copy.title}
        aria-label={copy.title}
        className={`icon-button !h-9 !w-9 sm:hidden ${copy.tone}`}
      >
        <Icon
          size={14}
          className={status === "saving" || status === "loading" ? "animate-spin" : ""}
          aria-hidden="true"
        />
      </button>
    </>
  );
}
