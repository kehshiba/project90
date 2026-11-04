"use client";

import { useEffect, useRef, useState } from "react";
import {
  CalendarRange,
  Check,
  Cloud,
  CloudOff,
  Database,
  Download,
  Dumbbell,
  Flame,
  Footprints,
  HardDriveDownload,
  LockKeyhole,
  LogOut,
  RefreshCw,
  RotateCcw,
  Scale,
  ShieldCheck,
  Target,
  Upload,
  UserRound,
  X,
} from "lucide-react";
import { CloudStatus } from "@/lib/cloud";
import {
  ChallengeConfig,
  ChallengeData,
  DEFAULT_CHALLENGE,
  formatShortDate,
  getChallengeEndKey,
  hasDayData,
  parseDateKey,
} from "@/lib/challenge";
import {
  exportChallengeData,
  parseImportFile,
} from "@/lib/storage";

interface SettingsDraft {
  name: string;
  startDate: string;
  startingWeight: string;
  weekdayCaloriesMin: string;
  weekdayCaloriesMax: string;
  weekendCaloriesMin: string;
  weekendCaloriesMax: string;
  protein: string;
  steps: string;
  gymSessionsPerWeek: string;
}

function buildDraft(config: ChallengeConfig): SettingsDraft {
  return {
    name: config.name,
    startDate: config.startDate,
    startingWeight: String(config.startingWeight),
    weekdayCaloriesMin: String(config.targets.weekdayCaloriesMin),
    weekdayCaloriesMax: String(config.targets.weekdayCaloriesMax),
    weekendCaloriesMin: String(config.targets.weekendCaloriesMin),
    weekendCaloriesMax: String(config.targets.weekendCaloriesMax),
    protein: String(config.targets.protein),
    steps: String(config.targets.steps),
    gymSessionsPerWeek: String(config.targets.gymSessionsPerWeek),
  };
}

function parseNumber(value: string): number {
  const cleaned = value.replace(/,/g, "").trim();
  return Number(cleaned);
}

function formatCloudTimestamp(value: string | null): string {
  if (!value) return "Not synced yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function cloudStatusDetails(status: CloudStatus): {
  label: string;
  tone: string;
} {
  if (status === "disabled") {
    return {
      label: "Local only",
      tone: "border-[#e5ded1] bg-[#f8f4ec] text-[#8b887d]",
    };
  }
  if (status === "saving") {
    return {
      label: "Saving",
      tone: "border-[#d5e4cf] bg-[#f2f8ee] text-[#5a7558]",
    };
  }
  if (status === "error") {
    return {
      label: "Needs retry",
      tone: "border-[#eccbc3] bg-[#faeae5] text-[#96594d]",
    };
  }
  if (status === "conflict") {
    return {
      label: "Review",
      tone: "border-[#ead9b9] bg-[#fcf6e6] text-[#856f3e]",
    };
  }
  if (status === "loading") {
    return {
      label: "Syncing",
      tone: "border-[#e5ded1] bg-[#f8f4ec] text-[#8b887d]",
    };
  }
  return {
    label: "Protected",
    tone: "border-[#d5e4cf] bg-[#f2f8ee] text-[#5a7558]",
  };
}

function SettingsInput({
  label,
  value,
  onChange,
  suffix,
  min,
  max,
  step = "1",
  type = "number",
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  suffix?: string;
  min?: number;
  max?: number;
  step?: string;
  type?: string;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      <div className="relative mt-1.5">
        <input
          type={type}
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(event) => onChange(event.target.value)}
          className={`field ${suffix ? "pr-12" : ""} ${type === "date" ? "tabular" : "tabular"}`}
        />
        {suffix ? (
          <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-[#a7a194]">
            {suffix}
          </span>
        ) : null}
      </div>
      {hint ? <p className="mt-1.5 text-[9px] leading-relaxed text-[#a19c90]">{hint}</p> : null}
    </label>
  );
}

