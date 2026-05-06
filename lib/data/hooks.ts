"use client";

import { useEffect, useSyncExternalStore } from "react";
import { store } from "@/lib/mock/store";
import type { Database } from "@/lib/types";

const emptyDb: Database = {
  teams: {},
  users: {},
  passwords: {},
  tasks: {},
  tickets: {},
  notifications: {},
  invoices: {},
  activity: {},
  metrics: {},
  globalMetrics: [],
  session: { userId: null, activeTeamId: null, impersonatorId: null },
};

// Stable references — the subscribe/getSnapshot args to useSyncExternalStore
// must be the same across renders, otherwise React unsubscribes/resubscribes
// every render and may misbehave.
const subscribe = (fn: () => void) => store.subscribe(fn);
const getSnapshot = () => store.getSnapshot();
const getServerSnapshot = () => emptyDb;

export function useDb(): Database {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useHydrate() {
  useEffect(() => {
    store.hydrate();
  }, []);
}
