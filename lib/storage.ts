import {
  ChallengeData,
  DEFAULT_CHALLENGE,
  DayEntry,
  WORKOUT_OPTIONS,
  Workout,
  WorkoutSet,
  createDefaultData,
  createEmptyDay,
  parseDateKey,
  STORAGE_KEY,
} from "./challenge";

interface ValidationSuccess {
  ok: true;
  data: ChallengeData;
  warning?: string;
}

interface ValidationFailure {
  ok: false;
  error: string;
}

export type ValidationResult = ValidationSuccess | ValidationFailure;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function numberInRange(
  value: unknown,
  name: string,
  min: number,
  max: number,
): number {
  const number =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim() !== ""
        ? Number(value)
        : NaN;
  if (!Number.isFinite(number) || number < min || number > max) {
    throw new Error(`${name} must be a number between ${min} and ${max}.`);
  }
  return number;
}

function optionalNumber(value: unknown, name: string): number | null {
  if (value == null || value === "") return null;
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number) || number < 0) {
    throw new Error(`${name} must be a positive number or empty.`);
  }
  return number;
}

function optionalString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function isWorkout(value: unknown): value is Workout {
  return (
    typeof value === "string" &&
    (WORKOUT_OPTIONS as readonly string[]).includes(value)
  );
}

function optionalNonNegative(value: unknown): number | null {
  if (value == null || value === "") return null;
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number) || number < 0) return null;
  return number;
}

function sanitizeWorkoutSet(raw: unknown): WorkoutSet | null {
  if (!isRecord(raw)) return null;

  const exercise = optionalString(raw.exercise).trim().slice(0, 80);
  if (!exercise) return null;

  const workout = optionalString(raw.workout).trim().slice(0, 60) || "Workout";
  const setNumber = optionalNonNegative(raw.setNumber);
  const actualReps = optionalNonNegative(raw.actualReps);
  const weightKg = optionalNonNegative(raw.weightKg);
  const rir = optionalNonNegative(raw.rir);

  return {
    workout,
    exercise,
    muscleGroup: optionalString(raw.muscleGroup).trim().slice(0, 40),
    setNumber:
      setNumber != null && setNumber >= 1 && setNumber <= 999
        ? Math.round(setNumber)
        : null,
    plannedReps: optionalString(raw.plannedReps).slice(0, 24),
    actualReps:
      actualReps != null && actualReps <= 1000 ? Math.round(actualReps) : null,
    weightKg: weightKg != null && weightKg <= 1000 ? weightKg : null,
    assisted: raw.assisted === true,
    rir: rir != null && rir <= 20 ? rir : null,
    completed: raw.completed !== false,
    notes: optionalString(raw.notes).slice(0, 500),
  };
}

function sanitizeWorkoutSets(raw: unknown): WorkoutSet[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .slice(0, 200)
    .map(sanitizeWorkoutSet)
    .filter((set): set is WorkoutSet => set !== null);
}

function sanitizeEntry(raw: unknown, dateKey: string): DayEntry {
  if (!isRecord(raw)) {
    throw new Error(`Entry for ${dateKey} is not a valid object.`);
  }

  const entry = createEmptyDay();
  entry.calories = optionalNumber(raw.calories, `${dateKey} calories`);
  entry.protein = optionalNumber(raw.protein, `${dateKey} protein`);
  entry.steps = optionalNumber(raw.steps, `${dateKey} steps`);
  entry.stepsCompleted = raw.stepsCompleted === true;
  entry.weight = optionalNumber(raw.weight, `${dateKey} weight`);
  entry.workout = isWorkout(raw.workout) ? raw.workout : null;
  entry.workoutNote = optionalString(raw.workoutNote).slice(0, 500);
  entry.workoutSets = sanitizeWorkoutSets(raw.workoutSets);
  entry.notes = optionalString(raw.notes).slice(0, 4000);

  return entry;
}

