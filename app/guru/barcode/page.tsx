"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Download, Printer, Search, X } from "lucide-react";
import { useStudents } from "@/contexts/StudentContext";

export default function GuruBarcodePage() {
  const { students, classes, loading } = useStudents();
  const [search, setSearch] = useState("");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [previewStudentId, setPreviewStudentId] = useState<string | null>(null);
  const qrRefs = useRef<Record<string, SVGSVGElement | null>>({});

  const filtered = useMemo(
    () =>
      students.filter((student) => {
        const matchesSearch = `${student.name} ${student.className} ${student.id}`
          .toLowerCase()
          .includes(search.toLowerCase());
        const matchesClass = selectedClass
          ? student.classId === selectedClass
          : true;
        return matchesSearch && matchesClass;
      }),
    [students, search, selectedClass]
  );

  const getStudentById = useCallback(
    (id: string) => filtered.find((student) => student.id === id),
    [filtered]
  );

  const serializeSvg = useCallback((studentId: string) => {
    const svgNode = qrRefs.current[studentId];
    if (!svgNode) return null;
    const clone = svgNode.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    return new XMLSerializer().serializeToString(clone);
  }, []);

  const downloadSvg = useCallback(
    (studentId: string) => {
      const svgContent = serializeSvg(studentId);
      const student = getStudentById(studentId);
      if (!svgContent || !student) return;
      const blob = new Blob([svgContent], {
        type: "image/svg+xml;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const tempLink = document.createElement("a");
      tempLink.href = url;
      tempLink.download = `${student.name.replace(/\s+/g, "-")}-${student.id}.svg`;
      document.body.appendChild(tempLink);
      tempLink.click();
      document.body.removeChild(tempLink);
      URL.revokeObjectURL(url);
    },
    [getStudentById, serializeSvg]
  );

  const printStudents = useCallback(
    (studentsToPrint: typeof filtered) => {
      if (loading || !studentsToPrint.length) return;
      const printWindow = window.open("", "_blank", "width=1024,height=768");
      if (!printWindow) return;
      const cardsHtml = studentsToPrint
        .map((student) => {
          const svg = serializeSvg(student.id);
          if (!svg) return "";
          return `
            <div class="card">
              <div class="qr">${svg}</div>
              <div class="info">
                <h3>${student.name}</h3>
                <p>${student.className}</p>
                <span>ID: ${student.id}</span>
              </div>
            </div>
          `;
        })
        .join("");
      printWindow.document.write(`<!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Cetak QR Siswa</title>
          <style>
            * { box-sizing: border-box; }
            body { font-family: 'Segoe UI', sans-serif; margin: 0; padding: 32px; background: #f8fafc; color: #0f172a; }
            h1 { text-align: center; margin-bottom: 24px; font-size: 22px; }
            .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; }
            .card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; padding: 20px; display: flex; flex-direction: column; align-items: center; gap: 12px; }
            .qr svg { width: 180px; height: 180px; }
            .info { text-align: center; }
            .info h3 { margin: 0; font-size: 18px; font-weight: 600; }
            .info p { margin: 4px 0 0; font-size: 14px; color: #475569; }
            .info span { display: inline-block; margin-top: 6px; padding: 4px 10px; border-radius: 9999px; background: #e2e8f0; font-size: 12px; color: #334155; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; }
            @media print {
              body { background: #ffffff; padding: 0; }
              .card { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <h1>Daftar QR Siswa</h1>
          <div class="grid">
            ${cardsHtml}
          </div>
        </body>
      </html>`);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 300);
    },
    [serializeSvg, loading]
  );

  const handleUseQr = useCallback((studentId: string) => {
    setPreviewStudentId(studentId);
  }, []);

  const handleDownload = useCallback(
    (studentId: string) => {
      downloadSvg(studentId);
    },
    [downloadSvg]
  );

  const previewStudent = previewStudentId
    ? getStudentById(previewStudentId) ?? null
    : null;

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
            <button
              onClick={() => printStudents(filtered)}
              disabled={loading || !filtered.length}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Printer className="h-4 w-4" />
              Cetak Massal
            </button>
          </div>
        </header>

        <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex w-full flex-col gap-3 md:max-w-2xl md:flex-row md:items-center md:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-11 py-3 text-sm text-slate-700 outline-none ring-indigo-500 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2"
                placeholder="Cari nama siswa atau kelas…"
              />
            </div>
            <div className="flex-1 md:max-w-xs">
              <select
                value={selectedClass}
                onChange={(event) => setSelectedClass(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 outline-none ring-indigo-500 focus:border-indigo-500 focus:ring-2"
              >
                <option value="">Semua kelas</option>
                {classes.map((classItem) => (
                  <option key={classItem.id} value={classItem.id}>
                    {classItem.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p className="text-xs text-slate-400">
            {loading ? (
              "Memuat data siswa..."
            ) : (
              <>
                Total QR ditampilkan: <strong>{filtered.length}</strong>
              </>
            )}
          </p>
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {!loading && filtered.map((student) => (
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
                  ref={(node) => {
                    qrRefs.current[student.id] = node;
                  }}
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
                  onClick={() => handleUseQr(student.id)}
                  className="flex-1 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-indigo-500/30 transition hover:bg-indigo-700"
                >
                  Gunakan QR
                </button>
                <button
                  onClick={() => handleDownload(student.id)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                >
                  <Download className="h-4 w-4" />
                  Unduh
                </button>
              </div>
            </article>
          ))}
          {!loading && filtered.length === 0 && (
            <div className="rounded-3xl border border-dashed border-slate-200 p-10 text-center text-sm text-slate-500">
              Tidak ada data siswa sesuai pencarian.
            </div>
          )}
          {loading && (
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={`loading-${index}`}
                  className="animate-pulse rounded-3xl border border-slate-100 bg-white p-6"
                >
                  <div className="h-48 rounded-2xl bg-slate-100" />
                  <div className="mt-4 h-4 w-3/4 rounded-full bg-slate-200" />
                  <div className="mt-2 h-3 w-1/2 rounded-full bg-slate-200" />
                  <div className="mt-4 flex gap-2">
                    <div className="h-8 w-24 rounded-full bg-slate-200" />
                    <div className="h-8 w-24 rounded-full bg-slate-200" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {filtered.length === 0 && (
          <div className="rounded-3xl border border-dashed border-slate-200 p-10 text-center text-sm text-slate-500">
            QR code tidak ditemukan. Periksa kata kunci pencarian atau tambahkan
            data siswa baru.
          </div>
        )}
      </section>

      {previewStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-8 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
            <button
              onClick={() => setPreviewStudentId(null)}
              className="absolute right-4 top-4 rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="space-y-4 text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-indigo-600">
                QR Siswa
              </div>
              <div className="mx-auto max-w-xs rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <QRCodeSVG value={previewStudent.id} size={240} />
              </div>
              <h3 className="text-xl font-semibold text-slate-900">
                {previewStudent.name}
              </h3>
              <p className="text-sm text-slate-500">{previewStudent.className}</p>
              <span className="inline-flex items-center justify-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                ID: {previewStudent.id}
              </span>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <button
                  onClick={() => {
                    setPreviewStudentId(null);
                    printStudents([previewStudent]);
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-700"
                >
                  <Printer className="h-4 w-4" />
                  Cetak QR
                </button>
                <button
                  onClick={() => handleDownload(previewStudent.id)}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                >
                  <Download className="h-4 w-4" />
                  Unduh SVG
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
