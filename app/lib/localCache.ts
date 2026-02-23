"use client";

interface CacheEnvelope<T> {
  timestamp: number;
  data: T;
}

const now = () => Date.now();

const isBrowser = () => typeof window !== "undefined";

export const localCache = {
  read<T>(key: string, maxAgeMs?: number): T | null {
    if (!isBrowser()) return null;

    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return null;

      const parsed = JSON.parse(raw) as CacheEnvelope<T>;
      if (!parsed || typeof parsed !== "object") return null;
      if (!("timestamp" in parsed) || !("data" in parsed)) return null;

      if (maxAgeMs && now() - parsed.timestamp > maxAgeMs) {
        window.localStorage.removeItem(key);
        return null;
      }

      return parsed.data;
    } catch {
      return null;
    }
  },

  write<T>(key: string, data: T): void {
    if (!isBrowser()) return;

    try {
      const payload: CacheEnvelope<T> = {
        timestamp: now(),
        data,
      };
      window.localStorage.setItem(key, JSON.stringify(payload));
    } catch {
      // noop
    }
  },

  remove(key: string): void {
    if (!isBrowser()) return;
    try {
      window.localStorage.removeItem(key);
    } catch {
      // noop
    }
  },
};
