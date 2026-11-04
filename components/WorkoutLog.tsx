"use client";

import { useState } from "react";
import {
  AlertCircle,
  ArrowUpFromLine,
  Check,
  ClipboardPaste,
  Minus,
  PencilLine,
  Trash2,
} from "lucide-react";
import { WorkoutSet } from "@/lib/challenge";
import {
  WORKOUT_CSV_PLACEHOLDER,
  normalizeWorkoutType,
  parseWorkoutCsv,
  serializeWorkoutCsv,
} from "@/lib/workout-csv";
import { WorkoutGlyph, workoutDetails } from "./shared";

interface ExerciseGroup {
  key: string;
  workout: string;
  exercise: string;
  muscleGroup: string;
  sets: WorkoutSet[];
}

function groupSets(sets: WorkoutSet[]): ExerciseGroup[] {
  const groups = new Map<string, ExerciseGroup>();
  for (const set of sets) {
    const key = `${set.workout.toLowerCase()}|${set.exercise.toLowerCase()}|${set.muscleGroup.toLowerCase()}`;
    const existing = groups.get(key);
    if (existing) {
      existing.sets.push(set);
    } else {
      groups.set(key, {
        key,
        workout: set.workout,
        exercise: set.exercise,
        muscleGroup: set.muscleGroup,
        sets: [set],
      });
    }
  }
  return Array.from(groups.values());
}

function numberText(value: number | null): string {
  return value == null ? "—" : String(value);
}

