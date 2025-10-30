"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useHydrated } from "@/hooks/useHydrated";

export type AttendanceStatus = "Hadir" | "Sakit" | "Izin" | "Alfa";

export type Student = {
  id: string;
  name: string;
  className: string;
  lastStatus: AttendanceStatus;
  lastCheckIn: string;
};

type StudentContextValue = {
  students: Student[];
  hydrated: boolean;
  addStudent: (student: AddStudentPayload) => void;
  updateStudent: (
    id: string,
    updates: Partial<Omit<Student, "id">>
  ) => void;
  removeStudent: (id: string) => void;
  getStudentById: (id: string) => Student | undefined;
};

type AddStudentPayload = {
  name: string;
  className: string;
  lastStatus?: AttendanceStatus;
  lastCheckIn?: string;
};

const StudentContext = createContext<StudentContextValue | null>(null);

const STORAGE_KEY = "absen-barcode-students";

const defaultStudents: Student[] = [
  {
    id: "STD-001",
    name: "Ahmad Fauzi",
    className: "X IPA 1",
    lastStatus: "Hadir",
    lastCheckIn: "07:10",
  },
  {
    id: "STD-002",
    name: "Siti Rahma",
    className: "X IPA 2",
    lastStatus: "Sakit",
    lastCheckIn: "—",
  },
  {
    id: "STD-003",
    name: "Budi Santoso",
    className: "X IPS 1",
    lastStatus: "Hadir",
    lastCheckIn: "07:18",
  },
  {
    id: "STD-004",
    name: "Lina Kartika",
    className: "XI IPA 1",
    lastStatus: "Izin",
    lastCheckIn: "—",
  },
];

export function StudentProvider({ children }: { children: React.ReactNode }) {
  const isClient = typeof window !== "undefined";
  const hydrated = useHydrated();
  const [students, setStudents] = useState<Student[]>(() => {
    if (!isClient) return defaultStudents;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return defaultStudents;
    try {
      const parsed = JSON.parse(stored) as Student[];
      if (Array.isArray(parsed) && parsed.length) {
        return parsed;
      }
    } catch {
      // ignore malformed data and fall back to defaults
    }
    return defaultStudents;
  });
  useEffect(() => {
    if (!hydrated || !isClient) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
  }, [hydrated, students, isClient]);

  const value = useMemo<StudentContextValue>(
    () => ({
      students,
      hydrated,
      addStudent: ({ name, className, lastStatus, lastCheckIn }) => {
        setStudents((prev) => [
          ...prev,
          {
            id: `STD-${(prev.length + 1).toString().padStart(3, "0")}`,
            name,
            className,
            lastStatus: lastStatus ?? "Hadir",
            lastCheckIn: lastCheckIn ?? "07:00",
          },
        ]);
      },
      updateStudent: (id, updates) => {
        setStudents((prev) =>
          prev.map((student) =>
            student.id === id ? { ...student, ...updates } : student
          )
        );
      },
      removeStudent: (id) => {
        setStudents((prev) => prev.filter((student) => student.id !== id));
      },
      getStudentById: (id) => students.find((student) => student.id === id),
    }),
    [students, hydrated]
  );

  return (
    <StudentContext.Provider value={value}>
      {children}
    </StudentContext.Provider>
  );
}

export function useStudents() {
  const context = useContext(StudentContext);
  if (!context) {
    throw new Error("useStudents must be used within StudentProvider");
  }
  return context;
}
