"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
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

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "absen-barcode-session";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const isClient = typeof window !== "undefined";
  const hydrated = useHydrated();
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

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      hydrated,
      loginGuru: async (email, password) => {
        const validEmail = "guru@sekolah.id";
        const validPassword = "12345";
        const isValid =
          email.trim().toLowerCase() === validEmail &&
          password.trim() === validPassword;

        if (isValid) {
          setSession({
            role: "guru",
            email: validEmail,
            name: "Bu Guru Admin",
          });
        }
        return isValid;
      },
      loginSiswa: (studentId) => {
        setSession({
          role: "siswa",
          studentId,
        });
      },
      logout: () => setSession(null),
    }),
    [session, hydrated]
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
