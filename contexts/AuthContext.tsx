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

type GuruSession = {
  role: "guru";
  email: string;
  name: string;
};

type SuperAdminSession = {
  role: "superadmin";
  email: string;
  name: string;
};

type SiswaSession = {
  role: "siswa";
  studentId: string;
};

export type Session = GuruSession | SuperAdminSession | SiswaSession | null;

type AuthContextValue = {
  session: Session;
  hydrated: boolean;
  loginGuru: (
    email: string,
    password: string
  ) => Promise<"guru" | "superadmin" | false>;
  loginSiswa: (studentId: string) => void;
  logout: () => void;
};

const STORAGE_KEY = "absen-barcode-session";

const AuthContext = createContext<AuthContextValue | null>(null);
const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 menit

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const hydrated = useHydrated();
  const isClient = typeof window !== "undefined";
  const [session, setSession] = useState<Session>(() => {
    if (!isClient) return null;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    try {
      return JSON.parse(stored) as Session;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (!hydrated || !isClient) return;
    if (session) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, [session, hydrated, isClient]);

  const loginGuru = useCallback(
    async (email: string, password: string) => {
      const trimmedEmail = email.trim();
      const trimmedPassword = password.trim();
      if (!trimmedEmail || !trimmedPassword) {
        return false;
      }

      try {
        const response = await fetch("/api/auth/guru-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: trimmedEmail,
            password: trimmedPassword,
          }),
        });

        if (!response.ok) {
          return false;
        }

        const payload = (await response.json()) as {
          success?: boolean;
          user?: { email: string; name: string; role?: "guru" | "superadmin" };
        };

        if (!payload.success || !payload.user) {
          return false;
        }

        const role = payload.user.role ?? "guru";
        if (role === "superadmin") {
          setSession({
            role: "superadmin",
            email: payload.user.email,
            name: payload.user.name,
          });
          return "superadmin";
        } else {
          setSession({
            role: "guru",
            email: payload.user.email,
            name: payload.user.name,
          });
          return "guru";
        }
      } catch (error) {
        console.error("[AuthContext][loginGuru]", error);
        return false;
      }
    },
    []
  );

  const loginSiswa = useCallback((studentId: string) => {
    const trimmed = studentId.trim();
    if (!trimmed.length) return;
    setSession({
      role: "siswa",
      studentId: trimmed,
    });
  }, []);

  const logout = useCallback(() => {
    setSession(null);
  }, []);

  useEffect(() => {
    if (!hydrated || !isClient || !session) {
      return;
    }

    let timeoutId: number | null = null;
    const clearTimer = () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
        timeoutId = null;
      }
    };

    const scheduleLogout = () => {
      clearTimer();
      timeoutId = window.setTimeout(() => {
        logout();
      }, INACTIVITY_TIMEOUT);
    };

    const handleActivity = () => {
      if (document.hidden) return;
      scheduleLogout();
    };

    const windowEvents: Array<keyof WindowEventMap> = [
      "click",
      "keydown",
      "mousemove",
      "scroll",
      "touchstart",
    ];

    windowEvents.forEach((event) =>
      window.addEventListener(event, handleActivity)
    );
    document.addEventListener("visibilitychange", handleActivity);
    scheduleLogout();

    return () => {
      clearTimer();
      windowEvents.forEach((event) =>
        window.removeEventListener(event, handleActivity)
      );
      document.removeEventListener("visibilitychange", handleActivity);
    };
  }, [hydrated, isClient, session, logout]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      hydrated,
      loginGuru,
      loginSiswa,
      logout,
    }),
    [session, hydrated, loginGuru, loginSiswa, logout]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
