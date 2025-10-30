"use client";

import { useMemo } from "react";
import { CalendarDays, CheckCircle2, Clock, Frown, Smile } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { AttendanceStatus, useStudents } from "@/contexts/StudentContext";
import { cn } from "@/lib/utils";

type HistoryItem = {
  date: string;
  status: AttendanceStatus;
  time: string;
};

const pastHistory: HistoryItem[] = [
  { date: "Kemarin", status: "Hadir", time: "07:05 WIB" },
  { date: "2 hari lalu", status: "Hadir", time: "07:12 WIB" },
  { date: "3 hari lalu", status: "Izin", time: "-" },
];

const statusBadge: Record<AttendanceStatus, string> = {
  Hadir: "bg-emerald-100 text-emerald-600",
  Sakit: "bg-amber-100 text-amber-600",
  Izin: "bg-blue-100 text-blue-600",
  Alfa: "bg-rose-100 text-rose-600",
};

export default function SiswaStatusPage() {
  const { session } = useAuth();
  const { getStudentById } = useStudents();

  const student =
    session?.role === "siswa" ? getStudentById(session.studentId) : null;

  const today = useMemo(
    () =>
      new Date().toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }),
    []
  );

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
            {today}
          </h2>
        </div>
        <div className="mt-4 flex flex-col gap-4 rounded-3xl border border-slate-100 bg-slate-50 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-400">
              Status Terakhir
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {student.lastStatus}
            </p>
            <p className="text-sm text-slate-500">
              Jam absen:{" "}
              <span className="font-semibold text-slate-700">
                {student.lastCheckIn === "—"
                  ? "Belum tercatat"
                  : `${student.lastCheckIn} WIB`}
              </span>
            </p>
          </div>
          <div
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold",
              statusBadge[student.lastStatus]
            )}
          >
            <CheckCircle2 className="h-4 w-4" />
            {student.lastStatus === "Hadir"
              ? "Selamat! Kamu sudah absen."
              : "Segera lapor ke guru untuk konfirmasi."}
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
          {[{ date: "Hari ini", status: student.lastStatus, time: student.lastCheckIn === "—" ? "-" : `${student.lastCheckIn} WIB` }, ...pastHistory].map(
            (item, index) => (
              <div
                key={`${item.date}-${index}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-100 bg-slate-50 px-5 py-4 sm:flex-nowrap"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {item.date}
                  </p>
                  <p className="text-xs text-slate-500">{item.time}</p>
                </div>
                <div className="w-full text-left sm:w-auto sm:text-right">
                  <span
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full px-4 py-1 text-xs font-semibold",
                      statusBadge[item.status]
                    )}
                  >
                    <Smile className="h-4 w-4" />
                    {item.status}
                  </span>
                </div>
              </div>
            )
          )}
        </div>
      </section>
    </div>
  );
}