export function WorkoutLog({
  date,
  sets,
  startDate,
  endDate,
  onImport,
  onRemove,
}: {
  date: string;
  sets: WorkoutSet[];
  startDate: string;
  endDate: string;
  onImport: (days: Record<string, WorkoutSet[]>) => void;
  onRemove: () => void;
}) {
  const [editing, setEditing] = useState(sets.length === 0);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const groups = groupSets(sets);
  const workoutNames = Array.from(
    new Set(sets.map((set) => set.workout.trim()).filter(Boolean)),
  );
  const workoutLabel =
    workoutNames.length === 1
      ? workoutNames[0]
      : workoutNames.length > 1
        ? `${workoutNames.length} workouts`
        : "Workout";
  const workoutType =
    workoutNames.length === 1 ? normalizeWorkoutType(workoutLabel) : null;
  const workoutTone = workoutType
    ? workoutDetails[workoutType].tone
    : "border-[#e5ded2] bg-[#f6f1e7] text-[#8c887b]";
  const completedCount = sets.filter((set) => set.completed).length;
  const editorOpen = editing || sets.length === 0;

  const openEditor = () => {
    setText(serializeWorkoutCsv(date, sets));
    setError(null);
    setNotice(null);
    setEditing(true);
  };

  const closeEditor = () => {
    setEditing(false);
    setError(null);
    setText("");
    setNotice(null);
  };

  const handleImport = () => {
    const result = parseWorkoutCsv(text, {
      startDate,
      endDate,
      fallbackDate: date,
    });
    if (!result.ok) {
      setError(result.error);
      setNotice(null);
      return;
    }

    onImport(result.data.days);
    setEditing(false);
    setText("");
    setError(null);
    setNotice(
      result.data.dateCount === 1
        ? `${result.data.totalSets} sets saved.`
        : `${result.data.totalSets} sets saved across ${result.data.dateCount} days.`,
    );
  };

  const handleRemove = () => {
    const confirmed = window.confirm(
      "Remove this day's workout log? Calories, protein, steps and weight stay exactly as they are.",
    );
    if (!confirmed) return;
    onRemove();
    closeEditor();
  };

  return (
    <div className="mt-3">
      {sets.length > 0 ? (
        <div className="overflow-hidden rounded-[14px] border border-[#e8e1d4] bg-[#fffdf9]">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#ece5d9] bg-[#faf7f0] px-3 py-2.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[9px] font-bold ${workoutTone}`}
              >
                <WorkoutGlyph workout={workoutType} size={10} />
                {workoutLabel}
              </span>
              <span className="text-[9px] font-semibold text-[#8f8b7f]">
                {sets.length} {sets.length === 1 ? "set" : "sets"} ·{" "}
                {groups.length} {groups.length === 1 ? "exercise" : "exercises"}
                {completedCount < sets.length ? ` · ${completedCount} done` : ""}
              </span>
            </div>
            <span className="tabular text-[9px] font-bold text-[#5d7f5f]">
              {Math.round((completedCount / sets.length) * 100)}% complete
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] table-fixed border-collapse text-left">
              <caption className="sr-only">
                Workout sets for {date}, {sets.length} total
              </caption>
              <thead>
                <tr className="border-b border-[#eae3d6] bg-[#f7f3ea] text-[7px] font-extrabold uppercase tracking-[0.08em] text-[#9b978b]">
                  <th scope="col" className="w-[29%] px-2.5 py-2">
                    Exercise
                  </th>
                  <th scope="col" className="w-[8%] px-1.5 py-2 text-center">
                    Set
                  </th>
                  <th scope="col" className="w-[12%] px-1.5 py-2 text-center">
                    Plan
                  </th>
                  <th scope="col" className="w-[11%] px-1.5 py-2 text-center">
                    Actual
                  </th>
                  <th scope="col" className="w-[14%] px-1.5 py-2 text-center">
                    Load
                  </th>
                  <th scope="col" className="w-[8%] px-1.5 py-2 text-center">
                    RIR
                  </th>
                  <th scope="col" className="w-[18%] px-2 py-2">
                    Notes
                  </th>
                </tr>
              </thead>
              {groups.map((group) => (
                <tbody key={group.key}>
                  {group.sets.map((set, index) => (
                    <tr
                      key={`${group.key}-${set.setNumber ?? index}-${index}`}
                      className="border-b border-[#f0ebe1] align-top last:border-b-0"
                    >
                      {index === 0 ? (
                        <th
                          scope="rowgroup"
                          rowSpan={group.sets.length}
                          className="border-r border-[#f0ebe1] bg-[#fffdf9] px-2.5 py-2.5 text-left align-top"
                        >
                          <span className="block text-[10px] font-bold leading-snug text-[#3d4136]">
                            {group.exercise}
                          </span>
                          {group.muscleGroup ? (
                            <span className="mt-1 inline-flex rounded-full bg-[#f3efe6] px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-[0.06em] text-[#918d81]">
                              {group.muscleGroup}
                            </span>
                          ) : null}
                        </th>
                      ) : null}
                      <td className="px-1.5 py-2.5 text-center">
                        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#f3efe6] px-1 text-[9px] font-bold tabular text-[#74786a]">
                          {numberText(set.setNumber)}
                        </span>
                      </td>
                      <td className="px-1.5 py-2.5 text-center text-[10px] font-semibold tabular text-[#838076]">
                        {set.plannedReps || "—"}
                      </td>
                      <td className="px-1.5 py-2.5 text-center">
                        <span
                          className={`inline-flex items-center gap-0.5 text-[11px] font-bold tabular ${
                            set.completed ? "text-[#47724f]" : "text-[#9c5a4d]"
                          }`}
                        >
                          {numberText(set.actualReps)}
                          {set.completed ? (
                            <Check size={9} strokeWidth={3} aria-hidden="true" />
                          ) : (
                            <Minus size={9} strokeWidth={3} aria-hidden="true" />
                          )}
                        </span>
                      </td>
                      <td className="px-1.5 py-2.5 text-center">
                        <span className="block text-[10px] font-bold tabular text-[#5e6155]">
                          {set.weightKg == null ? "—" : `${set.weightKg} kg`}
                        </span>
                        {set.assisted ? (
                          <span className="mt-1 inline-flex rounded bg-[#f9e6df] px-1 py-0.5 text-[6.5px] font-extrabold uppercase tracking-[0.04em] text-[#9c5a4d]">
                            Assist
                          </span>
                        ) : null}
                      </td>
                      <td className="px-1.5 py-2.5 text-center text-[10px] font-semibold tabular text-[#838076]">
                        {numberText(set.rir)}
                      </td>
                      <td className="px-2 py-2.5 text-[9px] leading-relaxed text-[#918d81]">
                        {set.notes || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              ))}
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#ece5d9] bg-[#fcfaf5] px-3 py-2">
            <button
              type="button"
              onClick={openEditor}
              className="btn-quiet !min-h-7 !px-2 !text-[9px]"
            >
              <PencilLine size={10} aria-hidden="true" />
              Edit CSV
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="btn-quiet !min-h-7 !px-2 !text-[9px] text-[#a07166] hover:bg-[#f9ebe6] hover:text-[#8d4e43]"
            >
              <Trash2 size={10} aria-hidden="true" />
              Remove log
            </button>
          </div>
        </div>
      ) : null}

      {editorOpen ? (
        <div
          className={`rounded-[14px] border border-dashed border-[#d8d0c0] bg-[#f9f6ef] p-3 ${
            sets.length > 0 ? "mt-2" : ""
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="flex items-center gap-1.5 text-[10px] font-bold text-[#5e6155]">
                <ClipboardPaste size={11} className="text-[#7d8b72]" aria-hidden="true" />
                Paste workout CSV
              </p>
              <p className="mt-0.5 text-[9px] leading-relaxed text-[#9a9589]">
                Keep the header row. Rows are filed by date, so a multi-day paste
                updates each day automatically.
              </p>
            </div>
            {sets.length > 0 ? (
              <button
                type="button"
                onClick={closeEditor}
                className="shrink-0 text-[9px] font-semibold text-[#8f8b7f] underline decoration-[#ccc5b7] underline-offset-2 hover:text-[#5e6155]"
              >
                Cancel
              </button>
            ) : null}
          </div>

          <textarea
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              if (error) setError(null);
            }}
            placeholder={WORKOUT_CSV_PLACEHOLDER}
            rows={7}
            spellCheck={false}
            className="field mt-2.5 !min-h-[150px] !py-2.5 font-mono !text-[10px] !leading-relaxed"
            aria-label="Workout CSV"
          />

          {error ? (
            <p
              role="alert"
              className="mt-2 flex items-start gap-1.5 rounded-[9px] border border-[#eccbc3] bg-[#f9e6df] px-2.5 py-2 text-[9.5px] font-semibold leading-relaxed text-[#955146]"
            >
              <AlertCircle size={11} className="mt-0.5 shrink-0" aria-hidden="true" />
              {error}
            </p>
          ) : null}

          {notice && !error ? (
            <p className="mt-2 text-[9px] font-semibold text-[#5d7f5f]">{notice}</p>
          ) : null}

          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[8px] font-medium text-[#a09b8f]">
              YYYY-MM-DD dates · up to 500 sets per paste
            </p>
            <button
              type="button"
              onClick={handleImport}
              disabled={!text.trim()}
              className="btn-primary !min-h-8 !px-3 !py-1.5 !text-[10px] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ArrowUpFromLine size={11} aria-hidden="true" />
              Import sets
            </button>
          </div>
        </div>
      ) : null}

    </div>
  );
}
