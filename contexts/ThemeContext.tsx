"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useHydrated } from "@/hooks/useHydrated";

type Theme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (nextTheme: Theme) => void;
};

const STORAGE_KEY = "absen-barcode-theme";

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getInitialTheme(): Theme {
  if (typeof window === "undefined") {
    return "light";
  }
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "dark" || stored === "light") {
    return stored;
  }
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const hydrated = useHydrated();
  const [theme, setThemeState] = useState<Theme>(() => getInitialTheme());

  useEffect(() => {
    if (!hydrated) return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const nextTheme =
      stored === "dark" || stored === "light" ? stored : getInitialTheme();
    const frame = requestAnimationFrame(() => {
      setThemeState(nextTheme);
    });
    return () => cancelAnimationFrame(frame);
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    const root = document.documentElement;
    root.dataset.theme = theme;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme, hydrated]);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      toggleTheme,
      setTheme,
    }),
    [theme, toggleTheme, setTheme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
