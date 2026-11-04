export const STORAGE_KEY = "the-90-day-cut:v1";

export const WORKOUT_OPTIONS = [
  "Upper A",
  "Lower A",
  "Rest",
  "Upper B",
  "Lower B",
  "Rest / Recovery",
] as const;

export type Workout = (typeof WORKOUT_OPTIONS)[number];

export interface WorkoutSet {
  workout: string;
  exercise: string;
  muscleGroup: string;
  setNumber: number | null;
  plannedReps: string;
  actualReps: number | null;
  weightKg: number | null;
  assisted: boolean;
  rir: number | null;
  completed: boolean;
  notes: string;
}

export interface ChallengeTargets {
  weekdayCaloriesMin: number;
  weekdayCaloriesMax: number;
  weekendCaloriesMin: number;
  weekendCaloriesMax: number;
  protein: number;
  steps: number;
  gymSessionsPerWeek: number;
}

export interface ChallengeConfig {
  name: string;
  startDate: string;
  duration: number;
  startingWeight: number;
  targets: ChallengeTargets;
}

export interface DayEntry {
  calories: number | null;
  protein: number | null;
  steps: number | null;
  stepsCompleted: boolean;
  weight: number | null;
  workout: Workout | null;
  workoutNote: string;
  workoutSets: WorkoutSet[];
  notes: string;
}

export interface ChallengeData {
  version: 1;
  challenge: ChallengeConfig;
  days: Record<string, DayEntry>;
  savedAt?: string;
}

export type MetricStatus = "green" | "yellow" | "red" | "empty";
export type DayStatus =
  | "complete"
  | "partial"
  | "off"
  | "unlogged"
  | "future";
export type WeightDirection = "down" | "up" | "stable" | "unknown";

export interface DayTargets {
  caloriesMin: number;
  caloriesMax: number;
  protein: number;
  steps: number;
  isWeekend: boolean;
}

export interface Week {
  number: number;
  monday: string;
  sunday: string;
  allDates: string[];
  challengeDates: string[];
}

export interface WeeklySummary {
  week: Week;
  caloriesAverage: number | null;
  proteinAverage: number | null;
  weightAverage: number | null;
  weightCount: number;
  weightDifference: number | null;
  stepsGoalDays: number;
  actualSteps: number;
  gymSessions: number;
  loggedDays: number;
  elapsedDays: number;
  completion: number | null;
  consistency: number | null;
}

export interface ChallengeStats {
  currentDay: number;
  daysRemaining: number;
  journeyPercent: number;
  currentStreak: number;
  maxStreak: number;
  loggedDays: number;
  completedDays: number;
  completionPercent: number;
  started: boolean;
  finished: boolean;
  beforeStart: boolean;
  latestWeight: number;
  latestWeightDate: string | null;
  weightChange: number;
  averageCalories: number | null;
  averageProtein: number | null;
  stepsGoalDays: number;
  gymSessions: number;
  totalSteps: number;
  weightDirection: WeightDirection;
  weightDirectionLabel: string;
}

export const DEFAULT_CHALLENGE: ChallengeConfig = {
  name: "THE 90-DAY CUT",
  startDate: "2026-11-02",
  duration: 90,
  startingWeight: 75.3,
  targets: {
    weekdayCaloriesMin: 1800,
    weekdayCaloriesMax: 1900,
    weekendCaloriesMin: 1800,
    weekendCaloriesMax: 2100,
    protein: 150,
    steps: 10000,
    gymSessionsPerWeek: 4,
  },
};

export function createEmptyDay(): DayEntry {
  return {
    calories: null,
    protein: null,
    steps: null,
    stepsCompleted: false,
    weight: null,
    workout: null,
    workoutNote: "",
    workoutSets: [],
    notes: "",
  };
}

export function createDefaultData(): ChallengeData {
  return {
    version: 1,
    challenge: {
      ...DEFAULT_CHALLENGE,
      targets: { ...DEFAULT_CHALLENGE.targets },
    },
    days: {},
  };
}

