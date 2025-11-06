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

type SiswaSession = {
  role: "siswa";
  studentId: string;
};

export type Session = GuruSession | SiswaSession | null;

type AuthContextValue = {
  session: Session;
  hydrated: boolean;
  loginGuru: (email: string, password: string) => Promise<boolean>;
  loginSiswa: (studentId: string) => void;
  logout: () => void;
};

const STORAGE_KEY = "absen-barcode-session";

const AuthContext = createContext<AuthContextValue | null>(null);

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
        await fetch("/api/auth/ensure-guru", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }).catch(() => {
          // ignore ensure error; login attempt will continue
        });
      } catch {
        // ignore ensure failure
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
          user?: { email: string; name: string };
        };

        if (!payload.success || !payload.user) {
          return false;
        }

        setSession({
          role: "guru",
          email: payload.user.email,
          name: payload.user.name,
        });
        return true;
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
