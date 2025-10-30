"use client";

import {
  Activity,
  CalendarDays,
  CheckCircle2,
  Clock,
  School,
  Users,
} from "lucide-react";
import { useStudents } from "@/contexts/StudentContext";
import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  Hadir: "bg-emerald-100 text-emerald-600",
  Sakit: "bg-amber-100 text-amber-600",
  Izin: "bg-blue-100 text-blue-600",
  Alfa: "bg-rose-100 text-rose-600",
};

export default function GuruDashboardPage() {
  const { students } = useStudents();

  const totalStudents = students.length;
  const hadir = students.filter((student) => student.lastStatus === "Hadir");
  const sakit = students.filter((student) => student.lastStatus === "Sakit");
  const izin = students.filter((student) => student.lastStatus === "Izin");
  const alfa = students.filter((student) => student.lastStatus === "Alfa");

  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const miniTable = students.slice(0, 6);

  return (
    <div className="space-y-8">
      <section className="grid gap-4 lg:grid-cols-4">
        <SummaryCard
          title="Total Siswa"
          value={`${totalStudents} siswa`}
          icon={Users}
          accent="from-indigo-500 to-purple-500"
        />
        <SummaryCard
          title="Hadir Hari Ini"
          value={`${hadir.length} siswa`}
          icon={CheckCircle2}
          accent="from-emerald-500 to-lime-500"
        />
        <SummaryCard
          title="Sakit / Izin"
          value={`${sakit.length + izin.length} siswa`}
          icon={Activity}
          accent="from-amber-500 to-orange-500"
        />
        <SummaryCard
          title="Tanpa Keterangan"
          value={`${alfa.length} siswa`}
          icon={Clock}
          accent="from-rose-500 to-pink-500"
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-12">
        <div className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-lg shadow-slate-200/40 lg:col-span-8">
          <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-indigo-500">
                Rekap Hari Ini
              </p>
              <h2 className="text-xl font-semibold text-slate-900">
                Kehadiran per siswa ({today})
              </h2>
            </div>
            <button className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-500/30 transition hover:bg-indigo-700">
              <CalendarDays className="h-4 w-4" />
              Export CSV
            </button>
          </header>

          <div className="rounded-2xl border border-slate-100">
            <div className="grid grid-cols-4 gap-3 border-b border-slate-100 px-4 py-3 text-xs font-semibold uppercase tracking-widest text-slate-500 max-sm:hidden">
              <span>Nama</span>
              <span>Kelas</span>
              <span>Status</span>
              <span>Jam Masuk</span>
            </div>
            <div className="divide-y divide-slate-100">
              {miniTable.map((student) => (
                <div
                  key={student.id}
                  className="grid grid-cols-1 gap-y-1 px-4 py-4 text-sm sm:grid-cols-4 sm:items-center sm:gap-3"
                >
                  <div>
                    <p className="font-semibold text-slate-900">
                      {student.name}
                    </p>
                    <p className="text-xs text-slate-400 sm:hidden">
                      {student.className}
                    </p>
                  </div>
                  <div className="text-slate-500 max-sm:hidden">
                    {student.className}
                  </div>
                  <div>
                    <span
                      className={cn(
                        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold",
                        statusColors[student.lastStatus] ??
                          "bg-slate-100 text-slate-600"
                      )}
                    >
                      <span className="h-2 w-2 rounded-full bg-current" />
                      {student.lastStatus}
                    </span>
                  </div>
                  <div className="text-slate-500">
                    {student.lastCheckIn === "—"
                      ? "Belum tercatat"
                      : `${student.lastCheckIn} WIB`}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="flex flex-col gap-4 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-500 p-6 text-white shadow-xl shadow-indigo-500/40 lg:col-span-4">
          <div className="flex items-start gap-3">
            <span className="rounded-full bg-white/10 p-3">
              <School className="h-6 w-6" />
            </span>
            <div>
              <h3 className="text-lg font-semibold">Informasi Penting</h3>
              <p className="text-sm text-indigo-100">
                Jadwalkan pengingat untuk mengirim pengumuman ke orang tua jika
                siswa tidak hadir lebih dari 2 hari berturut-turut.
              </p>
            </div>
          </div>
          <ul className="space-y-3 text-sm text-indigo-50">
            <li className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
              08.00 - Pertemuan wali kelas
            </li>
            <li className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
              09.30 - Monitoring izin kelas XI IPA
            </li>
            <li className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
              11.00 - Update forum komunikasi
            </li>
          </ul>
          <button className="mt-auto inline-flex items-center justify-center rounded-full bg-white px-4 py-3 text-sm font-semibold text-indigo-600 shadow-md shadow-indigo-500/30 transition hover:bg-slate-50">
            Tambah Pengumuman
          </button>
        </aside>
      </section>
    </div>
  );
}

type SummaryCardProps = {
  title: string;
  value: string;
  accent: string;
  icon: React.ComponentType<{ className?: string }>;
};

function SummaryCard({
  title,
  value,
  accent,
  icon: Icon,
}: SummaryCardProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-white p-6 shadow-lg shadow-slate-200/40">
      <div
        className={cn(
          "absolute -top-16 left-1/2 h-36 w-36 -translate-x-1/2 rounded-full bg-gradient-to-br opacity-30 blur-3xl",
          accent
        )}
      />
      <div className="relative z-10 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-slate-400">
            {title}
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
        </div>
        <span className="rounded-2xl bg-slate-100 p-3 text-indigo-600">
          <Icon className="h-6 w-6" />
        </span>
      </div>
    </div>
  );
}
