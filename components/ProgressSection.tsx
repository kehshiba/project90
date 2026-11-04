"use client";

import { useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarCheck2,
  ChartNoAxesColumnIncreasing,
  CircleDashed,
  Dumbbell,
  Flag,
  Flame,
  Footprints,
  Info,
  Minus,
  Scale,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  ChallengeData,
  ChallengeStats,
  WeeklySummary,
  formatShortDate,
  formatWeight,
  getChallengeDates,
  getDayStatus,
  getTrendFromWeeklySummaries,
  getWeeks,
} from "@/lib/challenge";
import { SectionHeading, WeightDelta } from "./shared";

function TrendBadge({
  direction,
  difference,
}: {
  direction: "down" | "up" | "stable" | "unknown";
  difference?: number | null;
}) {
  if (direction === "unknown") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e5dfd2] bg-[#f7f3ea] px-2.5 py-1 text-[9px] font-bold text-[#918d81]">
        <CircleDashed size={10} aria-hidden="true" />
        Awaiting weigh-ins
      </span>
    );
  }
  const down = direction === "down";
  const stable = direction === "stable";
  const Icon = stable ? Minus : down ? ArrowDownRight : ArrowUpRight;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-bold ${
        stable
          ? "border-[#e5dfd2] bg-[#f7f3ea] text-[#858277]"
          : down
            ? "border-[#cee2cc] bg-[#ebf4e8] text-[#4b7455]"
            : "border-[#eed4cd] bg-[#faeae5] text-[#9b5d50]"
      }`}
    >
      <Icon size={10} aria-hidden="true" />
      {stable ? "Holding steady" : down ? "Trending down" : "Trending up"}
      {difference != null ? (
        <span className="tabular opacity-70">{Math.abs(difference).toFixed(2)} kg</span>
      ) : null}
    </span>
  );
}

function WeightChart({
  data,
  summaries,
  stats,
}: {
  data: ChallengeData;
  summaries: WeeklySummary[];
  stats: ChallengeStats;
}) {
  const [activeWeek, setActiveWeek] = useState<number | null>(null);
  const weights = summaries.filter(
    (summary): summary is WeeklySummary & { weightAverage: number } =>
      summary.weightAverage != null,
  );
  const trend = getTrendFromWeeklySummaries(summaries);
  const totalWeeks = Math.max(summaries.length, 1);
  const chartWidth = 760;
  const chartHeight = 286;
  const pad = { top: 28, right: 30, bottom: 38, left: 48 };
  const innerWidth = chartWidth - pad.left - pad.right;
  const innerHeight = chartHeight - pad.top - pad.bottom;

  const values = [
    ...weights.map((summary) => summary.weightAverage),
    data.challenge.startingWeight,
  ];
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const spread = Math.max(0.6, maxValue - minValue);
  const domainMin = Math.floor((minValue - spread * 0.25) * 10) / 10;
  const domainMax = Math.ceil((maxValue + spread * 0.25) * 10) / 10;

  const xFor = (weekNumber: number) =>
    pad.left + ((weekNumber - 1) / Math.max(1, totalWeeks - 1)) * innerWidth;
  const yFor = (value: number) =>
    pad.top +
    ((domainMax - value) / Math.max(0.001, domainMax - domainMin)) * innerHeight;

  const points = weights.map((summary) => ({
    summary,
    x: xFor(summary.week.number),
    y: yFor(summary.weightAverage),
  }));

  const linePath = points
    .map((point, index) => {
      if (index === 0) return `M ${point.x} ${point.y}`;
      const previous = points[index - 1];
      const midX = (previous.x + point.x) / 2;
      return `C ${midX} ${previous.y} ${midX} ${point.y} ${point.x} ${point.y}`;
    })
    .join(" ");

  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1].x} ${pad.top + innerHeight} L ${points[0].x} ${pad.top + innerHeight} Z`
      : "";

  const yTicks = Array.from({ length: 4 }, (_, index) => {
    const value = domainMax - (index / 3) * (domainMax - domainMin);
    return { value, y: yFor(value) };
  });

  const active = activeWeek == null ? null : points.find(
    (point) => point.summary.week.number === activeWeek,
  );

  const latestWeighInWeek = weights.at(-1);
  const previousWeighInWeek = weights.at(-2);
  const latestDiff =
    latestWeighInWeek && previousWeighInWeek
      ? latestWeighInWeek.weightAverage - previousWeighInWeek.weightAverage
      : null;

  return (
    <div className="paper-card flex min-h-[440px] flex-col overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-[#eae3d7] px-5 pb-4 pt-5 sm:flex-row sm:items-start sm:justify-between sm:px-6 sm:pb-5">
        <div>
          <p className="section-kicker mb-2">
            <Scale size={12} aria-hidden="true" />
            Weight trend
          </p>
          <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
            <p className="flex items-baseline gap-1.5 tabular text-[32px] font-bold leading-none tracking-[-0.05em] text-[#2d3128]">
              {formatWeight(stats.latestWeight)}
              <span className="text-[12px] font-semibold tracking-normal text-[#9b978b]">kg</span>
            </p>
            <span className="pb-0.5 text-[10px] font-medium text-[#969185]">
              {stats.latestWeightDate ? `logged ${formatShortDate(stats.latestWeightDate)}` : "starting weight"}
            </span>
          </div>
          <div className="mt-2">
            <TrendBadge direction={trend.direction} difference={trend.difference} />
          </div>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#a6a094]">Weekly weigh-ins</p>
          <p className="mt-1.5 text-[12px] font-semibold text-[#686b5e]">
            {weights.length === 0
              ? "No check-ins yet"
              : latestWeighInWeek
                ? `Week ${latestWeighInWeek.week.number} average`
                : ""}
          </p>
          {latestDiff != null ? (
            <div className="mt-1.5 flex sm:justify-end">
              <WeightDelta value={latestDiff} />
            </div>
          ) : (
            <p className="mt-1 max-w-[170px] text-[9px] leading-relaxed text-[#a49f93] sm:ml-auto">
              Two weekly averages reveal a real trend.
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col px-2 pb-4 pt-3 sm:px-4">
        <div className="hide-scrollbar relative overflow-x-auto">
          <div
            className="relative mx-auto"
            style={{ minWidth: "590px", width: "100%", maxWidth: "780px" }}
          >
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="weight-chart h-auto w-full overflow-visible"
              role="img"
              aria-label="Chart of average weight by challenge week"
            >
              {yTicks.map((tick, index) => (
                <g key={index}>
                  <line
                    x1={pad.left}
                    y1={tick.y}
                    x2={chartWidth - pad.right}
                    y2={tick.y}
                    stroke="#e9e2d6"
                    strokeWidth="1"
                    strokeDasharray={index === yTicks.length - 1 ? "0" : "3 5"}
                  />
                  <text
                    x={pad.left - 11}
                    y={tick.y + 3}
                    textAnchor="end"
                    fontSize="9.5"
                    fill="#aaa498"
                    fontFamily="var(--font-sans)"
                    fontWeight="500"
                  >
                    {tick.value.toFixed(1)}
                  </text>
                </g>
              ))}

              {/* Start baseline: real starting data, never a fabricated weigh-in. */}
              <line
                x1={pad.left}
                y1={yFor(data.challenge.startingWeight)}
                x2={chartWidth - pad.right}
                y2={yFor(data.challenge.startingWeight)}
                stroke="#b9c8b4"
                strokeWidth="1.2"
                strokeDasharray="5 5"
                opacity="0.75"
              />
              <text
                x={chartWidth - pad.right}
                y={yFor(data.challenge.startingWeight) - 7}
                textAnchor="end"
                fontSize="8.5"
                fill="#99a591"
                fontFamily="var(--font-sans)"
                fontWeight="600"
              >
                Start {data.challenge.startingWeight.toFixed(2)} kg
              </text>

              {summaries.map((summary) => (
                <g key={summary.week.number}>
                  <text
                    x={xFor(summary.week.number)}
                    y={chartHeight - 13}
                    textAnchor="middle"
                    fontSize="8.5"
                    fill="#aaa498"
                    fontFamily="var(--font-sans)"
                    fontWeight="500"
                  >
                    W{summary.week.number}
                  </text>
                </g>
              ))}

              {points.length > 0 ? (
                <>
                  <path d={areaPath} fill="#dfebd8" opacity="0.4" />
                  <path
                    d={linePath}
                    fill="none"
                    stroke="#5d8263"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </>
              ) : (
                <g>
                  <circle
                    cx={chartWidth / 2}
                    cy={pad.top + innerHeight / 2 - 15}
                    r="26"
                    fill="#fbf8f1"
                    stroke="#e6dfd2"
                    strokeWidth="1.4"
                    strokeDasharray="4 4"
                  />
                  <path
                    d={`M ${chartWidth / 2 - 10} ${pad.top + innerHeight / 2 - 17} l 20 0 m -10 -6 l 0 18`}
                    stroke="#a9b7a3"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <text
                    x={chartWidth / 2}
                    y={pad.top + innerHeight / 2 + 30}
                    textAnchor="middle"
                    fontSize="12"
                    fill="#7d7f73"
                    fontFamily="var(--font-sans)"
                    fontWeight="600"
                  >
                    Your first weekend weigh-in lands here.
                  </text>
                  <text
                    x={chartWidth / 2}
                    y={pad.top + innerHeight / 2 + 46}
                    textAnchor="middle"
                    fontSize="9.5"
                    fill="#aaa498"
                    fontFamily="var(--font-sans)"
                  >
                    No data is invented. Just room for your story.
                  </text>
                </g>
              )}

              {points.map((point) => (
                <g
                  key={point.summary.week.number}
                  tabIndex={0}
                  role="button"
                  aria-label={`Week ${point.summary.week.number}: ${point.summary.weightAverage.toFixed(2)} kilograms`}
                  onMouseEnter={() => setActiveWeek(point.summary.week.number)}
                  onMouseLeave={() => setActiveWeek(null)}
                  onFocus={() => setActiveWeek(point.summary.week.number)}
                  onBlur={() => setActiveWeek(null)}
                  className="cursor-pointer outline-none"
                >
                  <circle cx={point.x} cy={point.y} r="12" fill="transparent" />
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={activeWeek === point.summary.week.number ? 5.5 : 4.2}
                    fill="#fbf9f2"
                    stroke="#557b5c"
                    strokeWidth="2.4"
                    className="transition-all duration-150"
                  />
                </g>
              ))}
            </svg>

            {active ? (
              <div
                className="pointer-events-none absolute z-10 w-[132px] -translate-x-1/2 -translate-y-[calc(100%+12px)] rounded-[11px] border border-[#dcd5c7] bg-[#fffdf9] px-2.5 py-2 text-left shadow-[0_8px_24px_rgba(41,43,33,.13)]"
                style={{
                  left: `${(active.x / chartWidth) * 100}%`,
                  top: `${(active.y / chartHeight) * 100}%`,
                }}
              >
                <span className="block text-[8px] font-bold uppercase tracking-[0.1em] text-[#9e998d]">
                  Week {active.summary.week.number}
                </span>
                <span className="mt-0.5 flex items-baseline gap-1 tabular text-[14px] font-bold text-[#34372e]">
                  {active.summary.weightAverage.toFixed(2)}
                  <span className="text-[9px] font-medium text-[#9b978b]">kg avg</span>
                </span>
                <span className="mt-0.5 block text-[8px] font-medium text-[#aaa498]">
                  {active.summary.weightCount} weigh-in{active.summary.weightCount === 1 ? "" : "s"}
                  {active.summary.weightDifference != null
                    ? ` · ${active.summary.weightDifference > 0 ? "+" : ""}${active.summary.weightDifference.toFixed(2)} kg`
                    : ""}
                </span>
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-1 flex flex-col gap-2 px-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
          <p className="flex items-center gap-1.5 text-[9px] font-medium text-[#a29d91]">
            <Info size={10} aria-hidden="true" />
            Weekly averages only. One step on the scale is not a trend.
          </p>
          <div className="flex items-center gap-3 text-[9px] font-medium text-[#a29d91]">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-px w-4 border-t border-dashed border-[#b9c8b4]" />
              Start weight
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full border border-[#557b5c] bg-[#fbf9f2]" />
              Weekly avg
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCell({
  icon: Icon,
  label,
  value,
  unit,
  sub,
  tone = "sage",
}: {
  icon: typeof Flame;
  label: string;
  value: string;
  unit?: string;
  sub?: string;
  tone?: "sage" | "peach" | "butter" | "lavender";
}) {
  const toneMap = {
    sage: "bg-[#eef4e9] text-[#657a5f]",
    peach: "bg-[#fbf0e8] text-[#a17659]",
    butter: "bg-[#fbf3d8] text-[#9c8136]",
    lavender: "bg-[#f1eef8] text-[#80759a]",
  };
  return (
    <div className="rounded-[16px] border border-[#ebe4d8] bg-[#fbf8f1]/70 p-3">
      <div className="flex items-center gap-2">
        <span className={`flex h-6 w-6 items-center justify-center rounded-lg ${toneMap[tone]}`}>
          <Icon size={12} strokeWidth={2.2} aria-hidden="true" />
        </span>
        <span className="text-[9px] font-bold uppercase tracking-[0.08em] text-[#a19b8f]">{label}</span>
      </div>
      <p className="mt-2 flex items-baseline gap-1 tabular text-[17px] font-bold leading-none tracking-[-0.03em] text-[#34372e]">
        {value}
        {unit ? <span className="text-[9px] font-semibold tracking-normal text-[#9d988c]">{unit}</span> : null}
      </p>
      {sub ? <p className="mt-1 text-[9px] font-medium text-[#aaa498]">{sub}</p> : null}
    </div>
  );
}

function StatsBoard({ data, stats }: { data: ChallengeData; stats: ChallengeStats }) {
  return (
    <div className="paper-card flex flex-col overflow-hidden">
      <div className="border-b border-[#eae3d7] px-5 pb-4 pt-5 sm:px-6">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="section-kicker mb-2">
              <ChartNoAxesColumnIncreasing size={12} aria-hidden="true" />
              By the numbers
            </p>
            <h3 className="text-[22px] font-bold tracking-[-0.04em] text-[#2e3229]">Your shape so far.</h3>
          </div>
          <TrendBadge direction={stats.weightDirection} />
        </div>
        <p className="mt-1.5 text-[11px] leading-relaxed text-[#918d81]">
          Only logged days are counted. Missing days don&apos;t become zeroes.
        </p>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
        <div className="rounded-[18px] border border-[#dce6d7] bg-[#eef4e9] p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#7b8b74]">
                {stats.latestWeightDate ? "Latest check-in" : "Starting line"}
              </span>
              <p className="mt-1.5 flex items-baseline gap-1.5 tabular text-[30px] font-bold leading-none tracking-[-0.05em] text-[#324030]">
                {formatWeight(stats.latestWeight)}
                <span className="text-[11px] font-semibold text-[#7f8e7a]">kg</span>
              </p>
              <p className="mt-1.5 text-[10px] font-medium text-[#8a9783]">
                {stats.latestWeightDate
                  ? `Logged ${formatShortDate(stats.latestWeightDate)} · start ${formatWeight(data.challenge.startingWeight)} kg`
                  : "Log a weekend weight to start the trend."}
              </p>
            </div>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#d5e2cf] bg-[#f9fcf6] text-[#6d866a]">
              <Scale size={17} strokeWidth={2} aria-hidden="true" />
            </span>
          </div>
          {stats.latestWeightDate ? (
            <div className="mt-3 flex items-center justify-between border-t border-[#dce7d6] pt-2.5">
              <span className="text-[9px] font-semibold text-[#8a9783]">Since the start</span>
              <WeightDelta value={stats.weightChange} label="Starting weight" />
            </div>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <StatCell icon={Flag} label="Started at" value={formatWeight(data.challenge.startingWeight)} unit="kg" sub="Day one baseline" tone="butter" />
          <StatCell
            icon={stats.weightChange < 0 ? TrendingDown : stats.weightChange > 0 ? TrendingUp : Minus}
            label="Total change"
            value={stats.latestWeightDate ? `${stats.weightChange > 0 ? "+" : ""}${stats.weightChange.toFixed(2)}` : "—"}
            unit={stats.latestWeightDate ? "kg" : undefined}
            sub={stats.latestWeightDate ? "since day one" : "No check-ins yet"}
            tone="peach"
          />
          <StatCell
            icon={Flame}
            label="Avg calories"
            value={stats.averageCalories == null ? "—" : stats.averageCalories.toLocaleString()}
            unit={stats.averageCalories == null ? undefined : "kcal"}
            sub={`${stats.loggedDays} logged day${stats.loggedDays === 1 ? "" : "s"}`}
            tone="peach"
          />
          <StatCell
            icon={Dumbbell}
            label="Avg protein"
            value={stats.averageProtein == null ? "—" : `${stats.averageProtein}`}
            unit={stats.averageProtein == null ? undefined : "g"}
            sub="on logged days"
            tone="lavender"
          />
          <StatCell
            icon={Footprints}
            label="10k-step days"
            value={`${stats.stepsGoalDays}`}
            sub={`${stats.totalSteps.toLocaleString()} total steps`}
          />
          <StatCell
            icon={Dumbbell}
            label="Gym sessions"
            value={`${stats.gymSessions}`}
            sub={`Target ${data.challenge.targets.gymSessionsPerWeek} / week`}
          />
          <StatCell
            icon={Flame}
            label="Current streak"
            value={`${stats.currentStreak}`}
            unit={stats.currentStreak === 1 ? "day" : "days"}
            sub={stats.currentStreak > 0 ? "Keep showing up" : "Begin with today"}
            tone="butter"
          />
          <StatCell
            icon={Target}
            label="Completion"
            value={`${stats.completionPercent}`}
            unit="%"
            sub={`${stats.loggedDays} of ${data.challenge.duration} days logged`}
          />
        </div>

        <div className="mt-auto flex items-center gap-2 rounded-[13px] border border-[#ebe4d8] bg-[#faf7f0] px-3 py-2.5">
          <Sparkles size={12} className="shrink-0 text-[#9daa91]" aria-hidden="true" />
          <p className="text-[9px] leading-relaxed text-[#938f83]">
            Trends compare weekly averages, never a single weigh-in. Missing
            weigh-ins stay blank.
          </p>
        </div>
      </div>
    </div>
  );
}

function Timeline({
  data,
  today,
  onOpenDay,
}: {
  data: ChallengeData;
  today: string;
  onOpenDay: (date: string) => void;
}) {
  const dates = getChallengeDates(data.challenge);
  const dayStatuses = dates.map((date) => {
    const status = getDayStatus(date, data.days[date], data.challenge, today);
    return { date, status };
  });
  const currentDate = dates.find((date) => date === today);

  return (
    <div className="paper-card mt-5 overflow-hidden px-4 py-5 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="section-kicker mb-2">
            <Footprints size={12} aria-hidden="true" />
            The whole road
          </p>
          <h3 className="text-[20px] font-bold tracking-[-0.035em] text-[#30332a]">90 little commitments.</h3>
          <p className="mt-1 text-[11px] leading-relaxed text-[#918d81]">
            Every tile is one day. Tap any day to open the log.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[9px] font-medium text-[#9b978b]">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-[3px] bg-[#dff0dd]" />
            Goals hit
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-[3px] bg-[#f8ebc3]" />
            In progress
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-[3px] border border-[#e8e1d4] bg-[#f6f2e8]" />
            Ahead
          </span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-[repeat(15,minmax(0,1fr))] gap-1 sm:grid-cols-[repeat(30,minmax(0,1fr))] sm:gap-1.5">
        {dayStatuses.map(({ date, status }, index) => {
          const isToday = date === today;
          const label = isToday ? "Today" : formatShortDate(date);
          const tones: Record<typeof status, string> = {
            complete: "border-[#bcd8ba] bg-[#cce5c8]",
            partial: "border-[#eadba9] bg-[#f5e6b8]",
            off: "border-[#ebcbc3] bg-[#f1d5ce]",
            unlogged: "border-[#e7e0d2] bg-[#f4efe5]",
            future: "border-[#ede7db] bg-[#f9f6ef]",
          };
          return (
            <button
              key={date}
              type="button"
              title={`${label} · ${status === "future" ? "upcoming" : status === "unlogged" ? "not logged" : status}`}
              aria-label={`${label}, ${status}`}
              aria-current={isToday ? "date" : undefined}
              onClick={() => onOpenDay(date)}
              className={`timeline-dot ${tones[status]} ${
                isToday ? "timeline-dot-today" : ""
              } ${index === 44 ? "relative" : ""}`}
            >
              {index === 44 ? (
                <span className="absolute -top-4 left-1/2 hidden -translate-x-1/2 whitespace-nowrap text-[8px] font-bold uppercase tracking-[0.08em] text-[#ac9b74] sm:block">
                  Half
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[9px] font-medium text-[#a39e92]">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#719777]" />
          Start {formatShortDate(data.challenge.startDate)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <CalendarCheck2 size={10} />
          {currentDate
            ? `You are here · ${formatShortDate(currentDate)}`
            : today < data.challenge.startDate
              ? `Starts ${formatShortDate(data.challenge.startDate)}`
              : "Finish line"}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#b9b1a1]" />
          Finish {formatShortDate(dates.at(-1) ?? data.challenge.startDate)}
        </span>
      </div>
    </div>
  );
}

export function ProgressSection({
  data,
  stats,
  summaries,
  today,
  onOpenDay,
  embedded = false,
}: {
  data: ChallengeData;
  stats: ChallengeStats;
  summaries: WeeklySummary[];
  today: string;
  onOpenDay: (date: string) => void;
  embedded?: boolean;
}) {
  const content = (
    <>
      <div className="grid items-stretch gap-4 xl:grid-cols-[minmax(0,1.38fr)_minmax(330px,0.78fr)]">
        <WeightChart data={data} summaries={summaries} stats={stats} />
        <StatsBoard data={data} stats={stats} />
      </div>
      <Timeline data={data} today={today} onOpenDay={onOpenDay} />
    </>
  );

  if (embedded) {
    return <div>{content}</div>;
  }

  return (
    <section id="progress" className="scroll-mt-24 py-6 sm:py-9">
      <SectionHeading
        kicker="Progress, not perfection"
        title="The bigger picture."
        description="A weekly view of your weight and habits. Honest, calm, and built only from what you've actually logged."
        icon={ChartNoAxesColumnIncreasing}
        action={
          <span className="chip">
            <span className="h-1.5 w-1.5 rounded-full bg-[#adc4a6]" />
            {getWeeks(data.challenge).length} weeks
          </span>
        }
      />
      {content}
    </section>
  );
}
