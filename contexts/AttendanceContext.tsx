"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useHydrated } from "@/hooks/useHydrated";

export type AttendanceStatus = "Hadir" | "Sakit" | "Izin" | "Alfa";

export type AttendanceRecord = {
  studentId: string;
  date: string;
  status: AttendanceStatus;
  checkIn: string;
};

type AttendanceContextValue = {
  records: AttendanceRecord[];
  hydrated: boolean;
  updateAttendance: (
    studentId: string,
    status: AttendanceStatus,
    checkIn: string,
    options?: { date?: string }
  ) => void;
  getRecordForStudent: (studentId: string, date: string) => AttendanceRecord | undefined;
  getHistoryForStudent: (studentId: string, limit?: number) => AttendanceRecord[];
  getRecordsByDate: (date: string) => AttendanceRecord[];
  getAvailableDates: () => string[];
};

const AttendanceContext = createContext<AttendanceContextValue | null>(null);

const STORAGE_KEY = "absen-barcode-attendance";

function formatDateWithOffset(offset: number) {
  const date = new Date();
  date.setDate(date.getDate() - offset);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().split("T")[0];
}

function createDefaultRecords(): AttendanceRecord[] {
  const make = (
    offset: number,
    studentId: string,
    status: AttendanceStatus,
    checkIn: string
  ): AttendanceRecord => ({
    studentId,
    date: formatDateWithOffset(offset),
    status,
    checkIn,
  });

  return [
    // Hari ini
    make(0, "STD-001", "Hadir", "07:05"),
    make(0, "STD-002", "Sakit", "-"),
    make(0, "STD-003", "Hadir", "07:10"),
    make(0, "STD-004", "Izin", "-"),
    make(0, "STD-005", "Hadir", "07:12"),
    make(0, "STD-006", "Hadir", "07:07"),
    make(0, "STD-007", "Alfa", "-"),
    make(0, "STD-008", "Hadir", "07:09"),
    make(0, "STD-009", "Hadir", "07:04"),
    make(0, "STD-010", "Izin", "-"),
    make(0, "STD-011", "Hadir", "07:06"),
    make(0, "STD-012", "Hadir", "07:08"),
    // Kemarin
    make(1, "STD-001", "Hadir", "07:03"),
    make(1, "STD-002", "Hadir", "07:16"),
    make(1, "STD-003", "Hadir", "07:11"),
    make(1, "STD-004", "Hadir", "07:15"),
    make(1, "STD-005", "Izin", "-"),
    make(1, "STD-006", "Hadir", "07:05"),
    make(1, "STD-007", "Hadir", "07:20"),
    make(1, "STD-008", "Sakit", "-"),
    make(1, "STD-009", "Hadir", "07:02"),
    make(1, "STD-010", "Hadir", "07:18"),
    make(1, "STD-011", "Hadir", "07:09"),
    make(1, "STD-012", "Alfa", "-"),
    // Dua hari lalu
    make(2, "STD-001", "Hadir", "07:08"),
    make(2, "STD-002", "Hadir", "07:05"),
    make(2, "STD-003", "Izin", "-"),
    make(2, "STD-004", "Hadir", "07:10"),
    make(2, "STD-005", "Hadir", "07:14"),
    make(2, "STD-006", "Hadir", "07:06"),
    make(2, "STD-007", "Hadir", "07:13"),
    make(2, "STD-008", "Hadir", "07:07"),
    make(2, "STD-009", "Sakit", "-"),
    make(2, "STD-010", "Hadir", "07:12"),
    make(2, "STD-011", "Hadir", "07:04"),
    make(2, "STD-012", "Hadir", "07:11"),
  ];
}

export function AttendanceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const isClient = typeof window !== "undefined";
  const hydrated = useHydrated();
  const [records, setRecords] = useState<AttendanceRecord[]>(() => {
    if (!isClient) return createDefaultRecords();
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return createDefaultRecords();
    try {
      const parsed = JSON.parse(stored) as AttendanceRecord[];
      if (Array.isArray(parsed) && parsed.length) {
        return parsed;
      }
    } catch {
      // data tidak valid, gunakan default
    }
    return createDefaultRecords();
  });

  useEffect(() => {
    if (!hydrated || !isClient) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }, [hydrated, isClient, records]);

  const value = useMemo<AttendanceContextValue>(() => {
    const sortedRecords = [...records].sort((a, b) => b.date.localeCompare(a.date));

    return {
      records,
      hydrated,
      updateAttendance: (studentId, status, checkIn, options) => {
        const targetDate = options?.date ?? formatDateWithOffset(0);
        setRecords((prev) => {
          const index = prev.findIndex(
            (record) =>
              record.studentId === studentId && record.date === targetDate
          );
          if (index !== -1) {
            const next = [...prev];
            next[index] = {
              ...next[index],
              status,
              checkIn,
            };
            return next;
          }
          return [
            ...prev,
            {
              studentId,
              date: targetDate,
              status,
              checkIn,
            },
          ];
        });
      },
      getRecordForStudent: (studentId, date) =>
        records.find(
          (record) => record.studentId === studentId && record.date === date
        ),
      getHistoryForStudent: (studentId, limit = 5) =>
        sortedRecords
          .filter((record) => record.studentId === studentId)
          .slice(0, limit),
      getRecordsByDate: (date) =>
        records.filter((record) => record.date === date),
      getAvailableDates: () => {
        const unique = new Set(records.map((record) => record.date));
        return Array.from(unique).sort((a, b) => b.localeCompare(a));
      },
    };
  }, [records, hydrated]);

  return (
    <AttendanceContext.Provider value={value}>
      {children}
    </AttendanceContext.Provider>
  );
}

export function useAttendance() {
  const context = useContext(AttendanceContext);
  if (!context) {
    throw new Error("useAttendance must be used within AttendanceProvider");
  }
  return context;
}
