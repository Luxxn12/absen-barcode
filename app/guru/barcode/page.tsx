"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Download, Printer, Search } from "lucide-react";
import { useStudents } from "@/contexts/StudentContext";

export default function GuruBarcodePage() {
  const { students } = useStudents();
  const [search, setSearch] = useState("");

  const filtered = students.filter((student) =>
    `${student.name} ${student.className} ${student.id}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-white p-6 shadow-lg shadow-slate-200/40">
        <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-indigo-500">
              QR Code
            </p>
            <h2 className="text-xl font-semibold text-slate-900">
              Daftar QR Code per siswa
            </h2>
            <p className="text-sm text-slate-500">
              QR menyimpan ID siswa dan siap dipindai oleh perangkat guru saat
              kehadiran berlangsung.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100">
              <Printer className="h-4 w-4" />
              Cetak Massal
            </button>
          </div>
        </header>

        <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-11 py-3 text-sm text-slate-700 outline-none ring-indigo-500 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2"
              placeholder="Cari nama siswa atau kelas…"
            />
          </div>
          <p className="text-xs text-slate-400">
            Total QR ditampilkan: <strong>{filtered.length}</strong>
          </p>
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((student) => (
            <article
              key={student.id}
              className="flex flex-col items-center rounded-3xl border border-slate-100 bg-white p-6 text-center shadow-sm transition hover:shadow-md"
            >
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <QRCodeSVG
                  value={student.id}
                  size={180}
                  bgColor="transparent"
                  className="text-indigo-600"
                />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">
                {student.name}
              </h3>
              <p className="text-sm text-slate-500">{student.className}</p>
              <span className="mt-2 rounded-full bg-slate-100 px-4 py-1 text-xs font-semibold text-slate-500">
                ID: {student.id}
              </span>
              <div className="mt-5 flex w-full flex-col gap-3 sm:flex-row">
                <button
                  onClick={() =>
                    alert(`QR ${student.name} siap diprint (simulasi).`)
                  }
                  className="flex-1 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-indigo-500/30 transition hover:bg-indigo-700"
                >
                  Gunakan QR
                </button>
                <button
                  onClick={() =>
                    alert(`QR ${student.name} berhasil diunduh (simulasi).`)
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                >
                  <Download className="h-4 w-4" />
                  Unduh
                </button>
              </div>
            </article>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="rounded-3xl border border-dashed border-slate-200 p-10 text-center text-sm text-slate-500">
            QR code tidak ditemukan. Periksa kata kunci pencarian atau tambahkan
            data siswa baru.
          </div>
        )}
      </section>
    </div>
  );
}
