"use client";

import {
  ArrowUpRight,
  CalendarRange,
  Flame,
  Scale,
  Target,
  TimerReset,
} from "lucide-react";
import {
  ChallengeData,
  ChallengeStats,
  formatLongDate,
  getChallengeEndKey,
  getDayCompletionScore,
  getDayStatus,
  getMascotMood,
  getMotivationalMessage,
  hasDayData,
  isWeekendKey,
  parseDateKey,
} from "@/lib/challenge";
import { Mascot } from "./Mascot";

function HeroStat({
  icon: Icon,
  label,
  value,
  detail,
  accent = false,
}: {
  icon: typeof Flame;
  label: string;
  value: string;
  detail?: string;
  accent?: boolean;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] border ${
          accent
            ? "border-[#ecdfbd] bg-[#fbf2d8] text-[#a17d31]"
            : "border-[#e5e5d8] bg-[#f4f5ec] text-[#71806a]"
        }`}
      >
        <Icon size={14} strokeWidth={2.2} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <span className="block text-[9px] font-bold uppercase tracking-[0.1em] text-[#9a968a]">
          {label}
        </span>
        <span className="mt-0.5 flex items-baseline gap-1 whitespace-nowrap">
          <span className="tabular text-[14px] font-bold tracking-[-0.02em] text-[#34372e]">
            {value}
          </span>
          {detail ? (
            <span className="text-[9px] font-medium text-[#a29d91]">{detail}</span>
          ) : null}
        </span>
      </div>
    </div>
  );
}

export function Hero({
  data,
  stats,
  today,
  onOpenDay,
}: {
  data: ChallengeData;
  stats: ChallengeStats;
  today: string;
  onOpenDay: (date: string) => void;
}) {
  const challengeEnd = getChallengeEndKey(data.challenge);
  const isTodayInChallenge =
    today >= data.challenge.startDate && today <= challengeEnd;
  const focusDate = isTodayInChallenge
    ? today
    : stats.beforeStart
      ? data.challenge.startDate
      : challengeEnd;
  const focusEntry = data.days[focusDate];
  const mood = getMascotMood(stats, hasDayData(focusEntry));
  const quote = getMotivationalMessage(stats);
  const hasToday = isTodayInChallenge && hasDayData(focusEntry);
  const todayScore =
    isTodayInChallenge && hasToday
      ? Math.round(getDayCompletionScore(focusEntry, data.challenge, focusDate) * 100)
      : 0;
  const todayStatus = isTodayInChallenge
    ? getDayStatus(today, focusEntry, data.challenge, today)
    : "unlogged";

  const actionLabel = stats.beforeStart
    ? "Preview day one"
    : stats.finished
      ? "Review the finish"
      : hasToday
        ? "Edit today's log"
        : "Log today";

  const startLabel = parseDateKey(data.challenge.startDate)
    ? new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(parseDateKey(data.challenge.startDate) as Date)
    : data.challenge.startDate;
  const endLabel = parseDateKey(challengeEnd)
    ? new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(parseDateKey(challengeEnd) as Date)
    : challengeEnd;

  return (
    <div className="relative overflow-hidden border-b border-[#e9e2d5] bg-[#fcfaf4] px-5 pb-5 pt-5 sm:px-7 sm:pb-6 sm:pt-6 lg:px-8">
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 max-w-[760px]">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[10px] font-medium text-[#99958a]">
            <span className="inline-flex items-center gap-1.5 font-bold uppercase tracking-[0.12em] text-[#5b755b]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#7e9b7b]" />
              A personal fitness game
            </span>
            <span className="hidden h-1 w-1 rounded-full bg-[#d2cbbd] sm:block" />
            <span>
              {startLabel} — {endLabel}
            </span>
          </div>

          <h1 className="mt-2 text-[clamp(2.15rem,5vw,3.55rem)] font-bold leading-[0.98] tracking-[-0.06em] text-[#2a2d24]">
            {data.challenge.name}
            <span className="display-serif ml-1 font-normal text-[#75926f]">.</span>
          </h1>
          <p className="display-serif mt-2.5 max-w-[650px] text-[1.18rem] leading-snug text-[#6b6c60] sm:text-[1.32rem]">
            &ldquo;{quote}&rdquo;
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-3 md:gap-4">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.11em] text-[#8d9784]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#7e9b7b]" />
              {isTodayInChallenge
                ? `${isWeekendKey(today) ? "Weekend" : "Weekday"} · Today`
                : stats.beforeStart
                  ? "Starts soon"
                  : "Challenge complete"}
            </p>
            <p className="mt-1 text-[12px] font-semibold text-[#55594d]">
              {formatLongDate(isTodayInChallenge ? today : focusDate)}
            </p>
            <p className="mt-0.5 text-[10px] font-medium text-[#9b978b]">
              {hasToday
                ? `${todayScore}% of today's goals · ${todayStatus === "complete" ? "all done" : "keep going"}`
                : "A fresh page, ready when you are."}
            </p>
            <button
              type="button"
              onClick={() => onOpenDay(focusDate)}
              className="btn-primary mt-2.5 !min-h-[38px] !px-3.5 !py-2 !text-[11px]"
            >
              {actionLabel}
              <ArrowUpRight size={14} aria-hidden="true" />
            </button>
          </div>
          <Mascot
            mood={mood}
            className="h-[82px] w-[82px] shrink-0 sm:h-[92px] sm:w-[92px]"
          />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-x-5 gap-y-3 border-y border-[#ece5d9] py-3.5 sm:grid-cols-3 lg:grid-cols-5">
        <HeroStat
          icon={CalendarRange}
          label="Challenge day"
          value={`${stats.currentDay}`}
          detail={`/ ${data.challenge.duration}`}
        />
        <HeroStat
          icon={TimerReset}
          label="Days remaining"
          value={`${stats.daysRemaining}`}
          detail={stats.daysRemaining === 1 ? "day" : "days"}
        />
        <HeroStat
          icon={Flame}
          label="Current streak"
          value={`${stats.currentStreak}`}
          detail={stats.currentStreak === 1 ? "day" : "days"}
          accent={stats.currentStreak > 0}
        />
        <HeroStat
          icon={Target}
          label="Completion"
          value={`${stats.completionPercent}%`}
          detail="goals hit"
        />
        <HeroStat
          icon={Scale}
          label={stats.latestWeightDate ? "Latest weight" : "Starting weight"}
          value={stats.latestWeight.toFixed(2)}
          detail="kg"
        />
      </div>

      <div className="mt-3.5">
        <div className="flex items-center justify-between gap-4 text-[9px] font-medium text-[#a09b90]">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#789a78]" />
            {Math.round(stats.journeyPercent)}% of the journey
          </span>
          <span>{stats.daysRemaining} days to go</span>
        </div>
        <div className="relative mt-1.5 h-2 overflow-hidden rounded-full border border-[#e4ddcf] bg-[#f1ece1]">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-[#3d6045] transition-[width] duration-700"
            style={{ width: `${Math.max(stats.journeyPercent, 0.8)}%` }}
          />
          <div className="absolute inset-0 flex justify-between px-2 py-[3px] opacity-35">
            {Array.from({ length: 12 }, (_, index) => (
              <span key={index} className="w-px rounded-full bg-[#fffdf8]" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