export function validateChallengeData(raw: unknown): ValidationResult {
  try {
    if (!isRecord(raw)) {
      return { ok: false, error: "The file must contain a JSON object." };
    }

    const challengeRaw = raw.challenge;
    if (!isRecord(challengeRaw)) {
      return { ok: false, error: "The file is missing its challenge settings." };
    }

    const startDate = challengeRaw.startDate;
    if (typeof startDate !== "string" || !parseDateKey(startDate)) {
      return {
        ok: false,
        error: "Challenge start date must be a valid YYYY-MM-DD date.",
      };
    }

    const duration = numberInRange(
      challengeRaw.duration ?? 90,
      "Challenge duration",
      1,
      365,
    );
    if (!Number.isInteger(duration)) {
      return { ok: false, error: "Challenge duration must be a whole number." };
    }

    const targetsRaw = challengeRaw.targets;
    if (!isRecord(targetsRaw)) {
      return { ok: false, error: "The file is missing challenge targets." };
    }

    const weekdayCaloriesMin = numberInRange(
      targetsRaw.weekdayCaloriesMin,
      "Weekday calorie minimum",
      500,
      10000,
    );
    const weekdayCaloriesMax = numberInRange(
      targetsRaw.weekdayCaloriesMax,
      "Weekday calorie maximum",
      500,
      10000,
    );
    const weekendCaloriesMin = numberInRange(
      targetsRaw.weekendCaloriesMin,
      "Weekend calorie minimum",
      500,
      10000,
    );
    const weekendCaloriesMax = numberInRange(
      targetsRaw.weekendCaloriesMax,
      "Weekend calorie maximum",
      500,
      10000,
    );
    if (weekdayCaloriesMin >= weekdayCaloriesMax) {
      return {
        ok: false,
        error: "Weekday calorie minimum must be lower than its maximum.",
      };
    }
    if (weekendCaloriesMin >= weekendCaloriesMax) {
      return {
        ok: false,
        error: "Weekend calorie minimum must be lower than its maximum.",
      };
    }

    const protein = numberInRange(targetsRaw.protein, "Protein target", 1, 1000);
    const steps = numberInRange(targetsRaw.steps, "Step target", 1, 100000);
    const gymSessionsPerWeek =
      targetsRaw.gymSessionsPerWeek == null
        ? 4
        : numberInRange(
            targetsRaw.gymSessionsPerWeek,
            "Weekly gym target",
            0,
            14,
          );

    const startingWeight = numberInRange(
      challengeRaw.startingWeight,
      "Starting weight",
      20,
      500,
    );

    const daysRaw = raw.days ?? {};
    if (!isRecord(daysRaw)) {
      return { ok: false, error: "The file's days data must be an object." };
    }

    const days: Record<string, DayEntry> = {};
    let invalidEntries = 0;
    for (const [dateKey, value] of Object.entries(daysRaw)) {
      if (!parseDateKey(dateKey)) continue;
      try {
        days[dateKey] = sanitizeEntry(value, dateKey);
      } catch {
        invalidEntries += 1;
      }
    }

    const name =
      typeof challengeRaw.name === "string" && challengeRaw.name.trim()
        ? challengeRaw.name.trim().slice(0, 80)
        : DEFAULT_CHALLENGE.name;

    return {
      ok: true,
      data: {
        version: 1,
        challenge: {
          name,
          startDate,
          duration,
          startingWeight,
          targets: {
            weekdayCaloriesMin: Math.round(weekdayCaloriesMin),
            weekdayCaloriesMax: Math.round(weekdayCaloriesMax),
            weekendCaloriesMin: Math.round(weekendCaloriesMin),
            weekendCaloriesMax: Math.round(weekendCaloriesMax),
            protein: Math.round(protein),
            steps: Math.round(steps),
            gymSessionsPerWeek: Math.round(gymSessionsPerWeek),
          },
        },
        days,
        savedAt: new Date().toISOString(),
      },
      warning:
        invalidEntries > 0
          ? `${invalidEntries} invalid day ${invalidEntries === 1 ? "entry was" : "entries were"} skipped.`
          : undefined,
    };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "That backup could not be read.",
    };
  }
}

export function loadStoredData(): {
  data: ChallengeData;
  warning?: string;
} {
  if (typeof window === "undefined") {
    return { data: createDefaultData() };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { data: createDefaultData() };
    const parsed: unknown = JSON.parse(raw);
    const result = validateChallengeData(parsed);
    if (!result.ok) {
      return {
        data: createDefaultData(),
        warning: `Your saved data couldn't be loaded: ${result.error}`,
      };
    }
    return { data: result.data, warning: result.warning };
  } catch {
    return {
      data: createDefaultData(),
      warning: "Your saved data couldn't be read, so a fresh tracker was opened.",
    };
  }
}

export function saveStoredData(data: ChallengeData): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function exportChallengeData(data: ChallengeData): void {
  if (typeof window === "undefined") return;
  const payload: ChallengeData = {
    ...data,
    savedAt: new Date().toISOString(),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `the-90-day-cut-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export async function parseImportFile(file: File): Promise<ValidationResult> {
  try {
    const text = await file.text();
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      return {
        ok: false,
        error: "That file isn't valid JSON. Check the file and try again.",
      };
    }
    return validateChallengeData(parsed);
  } catch {
    return { ok: false, error: "That file could not be read." };
  }
}

export function cloneData(data: ChallengeData): ChallengeData {
  return JSON.parse(JSON.stringify(data)) as ChallengeData;
}
