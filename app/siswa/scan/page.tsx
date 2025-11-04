"use client";

import dynamic from "next/dynamic";
import { useCallback, useMemo, useState } from "react";
import { CheckCircle2, Info, RefreshCw, XCircle } from "lucide-react";
import {
  AttendanceStatus,
  useAttendance,
} from "@/contexts/AttendanceContext";
import { useStudents } from "@/contexts/StudentContext";
import { cn } from "@/lib/utils";

const BarcodeScannerComponent = dynamic(
  () => import("react-qr-barcode-scanner"),
  { ssr: false }
);

type ScanState = {
  status: "idle" | "success" | "error";
  message: string;
  scannedId?: string;
  timestamp?: string;
  studentName?: string;
  className?: string;
};

export default function SiswaScanPage() {
  const { getStudentById } = useStudents();
  const { updateAttendance } = useAttendance();
  const [hasPermissionIssue, setHasPermissionIssue] = useState(false);
  const [scanState, setScanState] = useState<ScanState>({
    status: "idle",
    message: "Arahkan kamera ke barcode yang diberikan guru.",
  });
  const [cameraKey, setCameraKey] = useState(0);

  const statusColor: Record<AttendanceStatus | "error" | "idle", string> = useMemo(
    () => ({
      Hadir: "bg-emerald-100 text-emerald-600",
      Sakit: "bg-amber-100 text-amber-600",
      Izin: "bg-blue-100 text-blue-600",
      Alfa: "bg-rose-100 text-rose-600",
      error: "bg-rose-100 text-rose-600",
      idle: "bg-slate-100 text-slate-600",
    }),
    []
  );

  const handleScan = useCallback(
    async (_err: unknown, result: { text: string } | null) => {
      if (!result) return;
      const text = result.text.trim();
      if (!text) return;
      const student = getStudentById(text);

      if (student) {
        const now = new Date();
        const time = now.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        });
        const saved = await updateAttendance(student.id, "Hadir", time);
        if (saved) {
          setScanState({
            status: "success",
            message: `Absen berhasil untuk ${student.name}!`,
            scannedId: text,
            timestamp: `${time} WIB`,
            studentName: student.name,
            className: student.className,
          });
        } else {
          setScanState({
            status: "error",
            message:
              "Gagal menyimpan kehadiran. Periksa koneksi internet dan coba lagi.",
            scannedId: text,
            studentName: student.name,
            className: student.className,
          });
        }
      } else {
        setScanState({
          status: "error",
          message: "Barcode tidak dikenali. Pastikan kartu berasal dari guru Anda.",
          scannedId: text,
        });
      }
    },
    [getStudentById, updateAttendance]
  );

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <section className="rounded-3xl bg-white p-5 shadow-lg shadow-slate-200/40">
        <header className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-widest text-indigo-500">
            Scan Barcode
          </p>
          <h2 className="text-xl font-semibold text-slate-900">
            Arahkan kamera ke barcode dari guru
          </h2>
          <p className="text-sm text-slate-500">
            Pastikan barcode terlihat jelas di layar. Sistem akan otomatis
            memverifikasi ID Anda.
          </p>
        </header>

        <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-xs text-slate-500">
          Gunakan kamera belakang untuk hasil terbaik. Jika kamera tidak
          menyala, izinkan akses kamera pada browser Anda lalu tekan tombol
          refresh kamera.
        </div>

        <div className="relative mt-5 overflow-hidden rounded-3xl border border-slate-100 bg-black/80 text-white">
          <BarcodeScannerComponent
            key={cameraKey}
            width={500}
            height={300}
            onUpdate={(err, result) => {
              if (err) {
                setHasPermissionIssue(true);
                return;
              }
              if (hasPermissionIssue) {
                setHasPermissionIssue(false);
              }
              void handleScan(err, result);
            }}
          />
          {scanState.status === "success" && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/70 px-4 text-center">
              <div className="inline-flex items-center gap-2 rounded-2xl bg-white/95 px-4 py-3 text-sm font-semibold text-emerald-600 shadow-lg shadow-emerald-500/30">
                <CheckCircle2 className="h-5 w-5" />
                {scanState.message}
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold",
              scanState.status === "success"
                ? statusColor.Hadir
                : scanState.status === "error"
                  ? statusColor.error
                  : statusColor.idle
            )}
          >
            {scanState.status === "success" ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : scanState.status === "error" ? (
              <XCircle className="h-4 w-4" />
            ) : (
              <Info className="h-4 w-4" />
            )}
            {scanState.message}
          </div>
          <button
            onClick={() => {
              setCameraKey((prev) => prev + 1);
              setHasPermissionIssue(false);
              setScanState({
                status: "idle",
                message: "Kamera diperbarui. Arahkan ke barcode guru.",
              });
            }}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Kamera
          </button>
        </div>

        {hasPermissionIssue && (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
            Browser belum memiliki izin kamera. Buka pengaturan izin dan coba
            ubah menjadi allow.
          </div>
        )}
      </section>

      {scanState.status === "success" && (
        <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-700 shadow-sm">
          <h3 className="text-lg font-semibold">
            Kehadiran tercatat untuk {scanState.studentName ?? scanState.scannedId}
          </h3>
          <p className="mt-1 text-sm">
            ID Barcode: <strong>{scanState.scannedId}</strong>
          </p>
          {scanState.className && (
            <p className="text-sm">
              Kelas: <strong>{scanState.className}</strong>
            </p>
          )}
          <p className="text-sm">
            Jam Absen: <strong>{scanState.timestamp}</strong>
          </p>
          <p className="mt-2 text-xs">
            Simpan layar ini sebagai bukti jika diperlukan. Data tersimpan di
            sistem dan akan terlihat di menu status.
          </p>
        </section>
      )}
    </div>
  );
}
