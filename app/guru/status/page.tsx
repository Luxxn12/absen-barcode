"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Check, ListChecks, Loader2, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStudents } from "@/contexts/StudentContext";
import {
  AttendanceStatus,
  useAttendance,
} from "@/contexts/AttendanceContext";

type Row = {
  id: string;
  name: string;
  className: string;
  status: AttendanceStatus | "Belum Absen";
  checkIn: string;
};

const statusColors: Record<
  AttendanceStatus | "Belum Absen",
  string
> = {
  Hadir: "bg-emerald-100 text-emerald-600",
  Sakit: "bg-amber-100 text-amber-600",
  Izin: "bg-blue-100 text-blue-600",
  Alfa: "bg-rose-100 text-rose-600",
  "Belum Absen": "bg-slate-100 text-slate-600",
};

export default function GuruStatusPage() {
  const {
    students,
    loading: studentsLoading,
    hydrated: studentsHydrated,
  } = useStudents();
  const {
    getAvailableDates,
    getRecordsByDate,
    updateAttendance,
    loading,
    hydrated: attendanceHydrated,
  } = useAttendance();

  const fallbackDate = useMemo(() => getDateKey(new Date()), []);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const availableDates = getAvailableDates();
  const activeDate = useMemo(() => {
    if (selectedDate && availableDates.includes(selectedDate)) {
      return selectedDate;
    }
    if (availableDates.length > 0) {
      return availableDates[0];
    }
    return selectedDate ?? fallbackDate;
  }, [availableDates, selectedDate, fallbackDate]);
  const [search, setSearch] = useState("");
  const dateOptions =
    availableDates.length > 0 ? availableDates : [activeDate];
  const [pendingStatus, setPendingStatus] = useState<
    Record<string, AttendanceStatus>
  >({});
  const [pendingTimes, setPendingTimes] = useState<Record<string, string>>({});
  const [actionError, setActionError] = useState("");
  const [savingMap, setSavingMap] = useState<Record<string, boolean>>({});

  const recordsForDate = useMemo(
    () => getRecordsByDate(activeDate),
    [getRecordsByDate, activeDate]
  );

  const recordMap = useMemo(() => {
    const map = new Map<string, { status: AttendanceStatus; checkIn: string }>();
    recordsForDate.forEach((record) => {
      map.set(record.studentId, {
        status: record.status,
        checkIn: record.checkIn,
      });
    });
    return map;
  }, [recordsForDate]);

  const summary = useMemo(() => {
    const totals = {
      Hadir: 0,
      Sakit: 0,
      Izin: 0,
      Alfa: 0,
      BelumAbsen: 0,
    };
    students.forEach((student) => {
      const record = recordMap.get(student.id);
      if (!record) {
        totals.BelumAbsen += 1;
        return;
      }
      totals[record.status] += 1;
    });
    return totals;
  }, [students, recordMap]);

  const rows = useMemo<Row[]>(() => {
    const base = students.map<Row>((student) => {
      const record = recordMap.get(student.id);
      return {
        id: student.id,
        name: student.name,
        className: student.className,
        status: record?.status ?? ("Belum Absen" as const),
        checkIn: record?.checkIn ?? "-",
      };
    });

    const term = search.trim().toLowerCase();
    if (!term) return base;

    return base.filter(
      (row) =>
        row.name.toLowerCase().includes(term) ||
        row.className.toLowerCase().includes(term) ||
        row.id.toLowerCase().includes(term)
    );
  }, [students, recordMap, search]);

  const dateLabel = useMemo(() => {
    if (!activeDate) return "-";
    const date = new Date(`${activeDate}T00:00:00`);
    return date.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  }, [activeDate]);

  const totalStudents = students.length;
  const totalDisplayed = rows.length;
  const tanpaKeterangan = summary.Alfa + summary.BelumAbsen;
  const isLoading =
    !studentsHydrated ||
    !attendanceHydrated ||
    studentsLoading ||
    loading;

  if (isLoading) {
    return <StatusSkeleton />;
  }

  const handleStatusDraft = (
    studentId: string,
    nextStatus: AttendanceStatus
  ) => {
    setPendingStatus((prev) => ({
      ...prev,
      [studentId]: nextStatus,
    }));
    if (nextStatus !== "Hadir") {
      setPendingTimes((prev) => ({
        ...prev,
        [studentId]: "",
      }));
    } else {
      setPendingTimes((prev) => {
        const existing = prev[studentId];
        if (existing) {
          return prev;
        }
        const copy = { ...prev };
        copy[studentId] = getCurrentTime();
        return copy;
      });
    }
  };

  const handleTimeDraft = (studentId: string, nextTime: string) => {
    setPendingTimes((prev) => ({
      ...prev,
      [studentId]: nextTime,
    }));
  };

  const handleSave = async (studentId: string) => {
    if (savingMap[studentId]) return;
    const row = rows.find((item) => item.id === studentId);
    if (!row) return;

    const fallbackStatus =
      row.status === "Belum Absen" ? ("Hadir" as AttendanceStatus) : row.status;
    const selectedStatus = pendingStatus[studentId] ?? fallbackStatus;
    const fallbackTime =
      row.checkIn === "-" ? "" : row.checkIn ?? "";
    const selectedTime =
      selectedStatus === "Hadir"
        ? (pendingTimes[studentId] ?? fallbackTime)
        : "";

    const finalTime =
      selectedStatus === "Hadir" ? selectedTime || getCurrentTime() : "-";
    setSavingMap((prev) => ({ ...prev, [studentId]: true }));
    try {
      const saved = await updateAttendance(
        studentId,
        selectedStatus,
        finalTime,
        { date: activeDate }
      );
      if (!saved) {
        setActionError("Gagal menyimpan status kehadiran. Coba lagi.");
        return;
      }
      setActionError("");

      setPendingStatus((prev) => {
        const next = { ...prev };
        delete next[studentId];
        return next;
      });
      setPendingTimes((prev) => {
        const next = { ...prev };
        delete next[studentId];
        return next;
      });
    } finally {
      setSavingMap((prev) => {
        const next = { ...prev };
        delete next[studentId];
        return next;
      });
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-white p-6 shadow-lg shadow-slate-200/40">
        <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-indigo-500">
              Status Harian
            </p>
            <h2 className="text-xl font-semibold text-slate-900">
              Monitoring kehadiran per tanggal
            </h2>
            <p className="text-sm text-slate-500">
              Data ter-update otomatis dari hasil scan siswa. Pantau status
              terbaru untuk <span className="font-semibold text-slate-700">{dateLabel}</span>.
            </p>
          </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-600">
          <ListChecks className="h-4 w-4" />
          {loading ? "Memuat data…" : `${totalStudents} siswa terdaftar`}
        </div>
      </header>

      {actionError && (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-600">
          {actionError}
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryStat
            label="Hadir"
            value={`${summary.Hadir} siswa`}
            accent="from-emerald-500/20 to-emerald-500/40 text-emerald-600"
          />
          <SummaryStat
            label="Sakit"
            value={`${summary.Sakit} siswa`}
            accent="from-amber-500/20 to-amber-500/40 text-amber-600"
          />
          <SummaryStat
            label="Izin"
            value={`${summary.Izin} siswa`}
            accent="from-blue-500/20 to-blue-500/40 text-blue-600"
          />
          <SummaryStat
            label="Tanpa Keterangan"
            value={`${tanpaKeterangan} siswa`}
            accent="from-rose-500/20 to-rose-500/40 text-rose-600"
          />
        </div>

        <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <select
                value={activeDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                className="w-full appearance-none rounded-2xl border border-slate-200 bg-white px-11 py-3 text-sm text-slate-700 outline-none ring-indigo-500 focus:border-indigo-500 focus:ring-2"
              >
                {dateOptions.map((date) => (
                  <option key={date} value={date}>
                    {formatOptionLabel(date)}
                  </option>
                ))}
              </select>
            </div>
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-11 py-3 text-sm text-slate-700 outline-none ring-indigo-500 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2"
                placeholder="Cari nama, kelas, atau ID siswa"
              />
            </div>
          </div>
          <p className="text-xs text-slate-400">
            Menampilkan{" "}
            <strong className="text-slate-700">{totalDisplayed}</strong> siswa
            dari{" "}
            <strong className="text-slate-700">{totalStudents}</strong> total
            data.
          </p>
        </div>

        <div className="mt-6 overflow-hidden rounded-3xl border border-slate-100">
          <table className="min-w-full bg-white text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-widest text-slate-500">
              <tr>
                <th className="px-6 py-3">Nama</th>
                <th className="px-6 py-3">Kelas</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Jam Absen</th>
                <th className="px-6 py-3 text-right">Perbarui</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {rows.map((row) => {
                const draftStatus =
                  pendingStatus[row.id] ??
                  (row.status === "Belum Absen" ? "Hadir" : row.status);
                const baseTime =
                  pendingTimes[row.id] ??
                  (row.checkIn === "-" ? "" : row.checkIn);
                const isHadir = draftStatus === "Hadir";
                const isSaving = Boolean(savingMap[row.id]);
                const timeValue = isHadir ? baseTime : "";

                return (
                  <tr key={row.id} className="transition hover:bg-slate-50/60">
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {row.name}
                      <p className="text-xs font-normal text-slate-400 lg:hidden">
                        {row.className}
                      </p>
                    </td>
                    <td className="px-6 py-4 max-lg:hidden">{row.className}</td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold",
                          statusColors[row.status]
                        )}
                      >
                        <span className="h-2 w-2 rounded-full bg-current" />
                        {row.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {row.checkIn === "-"
                        ? "Belum tercatat"
                        : `${row.checkIn} WIB`}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                          <select
                            value={draftStatus}
                            onChange={(event) =>
                              handleStatusDraft(
                                row.id,
                                event.target.value as AttendanceStatus
                              )
                            }
                            disabled={isSaving}
                            className="w-full rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 sm:w-32 disabled:cursor-not-allowed disabled:bg-slate-100"
                          >
                            {statusOptions.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                          <input
                            type="time"
                            value={timeValue}
                            onChange={(event) =>
                              handleTimeDraft(row.id, event.target.value)
                            }
                            disabled={!isHadir || isSaving}
                            className="w-full rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 sm:w-24 disabled:cursor-not-allowed disabled:bg-slate-100"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => void handleSave(row.id)}
                          disabled={loading || isSaving}
                          className="inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
                        >
                          {isSaving ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              Menyimpan...
                            </>
                          ) : (
                            <>
                              <Check className="h-3.5 w-3.5" />
                              Simpan
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {rows.length === 0 && (
            <div className="p-10 text-center text-sm text-slate-500">
              Tidak ada data siswa untuk filter yang dipilih.
            </div>
          )}
        </div>

        <p className="mt-6 flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-xs text-slate-500">
          <CalendarDays className="h-4 w-4 text-indigo-500" />
          Perubahan status terjadi otomatis saat siswa melakukan scan barcode
          atau diperbarui secara manual oleh admin.
        </p>
      </section>
    </div>
  );
}

function SummaryStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
      <p className="text-xs uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-slate-900">{value}</p>
      <div
        className={cn(
          "mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-widest",
          accent
        )}
      >
        {label}
      </div>
    </div>
  );
}

function getDateKey(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().split("T")[0];
}

function formatOptionLabel(isoDate: string) {
  const date = new Date(`${isoDate}T00:00:00`);
  return date.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

const statusOptions: AttendanceStatus[] = ["Hadir", "Sakit", "Izin", "Alfa"];

function getCurrentTime() {
  const now = new Date();
  return now
    .toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
    .slice(0, 5);
}

function StatusSkeleton() {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-white p-6 shadow-lg shadow-slate-200/40">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
            <div className="h-6 w-64 animate-pulse rounded bg-slate-200" />
            <div className="h-3 w-48 animate-pulse rounded bg-slate-200" />
          </div>
          <div className="h-8 w-40 animate-pulse rounded-full bg-slate-200" />
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={`summary-skel-${index}`}
              className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm"
            >
              <div className="h-3 w-24 animate-pulse rounded bg-slate-200" />
              <div className="mt-3 h-7 w-20 animate-pulse rounded bg-slate-200" />
              <div className="mt-4 h-6 w-28 animate-pulse rounded-full bg-slate-200" />
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="h-12 w-full animate-pulse rounded-2xl bg-slate-200 sm:w-48" />
            <div className="h-12 w-full animate-pulse rounded-2xl bg-slate-200 sm:w-64" />
          </div>
          <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
        </div>

        <div className="mt-6 space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={`row-skel-${index}`}
              className="grid gap-3 rounded-3xl border border-slate-100 bg-white px-6 py-4 shadow-sm sm:grid-cols-[2fr,1fr,1fr,1fr]"
            >
              <div className="space-y-2">
                <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
                <div className="h-3 w-20 animate-pulse rounded bg-slate-200" />
              </div>
              <div className="h-4 w-20 animate-pulse rounded bg-slate-200" />
              <div className="h-6 w-28 animate-pulse rounded-full bg-slate-200" />
              <div className="h-10 w-full animate-pulse rounded-full bg-slate-200 sm:w-40" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
