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
import { fetchJSON } from "@/lib/fetchJSON";

export type AttendanceStatus = "Hadir" | "Sakit" | "Izin" | "Alfa";

export type AttendanceRecord = {
  id: string;
  studentId: string;
  date: string;
  status: AttendanceStatus;
  checkIn: string;
  createdAt: string;
  updatedAt: string;
};

type AttendanceContextValue = {
  records: AttendanceRecord[];
  hydrated: boolean;
  loading: boolean;
  updateAttendance: (
    studentId: string,
    status: AttendanceStatus,
    checkIn: string,
    options?: { date?: string }
  ) => Promise<AttendanceRecord | null>;
  getRecordForStudent: (
    studentId: string,
    date: string
  ) => AttendanceRecord | undefined;
  getHistoryForStudent: (
    studentId: string,
    limit?: number
  ) => AttendanceRecord[];
  getRecordsByDate: (date: string) => AttendanceRecord[];
  getAvailableDates: () => string[];
  refresh: () => Promise<void>;
};

const AttendanceContext = createContext<AttendanceContextValue | null>(null);

function sortRecords(records: AttendanceRecord[]) {
  return [...records].sort((a, b) => {
    if (a.date === b.date) {
      return b.updatedAt.localeCompare(a.updatedAt);
    }
    return b.date.localeCompare(a.date);
  });
}

export function AttendanceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const hydrated = useHydrated();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchJSON<AttendanceRecord[]>("/api/attendance");
      setRecords(sortRecords(data));
    } catch (error) {
      console.error("Gagal memuat data kehadiran:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    void refresh();
  }, [hydrated, refresh]);

  const updateAttendance = useCallback(
    async (
      studentId: string,
      status: AttendanceStatus,
      checkIn: string,
      options?: { date?: string }
    ) => {
      try {
        const payload = {
          studentId,
          status,
          checkIn,
          date: options?.date,
        };
        const record = await fetchJSON<AttendanceRecord>("/api/attendance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        setRecords((prev) => {
          const index = prev.findIndex(
            (item) =>
              item.studentId === record.studentId && item.date === record.date
          );
          if (index === -1) {
            return sortRecords([...prev, record]);
          }
          const next = [...prev];
          next[index] = record;
          return sortRecords(next);
        });
        return record;
      } catch (error) {
        console.error("Gagal memperbarui kehadiran:", error);
        return null;
      }
    },
    []
  );

  const value = useMemo<AttendanceContextValue>(
    () => ({
      records,
      hydrated,
      loading,
      updateAttendance,
      getRecordForStudent: (studentId, date) =>
        records.find(
          (record) => record.studentId === studentId && record.date === date
        ),
      getHistoryForStudent: (studentId, limit = 5) =>
        sortRecords(records)
          .filter((record) => record.studentId === studentId)
          .slice(0, limit),
      getRecordsByDate: (date) =>
        records.filter((record) => record.date === date),
      getAvailableDates: () => {
        const unique = new Set(records.map((record) => record.date));
        return Array.from(unique).sort((a, b) => b.localeCompare(a));
      },
      refresh,
    }),
    [records, hydrated, loading, updateAttendance, refresh]
  );

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

