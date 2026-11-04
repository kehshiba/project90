import {
  WORKOUT_OPTIONS,
  Workout,
  WorkoutSet,
  parseDateKey,
} from "./challenge";

const HEADER = [
  "date",
  "workout",
  "exercise",
  "muscle_group",
  "set_number",
  "planned_reps",
  "actual_reps",
  "weight_kg",
  "assisted",
  "rir",
  "completed",
  "notes",
] as const;

type FieldName = (typeof HEADER)[number];

const ALIASES: Record<FieldName, string[]> = {
  date: ["date", "day"],
  workout: ["workout", "session", "workout_name", "session_name"],
  exercise: ["exercise", "movement", "lift", "exercise_name"],
  muscle_group: ["muscle_group", "muscle", "body_part", "bodypart", "group"],
  set_number: ["set_number", "set", "set_no", "setno"],
  planned_reps: ["planned_reps", "target_reps", "planned", "target"],
  actual_reps: ["actual_reps", "reps", "actual", "reps_done"],
  weight_kg: ["weight_kg", "weight", "kg", "load"],
  assisted: ["assisted", "assist"],
  rir: ["rir"],
  completed: ["completed", "done", "complete"],
  notes: ["notes", "note", "comment", "comments"],
};

const HEADERLESS_ORDER: FieldName[] = [...HEADER];

interface CsvRecord {
  values: string[];
  line: number;
}

export interface ParsedWorkoutImport {
  days: Record<string, WorkoutSet[]>;
  totalSets: number;
  dateCount: number;
}

export type WorkoutCsvResult =
  | { ok: true; data: ParsedWorkoutImport }
  | { ok: false; error: string };

