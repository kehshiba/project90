"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, CloudOff, Sprout, X } from "lucide-react";
import {
  ChallengeConfig,
  ChallengeData,
  DayEntry,
  WorkoutSet,
  createDefaultData,
  createEmptyDay,
  formatShortDate,
  getChallengeStats,
  getWeekSummaries,
  getWeeks,
  todayKey,
} from "@/lib/challenge";
import {
  loadStoredData,
  saveStoredData,
  cloneData,
} from "@/lib/storage";
import { normalizeWorkoutType } from "@/lib/workout-csv";
import { useCloudSync } from "@/lib/use-cloud-sync";
import { AuthScreen } from "./AuthScreen";
import { CloudConflictDialog } from "./CloudConflictDialog";
import { HeaderNav } from "./HeaderNav";
import { Hero } from "./Hero";
import { CalendarSection } from "./CalendarSection";
import { InsightsModal } from "./InsightsModal";
import { DayDrawer } from "./DayDrawer";
import { SettingsModal } from "./SettingsModal";
import { Toast, ToastState, ToastTone } from "./Toast";

function LoadingScreen() {
  return (
    <div className="min-h-dvh bg-[#f6f2e8]">
      <div className="h-14 border-b border-[#e5ded0]/80 bg-[#f6f2e8]/80 sm:h-16" />
      <main className="mx-auto w-full max-w-[1280px] px-3 pt-3 sm:px-5 sm:pt-5 lg:px-6">
        <div className="overflow-hidden rounded-[26px] border border-[#e5ded0] bg-[#fcfaf4] sm:rounded-[32px]">
          <div className="flex items-center justify-center gap-2 border-b border-[#e9e2d5] py-16 text-[#8f8c80]">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#283b2e] text-[#d7e5d2]">
              <Sprout size={17} />
            </span>
            <span className="text-[12px] font-semibold">Opening your challenge…</span>
          </div>
          <div className="h-[420px] animate-pulse" />
        </div>
      </main>
    </div>
  );
}

