"use client";

import { useSyncExternalStore } from "react";

let hasHydrated = false;

const subscribe = (callback: () => void) => {
  if (typeof window === "undefined") return () => {};
  if (!hasHydrated) {
    hasHydrated = true;
    callback();
  }
  return () => {};
};

const getSnapshot = () => hasHydrated;

const getServerSnapshot = () => false;

export function useHydrated() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
