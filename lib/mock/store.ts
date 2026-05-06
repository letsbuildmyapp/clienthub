"use client";

import type { Database } from "@/lib/types";
import { freshSeed, SEED_VERSION } from "./seed";

const STORAGE_KEY = "clienthub:db";
const VERSION_KEY = "clienthub:db:version";

type Listener = () => void;

class MockStore {
  // The current snapshot. Each `update` replaces this with a freshly cloned
  // object so `useSyncExternalStore` sees a new reference and re-renders
  // subscribed components.
  private snapshot: Database;
  private listeners = new Set<Listener>();
  private hydrated = false;

  constructor() {
    this.snapshot = freshSeed();
  }

  hydrate() {
    if (this.hydrated || typeof window === "undefined") return;
    this.hydrated = true;
    try {
      const versionRaw = window.localStorage.getItem(VERSION_KEY);
      const version = versionRaw ? parseInt(versionRaw, 10) : 0;
      if (version !== SEED_VERSION) {
        this.snapshot = freshSeed();
        this.persist();
        window.localStorage.setItem(VERSION_KEY, String(SEED_VERSION));
      } else {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          this.snapshot = JSON.parse(raw) as Database;
        }
      }
    } catch {
      // localStorage unavailable; keep in-memory copy.
    }
    this.notify();
  }

  reset() {
    this.snapshot = freshSeed();
    this.persist();
    this.notify();
  }

  getSnapshot(): Database {
    return this.snapshot;
  }

  update(mutator: (db: Database) => void) {
    // Clone first, then mutate the clone, then swap. This gives subscribers
    // a brand-new top-level reference (and fresh inner refs) so React's
    // bail-out check in useSyncExternalStore detects the change.
    const next: Database = clone(this.snapshot);
    mutator(next);
    this.snapshot = next;
    this.persist();
    this.notify();
  }

  subscribe(fn: Listener) {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  private persist() {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.snapshot));
      window.localStorage.setItem(VERSION_KEY, String(SEED_VERSION));
    } catch {
      // ignore
    }
  }
}

function clone<T>(value: T): T {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value)) as T;
}

export const store = new MockStore();
