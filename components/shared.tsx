import {
  Activity,
  CalendarCheck2,
  Check,
  Dumbbell,
  Flag,
  Flame,
  Footprints,
  Leaf,
  LockKeyhole,
  Moon,
  PersonStanding,
  Sparkles,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import type { MetricStatus, Workout } from "@/lib/challenge";

export const workoutDetails: Record<
  Workout,
  {
    icon: LucideIcon;
    short: string;
    tone: string;
    dot: string;
  }
> = {
  "Upper A": {
    icon: Dumbbell,
    short: "Upper A",
    tone: "bg-[#e9f2e7] text-[#406a4c] border-[#d2e4cf]",
    dot: "#6b9a74",
  },
  "Lower A": {
    icon: PersonStanding,
    short: "Lower A",
    tone: "bg-[#e4f0f3] text-[#3f6771] border-[#cfe3e9]",
    dot: "#71a2ae",
  },
  Rest: {
    icon: Moon,
    short: "Rest",
    tone: "bg-[#f1ede4] text-[#7d786b] border-[#e5dfd2]",
    dot: "#aaa395",
  },
  "Upper B": {
    icon: Dumbbell,
    short: "Upper B",
    tone: "bg-[#eeecf8] text-[#5e5888] border-[#dfdbee]",
    dot: "#9188b9",
  },
  "Lower B": {
    icon: Activity,
    short: "Lower B",
    tone: "bg-[#faeee6] text-[#8d6044] border-[#efded1]",
    dot: "#c08d6b",
  },
  "Rest / Recovery": {
    icon: Leaf,
    short: "Recovery",
    tone: "bg-[#f1ede4] text-[#69735e] border-[#e5dfd2]",
    dot: "#9ba48d",
  },
};

export function WorkoutGlyph({
  workout,
  size = 14,
  className,
}: {
  workout: Workout | null;
  size?: number;
  className?: string;
}) {
  const Icon = workout ? workoutDetails[workout].icon : Activity;
  return <Icon size={size} className={className} aria-hidden="true" />;
}

export const metricIcons = {
  calories: Flame,
  protein: Dumbbell,
  steps: Footprints,
} as const;

export function metricPipClass(status: MetricStatus): string {
  return `metric-pip metric-pip-${status}`;
}

export function statusLabel(status: MetricStatus): string {
  if (status === "green") return "On target";
  if (status === "yellow") return "Slightly off";
  if (status === "red") return "Off target";
  return "Not logged";
}

export function deltaTone(value: number | null): string {
  if (value == null) return "text-[#8b887d] bg-[#f1ede4] border-[#e5dfd2]";
  if (value < -0.005) return "text-[#3f7054] bg-[#e9f3e8] border-[#d0e4ce]";
  if (value > 0.005) return "text-[#9d594c] bg-[#faece7] border-[#efd5ce]";
  return "text-[#7e7b70] bg-[#f3efe6] border-[#e6dfd3]";
}

export function WeightDelta({
  value,
  label,
  className = "",
}: {
  value: number | null;
  label?: string;
  className?: string;
}) {
  if (value == null) {
    return (
      <span className={`inline-flex items-center gap-1 text-[11px] font-medium text-[#969286] ${className}`}>
        {label ?? "No previous week"}
      </span>
    );
  }
  const down = value < -0.005;
  const up = value > 0.005;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold tabular ${deltaTone(value)} ${className}`}
    >
      {down ? "↓" : up ? "↑" : "→"}
      {Math.abs(value).toFixed(2)} kg
    </span>
  );
}

export function StatusDot({
  status,
  title,
}: {
  status: MetricStatus;
  title: string;
}) {
  const colors: Record<MetricStatus, string> = {
    green: "bg-[#6d9975]",
    yellow: "bg-[#d3ac4c]",
    red: "bg-[#c3786b]",
    empty: "bg-[#d8d2c5]",
  };
  return (
    <span
      role="img"
      aria-label={`${title}: ${statusLabel(status)}`}
      title={`${title}: ${statusLabel(status)}`}
      className={`h-1.5 w-1.5 shrink-0 rounded-full ${colors[status]}`}
    />
  );
}

export const achievementIcons: Record<string, LucideIcon> = {
  sparkles: Sparkles,
  flame: Flame,
  drumstick: Dumbbell,
  footprints: Footprints,
  "calendar-check": CalendarCheck2,
  flag: Flag,
  trophy: Trophy,
  check: Check,
  lock: LockKeyhole,
};

export const achievementTints: Record<
  string,
  { bg: string; iconBg: string; border: string; text: string; bar: string }
> = {
  sage: {
    bg: "bg-[#f3f8f0]",
    iconBg: "bg-[#dfeeda]",
    border: "border-[#dce9d6]",
    text: "text-[#44654b]",
    bar: "bg-[#7fa483]",
  },
  peach: {
    bg: "bg-[#fdf5ee]",
    iconBg: "bg-[#f7e3d4]",
    border: "border-[#efe0d4]",
    text: "text-[#896042]",
    bar: "bg-[#c99b75]",
  },
  butter: {
    bg: "bg-[#fdf9ea]",
    iconBg: "bg-[#f7edc8]",
    border: "border-[#f0e7ce]",
    text: "text-[#7d6a33]",
    bar: "bg-[#cbb76e]",
  },
  lavender: {
    bg: "bg-[#f7f5fd]",
    iconBg: "bg-[#ebe7f8]",
    border: "border-[#e6e1f1]",
    text: "text-[#635e85]",
    bar: "bg-[#9b94c5]",
  },
  rose: {
    bg: "bg-[#fdf3f2]",
    iconBg: "bg-[#f8e2de]",
    border: "border-[#f0ddda]",
    text: "text-[#8e5b53]",
    bar: "bg-[#c58d82]",
  },
  sky: {
    bg: "bg-[#f2f8fa]",
    iconBg: "bg-[#dfeef2]",
    border: "border-[#dcebef]",
    text: "text-[#4d6d76]",
    bar: "bg-[#83aeb8]",
  },
  gold: {
    bg: "bg-[#fdf8e9]",
    iconBg: "bg-[#f6e7b7]",
    border: "border-[#efe3c2]",
    text: "text-[#7e672e]",
    bar: "bg-[#c3a757]",
  },
};

export function SectionHeading({
  kicker,
  title,
  description,
  icon: Icon,
  action,
}: {
  kicker: string;
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="section-kicker mb-2">
          {Icon ? <Icon size={13} strokeWidth={2.4} aria-hidden="true" /> : null}
          {kicker}
        </p>
        <h2 className="max-w-2xl text-[1.65rem] font-semibold leading-tight tracking-[-0.035em] text-[#272a21] sm:text-[2rem]">
          {title}
        </h2>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#7b796f]">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function EmptyDot() {
  return <span className="h-1.5 w-1.5 rounded-full bg-[#d8d2c5]" aria-hidden="true" />;
}
