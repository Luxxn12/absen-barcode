"use client";

import { ArrowRight, Sparkles, Timer } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useStudents } from "@/contexts/StudentContext";

export default function SiswaHomePage() {
  const { session } = useAuth();
  const { getStudentById } = useStudents();

  const student =
    session?.role === "siswa" ? getStudentById(session.studentId) : null;

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-5">
      <section className="rounded-3xl bg-white p-6 shadow-lg shadow-slate-200/50">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-indigo-600">
              <Sparkles className="h-3 w-3" />
              Selamat datang
            </span>
            <h2 className="mt-3 text-2xl font-semibold text-slate-900">
              Halo, {student?.name ?? "Siswa"}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Siapkan kamera untuk memindai barcode dari guru. Setelah berhasil,
              status kehadiran kamu otomatis tersimpan di perangkat ini.
            </p>
          </div>
          <span className="rounded-full bg-indigo-600 px-4 py-2 text-xs font-semibold text-white">
            {student?.className ?? "Kelas"}
          </span>
        </div>
        <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-xs text-slate-500">
          Tips: Pastikan pencahayaan ruangan cukup terang agar barcode mudah
          terbaca. Jika mengalami kendala, hubungi guru piket.
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/siswa/scan"
            className="flex-1 rounded-xl bg-indigo-600 px-5 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-700"
          >
            Mulai Scan Sekarang
          </Link>
          <Link
            href="/siswa/status"
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:border-indigo-200 hover:text-indigo-600"
          >
            Lihat Status
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900">
          Jadwal Absensi Hari Ini
        </h3>
        <ul className="mt-4 space-y-3 text-sm text-slate-600">
          <li className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
            <span>Masuk kelas pagi</span>
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600">
              <Timer className="h-4 w-4" />
              06:45 - 07:15
            </span>
          </li>
          <li className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
            <span>Istirahat</span>
            <span className="text-xs font-semibold text-slate-500">09:45</span>
          </li>
          <li className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
            <span>Pulang</span>
            <span className="text-xs font-semibold text-slate-500">12:30</span>
          </li>
        </ul>
      </section>
    </div>
  );
}