export function SettingsModal({
  data,
  cloud,
  onClose,
  onSaveSettings,
  onImport,
  onReset,
}: {
  data: ChallengeData;
  cloud: {
    configured: boolean;
    email: string | null;
    status: CloudStatus;
    error: string | null;
    lastSyncedAt: string | null;
    conflict: boolean;
    onSyncNow: () => void;
    onSignOut: () => void;
  };
  onClose: () => void;
  onSaveSettings: (challenge: ChallengeConfig) => void;
  onImport: (data: ChallengeData, warning?: string) => void;
  onReset: () => void;
}) {
  const [draft, setDraft] = useState<SettingsDraft>(() => buildDraft(data.challenge));
  const [error, setError] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [pendingImport, setPendingImport] = useState<ChallengeData | null>(null);
  const [pendingImportWarning, setPendingImportWarning] = useState<string | undefined>();
  const [pendingName, setPendingName] = useState("");
  const [backupMessage, setBackupMessage] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
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
    };
  }, [onClose]);

  const updateDraft = (key: keyof SettingsDraft, value: string) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setError(null);
  };

  const endDate = parseDateKey(draft.startDate)
    ? getChallengeEndKey({
        ...data.challenge,
        startDate: draft.startDate,
      })
    : null;

  const handleSave = () => {
    const name = draft.name.trim();
    if (!name) {
      setError("Give your challenge a name.");
      return;
    }
    if (!parseDateKey(draft.startDate)) {
      setError("Choose a valid start date.");
      return;
    }

    const startingWeight = parseNumber(draft.startingWeight);
    const weekdayMin = parseNumber(draft.weekdayCaloriesMin);
    const weekdayMax = parseNumber(draft.weekdayCaloriesMax);
    const weekendMin = parseNumber(draft.weekendCaloriesMin);
    const weekendMax = parseNumber(draft.weekendCaloriesMax);
    const protein = parseNumber(draft.protein);
    const steps = parseNumber(draft.steps);
    const gym = parseNumber(draft.gymSessionsPerWeek);

    if (!Number.isFinite(startingWeight) || startingWeight < 20 || startingWeight > 500) {
      setError("Starting weight should be between 20 and 500 kg.");
      return;
    }
    if (!Number.isFinite(weekdayMin) || !Number.isFinite(weekdayMax) || weekdayMin < 500 || weekdayMax > 10000 || weekdayMin >= weekdayMax) {
      setError("Weekday calories need a valid range between 500 and 10,000 kcal, with the minimum lower than the maximum.");
      return;
    }
    if (!Number.isFinite(weekendMin) || !Number.isFinite(weekendMax) || weekendMin < 500 || weekendMax > 10000 || weekendMin >= weekendMax) {
      setError("Weekend calories need a valid range between 500 and 10,000 kcal, with the minimum lower than the maximum.");
      return;
    }
    if (!Number.isFinite(protein) || protein < 1 || protein > 1000) {
      setError("Protein target should be between 1 and 1,000 g.");
      return;
    }
    if (!Number.isFinite(steps) || steps < 1 || steps > 100000) {
      setError("Step target should be between 1 and 100,000.");
      return;
    }
    if (!Number.isInteger(gym) || gym < 0 || gym > 14) {
      setError("Weekly gym sessions should be a whole number from 0 to 14.");
      return;
    }

    onSaveSettings({
      ...data.challenge,
      name,
      startDate: draft.startDate,
      duration: data.challenge.duration,
      startingWeight,
      targets: {
        weekdayCaloriesMin: Math.round(weekdayMin),
        weekdayCaloriesMax: Math.round(weekdayMax),
        weekendCaloriesMin: Math.round(weekendMin),
        weekendCaloriesMax: Math.round(weekendMax),
        protein: Math.round(protein),
        steps: Math.round(steps),
        gymSessionsPerWeek: gym,
      },
    });
  };

  const handleFileChange = async (file: File | undefined) => {
    if (!file) return;
    setImportError(null);
    setBackupMessage(null);
    setPendingImport(null);
    setPendingName(file.name);

    if (file.size > 5 * 1024 * 1024) {
      setImportError("That backup is larger than 5 MB. Double-check the file.");
      return;
    }

    const result = await parseImportFile(file);
    if (!result.ok) {
      setImportError(result.error);
      return;
    }
    setPendingImport(result.data);
    setPendingImportWarning(result.warning);
  };

  const handleConfirmImport = () => {
    if (!pendingImport) return;
    onImport(pendingImport, pendingImportWarning);
  };

  const handleExport = () => {
    exportChallengeData(data);
    setBackupMessage("Backup downloaded.");
  };

  const handleReset = () => {
    onReset();
  };

  const loggedCount = Object.entries(data.days).filter(([, entry]) => hasDayData(entry)).length;
  const defaultTargets = DEFAULT_CHALLENGE.targets;
  const cloudState = cloudStatusDetails(cloud.status);
  const cloudSignedIn = cloud.configured && Boolean(cloud.email);
  const cloudBusy =
    cloud.status === "loading" || cloud.status === "saving" || cloud.conflict;

  return (
    <>
      <div className="overlay-backdrop" onClick={onClose} aria-hidden="true" />
      <div className="fixed inset-0 z-[71] flex items-center justify-center p-3 sm:p-6">
        <div
          ref={panelRef}
          className="modal-panel flex max-h-[min(90dvh,880px)] flex-col"
          role="dialog"
          aria-modal="true"
          aria-labelledby="settings-title"
        >
          <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[#e9e2d5] px-5 pb-4 pt-5 sm:px-7 sm:pt-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#eaf1e4] text-[#5b795f]">
                  <Target size={15} strokeWidth={2.2} />
                </span>
                <div>
                  <p className="eyebrow text-[#989386]">Make it yours</p>
                  <h2 id="settings-title" className="mt-0.5 text-[22px] font-bold tracking-[-0.04em] text-[#2e3229]">
                    Settings & backups
                  </h2>
                </div>
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-[#959084]">
                Targets can change. Your logged days stay exactly where they are.
              </p>
            </div>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              className="icon-button shrink-0"
              aria-label="Close settings"
            >
              <X size={17} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-7 sm:py-5">
            <div className="space-y-4">
              <section className="rounded-[20px] border border-[#e8e1d4] bg-[#fffdf9] p-4">
                <div className="mb-3 flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#f9f0dc] text-[#98793e]">
                    <CalendarRange size={13} />
                  </span>
                  <div>
                    <h3 className="text-[12px] font-bold text-[#383b31]">The challenge</h3>
                    <p className="text-[9px] font-medium text-[#a19c90]">Name, start date and baseline</p>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block sm:col-span-2">
                    <span className="field-label">Challenge name</span>
                    <input
                      type="text"
                      value={draft.name}
                      maxLength={40}
                      onChange={(event) => updateDraft("name", event.target.value)}
                      className="field mt-1.5"
                    />
                  </label>
                  <SettingsInput
                    label="Start date"
                    type="date"
                    value={draft.startDate}
                    onChange={(value) => updateDraft("startDate", value)}
                    hint={endDate ? `Ends ${formatShortDate(endDate)} · ${data.challenge.duration} days` : "Choose a valid date"}
                  />
                  <SettingsInput
                    label="Starting weight"
                    value={draft.startingWeight}
                    onChange={(value) => updateDraft("startingWeight", value)}
                    suffix="kg"
                    min={20}
                    max={500}
                    step="0.01"
                    hint="The baseline for your total change"
                  />
                </div>
                <div className="mt-3 flex items-start gap-2 rounded-[12px] border border-[#eae3d6] bg-[#f9f5ed] px-3 py-2">
                  <LockKeyhole size={11} className="mt-0.5 shrink-0 text-[#9a9589]" />
                  <p className="text-[9px] leading-relaxed text-[#9d988c]">
                    The 90-day length is fixed. Changing the start date keeps every
                    existing day in your data and backup.
                  </p>
                </div>
              </section>

              <section className="rounded-[20px] border border-[#e8e1d4] bg-[#fffdf9] p-4">
                <div className="mb-3 flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#eaf2e5] text-[#5f7c60]">
                    <Flame size={13} />
                  </span>
                  <div>
                    <h3 className="text-[12px] font-bold text-[#383b31]">Calorie targets</h3>
                    <p className="text-[9px] font-medium text-[#a19c90]">A comfortable range, not a hard ceiling</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <SettingsInput
                    label="Weekday minimum"
                    value={draft.weekdayCaloriesMin}
                    onChange={(value) => updateDraft("weekdayCaloriesMin", value)}
                    suffix="kcal"
                    min={500}
                    max={10000}
                  />
                  <SettingsInput
                    label="Weekday maximum"
                    value={draft.weekdayCaloriesMax}
                    onChange={(value) => updateDraft("weekdayCaloriesMax", value)}
                    suffix="kcal"
                    min={500}
                    max={10000}
                  />
                  <SettingsInput
                    label="Weekend minimum"
                    value={draft.weekendCaloriesMin}
                    onChange={(value) => updateDraft("weekendCaloriesMin", value)}
                    suffix="kcal"
                    min={500}
                    max={10000}
                  />
                  <SettingsInput
                    label="Weekend maximum"
                    value={draft.weekendCaloriesMax}
                    onChange={(value) => updateDraft("weekendCaloriesMax", value)}
                    suffix="kcal"
                    min={500}
                    max={10000}
                  />
                </div>
              </section>

              <section className="rounded-[20px] border border-[#e8e1d4] bg-[#fffdf9] p-4">
                <div className="mb-3 flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#eef0e8] text-[#737c63]">
                    <Footprints size={13} />
                  </span>
                  <div>
                    <h3 className="text-[12px] font-bold text-[#383b31]">Movement & training</h3>
                    <p className="text-[9px] font-medium text-[#a19c90]">Daily habits and weekly gym rhythm</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <SettingsInput
                    label="Protein"
                    value={draft.protein}
                    onChange={(value) => updateDraft("protein", value)}
                    suffix="g"
                    min={1}
                    max={1000}
                  />
                  <SettingsInput
                    label="Daily steps"
                    value={draft.steps}
                    onChange={(value) => updateDraft("steps", value)}
                    suffix="steps"
                    min={1}
                    max={100000}
                  />
                  <SettingsInput
                    label="Gym sessions"
                    value={draft.gymSessionsPerWeek}
                    onChange={(value) => updateDraft("gymSessionsPerWeek", value)}
                    suffix="per week"
                    min={0}
                    max={14}
                    hint="Upper / lower split"
                  />
                </div>
                <div className="mt-3 flex items-center gap-2 text-[9px] font-medium text-[#a19c90]">
                  <Dumbbell size={10} aria-hidden="true" />
                  Defaults: {defaultTargets.protein} g protein · {defaultTargets.steps.toLocaleString()} steps · {defaultTargets.gymSessionsPerWeek} sessions
                </div>
              </section>

              <section className="rounded-[20px] border border-[#e8e1d4] bg-[#fffdf9] p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#eaf1e4] text-[#5b795f]">
                      <Cloud size={13} />
                    </span>
                    <div>
                      <h3 className="text-[12px] font-bold text-[#383b31]">Private cloud backup</h3>
                      <p className="text-[9px] font-medium text-[#a19c90]">
                        {cloud.configured ? "Supabase · only your account" : "Not configured in this build"}
                      </p>
                    </div>
                  </div>
                  <span className={`rounded-full border px-2 py-1 text-[8px] font-bold ${cloudState.tone}`}>
                    {cloudState.label}
                  </span>
                </div>

                {cloudSignedIn ? (
                  <>
                    <div className="flex items-center gap-2.5 rounded-[12px] border border-[#e9e3d7] bg-[#faf7f0] px-3 py-2.5">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#e8f0e2] text-[#657f62]">
                        <UserRound size={13} aria-hidden="true" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[8px] font-bold uppercase tracking-[0.09em] text-[#a19c90]">
                          Signed in as
                        </p>
                        <p className="truncate text-[11px] font-bold text-[#4d5045]">
                          {cloud.email}
                        </p>
                      </div>
                      <span
                        title="Row Level Security protects this row"
                        className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#d8e5d2] bg-[#f2f8ee] px-1.5 py-0.5 text-[7px] font-extrabold uppercase tracking-[0.05em] text-[#668063]"
                      >
                        <ShieldCheck size={8} aria-hidden="true" />
                        RLS
                      </span>
                    </div>

                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={cloud.onSyncNow}
                        disabled={cloudBusy}
                        className="btn-secondary justify-start disabled:cursor-default disabled:opacity-45"
                      >
                        <RefreshCw
                          size={14}
                          className={cloud.status === "saving" || cloud.status === "loading" ? "animate-spin" : ""}
                          aria-hidden="true"
                        />
                        Sync now
                      </button>
                      <button
                        type="button"
                        onClick={cloud.onSignOut}
                        className="btn-secondary justify-start"
                      >
                        <LogOut size={14} aria-hidden="true" />
                        Sign out
                      </button>
                    </div>

                    <p className="mt-2 flex items-start gap-1.5 text-[9px] leading-relaxed text-[#a09b8f]">
                      <Cloud size={10} className="mt-0.5 shrink-0 text-[#8da087]" aria-hidden="true" />
                      Last cloud save: {formatCloudTimestamp(cloud.lastSyncedAt)}. Only{" "}
                      {cloud.email} can read or write this row.
                    </p>

                    {cloud.error ? (
                      <p
                        role="alert"
                        className="mt-2 flex items-start gap-1.5 rounded-[10px] border border-[#eccbc3] bg-[#faeae5] px-2.5 py-2 text-[9px] font-semibold leading-relaxed text-[#955146]"
                      >
                        <CloudOff size={11} className="mt-0.5 shrink-0" aria-hidden="true" />
                        {cloud.error}
                      </p>
                    ) : null}
                  </>
                ) : (
                  <div className="rounded-[12px] border border-[#ead9b9] bg-[#fcf6e6] px-3 py-2.5">
                    <p className="text-[10px] font-bold text-[#856f3e]">
                      Cloud sync is off
                    </p>
                    <p className="mt-0.5 text-[9px] leading-relaxed text-[#9a824f]">
                      {cloud.configured
                        ? "Sign in with your owner email to turn on cloud sync."
                        : "This build has no Supabase environment variables, so the app is running in local-only mode. Data stays in this browser."}
                    </p>
                    <p className="mt-1.5 font-mono text-[8px] leading-relaxed text-[#a28b5d]">
                      NEXT_PUBLIC_SUPABASE_URL
                      <br />
                      NEXT_PUBLIC_SUPABASE_ANON_KEY
                    </p>
                  </div>
                )}
              </section>

              <section className="rounded-[20px] border border-[#e8e1d4] bg-[#fffdf9] p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#eaf0f3] text-[#5e7d84]">
                      <Database size={13} />
                    </span>
                    <div>
                      <h3 className="text-[12px] font-bold text-[#383b31]">Your data</h3>
                      <p className="text-[9px] font-medium text-[#a19c90]">
                        {cloudSignedIn ? "Local cache + private cloud snapshot" : "Stored only in this browser"}
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full border border-[#e5ded1] bg-[#f8f4ec] px-2 py-1 text-[8px] font-bold text-[#9b968a]">
                    {loggedCount} logged day{loggedCount === 1 ? "" : "s"}
                  </span>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={handleExport}
                    className="btn-secondary justify-start"
                  >
                    <Download size={14} aria-hidden="true" />
                    Export JSON backup
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="btn-secondary justify-start"
                  >
                    <Upload size={14} aria-hidden="true" />
                    Import a backup
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  className="sr-only"
                  onChange={(event) => {
                    void handleFileChange(event.target.files?.[0]);
                    event.target.value = "";
                  }}
                  aria-label="Choose a JSON backup file"
                />
                <p className="mt-2 flex items-start gap-1.5 text-[9px] leading-relaxed text-[#a29d91]">
                  <ShieldCheck size={10} className="mt-0.5 shrink-0 text-[#8da087]" />
                  A JSON backup holds your settings, every daily entry and all notes.
                  {cloudSignedIn
                    ? " The file is created on this device; your regular cloud snapshot stays private to your account."
                    : " It stays on this device — nothing is uploaded."}
                </p>
                {cloudSignedIn ? (
                  <p className="mt-1.5 flex items-start gap-1.5 text-[9px] leading-relaxed text-[#a29d91]">
                    <Cloud size={10} className="mt-0.5 shrink-0 text-[#8da087]" aria-hidden="true" />
                    Keeping a regular JSON export matters: the free Supabase plan has no
                    automatic backups.
                  </p>
                ) : null}

                {backupMessage ? (
                  <div className="mt-3 flex items-center gap-2 rounded-[11px] border border-[#d6e5d1] bg-[#f0f7ec] px-3 py-2 text-[10px] font-semibold text-[#5d795d]">
                    <Check size={12} />
                    {backupMessage}
                  </div>
                ) : null}

                {importError ? (
                  <div className="mt-3 rounded-[11px] border border-[#eccfc8] bg-[#faeae5] px-3 py-2 text-[10px] font-medium leading-relaxed text-[#96594d]">
                    {importError}
                  </div>
                ) : null}

                {pendingImport ? (
                  <div className="mt-3 rounded-[15px] border border-[#d9e5d3] bg-[#f3f8ef] p-3">
                    <div className="flex items-start gap-2">
                      <HardDriveDownload size={14} className="mt-0.5 shrink-0 text-[#698466]" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold text-[#4d644a]">
                          Backup looks good — {pendingName || "import.json"}
                        </p>
                        <p className="mt-0.5 text-[9px] leading-relaxed text-[#7d8a77]">
                          {Object.keys(pendingImport.days).length} day entries · starts{" "}
                          {formatShortDate(pendingImport.challenge.startDate)} ·{" "}
                          {pendingImport.challenge.duration} days
                        </p>
                        {pendingImportWarning ? (
                          <p className="mt-1 text-[9px] font-medium text-[#9a7b36]">{pendingImportWarning}</p>
                        ) : null}
                        {cloudSignedIn ? (
                          <p className="mt-1 text-[9px] font-medium text-[#9a7b36]">
                            This also replaces your private cloud snapshot after syncing.
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <div className="mt-2.5 flex gap-2">
                      <button
                        type="button"
                        onClick={handleConfirmImport}
                        className="btn-primary !min-h-9 !px-3 !py-1.5 !text-[10px]"
                      >
                        Replace my data
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPendingImport(null);
                          setPendingImportWarning(undefined);
                        }}
                        className="btn-secondary !min-h-9 !px-3 !py-1.5 !text-[10px]"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : null}
              </section>

              <section className={`rounded-[20px] border p-4 ${confirmReset ? "border-[#e8c9c0] bg-[#fdf3f0]" : "border-[#e8e1d4] bg-[#fffdf9]"}`}>
                <div className="flex items-start gap-2.5">
                  <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${confirmReset ? "bg-[#f7e1da] text-[#a15c4f]" : "bg-[#f5f0e7] text-[#8d877a]"}`}>
                    <RotateCcw size={13} />
                  </span>
                  <div className="flex-1">
                    <h3 className="text-[12px] font-bold text-[#3a3d33]">Start fresh</h3>
                    <p className="mt-0.5 text-[9px] leading-relaxed text-[#a19c90]">
                      Resets all {loggedCount} logged days and restores the original settings.
                      This can&apos;t be undone.
                      {cloudSignedIn
                        ? " The cloud snapshot is replaced too, so export a JSON backup first."
                        : ""}
                    </p>
                    {!confirmReset ? (
                      <button
                        type="button"
                        onClick={() => setConfirmReset(true)}
                        className="mt-2 text-[10px] font-bold text-[#9a6257] underline decoration-[#d9b3a9] decoration-1 underline-offset-4 transition hover:text-[#7f4b40]"
                      >
                        Reset challenge
                      </button>
                    ) : (
                      <div className="mt-2.5 rounded-[12px] border border-[#e8cec6] bg-[#fffaf7] p-3">
                        <p className="text-[10px] font-semibold text-[#7e5147]">
                          Are you sure? Everything will be cleared.
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={handleReset}
                            className="inline-flex min-h-9 items-center justify-center rounded-full bg-[#9f5a4d] px-3 py-1.5 text-[10px] font-bold text-white transition hover:bg-[#88483d]"
                          >
                            Yes, reset everything
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmReset(false)}
                            className="btn-secondary !min-h-9 !px-3 !py-1.5 !text-[10px]"
                          >
                            Keep my progress
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={handleExport}
                          className="mt-2 inline-flex items-center gap-1 text-[9px] font-semibold text-[#97796f] underline underline-offset-2"
                        >
                          <Download size={9} />
                          Export a backup first
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {error ? (
                <div className="rounded-[13px] border border-[#eccfc8] bg-[#faeae5] px-3.5 py-3 text-[10px] font-semibold leading-relaxed text-[#95584b]">
                  {error}
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-2 border-t border-[#e8e1d5] bg-[#fcfaf5]/94 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <p className="hidden items-center gap-1.5 text-[9px] font-medium text-[#9e998d] sm:flex">
              <Scale size={10} />
              Targets affect color coding, not your saved entries.
            </p>
            <div className="flex w-full gap-2 sm:w-auto">
              <button type="button" onClick={onClose} className="btn-secondary flex-1 sm:flex-none">
                Cancel
              </button>
              <button type="button" onClick={handleSave} className="btn-primary flex-1 sm:flex-none">
                <Check size={14} />
                Save settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
