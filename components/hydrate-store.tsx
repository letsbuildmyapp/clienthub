"use client";

import { useEffect } from "react";
import { store } from "@/lib/mock/store";

export function HydrateStore() {
  useEffect(() => {
    store.hydrate();
  }, []);
  return null;
}
