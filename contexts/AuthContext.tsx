"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useHydrated } from "@/hooks/useHydrated";
import { fetchJSON } from "@/lib/fetchJSON";

type GuruSession = {
  role: "guru";
  id: string;
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

function normalizeSession(raw: unknown): Session {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const value = raw as Record<string, unknown>;
  if (value.role === "guru") {
    const id = value.id;
    const email = value.email;
    const name = value.name;
    if (
      typeof id === "string" &&
      id.trim().length &&
      typeof email === "string" &&
      email.trim().length &&
      typeof name === "string" &&
      name.trim().length
    ) {
      return {
        role: "guru",
        id: id.trim(),
        email: email.trim(),
        name: name.trim(),
      };
    }
    return null;
  }

  if (value.role === "siswa") {
    const studentId = value.studentId;
    if (typeof studentId === "string" && studentId.trim().length) {
      return {
        role: "siswa",
        studentId: studentId.trim(),
      };
    }
    return null;
  }

  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const isClient = typeof window !== "undefined";
  const hydrated = useHydrated();
  const [session, setSession] = useState<Session>(() => {
    if (!isClient) return null;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    try {
      return normalizeSession(JSON.parse(stored));
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
        const trimmedEmail = email.trim().toLowerCase();
        const trimmedPassword = password.trim();
        if (!trimmedEmail || !trimmedPassword) {
          return false;
        }

        try {
          const user = await fetchJSON<{
            id: string;
            email: string;
            name: string;
          }>("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: trimmedEmail,
              password: trimmedPassword,
            }),
          });
          setSession({
            role: "guru",
            id: user.id,
            email: user.email,
            name: user.name,
          });
          return true;
        } catch (error) {
          console.error("Login guru gagal:", error);
          return false;
        }
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