function normalizeHeader(value: string): string {
  return value
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function fieldForHeader(value: string): FieldName | null {
  const normalized = normalizeHeader(value);
  if (!normalized) return null;
  for (const field of HEADER) {
    if (ALIASES[field].includes(normalized)) return field;
  }
  return null;
}

function tokenize(input: string, delimiter: string): CsvRecord[] {
  const records: CsvRecord[] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let line = 1;
  let recordLine = 1;

  const finishRecord = () => {
    row.push(field);
    if (row.some((value) => value.trim() !== "")) {
      records.push({ values: row, line: recordLine });
    }
    row = [];
    field = "";
  };

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    const next = input[index + 1];

    if (inQuotes) {
      if (character === '"') {
        if (next === '"') {
          field += '"';
          index += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += character;
        if (character === "\n") line += 1;
      }
      continue;
    }

    if (character === '"') {
      inQuotes = true;
    } else if (character === delimiter) {
      row.push(field);
      field = "";
    } else if (character === "\n") {
      finishRecord();
      line += 1;
      recordLine = line;
    } else if (character !== "\r") {
      field += character;
    }
  }

  if (inQuotes) {
    throw new Error("A quoted value is missing its closing quote.");
  }
  finishRecord();

  return records;
}

function chooseDelimiter(input: string): {
  delimiter: string;
  records: CsvRecord[];
} {
  let best: { delimiter: string; records: CsvRecord[]; width: number } | null =
    null;

  for (const delimiter of [",", "\t", ";"]) {
    try {
      const records = tokenize(input, delimiter);
      const width = records[0]?.values.length ?? 0;
      if (!best || width > best.width) {
        best = { delimiter, records, width };
      }
    } catch {
      // Try the next delimiter; an unclosed quote is reported after detection.
    }
  }

  if (!best || best.width < 2) {
    throw new Error(
      'No columns found. Paste CSV with a header row beginning "date,workout,exercise".',
    );
  }
  return { delimiter: best.delimiter, records: best.records };
}

function parseDateValue(value: string): string | null {
  const match = value.trim().match(/^(\d{4})[-/](\d{2})[-/](\d{2})/);
  if (!match) return null;
  const key = `${match[1]}-${match[2]}-${match[3]}`;
  return parseDateKey(key) ? key : null;
}

function parseNullableNumber(
  raw: string,
  label: string,
  options: { integer?: boolean; min?: number; max?: number } = {},
): number | null {
  const cleaned = raw
    .replace(/,/g, "")
    .replace(/\s*(kg|kgs|lb|lbs|reps?|rir)$/i, "")
    .trim();
  if (cleaned === "") return null;

  const value = Number(cleaned);
  const min = options.min ?? 0;
  const max = options.max ?? Number.POSITIVE_INFINITY;
  if (!Number.isFinite(value) || value < min || value > max) {
    const range = Number.isFinite(max) ? `${min} to ${max}` : `at least ${min}`;
    throw new Error(`${label} must be a number ${range}.`);
  }
  return options.integer ? Math.round(value) : value;
}

function parseBoolean(raw: string, label: string, fallback: boolean): boolean {
  const cleaned = raw.trim().toLowerCase();
  if (cleaned === "") return fallback;
  if (["true", "yes", "y", "1", "done", "completed"].includes(cleaned)) {
    return true;
  }
  if (["false", "no", "n", "0", "skipped", "incomplete"].includes(cleaned)) {
    return false;
  }
  throw new Error(`${label} must be true or false.`);
}

export function normalizeWorkoutType(label: string): Workout | null {
  const compact = label.toLowerCase().replace(/[^a-z0-9]/g, "");
  for (const option of WORKOUT_OPTIONS) {
    if (option.toLowerCase().replace(/[^a-z0-9]/g, "") === compact) {
      return option;
    }
  }
  return null;
}

export function parseWorkoutCsv(
  input: string,
  options: { startDate: string; endDate: string; fallbackDate?: string },
): WorkoutCsvResult {
  const text = input.trim();
  if (!text) {
    return { ok: false, error: "Paste your workout CSV first." };
  }

  let records: CsvRecord[];
  try {
    records = chooseDelimiter(text).records;
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "That CSV couldn't be read.",
    };
  }

  if (records.length === 0) {
    return { ok: false, error: "No workout rows were found in that paste." };
  }

  const firstCells = records[0].values;
  const dateInFirstCell = parseDateValue(firstCells[0] ?? "");
  const recognizedHeaders = firstCells
    .map((cell) => fieldForHeader(cell))
    .filter((field): field is FieldName => field !== null);
  const hasHeader = !dateInFirstCell && recognizedHeaders.length > 0;

  const columnIndex = new Map<FieldName, number>();
  let dataRecords = records;

  if (hasHeader) {
    for (let index = 0; index < firstCells.length; index += 1) {
      const field = fieldForHeader(firstCells[index]);
      if (field && !columnIndex.has(field)) {
        columnIndex.set(field, index);
      }
    }

    for (const required of ["date", "workout", "exercise"] as const) {
      if (!columnIndex.has(required)) {
        return {
          ok: false,
          error: `The header is missing the "${required}" column.`,
        };
      }
    }
    dataRecords = records.slice(1);
  } else {
    HEADERLESS_ORDER.forEach((field, index) => columnIndex.set(field, index));
  }

  if (dataRecords.length === 0) {
    return { ok: false, error: "The header looks good, but there are no set rows yet." };
  }
  if (dataRecords.length > 500) {
    return {
      ok: false,
      error: `That paste has ${dataRecords.length} rows. Keep it under 500 sets at a time.`,
    };
  }

  const days: Record<string, WorkoutSet[]> = {};
  const setCounts = new Map<string, number>();
  let totalSets = 0;

  for (const record of dataRecords) {
    const value = (field: FieldName): string => {
      const index = columnIndex.get(field);
      return index === undefined ? "" : (record.values[index] ?? "").trim();
    };

    const rawDate = value("date");
    if (!rawDate && fieldForHeader(record.values[0] ?? "") === "date") {
      continue; // A repeated header row in a long paste.
    }

    try {
      let dateKey = parseDateValue(rawDate);
      if (!dateKey) {
        if (!rawDate && options.fallbackDate) {
          dateKey = options.fallbackDate;
        } else {
          throw new Error(
            rawDate
              ? `date "${rawDate}" must be YYYY-MM-DD.`
              : "date is required.",
          );
        }
      }
      if (dateKey < options.startDate || dateKey > options.endDate) {
        throw new Error(
          `date ${dateKey} is outside this challenge (${options.startDate} to ${options.endDate}).`,
        );
      }

      const workout = value("workout").slice(0, 60);
      if (!workout) throw new Error("workout is required.");

      const exercise = value("exercise").slice(0, 80);
      if (!exercise) throw new Error("exercise is required.");

      const setNumberValue = parseNullableNumber(
        value("set_number"),
        "set_number",
        { integer: true, min: 1, max: 999 },
      );

      const countKey = `${workout.toLowerCase()}|${exercise.toLowerCase()}`;
      const nextAutoSet = (setCounts.get(countKey) ?? 0) + 1;
      setCounts.set(
        countKey,
        setNumberValue == null ? nextAutoSet : Math.max(nextAutoSet, setNumberValue),
      );

      const actualReps = parseNullableNumber(value("actual_reps"), "actual_reps", {
        integer: true,
        min: 0,
        max: 1000,
      });
      const weightKg = parseNullableNumber(value("weight_kg"), "weight_kg", {
        min: 0,
        max: 1000,
      });
      const rir = parseNullableNumber(value("rir"), "rir", { min: 0, max: 20 });

      const set: WorkoutSet = {
        workout,
        exercise,
        muscleGroup: value("muscle_group").slice(0, 40),
        setNumber: setNumberValue ?? nextAutoSet,
        plannedReps: value("planned_reps").slice(0, 24),
        actualReps,
        weightKg,
        assisted: parseBoolean(value("assisted"), "assisted", false),
        rir,
        completed: parseBoolean(value("completed"), "completed", true),
        notes: value("notes").slice(0, 500),
      };

      if (!days[dateKey]) days[dateKey] = [];
      days[dateKey].push(set);
      totalSets += 1;

      if (days[dateKey].length > 200) {
        throw new Error(`more than 200 sets for ${dateKey}.`);
      }
    } catch (error) {
      return {
        ok: false,
        error: `Line ${record.line}: ${
          error instanceof Error ? error.message : "that row couldn't be read."
        }`,
      };
    }
  }

  const dateCount = Object.keys(days).length;
  if (totalSets === 0 || dateCount === 0) {
    return { ok: false, error: "No workout rows were found in that paste." };
  }

  return { ok: true, data: { days, totalSets, dateCount } };
}

function csvEscape(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function serializeWorkoutCsv(date: string, sets: WorkoutSet[]): string {
  const lines = [HEADER.join(",")];
  for (const set of sets) {
    const row = [
      date,
      set.workout,
      set.exercise,
      set.muscleGroup,
      set.setNumber == null ? "" : String(set.setNumber),
      set.plannedReps,
      set.actualReps == null ? "" : String(set.actualReps),
      set.weightKg == null ? "" : String(set.weightKg),
      set.assisted ? "true" : "false",
      set.rir == null ? "" : String(set.rir),
      set.completed ? "true" : "false",
      set.notes,
    ];
    lines.push(row.map(csvEscape).join(","));
  }
  return lines.join("\n");
}

export const WORKOUT_CSV_PLACEHOLDER = `date,workout,exercise,muscle_group,set_number,planned_reps,actual_reps,weight_kg,assisted,rir,completed,notes
2026-11-02,Upper A,Barbell Bench Press,Chest,1,6-8,5,60,false,,true,`;
