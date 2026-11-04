"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronRight,
  Dumbbell,
  Flame,
  Footprints,
  Info,
  LockKeyhole,
  Moon,
  NotebookPen,
  Scale,
  Sparkles,
  X,
} from "lucide-react";
import {
  ChallengeData,
  DayEntry,
  DayStatus,
  MetricStatus,
  WORKOUT_OPTIONS,
  Workout,
  formatCalories,
  formatLongDate,
  formatShortDate,
  formatWeight,
  getChallengeDayNumber,
  getChallengeEndKey,
  getDayStatus,
  getMetricStatuses,
  getTargetsForDate,
  hasDayData,
  isWeekendKey,
  WorkoutSet,
} from "@/lib/challenge";
import {
  WorkoutGlyph,
  workoutDetails,
} from "./shared";
import { WorkoutLog } from "./WorkoutLog";

const toneMap: Record<
  MetricStatus,
  { badge: string; bar: string; text: string; icon: string; message: string }
> = {
  green: {
    badge: "border-[#cce1cb] bg-[#e8f2e5] text-[#47724f]",
    bar: "bg-[#729c79]",
    text: "text-[#47724f]",
    icon: "bg-[#e8f2e5] text-[#527a58] border-[#d4e6d0]",
    message: "On target",
  },
  yellow: {
    badge: "border-[#ebdda9] bg-[#fbf1d0] text-[#87671f]",
    bar: "bg-[#d0ac50]",
    text: "text-[#86681f]",
    icon: "bg-[#fbf1d0] text-[#917129] border-[#ebdda9]",
    message: "Slightly off",
  },
  red: {
    badge: "border-[#eccbc3] bg-[#f9e6df] text-[#955146]",
    bar: "bg-[#c47d6f]",
    text: "text-[#955146]",
    icon: "bg-[#f9e6df] text-[#a2594c] border-[#eccbc3]",
    message: "Off target",
  },
  empty: {
    badge: "border-[#e4ded2] bg-[#f5f1e8] text-[#908c80]",
    bar: "bg-[#d3cdbf]",
    text: "text-[#928e81]",
    icon: "bg-[#f3efe6] text-[#928e81] border-[#e4ded2]",
    message: "Not logged",
  },
};

const dayStatusMeta: Record<
  DayStatus,
  { label: string; classes: string; dot: string }
> = {
  complete: {
    label: "All goals hit",
    classes: "border-[#cce1cb] bg-[#e8f2e5] text-[#47724f]",
    dot: "bg-[#729c79]",
  },
  partial: {
    label: "In progress",
    classes: "border-[#ebdda9] bg-[#fbf1d0] text-[#87671f]",
    dot: "bg-[#d0ac50]",
  },
  off: {
    label: "Off target",
    classes: "border-[#eccbc3] bg-[#f9e6df] text-[#955146]",
    dot: "bg-[#c47d6f]",
  },
  unlogged: {
    label: "Not logged yet",
    classes: "border-[#e4ded2] bg-[#f5f1e8] text-[#908c80]",
    dot: "bg-[#d3cdbf]",
  },
  future: {
    label: "Upcoming",
    classes: "border-[#e4ded2] bg-[#f5f1e8] text-[#908c80]",
    dot: "bg-[#d3cdbf]",
  },
};

function parseDraftNumber(input: string, integer = false): number | null {
  const cleaned = input.replace(/,/g, "").trim();
  if (cleaned === "") return null;
  const value = Number(cleaned);
  if (!Number.isFinite(value) || value < 0) return null;
  return integer ? Math.round(value) : value;
}

