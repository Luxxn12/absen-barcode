"use client";

import { useCallback, useMemo, useState } from "react";
import { CalendarRange, Download, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStudents } from "@/contexts/StudentContext";
import { useAttendance } from "@/contexts/AttendanceContext";

type RecapRow = {
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  hadir: number;
  sakit: number;
  izin: number;
  alfa: number;
};

const monthFormatter = new Intl.DateTimeFormat("id-ID", {
  month: "long",
  year: "numeric",
});

function getMonthKey(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 7);
}

function formatMonthLabel(key: string | undefined) {
  if (!key) return "-";
  const target = new Date(`${key}-01T00:00:00`);
  return monthFormatter.format(target);
}

const currentMonthKey = getMonthKey(new Date());

export default function GuruRekapPage() {
  const {
    students,
    classes,
    loading: studentsLoading,
  } = useStudents();
  const { records, loading: attendanceLoading } = useAttendance();

  const loading = studentsLoading || attendanceLoading;

  const monthOptions = useMemo(() => {
    const map = new Map<string, string>();
    records.forEach((record) => {
      const key = record.date.slice(0, 7);
      if (!map.has(key)) {
        map.set(key, formatMonthLabel(key));
      }
    });
    if (map.size === 0) {
      map.set(currentMonthKey, formatMonthLabel(currentMonthKey));
    }
    return Array.from(map.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([key, label]) => ({ key, label }));
  }, [records]);

  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(
    monthOptions[0]?.key ?? currentMonthKey
  );
  const safeSelectedMonthKey = useMemo(() => {
    if (!monthOptions.length) return selectedMonthKey;
    if (monthOptions.some((option) => option.key === selectedMonthKey)) {
      return selectedMonthKey;
    }
    return monthOptions[0].key;
  }, [monthOptions, selectedMonthKey]);

  const classOptions = useMemo(
    () => [
      { id: "all", name: "Semua Kelas" },
      ...classes.map((item) => ({ id: item.id, name: item.name })),
    ],
    [classes]
  );

  const [selectedClassId, setSelectedClassId] = useState<string>("all");
  const safeSelectedClassId = useMemo(() => {
    if (selectedClassId === "all") return "all";
    if (classes.some((classItem) => classItem.id === selectedClassId)) {
      return selectedClassId;
    }
    return "all";
  }, [classes, selectedClassId]);

  const recapRows = useMemo<RecapRow[]>(() => {
    if (!safeSelectedMonthKey) return [];
    const filteredStudents =
      safeSelectedClassId === "all"
        ? students
        : students.filter((student) => student.classId === safeSelectedClassId);

    if (!filteredStudents.length) return [];

    const map = new Map<string, RecapRow>();
    filteredStudents.forEach((student) => {
      map.set(student.id, {
        studentId: student.id,
        studentName: student.name,
        classId: student.classId,
        className: student.className,
        hadir: 0,
        sakit: 0,
        izin: 0,
        alfa: 0,
      });
    });

    records.forEach((record) => {
      if (!record.date.startsWith(safeSelectedMonthKey)) return;
      const entry = map.get(record.studentId);
      if (!entry) return;
      switch (record.status) {
        case "Hadir":
          entry.hadir += 1;
          break;
        case "Sakit":
          entry.sakit += 1;
          break;
        case "Izin":
          entry.izin += 1;
          break;
        case "Alfa":
          entry.alfa += 1;
          break;
      }
    });

    return Array.from(map.values()).sort((a, b) =>
      a.studentName.localeCompare(b.studentName, "id-ID", {
        sensitivity: "base",
      })
    );
  }, [records, students, safeSelectedClassId, safeSelectedMonthKey]);

  const totals = useMemo(
    () =>
      recapRows.reduce(
        (acc, row) => ({
          hadir: acc.hadir + row.hadir,
          sakit: acc.sakit + row.sakit,
          izin: acc.izin + row.izin,
          alfa: acc.alfa + row.alfa,
        }),
        { hadir: 0, sakit: 0, izin: 0, alfa: 0 }
      ),
    [recapRows]
  );

  const selectedMonthLabel =
    monthOptions.find((option) => option.key === safeSelectedMonthKey)?.label ??
    formatMonthLabel(safeSelectedMonthKey);

  const selectedClassLabel =
    classOptions.find((option) => option.id === safeSelectedClassId)?.name ??
    "Semua Kelas";

  const exportRekap = useCallback(() => {
    if (!recapRows.length) return;
    const headers = [
      "Nama",
      "Kelas",
      "Hadir (hari)",
      "Sakit (hari)",
      "Izin (hari)",
      "Alfa (hari)",
    ];
    const csvContent = [
      headers.join(","),
      ...recapRows.map((item) =>
        [
          `"${item.studentName.replace(/"/g, '""')}"`,
          `"${item.className.replace(/"/g, '""')}"`,
          item.hadir,
          item.sakit,
          item.izin,
          item.alfa,
        ].join(",")
      ),
    ].join("\n");
    const fileName = `rekap-bulanan-${selectedMonthLabel
      .toLowerCase()
      .replace(/\s+/g, "-")}-${selectedClassLabel
      .toLowerCase()
      .replace(/\s+/g, "-")}.csv`;
    const blob = new Blob([`\ufeff${csvContent}`], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [recapRows, selectedMonthLabel, selectedClassLabel]);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-white p-6 shadow-lg shadow-slate-200/40">
        <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-indigo-500">
              Rekap Bulanan
            </p>
            <h2 className="text-xl font-semibold text-slate-900">
              Ringkasan kehadiran per kelas
            </h2>
            <p className="text-sm text-slate-500">
              Data dihitung otomatis dari hasil absensi harian. Pilih bulan dan
              kelas untuk melihat statistik detail.
            </p>
          </div>
          <button
            onClick={exportRekap}
            disabled={!recapRows.length}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Unduh Rekap
          </button>
        </header>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Hadir"
            value={`${totals.hadir} hari`}
            accent="bg-emerald-500/20 text-emerald-600"
          />
          <StatCard
            label="Sakit"
            value={`${totals.sakit} hari`}
            accent="bg-amber-500/20 text-amber-600"
          />
          <StatCard
            label="Izin"
            value={`${totals.izin} hari`}
            accent="bg-blue-500/20 text-blue-600"
          />
          <StatCard
            label="Tanpa Keterangan"
            value={`${totals.alfa} hari`}
            accent="bg-rose-500/20 text-rose-600"
          />
        </div>

        <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <CalendarRange className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <select
                value={safeSelectedMonthKey}
                onChange={(event) => setSelectedMonthKey(event.target.value)}
                className="w-full appearance-none rounded-2xl border border-slate-200 bg-white px-11 py-3 text-sm text-slate-700 outline-none ring-indigo-500 focus:border-indigo-500 focus:ring-2"
              >
                {monthOptions.map((month) => (
                  <option key={month.key} value={month.key}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="relative flex-1">
              <Filter className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <select
                value={safeSelectedClassId}
                onChange={(event) => setSelectedClassId(event.target.value)}
                className="w-full appearance-none rounded-2xl border border-slate-200 bg-white px-11 py-3 text-sm text-slate-700 outline-none ring-indigo-500 focus:border-indigo-500 focus:ring-2"
              >
                {classOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p className="text-xs text-slate-400">
            {loading ? (
              "Memuat data rekap..."
            ) : (
              <>
                Menampilkan <strong>{recapRows.length}</strong> siswa untuk{" "}
                <span className="font-semibold text-slate-600">
                  {selectedClassLabel}
                </span>{" "}
                bulan{" "}
                <span className="font-semibold text-slate-600">
                  {selectedMonthLabel}
                </span>
              </>
            )}
          </p>
        </div>

        <div className="mt-6 overflow-hidden rounded-3xl border border-slate-100">
          {loading ? (
            <div className="p-10 text-center text-sm text-slate-500">
              Memuat data rekap...
            </div>
          ) : recapRows.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500">
              Tidak ada data rekap untuk filter yang dipilih.
            </div>
          ) : (
            <table className="min-w-full bg-white text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-widest text-slate-500">
                <tr>
                  <th className="px-6 py-3">Siswa</th>
                  <th className="px-6 py-3">Kelas</th>
                  <th className="px-6 py-3">Hadir</th>
                  <th className="px-6 py-3">Sakit</th>
                  <th className="px-6 py-3">Izin</th>
                  <th className="px-6 py-3">Alfa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {recapRows.map((row) => (
                  <tr
                    key={row.studentId}
                    className="transition hover:bg-slate-50/60"
                  >
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {row.studentName}
                    </td>
                    <td className="px-6 py-4">{row.className}</td>
                    <td className="px-6 py-4 font-semibold text-slate-700">
                      {row.hadir}
                    </td>
                    <td className="px-6 py-4">{row.sakit}</td>
                    <td className="px-6 py-4">{row.izin}</td>
                    <td className="px-6 py-4 text-rose-500">{row.alfa}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
      <p className="text-xs uppercase tracking-widest text-slate-400">
        {label}
      </p>
      <p className="mt-3 text-2xl font-semibold text-slate-900">{value}</p>
      <div
        className={cn(
          "mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold",
          accent
        )}
      >
        {label}
      </div>
    </div>
  );
}
