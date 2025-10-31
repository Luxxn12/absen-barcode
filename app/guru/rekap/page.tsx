"use client";

import { useMemo, useState, useCallback } from "react";
import { CalendarRange, Download, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

type RekapItem = {
  student: string;
  className: string;
  hadir: number;
  sakit: number;
  izin: number;
  alfa: number;
};

const dummyRekap: RekapItem[] = [
  {
    student: "Ahmad Fauzi",
    className: "X IPA 1",
    hadir: 18,
    sakit: 1,
    izin: 1,
    alfa: 0,
  },
  {
    student: "Siti Rahma",
    className: "X IPA 2",
    hadir: 16,
    sakit: 2,
    izin: 1,
    alfa: 1,
  },
  {
    student: "Budi Santoso",
    className: "X IPS 1",
    hadir: 19,
    sakit: 0,
    izin: 0,
    alfa: 1,
  },
  {
    student: "Lina Kartika",
    className: "XI IPA 1",
    hadir: 17,
    sakit: 1,
    izin: 2,
    alfa: 0,
  },
  {
    student: "Dewi Lestari",
    className: "XI IPS 2",
    hadir: 14,
    sakit: 3,
    izin: 1,
    alfa: 2,
  },
];

const months = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const classes = [
  "Semua Kelas",
  "X IPA 1",
  "X IPA 2",
  "X IPS 1",
  "XI IPA 1",
  "XI IPS 2",
];

export default function GuruRekapPage() {
  const [selectedMonth, setSelectedMonth] = useState(months[new Date().getMonth()]);
  const [selectedClass, setSelectedClass] = useState(classes[0]);

  const filtered = useMemo(() => {
    if (selectedClass === "Semua Kelas") return dummyRekap;
    return dummyRekap.filter((item) => item.className === selectedClass);
  }, [selectedClass]);

  const totalHadir = filtered.reduce((total, item) => total + item.hadir, 0);
  const totalSakit = filtered.reduce((total, item) => total + item.sakit, 0);
  const totalIzin = filtered.reduce((total, item) => total + item.izin, 0);
  const totalAlfa = filtered.reduce((total, item) => total + item.alfa, 0);

  const exportRekap = useCallback(() => {
    if (!filtered.length) return;
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
      ...filtered.map((item) =>
        [
          `"${item.student.replace(/"/g, '""')}"`,
          `"${item.className.replace(/"/g, '""')}"`,
          item.hadir,
          item.sakit,
          item.izin,
          item.alfa,
        ].join(",")
      ),
    ].join("\n");
    const fileName = `rekap-bulanan-${selectedMonth}-${selectedClass.replace(/\s+/g, "-")}.csv`;
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
  }, [filtered, selectedMonth, selectedClass]);

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
              Data dummy untuk simulasi laporan. Filter berdasarkan bulan dan kelas.
            </p>
          </div>
          <button
            onClick={exportRekap}
            disabled={!filtered.length}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Unduh Rekap
          </button>
        </header>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Hadir" value={`${totalHadir} hari`} accent="bg-emerald-500/20 text-emerald-600" />
          <StatCard label="Sakit" value={`${totalSakit} hari`} accent="bg-amber-500/20 text-amber-600" />
          <StatCard label="Izin" value={`${totalIzin} hari`} accent="bg-blue-500/20 text-blue-600" />
          <StatCard label="Tanpa Keterangan" value={`${totalAlfa} hari`} accent="bg-rose-500/20 text-rose-600" />
        </div>

        <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <CalendarRange className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <select
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(event.target.value)}
                className="w-full appearance-none rounded-2xl border border-slate-200 bg-white px-11 py-3 text-sm text-slate-700 outline-none ring-indigo-500 focus:border-indigo-500 focus:ring-2"
              >
                {months.map((month) => (
                  <option key={month}>{month}</option>
                ))}
              </select>
            </div>
            <div className="relative flex-1">
              <Filter className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <select
                value={selectedClass}
                onChange={(event) => setSelectedClass(event.target.value)}
                className="w-full appearance-none rounded-2xl border border-slate-200 bg-white px-11 py-3 text-sm text-slate-700 outline-none ring-indigo-500 focus:border-indigo-500 focus:ring-2"
              >
                {classes.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </div>
          </div>
          <p className="text-xs text-slate-400">
            Menampilkan <strong>{filtered.length}</strong> siswa untuk{" "}
            <span className="font-semibold text-slate-600">{selectedClass}</span>{" "}
            bulan <span className="font-semibold text-slate-600">{selectedMonth}</span>
          </p>
        </div>

        <div className="mt-6 overflow-hidden rounded-3xl border border-slate-100">
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
              {filtered.map((item) => (
                <tr key={item.student} className="transition hover:bg-slate-50/60">
                  <td className="px-6 py-4 font-semibold text-slate-900">
                    {item.student}
                  </td>
                  <td className="px-6 py-4">{item.className}</td>
                  <td className="px-6 py-4 font-semibold text-slate-700">
                    {item.hadir}
                  </td>
                  <td className="px-6 py-4">{item.sakit}</td>
                  <td className="px-6 py-4">{item.izin}</td>
                  <td className="px-6 py-4 text-rose-500">{item.alfa}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="p-10 text-center text-sm text-slate-500">
              Tidak ada data rekap untuk filter yang dipilih.
            </div>
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
      <div className={cn("mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold", accent)}>
        {label}
      </div>
    </div>
  );
}