const MS_PER_DAY = 86_400_000;

export function parseDateKey(key: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return null;
  const [year, month, day] = key.split("-").map(Number);
  const date = new Date(year, month - 1, day, 12, 0, 0, 0);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayKey(): string {
  return toDateKey(new Date());
}

function utcValue(key: string): number {
  const [year, month, day] = key.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

export function addDaysKey(key: string, amount: number): string {
  const date = parseDateKey(key);
  if (!date) return key;
  date.setDate(date.getDate() + amount);
  return toDateKey(date);
}

export function dayDifference(later: string, earlier: string): number {
  return Math.round((utcValue(later) - utcValue(earlier)) / MS_PER_DAY);
}

export function getDayOfWeek(key: string): number {
  return parseDateKey(key)?.getDay() ?? 0;
}

export function isWeekendKey(key: string): boolean {
  const day = getDayOfWeek(key);
  return day === 0 || day === 6;
}

export function getChallengeDates(challenge: ChallengeConfig): string[] {
  const dates: string[] = [];
  if (!parseDateKey(challenge.startDate)) return dates;
  for (let index = 0; index < challenge.duration; index += 1) {
    dates.push(addDaysKey(challenge.startDate, index));
  }
  return dates;
}

export function getChallengeEndKey(challenge: ChallengeConfig): string {
  return addDaysKey(challenge.startDate, Math.max(0, challenge.duration - 1));
}

export function getChallengeDayNumber(
  challenge: ChallengeConfig,
  key: string,
): number {
  const difference = dayDifference(key, challenge.startDate) + 1;
  if (difference < 1 || difference > challenge.duration) return 0;
  return difference;
}

export function getWeekMonday(key: string): string {
  const day = getDayOfWeek(key);
  const distanceFromMonday = day === 0 ? 6 : day - 1;
  return addDaysKey(key, -distanceFromMonday);
}

export function getWeeks(challenge: ChallengeConfig): Week[] {
  const dates = getChallengeDates(challenge);
  if (dates.length === 0) return [];
  const start = dates[0];
  const end = dates[dates.length - 1];
  const weeks: Week[] = [];
  let cursor = getWeekMonday(start);

  while (cursor <= end) {
    const allDates = Array.from({ length: 7 }, (_, index) =>
      addDaysKey(cursor, index),
    );
    const challengeDates = allDates.filter(
      (date) => date >= start && date <= end,
    );
    if (challengeDates.length > 0) {
      weeks.push({
        number: weeks.length + 1,
        monday: cursor,
        sunday: addDaysKey(cursor, 6),
        allDates,
        challengeDates,
      });
    }
    cursor = addDaysKey(cursor, 7);
  }

  return weeks;
}

export function getWeekForDate(
  challenge: ChallengeConfig,
  key: string,
): Week | null {
  return (
    getWeeks(challenge).find((week) => week.challengeDates.includes(key)) ??
    null
  );
}

export function getTargetsForDate(
  challenge: ChallengeConfig,
  key: string,
): DayTargets {
  const isWeekend = isWeekendKey(key);
  return {
    caloriesMin: isWeekend
      ? challenge.targets.weekendCaloriesMin
      : challenge.targets.weekdayCaloriesMin,
    caloriesMax: isWeekend
      ? challenge.targets.weekendCaloriesMax
      : challenge.targets.weekdayCaloriesMax,
    protein: challenge.targets.protein,
    steps: challenge.targets.steps,
    isWeekend,
  };
}

export function formatShortDate(key: string): string {
  const date = parseDateKey(key);
  if (!date) return key;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

export function formatLongDate(key: string): string {
  const date = parseDateKey(key);
  if (!date) return key;
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function formatDayOfWeek(key: string, length: "short" | "long" = "short") {
  const date = parseDateKey(key);
  if (!date) return "";
  return new Intl.DateTimeFormat("en-US", { weekday: length }).format(date);
}

export function formatMonthYear(key: string): string {
  const date = parseDateKey(key);
  if (!date) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatWeekRange(week: Week): string {
  const first = week.challengeDates[0];
  const last = week.challengeDates[week.challengeDates.length - 1];
  const firstDate = parseDateKey(first);
  const lastDate = parseDateKey(last);
  if (!firstDate || !lastDate) return "";
  const firstMonth = new Intl.DateTimeFormat("en-US", {
    month: "short",
  }).format(firstDate);
  const lastMonth = new Intl.DateTimeFormat("en-US", {
    month: "short",
  }).format(lastDate);
  if (firstMonth === lastMonth) {
    return `${firstMonth} ${firstDate.getDate()} – ${lastDate.getDate()}`;
  }
  return `${firstMonth} ${firstDate.getDate()} – ${lastMonth} ${lastDate.getDate()}`;
}

export function formatWeight(value: number | null): string {
  return value == null ? "—" : value.toFixed(2);
}

export function formatWeightDifference(value: number | null): string {
  if (value == null) return "—";
  if (Math.abs(value) < 0.005) return "0.00 kg";
  return `${value > 0 ? "+" : "−"}${Math.abs(value).toFixed(2)} kg`;
}

export function formatCalories(value: number | null): string {
  return value == null ? "—" : `${Math.round(value).toLocaleString("en-US")}`;
}

export function round(value: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function normalizeNumber(value: number | null): number | null {
  return value != null && Number.isFinite(value) ? value : null;
}

export function hasDayData(entry: DayEntry | undefined): boolean {
  if (!entry) return false;
  return (
    entry.calories != null ||
    entry.protein != null ||
    entry.steps != null ||
    entry.stepsCompleted ||
    entry.weight != null ||
    entry.workout != null ||
    entry.workoutNote.trim().length > 0 ||
    entry.workoutSets.length > 0 ||
    entry.notes.trim().length > 0
  );
}

export function getCalorieStatus(
  value: number | null,
  targets: DayTargets,
): MetricStatus {
  if (value == null) return "empty";
  if (value >= targets.caloriesMin && value <= targets.caloriesMax) {
    return "green";
  }

  const over = value > targets.caloriesMax;
  if (over) {
    return value <= targets.caloriesMax + 200 ? "yellow" : "red";
  }

  return value >= targets.caloriesMin - 300 ? "yellow" : "red";
}

export function getProteinStatus(
  value: number | null,
  target: number,
): MetricStatus {
  if (value == null) return "empty";
  if (value >= target) return "green";
  if (value >= target * 0.9) return "yellow";
  return "red";
}

export function getStepsStatus(
  entry: DayEntry | undefined,
  target: number,
): MetricStatus {
  if (!entry) return "empty";
  if (entry.stepsCompleted) return "green";
  if (entry.steps == null) return "empty";
  if (entry.steps >= target) return "green";
  if (entry.steps >= target * 0.7) return "yellow";
  return "red";
}

export function getMetricStatuses(
  entry: DayEntry | undefined,
  challenge: ChallengeConfig,
  dateKey: string,
) {
  const targets = getTargetsForDate(challenge, dateKey);
  return {
    calories: getCalorieStatus(entry?.calories ?? null, targets),
    protein: getProteinStatus(entry?.protein ?? null, targets.protein),
    steps: getStepsStatus(entry, targets.steps),
  };
}

export function getDayStatus(
  dateKey: string,
  entry: DayEntry | undefined,
  challenge: ChallengeConfig,
  today: string,
): DayStatus {
  if (dateKey > today && !hasDayData(entry)) return "future";
  if (!hasDayData(entry)) return "unlogged";

  const statuses = getMetricStatuses(entry, challenge, dateKey);
  const metrics = [statuses.calories, statuses.protein, statuses.steps];
  const reds = metrics.filter((status) => status === "red").length;
  const greens = metrics.filter((status) => status === "green").length;

  if (statuses.calories === "red" || reds >= 2) return "off";
  if (greens === 3) return "complete";
  return "partial";
}

export function getDayCompletionScore(
  entry: DayEntry | undefined,
  challenge: ChallengeConfig,
  dateKey: string,
): number {
  if (!hasDayData(entry)) return 0;
  const statuses = getMetricStatuses(entry, challenge, dateKey);
  const points = [statuses.calories, statuses.protein, statuses.steps].reduce(
    (total, status) => {
      if (status === "green") return total + 1;
      if (status === "yellow") return total + 0.5;
      return total;
    },
    0,
  );
  return points / 3;
}

export function isGymWorkout(workout: Workout | null | undefined): boolean {
  return workout === "Upper A" || workout === "Lower A" || workout === "Upper B" || workout === "Lower B";
}

export function hasGymWorkout(entry: DayEntry | undefined): boolean {
  return isGymWorkout(entry?.workout) || (entry?.workoutSets.length ?? 0) > 0;
}

export function isRestWorkout(workout: Workout | null | undefined): boolean {
  return workout === "Rest" || workout === "Rest / Recovery";
}

export function getWeekSummaries(
  challenge: ChallengeConfig,
  days: Record<string, DayEntry>,
  today: string,
): WeeklySummary[] {
  const weeks = getWeeks(challenge);

  return weeks.map((week, index) => {
    const entries = week.challengeDates
      .map((date) => ({ date, entry: days[date] }))
      .filter((item): item is { date: string; entry: DayEntry } =>
        Boolean(item.entry && hasDayData(item.entry)),
      );

    const calories = entries
      .map(({ entry }) => entry.calories)
      .filter((value): value is number => value != null);
    const protein = entries
      .map(({ entry }) => entry.protein)
      .filter((value): value is number => value != null);
    const weights = entries
      .map(({ entry }) => entry.weight)
      .filter((value): value is number => value != null);

    const previous = index > 0 ? weeks[index - 1] : null;
    const previousWeightValues = previous
      ? previous.challengeDates
          .map((date) => days[date]?.weight)
          .filter((value): value is number => value != null)
      : [];
    const previousAverage =
      previousWeightValues.length > 0
        ? previousWeightValues.reduce((sum, value) => sum + value, 0) /
          previousWeightValues.length
        : null;

    const weightAverage =
      weights.length > 0
        ? weights.reduce((sum, value) => sum + value, 0) / weights.length
        : null;

    const completionValues = entries.map(({ date, entry }) =>
      getDayCompletionScore(entry, challenge, date),
    );

    const elapsedDates = week.challengeDates.filter((date) => date <= today);
    const loggedElapsed = elapsedDates.filter((date) => hasDayData(days[date]));

    return {
      week,
      caloriesAverage:
        calories.length > 0
          ? Math.round(
              calories.reduce((sum, value) => sum + value, 0) / calories.length,
            )
          : null,
      proteinAverage:
        protein.length > 0
          ? Math.round(
              protein.reduce((sum, value) => sum + value, 0) / protein.length,
            )
          : null,
      weightAverage:
        weightAverage == null ? null : round(weightAverage, 2),
      weightCount: weights.length,
      weightDifference:
        weightAverage != null && previousAverage != null
          ? round(weightAverage - previousAverage, 2)
          : null,
      stepsGoalDays: week.challengeDates.filter(
        (date) =>
          getStepsStatus(days[date], challenge.targets.steps) === "green",
      ).length,
      actualSteps: entries.reduce(
        (sum, { entry }) => sum + (entry.steps ?? 0),
        0,
      ),
      gymSessions: entries.filter(({ entry }) => hasGymWorkout(entry)).length,
      loggedDays: entries.length,
      elapsedDays: elapsedDates.length,
      completion:
        completionValues.length > 0
          ? Math.round(
              (completionValues.reduce((sum, value) => sum + value, 0) /
                completionValues.length) *
                100,
            )
          : null,
      consistency:
        elapsedDates.length > 0
          ? Math.round((loggedElapsed.length / elapsedDates.length) * 100)
          : null,
    };
  });
}

export function getLatestWeight(
  challenge: ChallengeConfig,
  days: Record<string, DayEntry>,
  today: string,
): { value: number; date: string | null } {
  const weights = Object.entries(days)
    .filter(([date, entry]) => date <= today && entry.weight != null)
    .sort(([a], [b]) => a.localeCompare(b));

  if (weights.length === 0) {
    return { value: challenge.startingWeight, date: null };
  }
  const [date, entry] = weights[weights.length - 1];
  return { value: entry.weight as number, date };
}

export function getCurrentStreak(
  challenge: ChallengeConfig,
  days: Record<string, DayEntry>,
  today: string,
): number {
  const dates = getChallengeDates(challenge);
  if (dates.length === 0) return 0;
  const end = dates.find((date) => date === today)
    ? today
    : dates.filter((date) => date < today).at(-1);
  if (!end) return 0;

  let cursor = end;
  let streak = 0;
  while (cursor >= challenge.startDate) {
    if (hasDayData(days[cursor])) {
      streak += 1;
      cursor = addDaysKey(cursor, -1);
    } else {
      break;
    }
  }
  return streak;
}

export function getMaxStreak(
  challenge: ChallengeConfig,
  days: Record<string, DayEntry>,
  today: string,
): number {
  const dates = getChallengeDates(challenge).filter((date) => date <= today);
  let best = 0;
  let current = 0;
  for (const date of dates) {
    if (hasDayData(days[date])) {
      current += 1;
      best = Math.max(best, current);
    } else {
      current = 0;
    }
  }
  return best;
}

export function getChallengeStats(
  data: ChallengeData,
  today: string,
): ChallengeStats {
  const { challenge, days } = data;
  const dates = getChallengeDates(challenge);
  const beforeStart = today < challenge.startDate;
  const finished = today > getChallengeEndKey(challenge);
  const currentDay = beforeStart
    ? 0
    : finished
      ? challenge.duration
      : Math.min(
          challenge.duration,
          Math.max(1, dayDifference(today, challenge.startDate) + 1),
        );

  const loggedDays = dates.filter((date) => hasDayData(days[date])).length;
  const completedDays = dates.filter(
    (date) => getDayStatus(date, days[date], challenge, today) === "complete",
  ).length;
  const calorieValues = dates
    .map((date) => days[date]?.calories)
    .filter((value): value is number => value != null);
  const proteinValues = dates
    .map((date) => days[date]?.protein)
    .filter((value): value is number => value != null);
  const stepDays = dates.filter(
    (date) => getStepsStatus(days[date], challenge.targets.steps) === "green",
  ).length;
  const gymSessions = dates.filter((date) => hasGymWorkout(days[date])).length;
  const totalSteps = dates.reduce(
    (sum, date) => sum + (days[date]?.steps ?? 0),
    0,
  );
  const latest = getLatestWeight(challenge, days, today);
  const completionScores = dates
    .filter((date) => hasDayData(days[date]))
    .map((date) => getDayCompletionScore(days[date], challenge, date));
  const completionPercent =
    completionScores.length > 0
      ? Math.round(
          (completionScores.reduce((sum, value) => sum + value, 0) /
            completionScores.length) *
            100,
        )
      : 0;

  const weeklyWeights = getWeekSummaries(challenge, days, today).filter(
    (summary) => summary.weightAverage != null,
  );
  let weightDirection: WeightDirection = "unknown";
  let weightDirectionLabel = "Log two weekly averages to see a trend";
  if (weeklyWeights.length >= 2) {
    const latestWeek = weeklyWeights[weeklyWeights.length - 1];
    const previousWeek = weeklyWeights[weeklyWeights.length - 2];
    const difference =
      (latestWeek.weightAverage as number) -
      (previousWeek.weightAverage as number);
    if (difference <= -0.1) {
      weightDirection = "down";
      weightDirectionLabel = "Trending down";
    } else if (difference >= 0.1) {
      weightDirection = "up";
      weightDirectionLabel = "Trending up";
    } else {
      weightDirection = "stable";
      weightDirectionLabel = "Holding steady";
    }
  } else if (weeklyWeights.length === 1) {
    weightDirectionLabel = "One weigh-in logged";
  }

  return {
    currentDay,
    daysRemaining: Math.max(0, challenge.duration - currentDay),
    journeyPercent: (currentDay / challenge.duration) * 100,
    currentStreak: getCurrentStreak(challenge, days, today),
    maxStreak: getMaxStreak(challenge, days, today),
    loggedDays,
    completedDays,
    completionPercent,
    started: !beforeStart,
    finished,
    beforeStart,
    latestWeight: latest.value,
    latestWeightDate: latest.date,
    weightChange: latest.date ? round(latest.value - challenge.startingWeight, 2) : 0,
    averageCalories:
      calorieValues.length > 0
        ? Math.round(
            calorieValues.reduce((sum, value) => sum + value, 0) /
              calorieValues.length,
          )
        : null,
    averageProtein:
      proteinValues.length > 0
        ? Math.round(
            proteinValues.reduce((sum, value) => sum + value, 0) /
              proteinValues.length,
          )
        : null,
    stepsGoalDays: stepDays,
    gymSessions,
    totalSteps,
    weightDirection,
    weightDirectionLabel,
  };
}

export function getMotivationalMessage(stats: ChallengeStats): string {
  if (stats.beforeStart) return "Your next chapter starts soon. Get your mind ready.";
  if (stats.finished) {
    return stats.loggedDays === 0
      ? "The challenge is complete. Every finish line is a beginning."
      : "You finished. Take a moment to be proud of the person you became.";
  }
  if (stats.currentStreak >= 14) return "You're making this look like a habit.";
  if (stats.currentStreak >= 7) return "One week of showing up. That's how it's done.";
  if (stats.currentStreak >= 3) return "A little momentum goes a long way.";
  if (stats.currentDay === 1) return "Today is day one. All you have to do is start.";
  if (stats.completionPercent >= 75) return "You're not just consistent — you're crushing it.";
  if (stats.currentDay > 45) return "The second half is where the magic happens.";
  if (stats.currentStreak === 0 && stats.loggedDays === 0) {
    return "Your only competition is yesterday's version of you.";
  }
  const messages = [
    "Small wins compound. Keep stacking them.",
    "Consistency beats perfection.",
    "One more day closer.",
    "A little progress is still progress.",
    "Future you is cheering you on.",
  ];
  return messages[stats.currentDay % messages.length];
}

export function getMascotMood(
  stats: ChallengeStats,
  todayIsLogged: boolean,
): "excited" | "proud" | "happy" | "ready" {
  if (stats.currentStreak >= 7) return "excited";
  if (todayIsLogged || stats.currentStreak >= 1) return "happy";
  if (stats.completionPercent >= 50) return "proud";
  return "ready";
}

export function getAchievements(
  data: ChallengeData,
  today: string,
) {
  const { challenge, days } = data;
  const stats = getChallengeStats(data, today);
  const dates = getChallengeDates(challenge).filter((date) => date <= today);
  const loggedDates = dates.filter((date) => hasDayData(days[date]));
  const proteinDays = dates.filter((date) => {
    const value = days[date]?.protein;
    return value != null && value >= challenge.targets.protein;
  }).length;
  const stepDays = dates.filter(
    (date) => getStepsStatus(days[date], challenge.targets.steps) === "green",
  ).length;
  const weeks = getWeeks(challenge);
  const fullWeeks = weeks.filter((week) => week.challengeDates.length === 7);
  const bestFullWeekLogged = fullWeeks.reduce((best, week) => {
    const logged = week.challengeDates.filter((date) => hasDayData(days[date])).length;
    return Math.max(best, logged);
  }, 0);
  const loggedEveryDayWeek = fullWeeks.some((week) =>
    week.challengeDates.every((date) => hasDayData(days[date])),
  );

  return [
    {
      id: "first-day",
      title: "First Day",
      description: "Log your first day.",
      icon: "sparkles",
      tint: "sage",
      unlocked: loggedDates.length >= 1,
      value: Math.min(loggedDates.length, 1),
      target: 1,
    },
    {
      id: "streak-3",
      title: "3-Day Streak",
      description: "Show up three days in a row.",
      icon: "flame",
      tint: "peach",
      unlocked: stats.maxStreak >= 3,
      value: Math.min(stats.maxStreak, 3),
      target: 3,
    },
    {
      id: "streak-7",
      title: "7-Day Streak",
      description: "One full week of showing up.",
      icon: "flame",
      tint: "butter",
      unlocked: stats.maxStreak >= 7,
      value: Math.min(stats.maxStreak, 7),
      target: 7,
    },
    {
      id: "streak-14",
      title: "14-Day Streak",
      description: "Two weeks of momentum.",
      icon: "flame",
      tint: "lavender",
      unlocked: stats.maxStreak >= 14,
      value: Math.min(stats.maxStreak, 14),
      target: 14,
    },
    {
      id: "streak-30",
      title: "30-Day Streak",
      description: "A whole month of consistency.",
      icon: "flame",
      tint: "rose",
      unlocked: stats.maxStreak >= 30,
      value: Math.min(stats.maxStreak, 30),
      target: 30,
    },
    {
      id: "protein-champion",
      title: "Protein Champion",
      description: `Hit ${challenge.targets.protein} g of protein on 7 days.`,
      icon: "drumstick",
      tint: "sage",
      unlocked: proteinDays >= 7,
      value: Math.min(proteinDays, 7),
      target: 7,
    },
    {
      id: "walking-machine",
      title: "Walking Machine",
      description: `Complete ${challenge.targets.steps.toLocaleString()} steps on 7 days.`,
      icon: "footprints",
      tint: "sky",
      unlocked: stepDays >= 7,
      value: Math.min(stepDays, 7),
      target: 7,
    },
    {
      id: "consistency-king",
      title: "Consistency King",
      description: "Log every day in a single week.",
      icon: "calendar-check",
      tint: "butter",
      unlocked: loggedEveryDayWeek,
      value: Math.min(bestFullWeekLogged, 7),
      target: 7,
    },
    {
      id: "halfway",
      title: "Halfway There",
      description: `Log 45 days of the ${challenge.duration}-day challenge.`,
      icon: "flag",
      tint: "peach",
      unlocked: stats.loggedDays >= 45,
      value: Math.min(stats.loggedDays, 45),
      target: 45,
    },
    {
      id: "finisher",
      title: "The Finisher",
      description: `Log all ${challenge.duration} days. What a run.`,
      icon: "trophy",
      tint: "gold",
      unlocked: stats.loggedDays >= challenge.duration,
      value: Math.min(stats.loggedDays, challenge.duration),
      target: challenge.duration,
    },
  ] as const;
}

export type Achievement = ReturnType<typeof getAchievements>[number];

export function getTrendFromWeeklySummaries(
  summaries: WeeklySummary[],
): { direction: WeightDirection; difference: number | null } {
  const filled = summaries.filter((summary) => summary.weightAverage != null);
  if (filled.length < 2) return { direction: "unknown", difference: null };
  const latest = filled[filled.length - 1].weightAverage as number;
  const previous = filled[filled.length - 2].weightAverage as number;
  const difference = round(latest - previous, 2);
  if (difference <= -0.1) return { direction: "down", difference };
  if (difference >= 0.1) return { direction: "up", difference };
  return { direction: "stable", difference };
}

export function getWeeklyLoggingBest(
  challenge: ChallengeConfig,
  days: Record<string, DayEntry>,
  today: string,
): number {
  return getWeekSummaries(challenge, days, today).reduce((best, summary) => {
    const elapsed = summary.elapsedDays;
    const logged = summary.week.challengeDates.filter(
      (date) => date <= today && hasDayData(days[date]),
    ).length;
    return Math.max(best, elapsed > 0 ? Math.round((logged / elapsed) * 100) : 0);
  }, 0);
}
