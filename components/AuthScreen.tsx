"use client";

import { FormEvent, useId, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Check,
  Cloud,
  Loader2,
  LockKeyhole,
  Mail,
  MailCheck,
  ShieldCheck,
  Sprout,
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

type SendResult = { ok: boolean; error?: string };

export function AuthScreen({
  onSend,
  cloudError,
}: {
  onSend: (email: string) => Promise<SendResult>;
  cloudError?: string | null;
}) {
  const emailId = useId();
  const [email, setEmail] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const address = email.trim();
    if (!address) {
      setError("Enter the email linked to your private tracker.");
      return;
    }

    setSending(true);
    setError(null);
    const result = await onSend(address);
    setSending(false);

    if (!result.ok) {
      setError(result.error ?? "That sign-in link couldn't be sent. Try again.");
      return;
    }

    setSentTo(address);
    setEmail(address);
  };

  return (
    <div className="min-h-dvh bg-[#f6f2e8]">
      <header className="mx-auto flex h-14 w-full max-w-[1280px] items-center justify-between px-3 sm:h-16 sm:px-5 lg:px-6">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-[11px] bg-[#283b2e] text-[#d7e5d2] shadow-[0_3px_0_#1c2a20] sm:h-9 sm:w-9 sm:rounded-[13px]">
            <Sprout size={16} strokeWidth={2.2} aria-hidden="true" />
          </span>
          <span className="leading-none">
            <span className="block text-[11px] font-extrabold tracking-[0.09em] text-[#303229] sm:text-[12px]">
              THE 90-DAY CUT
            </span>
            <span className="mt-1 block text-[9px] font-semibold uppercase tracking-[0.13em] text-[#939084] sm:text-[10px]">
              Private tracker
            </span>
          </span>
        </div>
        <ThemeToggle />
      </header>

      <main className="mx-auto flex min-h-[calc(100dvh-5.5rem)] w-full max-w-[1280px] items-center justify-center px-3 pb-10 pt-4 sm:px-5">
        <div className="w-full max-w-[430px] overflow-hidden rounded-[28px] border border-[#e5ded0] bg-[#fcfaf5] shadow-[var(--shadow-soft)]">
          <div className="h-1.5 w-full bg-[#283b2e]" />
          <div className="p-6 sm:p-7">
            <span className="flex h-11 w-11 items-center justify-center rounded-[14px] border border-[#d8e4d2] bg-[#eef5e9] text-[#5f7c60]">
              <LockKeyhole size={19} strokeWidth={2.1} aria-hidden="true" />
            </span>

            <p className="eyebrow mt-4 text-[#8d9984]">Private access</p>
            <h1 className="mt-1 text-[32px] font-bold leading-[0.98] tracking-[-0.055em] text-[#2e3229] sm:text-[36px]">
              Welcome back<span className="display-serif ml-0.5 font-normal text-[#75926f]">.</span>
            </h1>
            <p className="mt-3 text-[12px] leading-relaxed text-[#77786c]">
              This tracker is yours alone. Sign in with a magic link — no password
              to remember, no account for anyone else.
            </p>

            {sentTo ? (
              <div className="mt-5">
                <div className="rounded-[18px] border border-[#d5e5cf] bg-[#f2f8ee] p-4">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e1efda] text-[#5d805d]">
                    <MailCheck size={17} aria-hidden="true" />
                  </span>
                  <p className="mt-2.5 text-[13px] font-bold text-[#426241]">
                    Check your inbox
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-[#6d7f68]">
                    We sent a one-time link to{" "}
                    <span className="font-semibold text-[#4e684c]">{sentTo}</span>.
                    Open it on this device to finish signing in.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSentTo(null);
                    setError(null);
                  }}
                  className="mt-3 inline-flex items-center gap-1 text-[10px] font-bold text-[#6d7f68] underline decoration-[#c7d5c1] underline-offset-4 transition hover:text-[#405a3e]"
                >
                  <Mail size={11} aria-hidden="true" />
                  Use a different email
                </button>
              </div>
            ) : (
              <form onSubmit={handleSend} className="mt-5">
                <label htmlFor={emailId} className="field-label">
                  Email address
                </label>
                <div className="relative mt-1.5">
                  <Mail
                    size={14}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#a09b8f]"
                    aria-hidden="true"
                  />
                  <input
                    id={emailId}
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="you@example.com"
                    className="field !pl-10"
                    aria-describedby={error ? `${emailId}-error` : undefined}
                  />
                </div>

                {error || cloudError ? (
                  <p
                    id={`${emailId}-error`}
                    role="alert"
                    className="mt-2.5 flex items-start gap-1.5 rounded-[10px] border border-[#eccbc3] bg-[#f9e6df] px-2.5 py-2 text-[10px] font-semibold leading-relaxed text-[#955146]"
                  >
                    <AlertCircle
                      size={12}
                      className="mt-0.5 shrink-0"
                      aria-hidden="true"
                    />
                    {error ?? cloudError}
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={sending}
                  className="btn-primary mt-3 w-full justify-between !px-4 disabled:cursor-wait disabled:opacity-70"
                >
                  <span className="inline-flex items-center gap-2">
                    {sending ? (
                      <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                    ) : (
                      <Mail size={14} aria-hidden="true" />
                    )}
                    {sending ? "Sending link…" : "Send magic link"}
                  </span>
                  <ArrowRight size={14} aria-hidden="true" />
                </button>

                <p className="mt-3 flex items-start gap-1.5 text-[9px] leading-relaxed text-[#a09b8f]">
                  <ShieldCheck
                    size={11}
                    className="mt-0.5 shrink-0 text-[#8da087]"
                    aria-hidden="true"
                  />
                  Only this email can read or write your cloud backup. The link
                  expires and can only be used once.
                </p>
              </form>
            )}

            <div className="mt-5 flex items-center gap-2 border-t border-[#ece5d9] pt-4 text-[9px] font-medium text-[#9c978b]">
              <Check size={11} className="text-[#7b9974]" aria-hidden="true" />
              Your browser keeps a local copy too
            </div>
            <div className="mt-1.5 flex items-center gap-2 text-[9px] font-medium text-[#9c978b]">
              <Cloud size={11} className="text-[#7b9974]" aria-hidden="true" />
              Powered by a private Supabase database
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
