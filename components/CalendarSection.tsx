"use client";

import { useState } from "react";
import {
  CalendarCheck2,
  ChevronDown,
  Dumbbell,
  Flame,
  Footprints,
  Scale,
  Sparkles,
  Target,
  TrendingDown,
} from "lucide-react";
import {
  ChallengeData,
  DayEntry,
  DayStatus,
  MetricStatus,
  WeeklySummary,
  formatDayOfWeek,
  formatLongDate,
  formatWeekRange,
  formatWeight,
  formatWeightDifference,
  getChallengeDayNumber,
  getDayStatus,
  getMetricStatuses,
  getWeekForDate,
  getWeeklyLoggingBest,
  hasDayData,
  isWeekendKey,
} from "@/lib/challenge";
import {
  WorkoutGlyph,
  WeightDelta,
  metricIcons,
  workoutDetails,
  statusLabel,
} from "./shared";

const statusLabelMap: Record<DayStatus, string> = {
  complete: "All goals hit",
  partial: "In progress",
  off: "Off target",
  unlogged: "Not logged",
  future: "Upcoming",
};

const dayStatusClass: Record<DayStatus, string> = {
  complete: "day-complete",
  partial: "day-partial",
  off: "day-off",
  unlogged: "day-unlogged",
  future: "day-future",
};

function statusTextClass(status: DayStatus) {
  if (status === "complete") return "text-[#457050]";
  if (status === "partial") return "text-[#8e711f]";
  if (status === "off") return "text-[#9c5a4d]";
  if (status === "future") return "text-[#b3afa3]";
  return "text-[#949085]";
}

function MetricPip({
  metric,
  status,
  compact = false,
}: {
  metric: "calories" | "protein" | "steps";
  status: MetricStatus;
  compact?: boolean;
}) {
  const Icon = metricIcons[metric];
  const label =
    metric === "calories"
      ? "Calories"
      : metric === "protein"
        ? "Protein"
        : "Steps";

  if (compact) {
    return (
      <span
        role="img"
        aria-label={`${label}: ${statusLabel(status)}`}
        title={`${label}: ${statusLabel(status)}`}
        className={`h-[5px] w-[5px] rounded-full ${
          status === "green"
            ? "bg-[#6f9975]"
            : status === "yellow"
              ? "bg-[#d1ad50]"
              : status === "red"
                ? "bg-[#c67f72]"
                : "bg-[#d5cfc2]"
        }`}
      />
    );
  }

  return (
    <span
      role="img"
      aria-label={`${label}: ${statusLabel(status)}`}
      title={`${label}: ${statusLabel(status)}`}
      className={`metric-pip metric-pip-${status} !h-[18px] !w-[18px] !rounded-[6px]`}
    >
      <Icon size={10} strokeWidth={2.4} aria-hidden="true" />
    </span>
  );
}