function StatusBadge({ status }: { status: MetricStatus }) {
  const tone = toneMap[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[9px] font-bold ${tone.badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${tone.bar}`} />
      {tone.message}
    </span>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  status,
  iconTone = "bg-[#eef2e9] text-[#5c775e] border-[#dde6d8]",
}: {
  icon: typeof Flame;
  title: string;
  subtitle?: string;
  status?: MetricStatus;
  iconTone?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <span className={`flex h-8 w-8 items-center justify-center rounded-[10px] border ${iconTone}`}>
          <Icon size={15} strokeWidth={2.2} aria-hidden="true" />
        </span>
        <div>
          <h3 className="text-[13px] font-bold tracking-[-0.01em] text-[#30332a]">{title}</h3>
          {subtitle ? (
            <p className="mt-0.5 text-[10px] font-medium text-[#999488]">{subtitle}</p>
          ) : null}
        </div>
      </div>
      {status ? <StatusBadge status={status} /> : null}
    </div>
  );
}

function FieldShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[20px] border border-[#e8e1d4] bg-[#fffdf9] p-4">
      {children}
    </div>
  );
}

export function DayDrawer({
  date,
  data,
  today,
  latestWeight,
  latestWeightDate,
  onClose,
  onUpdateDay,
  onClearDay,
  onSaveDay,
  onImportWorkoutLog,
  onRemoveWorkoutLog,
}: {
  date: string;
  data: ChallengeData;
  today: string;
  latestWeight: number;
  latestWeightDate: string | null;
  onClose: () => void;
  onUpdateDay: (date: string, patch: Partial<DayEntry>) => void;
  onClearDay: (date: string) => void;
  onSaveDay: (date: string) => void;
  onImportWorkoutLog: (days: Record<string, WorkoutSet[]>) => void;
  onRemoveWorkoutLog: (date: string) => void;
}) {
  const entry = data.days[date];
  const targets = getTargetsForDate(data.challenge, date);
  const isFuture = date > today && !hasDayData(entry);
  const isToday = date === today;
  const dayNumber = getChallengeDayNumber(data.challenge, date);
  const status = getDayStatus(date, entry, data.challenge, today);
  const statusMeta = dayStatusMeta[status];
  const statuses = getMetricStatuses(entry, data.challenge, date);
  const locked = isFuture;
  const isWeekend = isWeekendKey(date);
  const workoutSets = entry?.workoutSets ?? [];
  const challengeEnd = getChallengeEndKey(data.challenge);

  const [caloriesText, setCaloriesText] = useState(
    entry?.calories == null ? "" : String(entry.calories),
  );
  const [proteinText, setProteinText] = useState(
    entry?.protein == null ? "" : String(entry.protein),
  );
  const [stepsText, setStepsText] = useState(
    entry?.steps == null ? "" : String(entry.steps),
  );
  const [weightText, setWeightText] = useState(
    entry?.weight == null ? "" : String(entry.weight),
  );
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previousActive = document.activeElement as HTMLElement | null;
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
      previousActive?.focus?.();
    };
  }, [onClose]);

  const updatePatch = (patch: Partial<DayEntry>) => {
    if (locked) return;
    onUpdateDay(date, patch);
  };

  const handleCalories = (value: string) => {
    setCaloriesText(value);
    updatePatch({ calories: parseDraftNumber(value) });
  };

  const handleProtein = (value: string) => {
    setProteinText(value);
    updatePatch({ protein: parseDraftNumber(value) });
  };

  const handleSteps = (value: string) => {
    setStepsText(value);
    updatePatch({ steps: parseDraftNumber(value, true) });
  };

  const handleWeight = (value: string) => {
    setWeightText(value);
    updatePatch({ weight: parseDraftNumber(value) });
  };

  const handleWorkout = (value: string) => {
    updatePatch({ workout: (value || null) as Workout | null });
  };

  const handleToggleSteps = () => {
    if (locked) return;
    updatePatch({ stepsCompleted: !entry?.stepsCompleted });
  };

  const handleClear = () => {
    if (locked || !hasDayData(entry)) return;
    const confirmed = window.confirm(
      `Clear all logged data for ${formatLongDate(date)}? This can't be undone.`,
    );
    if (!confirmed) return;
    onClearDay(date);
    setCaloriesText("");
    setProteinText("");
    setStepsText("");
    setWeightText("");
  };

  const calorieRemaining =
    entry?.calories == null ? null : targets.caloriesMax - entry.calories;
  const proteinRemaining =
    entry?.protein == null ? null : Math.max(0, targets.protein - entry.protein);
  const actualSteps = entry?.stepsCompleted ? targets.steps : entry?.steps;
  const stepsRemaining =
    actualSteps == null ? null : Math.max(0, targets.steps - actualSteps);

  const caloriePercent =
    entry?.calories == null
      ? 0
      : Math.min(100, Math.max(0, (entry.calories / targets.caloriesMax) * 100));
  const proteinPercent =
    entry?.protein == null
      ? 0
      : Math.min(100, Math.max(0, (entry.protein / targets.protein) * 100));
  const stepsPercent =
    actualSteps == null
      ? 0
      : Math.min(100, Math.max(0, (actualSteps / targets.steps) * 100));

  const formatRemaining = () => {
    if (entry?.calories == null) {
      return `Aim for ${targets.caloriesMin.toLocaleString()}–${targets.caloriesMax.toLocaleString()} kcal.`;
    }
    if ((calorieRemaining ?? 0) >= 0) {
      return `${Math.round(calorieRemaining ?? 0).toLocaleString()} kcal left before the top of your range.`;
    }
    return `${Math.abs(Math.round(calorieRemaining ?? 0)).toLocaleString()} kcal over your target range.`;
  };

  return (
    <>
      <div className="overlay-backdrop" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        className="drawer-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="day-drawer-title"
      >
        <header className="shrink-0 border-b border-[#e9e2d5] px-5 pb-4 pt-5 sm:px-6 sm:pt-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="eyebrow text-[#8d897c]">Day {dayNumber || "—"} of {data.challenge.duration}</span>
                {isToday ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#e9f2e4] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-[#5a795d]">
                    <span className="h-1 w-1 rounded-full bg-[#739b74]" />
                    Today
                  </span>
                ) : isFuture ? (
                  <span className="rounded-full bg-[#f1ede4] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-[#928e81]">
                    Ahead
                  </span>
                ) : (
                  <span className="rounded-full bg-[#f1ede4] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-[#928e81]">
                    Past
                  </span>
                )}
              </div>
              <h2
                id="day-drawer-title"
                className="mt-1.5 text-[25px] font-bold leading-tight tracking-[-0.045em] text-[#2c3027] sm:text-[28px]"
              >
                {formatLongDate(date)}
              </h2>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-bold ${statusMeta.classes}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${statusMeta.dot}`} />
                  {statusMeta.label}
                </span>
                <span className="chip !bg-[#f8f4ec] !text-[#8c887b]">
                  {isWeekend ? "Weekend targets" : "Weekday targets"}
                </span>
              </div>
            </div>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              className="icon-button shrink-0"
              aria-label="Close day log"
            >
              <X size={17} />
            </button>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="rounded-[13px] border border-[#eae3d6] bg-[#f9f5ed] px-2.5 py-2">
              <span className="flex items-center gap-1 text-[8px] font-bold uppercase tracking-[0.08em] text-[#a29d91]">
                <Flame size={9} /> Calories
              </span>
              <p className="mt-1 tabular text-[11px] font-bold text-[#5f6156]">
                {targets.caloriesMin.toLocaleString()}–{targets.caloriesMax.toLocaleString()}
              </p>
            </div>
            <div className="rounded-[13px] border border-[#eae3d6] bg-[#f9f5ed] px-2.5 py-2">
              <span className="flex items-center gap-1 text-[8px] font-bold uppercase tracking-[0.08em] text-[#a29d91]">
                <Dumbbell size={9} /> Protein
              </span>
              <p className="mt-1 tabular text-[11px] font-bold text-[#5f6156]">{targets.protein} g</p>
            </div>
            <div className="rounded-[13px] border border-[#eae3d6] bg-[#f9f5ed] px-2.5 py-2">
              <span className="flex items-center gap-1 text-[8px] font-bold uppercase tracking-[0.08em] text-[#a29d91]">
                <Footprints size={9} /> Steps
              </span>
              <p className="mt-1 tabular text-[11px] font-bold text-[#5f6156]">
                {targets.steps.toLocaleString()}
              </p>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
          {locked ? (
            <div className="flex h-full min-h-[330px] flex-col items-center justify-center rounded-[24px] border border-dashed border-[#ddd5c6] bg-[#f9f5ed] px-8 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full border border-[#e1d9ca] bg-[#fffdf8] text-[#8d9b85] shadow-sm">
                <LockKeyhole size={22} strokeWidth={1.8} />
              </span>
              <h3 className="mt-4 text-[17px] font-bold tracking-[-0.025em] text-[#41453a]">
                This day is still ahead
              </h3>
              <p className="mt-2 max-w-[280px] text-[12px] leading-relaxed text-[#928e82]">
                Future days stay grey and open on the day itself. No pressure to
                plan every meal in advance.
              </p>
              <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#e6dfd2] bg-[#fffdf8] px-3 py-1.5 text-[10px] font-semibold text-[#8a8679]">
                <CalendarDays size={11} />
                {formatShortDate(date)} · {targets.caloriesMin.toLocaleString()}–{targets.caloriesMax.toLocaleString()} kcal
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {!hasDayData(entry) ? (
                <div className="flex items-start gap-2.5 rounded-[16px] border border-[#dce7d5] bg-[#f1f7ec] px-3.5 py-3">
                  <Sparkles size={14} className="mt-0.5 shrink-0 text-[#769176]" />
                  <p className="text-[11px] leading-relaxed text-[#70806b]">
                    A fresh page. Log what you can — partial days still count, and
                    everything saves as you go.
                  </p>
                </div>
              ) : null}

              <FieldShell>
                <SectionHeader
                  icon={Flame}
                  title="Calories"
                  subtitle={`${isWeekend ? "Weekend" : "Weekday"} target ${targets.caloriesMin.toLocaleString()}–${targets.caloriesMax.toLocaleString()} kcal`}
                  status={statuses.calories}
                  iconTone={toneMap[statuses.calories].icon}
                />
                <div className="mt-3.5 flex items-stretch gap-2">
                  <div className="relative min-w-0 flex-1">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      inputMode="numeric"
                      value={caloriesText}
                      onChange={(event) => handleCalories(event.target.value)}
                      placeholder="0"
                      className="field !h-14 !text-[22px] !font-bold tabular !tracking-[-0.03em] pr-16"
                      aria-label="Total calories consumed"
                    />
                    <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-[#aaa498]">
                      kcal
                    </span>
                  </div>
                  <div className="flex w-[106px] shrink-0 flex-col justify-center rounded-[14px] border border-[#ebe4d7] bg-[#faf6ee] px-3">
                    <span className="text-[8px] font-bold uppercase tracking-[0.08em] text-[#aaa498]">
                      {entry?.calories == null ? "Your target" : (calorieRemaining ?? 0) >= 0 ? "Remaining" : "Over by"}
                    </span>
                    <span className={`mt-1 tabular text-[16px] font-bold leading-none ${toneMap[statuses.calories].text}`}>
                      {entry?.calories == null
                        ? `${targets.caloriesMax.toLocaleString()}`
                        : Math.abs(Math.round(calorieRemaining ?? 0)).toLocaleString()}
                    </span>
                    <span className="mt-1 text-[8px] font-medium text-[#a6a094]">
                      {entry?.calories == null ? "kcal max" : "kcal"}
                    </span>
                  </div>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#ece5d9]">
                  <div
                    className={`h-full rounded-full transition-[width] duration-300 ${toneMap[statuses.calories].bar}`}
                    style={{ width: `${caloriePercent}%` }}
                  />
                </div>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[10px] font-medium text-[#989387]">{formatRemaining()}</p>
                  {entry?.calories != null ? (
                    <span className={`text-[10px] font-bold ${toneMap[statuses.calories].text}`}>
                      {formatCalories(entry.calories)} logged
                    </span>
                  ) : null}
                </div>
              </FieldShell>

              <FieldShell>
                <SectionHeader
                  icon={Dumbbell}
                  title="Protein"
                  subtitle={`${targets.protein} g daily target`}
                  status={statuses.protein}
                  iconTone={toneMap[statuses.protein].icon}
                />
                <div className="mt-3.5 flex items-center gap-3">
                  <div className="relative min-w-0 flex-1">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      inputMode="numeric"
                      value={proteinText}
                      onChange={(event) => handleProtein(event.target.value)}
                      placeholder="0"
                      className="field !h-12 !text-[18px] !font-bold tabular pr-10"
                      aria-label="Protein in grams"
                    />
                    <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-[#aaa498]">
                      g
                    </span>
                  </div>
                  <span className={`shrink-0 text-[11px] font-semibold ${toneMap[statuses.protein].text}`}>
                    {entry?.protein == null
                      ? `0 / ${targets.protein} g`
                      : entry.protein >= targets.protein
                        ? `${Math.round(entry.protein)} g · target hit`
                        : `${Math.round(proteinRemaining ?? 0)} g to go`}
                  </span>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#ece5d9]">
                  <div
                    className={`h-full rounded-full transition-[width] duration-300 ${toneMap[statuses.protein].bar}`}
                    style={{ width: `${proteinPercent}%` }}
                  />
                </div>
                <div className="mt-2 flex items-center gap-1.5 text-[10px] font-medium text-[#9a9589]">
                  <Info size={10} aria-hidden="true" />
                  150 g or more is a win. 135–149 g is close enough to celebrate.
                </div>
              </FieldShell>

              <FieldShell>
                <SectionHeader
                  icon={Footprints}
                  title="Steps"
                  subtitle={`${targets.steps.toLocaleString()} steps daily`}
                  status={statuses.steps}
                  iconTone={toneMap[statuses.steps].icon}
                />
                <div className="mt-3.5 flex items-center gap-3">
                  <div className="relative min-w-0 flex-1">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      inputMode="numeric"
                      value={stepsText}
                      onChange={(event) => handleSteps(event.target.value)}
                      placeholder="Actual step count"
                      className="field !h-12 !text-[17px] !font-bold tabular pr-14"
                      aria-label="Step count"
                    />
                    <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-[#aaa498]">
                      steps
                    </span>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={Boolean(entry?.stepsCompleted)}
                    onClick={handleToggleSteps}
                    className="toggle-track shrink-0"
                    data-on={Boolean(entry?.stepsCompleted)}
                    aria-label="Mark 10,000 steps completed"
                  >
                    <span className="toggle-thumb" />
                  </button>
                </div>
                <div className="mt-2.5 flex items-center justify-between gap-3">
                  <span className={`text-[10px] font-semibold ${toneMap[statuses.steps].text}`}>
                    {entry?.stepsCompleted
                      ? "10k marked complete"
                      : entry?.steps == null
                        ? "Enter your count or flip the switch"
                        : entry.steps >= targets.steps
                          ? "Target reached by your step count"
                          : `${stepsRemaining?.toLocaleString()} steps to go`}
                  </span>
                  <span className="tabular text-[10px] font-bold text-[#9a9589]">
                    {Math.round(stepsPercent)}%
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#ece5d9]">
                  <div
                    className={`h-full rounded-full transition-[width] duration-300 ${toneMap[statuses.steps].bar}`}
                    style={{ width: `${stepsPercent}%` }}
                  />
                </div>
              </FieldShell>

              <FieldShell>
                <SectionHeader
                  icon={Dumbbell}
                  title="Workout"
                  subtitle={
                    workoutSets.length > 0
                      ? `${workoutSets.length} sets logged · ${entry?.workout ?? workoutSets[0]?.workout ?? "Session"}`
                      : "Upper / lower split · paste your set log"
                  }
                  iconTone="bg-[#fbf0eb] text-[#976c55] border-[#eeddd3]"
                />

                {workoutSets.length === 0 ? (
                  <>
                    <div className="relative mt-3">
                      <div className="pointer-events-none absolute left-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md bg-[#f5f0e7] text-[#7b7c6e]">
                        <WorkoutGlyph workout={(entry?.workout as Workout | null) ?? null} size={13} />
                      </div>
                      <select
                        value={entry?.workout ?? ""}
                        onChange={(event) => handleWorkout(event.target.value)}
                        className="field select-field !pl-11"
                        aria-label="Workout type"
                      >
                        <option value="">Choose workout</option>
                        {WORKOUT_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                    {entry?.workout ? (
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[9px] font-bold ${workoutDetails[entry.workout].tone}`}>
                          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: workoutDetails[entry.workout].dot }} />
                          {entry.workout}
                        </span>
                        <span className="text-[9px] font-medium text-[#a09b8f]">
                          {entry.workout.includes("Rest") ? "Recovery is training too" : "Nice work showing up"}
                        </span>
                      </div>
                    ) : null}
                  </>
                ) : null}

                <WorkoutLog
                  date={date}
                  sets={workoutSets}
                  startDate={data.challenge.startDate}
                  endDate={challengeEnd}
                  onImport={onImportWorkoutLog}
                  onRemove={() => onRemoveWorkoutLog(date)}
                />

                <input
                  type="text"
                  value={entry?.workoutNote ?? ""}
                  onChange={(event) => updatePatch({ workoutNote: event.target.value })}
                  placeholder="Session note (optional) — energy, focus, aches"
                  className="field mt-2.5 !h-11 !text-[13px]"
                  aria-label="Workout note"
                />
              </FieldShell>

              <FieldShell>
                <SectionHeader
                  icon={Scale}
                  title="Weight"
                  subtitle={isWeekend ? "Weekend weigh-in" : "A check-in is welcome any day"}
                  iconTone="bg-[#f1edf7] text-[#756887] border-[#e4ddec]"
                />
                <div className={`mt-3 flex items-start gap-2.5 rounded-[13px] border px-3 py-2.5 ${isWeekend ? "border-[#dce7d4] bg-[#f1f7ed]" : "border-[#ede6da] bg-[#faf7f0]"}`}>
                  <Scale size={13} className={`mt-0.5 shrink-0 ${isWeekend ? "text-[#6f8e6d]" : "text-[#a09b8f]"}`} />
                  <p className={`text-[10px] leading-relaxed ${isWeekend ? "text-[#6c8066]" : "text-[#938f83]"}`}>
                    {isWeekend
                      ? "It's the weekend — the perfect moment for your weekly check-in. Step on the scale at the same time of day."
                      : "We host the weekly weigh-in on weekends, but if today is when the scale calls, log it here."}
                  </p>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <div className="relative min-w-0 flex-1">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      value={weightText}
                      onChange={(event) => handleWeight(event.target.value)}
                      placeholder="0.00"
                      className="field !h-12 !text-[18px] !font-bold tabular pr-10"
                      aria-label="Weight in kilograms"
                    />
                    <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-[#aaa498]">
                      kg
                    </span>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="block text-[8px] font-bold uppercase tracking-[0.08em] text-[#a8a296]">
                      Latest logged
                    </span>
                    <span className="mt-0.5 block tabular text-[13px] font-bold text-[#5e6155]">
                      {formatWeight(latestWeight)} kg
                    </span>
                    <span className="text-[9px] font-medium text-[#a8a296]">
                      {latestWeightDate ? formatShortDate(latestWeightDate) : "Starting weight"}
                    </span>
                  </div>
                </div>
                <p className="mt-2 flex items-center gap-1.5 text-[10px] font-medium text-[#a39e91]">
                  <ChevronRight size={10} aria-hidden="true" />
                  Starting at {data.challenge.startingWeight.toFixed(2)} kg. Two logs create a trend.
                </p>
              </FieldShell>

              <FieldShell>
                <SectionHeader
                  icon={NotebookPen}
                  title="Notes"
                  subtitle="Energy, hunger, sleep, or a tiny win"
                  iconTone="bg-[#f0f1e8] text-[#72785f] border-[#e2e4d6]"
                />
                <textarea
                  value={entry?.notes ?? ""}
                  onChange={(event) => updatePatch({ notes: event.target.value })}
                  placeholder="How did today feel? What went well?"
                  rows={4}
                  maxLength={4000}
                  className="field mt-3 !min-h-[104px] !text-[13px]"
                  aria-label="Daily notes"
                />
              </FieldShell>

              <div className="flex flex-col gap-2 px-0.5 pb-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="flex items-center gap-1.5 text-[9px] font-medium text-[#a39e92]">
                  <Check size={10} className="text-[#7f9d7e]" />
                  Every change is saved to this browser automatically.
                </p>
                {hasDayData(entry) ? (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="btn-quiet self-start text-[#a07166] hover:bg-[#f9ebe6] hover:text-[#8d4e43]"
                  >
                    Clear day
                  </button>
                ) : null}
              </div>
            </div>
          )}
        </div>

        <footer className="shrink-0 border-t border-[#e8e1d5] bg-[#fcfaf5]/92 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:px-6">
          {locked ? (
            <button type="button" onClick={onClose} className="btn-secondary w-full">
              <Moon size={14} aria-hidden="true" />
              Back to the calendar
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="hidden items-center gap-1.5 text-[9px] font-semibold text-[#918d81] sm:flex">
                <span className="h-1.5 w-1.5 rounded-full bg-[#7d9d7d]" />
                Auto-saved
              </span>
              <button
                type="button"
                onClick={() => onSaveDay(date)}
                className="btn-primary flex-1 justify-center"
              >
                <Check size={15} aria-hidden="true" />
                Save day
                <ArrowRight size={14} className="ml-0.5" aria-hidden="true" />
              </button>
            </div>
          )}
        </footer>
      </div>
    </>
  );
}