export function ChallengeApp() {
  const [data, setData] = useState<ChallengeData>(() => createDefaultData());
  const [ready, setReady] = useState(false);
  const [today, setToday] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [insightsOpen, setInsightsOpen] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [storageWarning, setStorageWarning] = useState<string | null>(null);
  const [persistFailed, setPersistFailed] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string, tone: ToastTone = "success") => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ id: Date.now(), message, tone });
    toastTimer.current = setTimeout(() => setToast(null), 3400);
  }, []);

  const cloud = useCloudSync({ ready, data, setData });
  const { syncNow: syncCloudNow, signOut: signOutCloud } = cloud;

  const handleCloudSync = useCallback(async () => {
    const result = await syncCloudNow();
    if (result.ok) {
      showToast(
        result.reloading
          ? "Checking your private cloud backup…"
          : "Cloud backup updated.",
        result.reloading ? "info" : "success",
      );
    } else {
      showToast(result.error ?? "Cloud sync failed. Try again.", "error");
    }
  }, [syncCloudNow, showToast]);

  const handleCloudSignOut = useCallback(async () => {
    await signOutCloud();
    showToast("Signed out. This browser keeps its local copy.", "info");
  }, [signOutCloud, showToast]);

  useEffect(() => {
    // Hydration-safe localStorage read. State must be filled after the first
    // client render so server and client markup always match.
    const loaded = loadStoredData();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setData(loaded.data);
    setToday(todayKey());
    if (loaded.warning) setStorageWarning(loaded.warning);
    setReady(true);

    const interval = window.setInterval(() => {
      setToday(todayKey());
    }, 60_000);

    return () => {
      window.clearInterval(interval);
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    const saved = saveStoredData(data);
    // The persistence failure is external state; surface it without blocking.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!saved) setPersistFailed(true);
    else if (persistFailed) setPersistFailed(false);
  }, [data, persistFailed, ready]);

  const stats = useMemo(
    () => (today ? getChallengeStats(data, today) : null),
    [data, today],
  );
  const summaries = useMemo(
    () => (today ? getWeekSummaries(data.challenge, data.days, today) : []),
    [data, today],
  );
  const weeks = useMemo(() => getWeeks(data.challenge), [data.challenge]);
  const latestWeightInfo = useMemo(() => {
    if (!today) return { value: data.challenge.startingWeight, date: null };
    const weights = Object.entries(data.days)
      .filter(([date, entry]) => date <= today && entry.weight != null)
      .sort(([a], [b]) => a.localeCompare(b));
    if (weights.length === 0) {
      return { value: data.challenge.startingWeight, date: null };
    }
    const [date, entry] = weights[weights.length - 1];
    return { value: entry.weight as number, date };
  }, [data.challenge.startingWeight, data.days, today]);

  const openDay = useCallback((date: string) => {
    setInsightsOpen(false);
    setSelectedDate(date);
  }, []);

  const openInsights = useCallback(() => {
    setSelectedDate(null);
    setInsightsOpen(true);
  }, []);

  const closeInsights = useCallback(() => {
    setInsightsOpen(false);
  }, []);

  const closeDay = useCallback(() => {
    setSelectedDate(null);
  }, []);

  const updateDay = useCallback((date: string, patch: Partial<DayEntry>) => {
    setData((current) => {
      const existing = current.days[date] ?? createEmptyDay();
      return {
        ...current,
        days: {
          ...current.days,
          [date]: { ...existing, ...patch },
        },
      };
    });
  }, []);

  const clearDay = useCallback((date: string) => {
    setData((current) => {
      const nextDays = { ...current.days };
      delete nextDays[date];
      return { ...current, days: nextDays };
    });
    showToast("That day has been cleared.", "info");
  }, [showToast]);

  const importWorkoutLog = useCallback(
    (incoming: Record<string, WorkoutSet[]>) => {
      const dates = Object.keys(incoming).sort();
      const totalSets = dates.reduce(
        (sum, date) => sum + incoming[date].length,
        0,
      );
      if (dates.length === 0 || totalSets === 0) return;

      setData((current) => {
        const nextDays = { ...current.days };
        for (const date of dates) {
          const sets = incoming[date];
          if (!sets?.length) continue;
          const existing = nextDays[date] ?? createEmptyDay();
          const firstWorkout = sets[0]?.workout ?? "";
          nextDays[date] = {
            ...existing,
            workoutSets: sets,
            workout:
              normalizeWorkoutType(firstWorkout) ?? existing.workout,
          };
        }
        return { ...current, days: nextDays };
      });

      showToast(
        dates.length === 1
          ? `${totalSets} sets saved to ${formatShortDate(dates[0])}.`
          : `${totalSets} sets saved across ${dates.length} days.`,
        "success",
      );
    },
    [showToast],
  );

  const removeWorkoutLog = useCallback(
    (date: string) => {
      setData((current) => {
        const existing = current.days[date];
        if (!existing) return current;
        return {
          ...current,
          days: {
            ...current.days,
            [date]: { ...existing, workoutSets: [] },
          },
        };
      });
      showToast(`Workout log removed for ${formatShortDate(date)}.`, "info");
    },
    [showToast],
  );

  const saveDay = useCallback(
    (date: string) => {
      setSelectedDate(null);
      showToast(`${formatShortDate(date)} is saved locally.`, "success");
    },
    [showToast],
  );

  const openSettings = useCallback(() => {
    setSelectedDate(null);
    setInsightsOpen(false);
    setSettingsOpen(true);
  }, []);

  const closeSettings = useCallback(() => {
    setSettingsOpen(false);
  }, []);

  const applySettings = useCallback(
    (challenge: ChallengeConfig) => {
      setData((current) => ({ ...current, challenge }));
      setSettingsOpen(false);
      showToast("Settings saved. Every logged day is still intact.", "success");
    },
    [showToast],
  );

  const replaceData = useCallback(
    (imported: ChallengeData, warning?: string) => {
      setData(cloneData(imported));
      setSettingsOpen(false);
      setSelectedDate(null);
      setInsightsOpen(false);
      setStorageWarning(null);
      showToast(
        warning
          ? `Backup restored. ${warning}`
          : `Backup restored — ${Object.keys(imported.days).length} day entries.`,
        warning ? "info" : "success",
      );
    },
    [showToast],
  );

  const resetChallenge = useCallback(() => {
    const fresh = createDefaultData();
    setData(fresh);
    setSettingsOpen(false);
    setSelectedDate(null);
    setInsightsOpen(false);
    setStorageWarning(null);
    showToast("A fresh challenge is ready. Let's begin again.", "info");
  }, [showToast]);

  if (!ready || !today || !stats) {
    return <LoadingScreen />;
  }

  if (cloud.configured && cloud.authLoading) {
    return <LoadingScreen />;
  }

  if (cloud.configured && !cloud.signedIn) {
    return <AuthScreen onSend={cloud.sendMagicLink} cloudError={cloud.error} />;
  }

  if (cloud.configured && cloud.status === "loading") {
    return <LoadingScreen />;
  }

  return (
    <div id="top" className="min-h-dvh overflow-x-hidden pb-6">
      <HeaderNav
        currentDay={stats.currentDay}
        duration={data.challenge.duration}
        onOpenInsights={openInsights}
        onOpenSettings={openSettings}
        cloudStatus={cloud.status}
        cloudLastSyncedAt={cloud.lastSyncedAt}
        onSyncNow={handleCloudSync}
      />

      <main className="mx-auto w-full max-w-[1280px] px-3 pt-3 sm:px-5 sm:pt-4 lg:px-6">
        {cloud.error && cloud.signedIn ? (
          <div className="mb-3 flex items-start gap-2.5 rounded-[16px] border border-[#eccbc3] bg-[#faeae5] px-3.5 py-3 text-[11px] font-medium leading-relaxed text-[#96594d]">
            <CloudOff size={14} className="mt-0.5 shrink-0 text-[#a35d50]" aria-hidden="true" />
            <div className="flex-1">
              <p className="font-bold">Cloud sync needs attention</p>
              <p className="mt-0.5 text-[10px] opacity-85">
                {cloud.error} Your changes are still saved in this browser.
              </p>
            </div>
            <button
              type="button"
              onClick={handleCloudSync}
              className="shrink-0 rounded-full border border-[#e3bdb2] bg-[#fff7f4] px-2.5 py-1 text-[9px] font-bold transition hover:bg-[#fbe9e4]"
            >
              Retry
            </button>
          </div>
        ) : null}

        {storageWarning || persistFailed ? (
          <div className="mb-3 flex items-start gap-2.5 rounded-[16px] border border-[#ead9b9] bg-[#fcf6e6] px-3.5 py-3 text-[11px] font-medium leading-relaxed text-[#856f3e]">
            <AlertTriangle size={14} className="mt-0.5 shrink-0 text-[#a58842]" />
            <div className="flex-1">
              <p className="font-bold">Your browser storage needs attention</p>
              <p className="mt-0.5 text-[10px] opacity-85">
                {storageWarning ??
                  "Changes couldn't be saved to this browser. Export a backup before closing the page."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setStorageWarning(null);
                setPersistFailed(false);
              }}
              className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full hover:bg-black/5"
              aria-label="Dismiss storage warning"
            >
              <X size={12} />
            </button>
          </div>
        ) : null}

        <div className="overflow-hidden rounded-[26px] border border-[#e5ded0] bg-[#fcfaf5] shadow-[var(--shadow-soft)] sm:rounded-[32px]">
          <Hero
            data={data}
            stats={stats}
            today={today}
            onOpenDay={openDay}
          />

          <CalendarSection
            data={data}
            summaries={summaries}
            today={today}
            onOpenDay={openDay}
          />
        </div>

        <footer className="mt-1 flex flex-col gap-2 px-1.5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-1.5 text-[9px] font-medium text-[#a09b8f]">
            <Sprout size={11} className="text-[#8b9a84]" aria-hidden="true" />
            {weeks.length} weeks · {data.challenge.duration} days ·{" "}
            {cloud.signedIn
              ? "saved here + in your private cloud backup"
              : "stored on this device only"}
          </p>
          <button
            type="button"
            onClick={openSettings}
            className="self-start text-[9px] font-semibold text-[#74786a] underline decoration-[#ccc5b7] underline-offset-2 transition hover:text-[#475643] sm:self-auto"
          >
            Back up your progress
          </button>
        </footer>
      </main>

      {selectedDate ? (
        <DayDrawer
          key={selectedDate}
          date={selectedDate}
          data={data}
          today={today}
          latestWeight={latestWeightInfo.value}
          latestWeightDate={latestWeightInfo.date}
          onClose={closeDay}
          onUpdateDay={updateDay}
          onClearDay={clearDay}
          onSaveDay={saveDay}
          onImportWorkoutLog={importWorkoutLog}
          onRemoveWorkoutLog={removeWorkoutLog}
        />
      ) : null}

      {insightsOpen ? (
        <InsightsModal
          data={data}
          stats={stats}
          summaries={summaries}
          today={today}
          onOpenDay={openDay}
          onClose={closeInsights}
        />
      ) : null}

      {settingsOpen ? (
        <SettingsModal
          data={data}
          cloud={{
            configured: cloud.configured,
            email: cloud.email,
            status: cloud.status,
            error: cloud.error,
            lastSyncedAt: cloud.lastSyncedAt,
            conflict: Boolean(cloud.conflict),
            onSyncNow: handleCloudSync,
            onSignOut: handleCloudSignOut,
          }}
          onClose={closeSettings}
          onSaveSettings={applySettings}
          onImport={replaceData}
          onReset={resetChallenge}
        />
      ) : null}

      {cloud.conflict ? (
        <CloudConflictDialog
          local={data}
          cloud={cloud.conflict.data}
          cloudUpdatedAt={cloud.conflict.updatedAt}
          onUseCloud={() => {
            cloud.useCloud();
            showToast("Cloud backup loaded into this browser.", "success");
          }}
          onKeepLocal={() => {
            cloud.keepLocal();
            showToast("This browser's data will replace the cloud copy.", "info");
          }}
        />
      ) : null}

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
