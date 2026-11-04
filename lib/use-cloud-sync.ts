"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Session } from "@supabase/supabase-js";
import { ChallengeData } from "@/lib/challenge";
import {
  CloudSnapshot,
  CloudStatus,
  canonicalData,
  cloudErrorMessage,
  fetchCloudSnapshot,
  hasMeaningfulData,
  saveCloudSnapshot,
  sendMagicLink as sendCloudMagicLink,
  signOutCloud,
} from "@/lib/cloud";
import { cloneData } from "@/lib/storage";
import { getSupabase, isCloudConfigured } from "@/lib/supabase";

export interface CloudSyncState {
  configured: boolean;
  signedIn: boolean;
  email: string | null;
  authLoading: boolean;
  status: CloudStatus;
  error: string | null;
  lastSyncedAt: string | null;
  conflict: CloudSnapshot | null;
  sendMagicLink: (email: string) => Promise<{ ok: boolean; error?: string }>;
  signOut: () => Promise<void>;
  syncNow: () => Promise<{ ok: boolean; reloading?: boolean; error?: string }>;
  useCloud: () => void;
  keepLocal: () => void;
}

export function useCloudSync({
  ready,
  data,
  setData,
}: {
  ready: boolean;
  data: ChallengeData;
  setData: React.Dispatch<React.SetStateAction<ChallengeData>>;
}): CloudSyncState {
  const configured = isCloudConfigured;
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(configured);
  const [status, setStatus] = useState<CloudStatus>(
    configured ? "loading" : "disabled",
  );
  const [error, setError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [conflict, setConflict] = useState<CloudSnapshot | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  const dataRef = useRef(data);
  const lastSyncedRef = useRef("");
  const syncArmedRef = useRef(false);
  const loadedUserRef = useRef("");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveSequenceRef = useRef(0);

  const userId = session?.user.id ?? null;

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const resetSyncState = useCallback(() => {
    loadedUserRef.current = "";
    syncArmedRef.current = false;
    lastSyncedRef.current = "";
    saveSequenceRef.current += 1;
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    setConflict(null);
    setLastSyncedAt(null);
    setError(null);
    setStatus(configured ? "loading" : "disabled");
  }, [configured]);

  useEffect(() => {
    if (!configured) return;

    let client;
    try {
      client = getSupabase();
    } catch (initializationError) {
      // Initialization failures are unusual and must be surfaced immediately.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError(cloudErrorMessage(initializationError));
      setStatus("error");
      setAuthLoading(false);
      return;
    }

    if (!client) {
      setError("Cloud sync is not configured for this build.");
      setStatus("error");
      setAuthLoading(false);
      return;
    }

    let cancelled = false;

    client.auth
      .getSession()
      .then(({ data: sessionData, error: sessionError }) => {
        if (cancelled) return;
        if (sessionError) {
          setError(cloudErrorMessage(sessionError));
          setStatus("error");
        }
        setSession(sessionData.session);
        setAuthLoading(false);
      })
      .catch((sessionError: unknown) => {
        if (cancelled) return;
        setError(cloudErrorMessage(sessionError));
        setStatus("error");
        setAuthLoading(false);
      });

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, nextSession) => {
      if (cancelled) return;
      setSession(nextSession);
      setAuthLoading(false);
      if (!nextSession) resetSyncState();
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [configured, resetSyncState]);

  useEffect(() => {
    if (!configured || !ready || !userId) return;
    if (loadedUserRef.current === userId) return;
    loadedUserRef.current = userId;

    let cancelled = false;
    const local = dataRef.current;

    const hydrate = async () => {
      setStatus("loading");
      setError(null);

      try {
        const snapshot = await fetchCloudSnapshot(userId);
        if (cancelled) return;

        if (!snapshot) {
          const savedAt = await saveCloudSnapshot(userId, local);
          if (cancelled) return;
          lastSyncedRef.current = JSON.stringify(local);
          syncArmedRef.current = true;
          setLastSyncedAt(savedAt);
          setStatus("ready");
          return;
        }

        if (!hasMeaningfulData(local)) {
          const cloudData = cloneData(snapshot.data);
          lastSyncedRef.current = JSON.stringify(cloudData);
          syncArmedRef.current = true;
          setData(cloudData);
          setLastSyncedAt(snapshot.updatedAt);
          setConflict(null);
          setStatus("ready");
          return;
        }

        if (canonicalData(local) === canonicalData(snapshot.data)) {
          lastSyncedRef.current = JSON.stringify(local);
          syncArmedRef.current = true;
          setLastSyncedAt(snapshot.updatedAt);
          setStatus("ready");
          return;
        }

        setConflict(snapshot);
        syncArmedRef.current = false;
        setStatus("conflict");
      } catch (syncError) {
        if (cancelled) return;
        loadedUserRef.current = "";
        syncArmedRef.current = false;
        setError(cloudErrorMessage(syncError));
        setStatus("error");
      }
    };

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, [configured, ready, userId, retryKey, setData]);

  useEffect(() => {
    if (!configured || !ready || !userId) return;
    if (!syncArmedRef.current || conflict) return;

    const serialized = JSON.stringify(data);
    if (serialized === lastSyncedRef.current) return;

    let cancelled = false;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    saveTimerRef.current = setTimeout(() => {
      const sequence = ++saveSequenceRef.current;
      setStatus("saving");

      saveCloudSnapshot(userId, data)
        .then((updatedAt) => {
          if (cancelled || sequence !== saveSequenceRef.current) return;
          lastSyncedRef.current = serialized;
          setLastSyncedAt(updatedAt);
          setError(null);
          setStatus("ready");
        })
        .catch((syncError: unknown) => {
          if (cancelled || sequence !== saveSequenceRef.current) return;
          setError(cloudErrorMessage(syncError));
          setStatus("error");
        });
    }, 1200);

    return () => {
      cancelled = true;
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
    };
  }, [configured, ready, userId, data, conflict]);

  const sendMagicLink = useCallback(
    async (email: string) => {
      try {
        await sendCloudMagicLink(email);
        return { ok: true };
      } catch (authError) {
        return { ok: false, error: cloudErrorMessage(authError) };
      }
    },
    [],
  );

  const signOut = useCallback(async () => {
    try {
      await signOutCloud();
    } catch {
      // Clear the local session state even if the network sign-out fails.
    }
    resetSyncState();
    setSession(null);
  }, [resetSyncState]);

  const useCloud = useCallback(() => {
    if (!conflict) return;
    const cloudData = cloneData(conflict.data);
    lastSyncedRef.current = JSON.stringify(cloudData);
    syncArmedRef.current = true;
    setData(cloudData);
    setLastSyncedAt(conflict.updatedAt);
    setConflict(null);
    setError(null);
    setStatus("ready");
  }, [conflict, setData]);

  const keepLocal = useCallback(() => {
    if (!conflict) return;
    syncArmedRef.current = true;
    setConflict(null);
    setError(null);
    setStatus("ready");
  }, [conflict]);

  const syncNow = useCallback(async () => {
    const currentUserId = session?.user.id;
    if (!configured || !currentUserId) {
      return { ok: false, error: "Sign in before syncing." };
    }
    if (conflict) {
      return { ok: false, error: "Choose which backup to keep first." };
    }
    if (!syncArmedRef.current) {
      loadedUserRef.current = "";
      setRetryKey((key) => key + 1);
      return { ok: true, reloading: true };
    }

    const snapshot = dataRef.current;
    const serialized = JSON.stringify(snapshot);
    setStatus("saving");
    setError(null);

    try {
      const updatedAt = await saveCloudSnapshot(currentUserId, snapshot);
      lastSyncedRef.current = serialized;
      setLastSyncedAt(updatedAt);
      setStatus("ready");
      return { ok: true };
    } catch (syncError) {
      const message = cloudErrorMessage(syncError);
      setError(message);
      setStatus("error");
      return { ok: false, error: message };
    }
  }, [configured, conflict, session]);

  return {
    configured,
    signedIn: Boolean(session),
    email: session?.user.email ?? null,
    authLoading,
    status,
    error,
    lastSyncedAt,
    conflict,
    sendMagicLink,
    signOut,
    syncNow,
    useCloud,
    keepLocal,
  };
}