function DayCell({
  date,
  entry,
  data,
  today,
  onOpenDay,
}: {
  date: string;
  entry: DayEntry | undefined;
  data: ChallengeData;
  today: string;
  onOpenDay: (date: string) => void;
}) {
  const status = getDayStatus(date, entry, data.challenge, today);
  const hasData = hasDayData(entry);
  const isToday = date === today;
  const statuses = getMetricStatuses(entry, data.challenge, date);
  const dayNumber = getChallengeDayNumber(data.challenge, date);
  const logged = hasData;
  const setCount = entry?.workoutSets?.length ?? 0;
  const aria = `${formatLongDate(date)}, challenge day ${dayNumber}. ${statusLabelMap[status]}${
    logged ? ", logged" : ""
  }${entry?.workout ? `, ${entry.workout}` : ""}${
    setCount > 0 ? `, ${setCount} sets` : ""
  }`;

  return (
    <button
      type="button"
      onClick={() => onOpenDay(date)}
      aria-current={isToday ? "date" : undefined}
      aria-label={aria}
      title={aria}
      className={`day-cell ${dayStatusClass[status]} group flex flex-col ${
        isToday ? "today-ring" : ""
      }`}
    >
      <div className="flex w-full items-start justify-between gap-1">
        <span
          className={`text-[7px] font-extrabold uppercase tracking-[0.08em] sm:text-[8px] sm:tracking-[0.12em] lg:text-[9px] ${
            isToday ? "text-[#4f7254]" : statusTextClass(status)
          }`}
        >
          {formatDayOfWeek(date)}
        </span>
        {logged ? (
          <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white/65 text-[#5c7d5e]">
            <CalendarCheck2 size={9} strokeWidth={2.5} aria-hidden="true" />
          </span>
        ) : isToday ? (
          <span className="h-1.5 w-1.5 rounded-full bg-[#57785b]" aria-hidden="true" />
        ) : (
          <span className="hidden h-1.5 w-1.5 rounded-full bg-current opacity-10 sm:block" aria-hidden="true" />
        )}
      </div>

      <div className="mt-1 flex w-full items-baseline justify-between gap-1 lg:mt-1.5">
        <span
          className={`tabular text-[20px] font-bold leading-none tracking-[-0.055em] sm:text-[22px] lg:text-[26px] ${
            status === "future" ? "text-[#aaa69b]" : "text-[#30332a]"
          }`}
        >
          {Number(date.slice(8, 10))}
        </span>
        {isWeekendKey(date) ? (
          <span className="hidden text-[8px] font-bold uppercase tracking-[0.08em] text-[#b3a58d] sm:block">
            Wknd
          </span>
        ) : null}
      </div>

      <div className="mt-auto w-full pt-1.5 lg:pt-2">
        <div className="flex items-center gap-[2px] sm:gap-[3px] lg:gap-1">
          <div className="hidden items-center gap-1 lg:flex">
            <MetricPip metric="calories" status={statuses.calories} />
            <MetricPip metric="protein" status={statuses.protein} />
            <MetricPip metric="steps" status={statuses.steps} />
          </div>
          <div className="flex items-center gap-0.5 sm:gap-1 lg:hidden">
            <MetricPip metric="calories" status={statuses.calories} compact />
            <MetricPip metric="protein" status={statuses.protein} compact />
            <MetricPip metric="steps" status={statuses.steps} compact />
          </div>
        </div>

        <div className="mt-1.5 flex min-h-[14px] w-full items-center">
          {entry?.workout ? (
            <span
              className={`inline-flex max-w-full items-center gap-1 truncate rounded px-1 py-0.5 text-[8px] font-bold leading-tight lg:rounded-md lg:px-1.5 lg:text-[9px] ${workoutDetails[entry.workout].tone}`}
              title={setCount > 0 ? `${entry.workout} · ${setCount} sets` : entry.workout}
            >
              <WorkoutGlyph workout={entry.workout} size={9} />
              <span className="hidden truncate lg:inline">
                {workoutDetails[entry.workout].short}
              </span>
              {setCount > 0 ? (
                <span className="hidden tabular lg:inline">· {setCount}</span>
              ) : null}
            </span>
          ) : setCount > 0 ? (
            <span
              className="inline-flex max-w-full items-center gap-1 truncate rounded bg-[#f1ede4] px-1 py-0.5 text-[8px] font-bold leading-tight text-[#8c887b] lg:rounded-md lg:px-1.5 lg:text-[9px]"
              title={`${setCount} sets logged`}
            >
              <Dumbbell size={9} aria-hidden="true" />
              <span className="hidden tabular lg:inline">{setCount} sets</span>
            </span>
          ) : (
            <span className="hidden text-[8px] font-medium text-[#b8b3a7] lg:block">
              {status === "future" ? "Ahead" : "Tap to log"}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

function WeekMeta({
  summary,
  isCurrent,
  expanded,
  onToggle,
  mobile = false,
}: {
  summary: WeeklySummary;
  isCurrent: boolean;
  expanded: boolean;
  onToggle: () => void;
  mobile?: boolean;
}) {
  if (mobile) {
    return (
      <div className="flex items-center justify-between gap-3 px-0.5 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold tracking-[-0.01em] text-[#30332a]">
            Week {summary.week.number}
          </span>
          <span className="text-[10px] font-medium text-[#a29d91]">
            {formatWeekRange(summary.week)}
          </span>
          {isCurrent ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#e8f1e2] px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.08em] text-[#5a795d]">
              <span className="h-1 w-1 rounded-full bg-[#719a73]" />
              Now
            </span>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          aria-label={`${expanded ? "Collapse" : "Expand"} week ${summary.week.number} details`}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-[#e6dfd2] bg-[#fbf8f1] text-[#8d897c] transition hover:bg-[#f1ebe0]"
        >
          <ChevronDown
            size={13}
            className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
          />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex h-full flex-col justify-between rounded-[14px] border border-transparent px-1 py-1 text-left transition hover:border-[#e5ded0] hover:bg-[#f7f2e8]/60"
      aria-expanded={expanded}
      aria-label={`${expanded ? "Collapse" : "Expand"} week ${summary.week.number} details`}
    >
      <div>
        <div className="flex items-center gap-1.5">
          <span className="week-meta-label text-[10px] font-bold uppercase tracking-[0.1em] text-[#8c887b]">
            Week {summary.week.number}
          </span>
          {isCurrent ? <span className="h-1.5 w-1.5 rounded-full bg-[#7d9d7f]" /> : null}
        </div>
        <span className="mt-1 block text-[9px] font-medium leading-tight text-[#a7a296]">
          {formatWeekRange(summary.week)}
        </span>
      </div>
      <ChevronDown
        size={13}
        className={`mt-2 text-[#aaa69b] transition-transform duration-200 ${
          expanded ? "rotate-180" : ""
        }`}
      />
    </button>
  );
}

function WeeklySummaryPanel({
  summary,
  expanded,
  onToggle,
  mobile = false,
}: {
  summary: WeeklySummary;
  expanded: boolean;
  onToggle: () => void;
  mobile?: boolean;
}) {
  const weightValue =
    summary.weightAverage == null ? "—" : formatWeight(summary.weightAverage);
  const caloriesValue =
    summary.caloriesAverage == null
      ? "—"
      : `${summary.caloriesAverage.toLocaleString()} kcal`;
  const completionValue =
    summary.completion == null ? "—" : `${summary.completion}%`;

  if (mobile) {
    return (
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="mt-2.5 flex w-full items-center justify-between gap-2 rounded-[13px] border border-[#e9e2d5] bg-[#fbf8f1]/75 px-3 py-2.5 text-left transition hover:bg-[#f7f2e7]"
      >
        <div className="min-w-0">
          <span className="block text-[8px] font-extrabold uppercase tracking-[0.1em] text-[#aaa599]">
            Week avg
          </span>
          <span className="mt-0.5 flex items-center gap-1.5">
            <span className={`tabular text-[13px] font-bold ${summary.weightAverage == null ? "text-[#a6a195]" : "text-[#31342b]"}`}>
              {weightValue}
              {summary.weightAverage != null ? (
                <span className="ml-0.5 text-[9px] font-medium text-[#999589]">kg</span>
              ) : null}
            </span>
            <WeightDelta
              value={summary.weightDifference}
              label={summary.weightCount === 0 ? "Not logged" : "No prior avg"}
            />
          </span>
        </div>
        <div className="min-w-0">
          <span className="block text-[8px] font-extrabold uppercase tracking-[0.1em] text-[#aaa599]">
            Avg calories
          </span>
          <span className="mt-0.5 block tabular text-[11px] font-bold text-[#5e6155]">
            {caloriesValue}
          </span>
        </div>
        <div className="min-w-0 text-right">
          <span className="block text-[8px] font-extrabold uppercase tracking-[0.1em] text-[#aaa599]">
            Complete
          </span>
          <span className="mt-0.5 block tabular text-[11px] font-bold text-[#5e6155]">
            {completionValue}
          </span>
        </div>
        <ChevronDown
          size={13}
          className={`shrink-0 text-[#aaa69b] transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
        />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={expanded}
      className="group/summary flex h-full flex-col justify-between rounded-[15px] border border-[#ebe4d7] bg-[#fbf8f1]/72 px-3 py-2.5 text-left transition hover:border-[#d8d0c0] hover:bg-[#f7f2e7]"
    >
      <div className="flex w-full items-start justify-between gap-1">
        <div>
          <span className="block text-[8px] font-extrabold uppercase tracking-[0.1em] text-[#a7a296]">
            Weight avg
          </span>
          <span className={`mt-0.5 flex items-baseline gap-1 tabular text-[18px] font-bold leading-none tracking-[-0.04em] ${summary.weightAverage == null ? "text-[#aaa69b]" : "text-[#30332a]"}`}>
            {weightValue}
            {summary.weightAverage != null ? (
              <span className="text-[9px] font-medium tracking-normal text-[#979387]">kg</span>
            ) : null}
          </span>
          <span className="mt-1 block">
            <WeightDelta
              value={summary.weightDifference}
              label={summary.weightCount === 0 ? "Not logged" : "First week"}
            />
          </span>
        </div>
        <ChevronDown
          size={12}
          className={`mt-0.5 shrink-0 text-[#aaa69b] transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
        />
      </div>
      <div className="mt-1.5 flex w-full items-center justify-between gap-2 border-t border-[#eee8dc] pt-1.5">
        <span className="inline-flex min-w-0 items-center gap-1 text-[9px] font-semibold text-[#898579]">
          <Flame size={9} className="shrink-0 text-[#b18d5d]" aria-hidden="true" />
          <span className="truncate">{caloriesValue}</span>
        </span>
        <span className="inline-flex shrink-0 items-center gap-1 text-[9px] font-bold text-[#707367]">
          <Target size={9} className="text-[#879b7d]" aria-hidden="true" />
          {completionValue}
        </span>
      </div>
    </button>
  );
}

function WeekDetail({ summary, data }: { summary: WeeklySummary; data: ChallengeData }) {
  const targets = data.challenge.targets;
  const loggedElapsed = summary.elapsedDays;
  const weightSub =
    summary.weightCount > 0
      ? `${summary.weightCount} weigh-in${summary.weightCount === 1 ? "" : "s"}`
      : "No weigh-in";

  const items = [
    {
      icon: Scale,
      label: "Weight avg",
      value:
        summary.weightAverage == null
          ? "—"
          : `${formatWeight(summary.weightAverage)} kg`,
      sub: weightSub,
      accent: "text-[#5e6155]",
    },
    {
      icon: TrendingDown,
      label: "Weight change",
      value: formatWeightDifference(summary.weightDifference),
      sub:
        summary.weightDifference == null
          ? "Need last week's average"
          : "vs. previous week",
      accent:
        summary.weightDifference == null
          ? "text-[#aaa69b]"
          : summary.weightDifference <= 0
            ? "text-[#4a7555]"
            : "text-[#9d5b4f]",
    },
    {
      icon: Flame,
      label: "Calories avg",
      value: summary.caloriesAverage == null ? "—" : summary.caloriesAverage.toLocaleString(),
      sub: "kcal on logged days",
      accent: "text-[#8d5d4d]",
    },
    {
      icon: Dumbbell,
      label: "Protein avg",
      value: summary.proteinAverage == null ? "—" : `${summary.proteinAverage} g`,
      sub: `${targets.protein} g target`,
      accent: "text-[#6e6285]",
    },
    {
      icon: Footprints,
      label: "10k-step days",
      value: `${summary.stepsGoalDays} / ${summary.week.challengeDates.length}`,
      sub:
        summary.actualSteps > 0
          ? `${summary.actualSteps.toLocaleString()} steps walked`
          : "No steps logged",
      accent: "text-[#53747a]",
    },
    {
      icon: Dumbbell,
      label: "Gym sessions",
      value: `${summary.gymSessions} / ${targets.gymSessionsPerWeek}`,
      sub: summary.gymSessions >= targets.gymSessionsPerWeek ? "Weekly goal hit" : "Upper / lower split",
      accent: "text-[#506e5a]",
    },
    {
      icon: Target,
      label: "Completion",
      value: summary.completion == null ? "—" : `${summary.completion}%`,
      sub: "Daily goals on logged days",
      accent: "text-[#627457]",
    },
    {
      icon: CalendarCheck2,
      label: "Consistency",
      value: summary.consistency == null ? "—" : `${summary.consistency}%`,
      sub: `${summary.loggedDays} of ${loggedElapsed} elapsed days logged`,
      accent: "text-[#6e6a56]",
    },
  ];

  return (
    <div className="week-detail border-t border-[#ebe4d7] bg-[#f8f5ed] px-3 py-4 sm:px-4 sm:py-5 lg:mx-2 lg:my-1 lg:rounded-b-[18px] lg:border lg:border-[#ebe4d7] lg:px-4">
      <div className="mb-3 flex items-center justify-between gap-3 px-1">
        <div>
          <p className="eyebrow text-[#8c877a]">Week {summary.week.number} · in review</p>
          <p className="mt-1 text-[11px] font-medium text-[#9a9589]">
            {summary.loggedDays} day{summary.loggedDays === 1 ? "" : "s"} logged
            {summary.completion != null ? ` · ${summary.completion}% goal completion` : ""}
          </p>
        </div>
        <span className="hidden items-center gap-1.5 rounded-full border border-[#e1dacd] bg-[#fdfbf6] px-2.5 py-1 text-[9px] font-semibold text-[#8c877a] sm:inline-flex">
          <Sparkles size={10} aria-hidden="true" />
          Small steps, stacked
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="inset-card bg-[#fffdf8] px-3 py-2.5">
              <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.08em] text-[#a19b8e]">
                <Icon size={11} strokeWidth={2.2} aria-hidden="true" />
                {item.label}
              </span>
              <span className={`mt-1.5 block tabular text-[15px] font-bold tracking-[-0.025em] ${item.accent}`}>
                {item.value}
              </span>
              <span className="mt-0.5 block truncate text-[9px] font-medium text-[#a9a397]">
                {item.sub}
              </span>
            </div>
          );
        })}
      </div>
      {summary.consistency != null ? (
        <div className="mt-3 flex items-center gap-3 px-1">
          <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#a29c90]">
            Logging consistency
          </span>
          <span className="progress-track h-1.5 flex-1">
            <span
              className="progress-fill block bg-[#91a78b]"
              style={{ width: `${summary.consistency}%` }}
            />
          </span>
          <span className="tabular text-[9px] font-bold text-[#777a6d]">
            {summary.consistency}%
          </span>
        </div>
      ) : null}
    </div>
  );
}

function Legend() {
  const items = [
    { color: "bg-[#75a079]", label: "On track" },
    { color: "bg-[#d5b150]", label: "Slightly off" },
    { color: "bg-[#c98275]", label: "Off target" },
    { color: "bg-[#d8d2c5]", label: "Not logged / ahead" },
  ];
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      {items.map((item) => (
        <span key={item.label} className="inline-flex items-center gap-1.5 text-[10px] font-medium text-[#969184]">
          <span className={`h-1.5 w-1.5 rounded-full ${item.color}`} />
          {item.label}
        </span>
      ))}
    </div>
  );
}

export function CalendarSection({
  data,
  summaries,
  today,
  onOpenDay,
}: {
  data: ChallengeData;
  summaries: WeeklySummary[];
  today: string;
  onOpenDay: (date: string) => void;
}) {
  const [expandedWeek, setExpandedWeek] = useState<number | null>(null);
  const currentWeek = getWeekForDate(data.challenge, today);
  const bestLogging = getWeeklyLoggingBest(data.challenge, data.days, today);

  const toggleWeek = (weekNumber: number) => {
    setExpandedWeek((current) => (current === weekNumber ? null : weekNumber));
  };

  return (
    <section id="calendar" className="scroll-mt-24 px-3 pb-2 pt-3 sm:px-5 sm:pb-3">
      <div className="flex flex-col gap-2 px-1 pb-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
          <h2 className="inline-flex items-center gap-1.5 text-[12px] font-bold tracking-[-0.01em] text-[#3b3e34]">
            <CalendarCheck2 size={13} className="text-[#759079]" aria-hidden="true" />
            The 90 days
          </h2>
          <p className="text-[10px] font-medium text-[#a29d91]">
            Monday–Sunday · tap any day to log
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e5ded0] bg-[#f7f3ea] px-2.5 py-1 text-[9px] font-bold text-[#717469]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#7f9d81]" />
            Week {currentWeek?.number ?? 1} of {summaries.length}
          </span>
          {bestLogging > 0 ? (
            <span className="hidden items-center rounded-full border border-[#e5ded0] bg-[#f7f3ea] px-2.5 py-1 text-[9px] font-bold text-[#8d897c] sm:inline-flex">
              Best {bestLogging}%
            </span>
          ) : null}
        </div>
      </div>

      <div>
        {/* Desktop calendar */}
        <div className="hidden px-3 pb-2 pt-1 lg:block">
          <div className="grid grid-cols-[84px_repeat(7,minmax(0,1fr))_206px] items-center gap-2 px-1 py-2">
            <span className="text-[9px] font-extrabold uppercase tracking-[0.1em] text-[#aaa599]">
              Week
            </span>
            {Array.from({ length: 7 }, (_, index) => {
              const firstWeek = summaries[0]?.week;
              const day = firstWeek?.allDates[index];
              return (
                <span
                  key={index}
                  className="text-center text-[9px] font-extrabold uppercase tracking-[0.11em] text-[#aaa599]"
                >
                  {day ? formatDayOfWeek(day) : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][index]}
                </span>
              );
            })}
            <span className="pl-1 text-left text-[9px] font-extrabold uppercase tracking-[0.1em] text-[#aaa599]">
              Week recap
            </span>
          </div>

          <div>
            {summaries.map((summary) => {
              const expanded = expandedWeek === summary.week.number;
              const isCurrent =
                currentWeek?.number === summary.week.number &&
                summary.week.challengeDates.includes(today);
              return (
                <div key={summary.week.number} className="week-row border-t border-[#f0eadf] first:border-t-0">
                  <div className="grid grid-cols-[84px_repeat(7,minmax(0,1fr))_206px] gap-2 py-1.5">
                    <WeekMeta
                      summary={summary}
                      isCurrent={isCurrent}
                      expanded={expanded}
                      onToggle={() => toggleWeek(summary.week.number)}
                    />
                    {summary.week.allDates.map((date) => {
                      const inChallenge = summary.week.challengeDates.includes(date);
                      return inChallenge ? (
                        <DayCell
                          key={date}
                          date={date}
                          entry={data.days[date]}
                          data={data}
                          today={today}
                          onOpenDay={onOpenDay}
                        />
                      ) : (
                        <div
                          key={date}
                          className="min-h-[116px] rounded-[16px] border border-dashed border-[#ece6da] bg-[#f8f5ed]/45"
                          aria-hidden="true"
                        />
                      );
                    })}
                    <WeeklySummaryPanel
                      summary={summary}
                      expanded={expanded}
                      onToggle={() => toggleWeek(summary.week.number)}
                    />
                  </div>
                  {expanded ? <WeekDetail summary={summary} data={data} /> : null}
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile / tablet calendar */}
        <div className="px-1.5 pb-1 pt-2 sm:px-2.5 lg:hidden">
          {summaries.map((summary) => {
            const expanded = expandedWeek === summary.week.number;
            const isCurrent =
              currentWeek?.number === summary.week.number &&
              summary.week.challengeDates.includes(today);
            return (
              <div key={summary.week.number} className="border-b border-[#eee8dc] py-3 last:border-b-0">
                <WeekMeta
                  summary={summary}
                  isCurrent={isCurrent}
                  expanded={expanded}
                  onToggle={() => toggleWeek(summary.week.number)}
                  mobile
                />
                <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                  {summary.week.allDates.map((date) => {
                    const inChallenge = summary.week.challengeDates.includes(date);
                    return inChallenge ? (
                      <DayCell
                        key={date}
                        date={date}
                        entry={data.days[date]}
                        data={data}
                        today={today}
                        onOpenDay={onOpenDay}
                      />
                    ) : (
                      <div
                        key={date}
                        className="min-h-[88px] rounded-[14px] border border-dashed border-[#ece6da] bg-[#f8f5ed]/45"
                        aria-hidden="true"
                      />
                    );
                  })}
                </div>
                <WeeklySummaryPanel
                  summary={summary}
                  expanded={expanded}
                  onToggle={() => toggleWeek(summary.week.number)}
                  mobile
                />
                {expanded ? <WeekDetail summary={summary} data={data} /> : null}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t border-[#eee7db] px-1 pb-2 pt-3 sm:flex-row sm:items-center sm:justify-between">
        <Legend />
        <p className="flex items-center gap-1.5 text-[9px] font-medium text-[#a09b8f]">
          <Sparkles size={10} aria-hidden="true" />
          Missing data stays neutral. One missed checkbox never ruins a day.
        </p>
      </div>
    </section>
  );
}
