"use client";

import { useMemo } from "react";
import { CalendarDays, CheckCircle2, Clock, Frown, Smile } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useStudents } from "@/contexts/StudentContext";
import {
  AttendanceStatus,
  useAttendance,
} from "@/contexts/AttendanceContext";
import { cn } from "@/lib/utils";

type HistoryItem = {
  date: string;
  status: AttendanceStatus | "Belum Absen";
  checkIn: string;
};

const statusBadge: Record<AttendanceStatus | "Belum Absen", string> = {
  Hadir: "bg-emerald-100 text-emerald-600",
  Sakit: "bg-amber-100 text-amber-600",
  Izin: "bg-blue-100 text-blue-600",
  Alfa: "bg-rose-100 text-rose-600",
  "Belum Absen": "bg-slate-100 text-slate-600",
};

export default function SiswaStatusPage() {
  const { session } = useAuth();
  const { getStudentById } = useStudents();
  const { getRecordForStudent, getHistoryForStudent } = useAttendance();

  const student =
    session?.role === "siswa" ? getStudentById(session.studentId) : null;

  const todayLabel = useMemo(
    () =>
      new Date().toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }),
    []
  );

  const todayKey = useMemo(() => getDateKey(new Date()), []);
  const yesterdayKey = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    return getDateKey(date);
  }, []);

  const todayRecord = useMemo(() => {
    if (!student) return undefined;
    return getRecordForStudent(student.id, todayKey);
  }, [student, getRecordForStudent, todayKey]);

  const historyRecords = useMemo(() => {
    if (!student) return [];
    return getHistoryForStudent(student.id, 4);
  }, [student, getHistoryForStudent]);

  const historyItems = useMemo<HistoryItem[]>(() => {
    const items: HistoryItem[] = [];
    const seen = new Set<string>();

    if (todayRecord) {
      items.push({
        date: todayRecord.date,
        status: todayRecord.status,
        checkIn: todayRecord.checkIn,
      });
      seen.add(todayRecord.date);
    } else if (student) {
      items.push({
        date: todayKey,
        status: "Belum Absen",
        checkIn: "-",
      });
      seen.add(todayKey);
    }

    historyRecords.forEach((record) => {
      if (seen.has(record.date)) return;
      items.push({
        date: record.date,
        status: record.status,
        checkIn: record.checkIn,
      });
      seen.add(record.date);
    });

    return items;
  }, [historyRecords, todayRecord, todayKey, student]);

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }),
    []
  );

  const formatDateLabel = (isoDate: string) => {
    if (isoDate === todayKey) return "Hari ini";
    if (isoDate === yesterdayKey) return "Kemarin";
    const target = new Date(`${isoDate}T00:00:00`);
    return dateFormatter.format(target);
  };

  const statusLabel: AttendanceStatus | "Belum Absen" =
    todayRecord?.status ?? "Belum Absen";
  const checkInLabel = todayRecord?.checkIn ?? "-";
  const statusMessage =
    statusLabel === "Hadir"
      ? "Selamat! Kamu sudah absen."
      : statusLabel === "Belum Absen"
        ? "Belum ada data hari ini. Silakan lakukan scan."
        : "Segera lapor ke guru untuk konfirmasi.";
  const checkInDisplay =
    checkInLabel === "-" ? "Belum tercatat" : `${checkInLabel} WIB`;

  if (!student) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center justify-center gap-3 rounded-3xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500 shadow-sm">
        <Frown className="h-10 w-10 text-slate-400" />
        <p>Data siswa tidak ditemukan. Silakan ulangi proses login.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <section className="rounded-3xl bg-white p-6 shadow-lg shadow-slate-200/40">
        <div className="flex flex-col gap-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-600">
            <CalendarDays className="h-4 w-4" />
            Status Kehadiran Hari Ini
          </span>
          <h2 className="text-xl font-semibold text-slate-900">
            {todayLabel}
          </h2>
        </div>
        <div className="mt-4 flex flex-col gap-4 rounded-3xl border border-slate-100 bg-slate-50 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-400">
              Status Terakhir
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {statusLabel}
            </p>
            <p className="text-sm text-slate-500">
              Jam absen:{" "}
              <span className="font-semibold text-slate-700">
                {checkInDisplay}
              </span>
            </p>
          </div>
          <div
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold",
              statusBadge[statusLabel]
            )}
          >
            <CheckCircle2 className="h-4 w-4" />
            {statusMessage}
          </div>
        </div>
        <div className="mt-5 rounded-2xl bg-white px-4 py-3 text-xs text-slate-500">
          Jika ada kesalahan data, segera hubungi guru atau petugas piket agar
          status kehadiran diperbarui.
        </div>
      </section>

      <section className="space-y-4 rounded-3xl bg-white p-6 shadow-lg shadow-slate-200/40">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-slate-900">
            Riwayat tiga hari terakhir
          </h3>
          <span className="inline-flex items-center gap-2 text-xs text-slate-400">
            <Clock className="h-4 w-4" />
            Update otomatis setelah scan
          </span>
        </header>
        <div className="space-y-3">
          {historyItems.length > 0 ? (
            historyItems.map((item, index) => {
              const Icon = item.status === "Hadir" ? Smile : Frown;
              const timeLabel =
                item.checkIn === "-" ? "-" : `${item.checkIn} WIB`;
              return (
                <div
                  key={`${item.date}-${index}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-100 bg-slate-50 px-5 py-4 sm:flex-nowrap"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {formatDateLabel(item.date)}
                    </p>
                    <p className="text-xs text-slate-500">{timeLabel}</p>
                  </div>
                  <div className="w-full text-left sm:w-auto sm:text-right">
                    <span
                      className={cn(
                        "inline-flex items-center gap-2 rounded-full px-4 py-1 text-xs font-semibold",
                        statusBadge[item.status]
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.status}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-200 px-5 py-8 text-center text-sm text-slate-500">
              Belum ada riwayat kehadiran yang tersimpan.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function getDateKey(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().split("T")[0];
}
