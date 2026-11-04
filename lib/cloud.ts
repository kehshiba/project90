import {
  ChallengeData,
  createDefaultData,
  hasDayData,
} from "./challenge";
import { validateChallengeData } from "./storage";
import { getSupabase } from "./supabase";

export type CloudStatus =
  | "disabled"
  | "loading"
  | "ready"
  | "saving"
  | "error"
  | "conflict";

export interface CloudSnapshot {
  data: ChallengeData;
  updatedAt: string;
}

function requireSupabase() {
  const client = getSupabase();
  if (!client) {
    throw new Error("Cloud sync is not configured for this build.");
  }
  return client;
}

export function cloudErrorMessage(error: unknown): string {
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === "object" &&
          error !== null &&
          "message" in error &&
          typeof (error as { message: unknown }).message === "string"
        ? (error as { message: string }).message
        : "";

  const message = raw.trim();
  const lower = message.toLowerCase();

  if (
    lower.includes("failed to fetch") ||
    lower.includes("networkerror") ||
    lower.includes("load failed") ||
    lower.includes("network request failed")
  ) {
    return "Couldn't reach the cloud service. Check your connection and try again.";
  }
  if (lower.includes("signups not allowed") || lower.includes("user not found")) {
    return "No confirmed Supabase user matches this email. Check the exact address in Authentication → Users, confirm the user, and make sure this site uses the same Supabase project.";
  }
  if (lower.includes("rate limit") || lower.includes("too many")) {
    return "Too many sign-in emails were requested. Wait a few minutes and try again.";
  }
  if (lower.includes("jwt expired") || lower.includes("invalid jwt")) {
    return "Your cloud session expired. Sign out and sign in again.";
  }
  if (lower.includes("row-level security") || lower.includes("permission denied")) {
    return "The cloud refused this change. Sign out and sign in again.";
  }

  return message || "Cloud sync failed. Check your connection and try again.";
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
    .join(",")}}`;
}

/**
 * JSONB does not preserve object key order, so compare a stable representation
 * and ignore the volatile savedAt timestamp.
 */
export function canonicalData(data: ChallengeData): string {
  const copy = { ...data };
  delete copy.savedAt;
  return stableStringify(copy);
}

export function countLoggedDays(data: ChallengeData): number {
  return Object.values(data.days).filter((entry) => hasDayData(entry)).length;
}

export function hasMeaningfulData(data: ChallengeData): boolean {
  if (countLoggedDays(data) > 0) return true;
  return (
    stableStringify(data.challenge) !==
    stableStringify(createDefaultData().challenge)
  );
}

export async function sendMagicLink(email: string): Promise<void> {
  const supabase = requireSupabase();
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: {
      // The owner account is created once in Supabase. Keeping sign-ups closed
      // means an anonymous visitor cannot create a new account of their own.
      shouldCreateUser: false,
      emailRedirectTo: window.location.origin,
    },
  });
  if (error) throw error;
}

export async function signOutCloud(): Promise<void> {
  const supabase = requireSupabase();
  // Only end this browser's session. Signing out on the laptop should not kick
  // the phone off as well.
  const { error } = await supabase.auth.signOut({ scope: "local" });
  if (error) throw error;
}

export async function fetchCloudSnapshot(
  userId: string,
): Promise<CloudSnapshot | null> {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("challenge_state")
    .select("data, updated_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const validated = validateChallengeData(data.data);
  if (!validated.ok) {
    throw new Error(`The cloud backup could not be read: ${validated.error}`);
  }

  return {
    data: validated.data,
    updatedAt: data.updated_at as string,
  };
}

export async function saveCloudSnapshot(
  userId: string,
  data: ChallengeData,
): Promise<string> {
  const supabase = requireSupabase();
  const serialized = JSON.stringify(data);

  if (serialized.length > 900_000) {
    throw new Error(
      "This backup is too large for one cloud snapshot. Export a JSON file instead.",
    );
  }

  const updatedAt = new Date().toISOString();
  const { data: row, error } = await supabase
    .from("challenge_state")
    .upsert(
      {
        user_id: userId,
        data,
        updated_at: updatedAt,
      },
      { onConflict: "user_id" },
    )
    .select("updated_at")
    .single();

  if (error) throw error;
  return (row?.updated_at as string | undefined) ?? updatedAt;
}
