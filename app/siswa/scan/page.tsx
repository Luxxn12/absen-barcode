"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Camera, CheckCircle2, Info, RefreshCw, XCircle } from "lucide-react";
import {
  AttendanceStatus,
  useAttendance,
} from "@/contexts/AttendanceContext";
import { useStudents } from "@/contexts/StudentContext";
import { cn } from "@/lib/utils";
import { loadFaceApiModels } from "@/lib/faceApi";

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

type FaceRecord = {
  studentId: string;
  studentName: string;
  className: string;
  descriptorVec: Float32Array;
};

export default function SiswaScanPage() {
  const { getStudentById } = useStudents();
  const { updateAttendance } = useAttendance();
  const [mode, setMode] = useState<"barcode" | "face">("barcode");
  const [hasPermissionIssue, setHasPermissionIssue] = useState(false);
  const [scanState, setScanState] = useState<ScanState>({
    status: "idle",
    message: "Arahkan kamera ke barcode yang diberikan guru.",
  });
  const [cameraKey, setCameraKey] = useState(0);
  const faceVideoRef = useRef<HTMLVideoElement | null>(null);
  const [faceRecords, setFaceRecords] = useState<FaceRecord[]>([]);
  const [faceDataLoading, setFaceDataLoading] = useState(false);
  const [faceCameraError, setFaceCameraError] = useState("");
  const [faceScanState, setFaceScanState] = useState<ScanState>({
    status: "idle",
    message: "Pastikan wajah terlihat jelas di kamera.",
  });
  const [facePending, setFacePending] = useState(false);

  useEffect(() => {
    if (mode === "face") {
      setFaceScanState({
        status: "idle",
        message: "Pastikan wajah terlihat jelas di kamera.",
      });
    }
  }, [mode]);

  const actionDisabled =
    mode !== "face" ||
    facePending ||
    Boolean(faceCameraError) ||
    faceRecords.length === 0;

  useEffect(() => {
    if (mode !== "face") return;
    let active = true;
    setFaceDataLoading(true);
    fetch("/api/faces")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Gagal memuat data wajah.");
        }
        return response.json();
      })
      .then((rows: Array<{ studentId: string; studentName: string; className: string; descriptor: number[] }>) => {
        if (!active) return;
        const mapped = rows
          .filter((row) => Array.isArray(row.descriptor) && row.descriptor.length === 128)
          .map((row) => ({
            studentId: row.studentId,
            studentName: row.studentName,
            className: row.className,
            descriptorVec: new Float32Array(row.descriptor),
          }));
        setFaceRecords(mapped);
      })
      .catch((error) => {
        console.error(error);
        if (active) {
          setFaceScanState({
            status: "error",
            message:
              "Gagal memuat data wajah. Pastikan guru telah menambahkan data wajah siswa.",
          });
        }
      })
      .finally(() => {
        if (active) {
          setFaceDataLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [mode]);

  useEffect(() => {
    if (mode !== "face") {
      return;
    }
    let stream: MediaStream | null = null;
    let cancelled = false;
    (async () => {
      try {
        await loadFaceApiModels();
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
        });
        if (cancelled) return;
        if (faceVideoRef.current) {
          faceVideoRef.current.srcObject = stream;
          await faceVideoRef.current.play();
        }
        setFaceCameraError("");
      } catch (error) {
        console.error("Face camera error:", error);
        if (!cancelled) {
          setFaceCameraError(
            "Tidak dapat membuka kamera. Periksa izin kamera pada browser."
          );
        }
      }
    })();
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [mode]);

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

  const handleFaceAttendance = useCallback(async () => {
    if (facePending) return;
    if (mode !== "face") return;
    if (!faceVideoRef.current) {
      setFaceScanState({
        status: "error",
        message: "Kamera belum siap.",
      });
      return;
    }
    if (!faceRecords.length) {
      setFaceScanState({
        status: "error",
        message:
          "Belum ada data wajah yang terdaftar. Minta guru untuk menambahkan.",
      });
      return;
    }
    setFacePending(true);
    try {
      const faceapiLib = await loadFaceApiModels();
      const detection = await faceapiLib
        .detectSingleFace(
          faceVideoRef.current,
          new faceapiLib.TinyFaceDetectorOptions()
        )
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        setFaceScanState({
          status: "error",
          message:
            "Wajah belum terdeteksi. Pastikan pencahayaan cukup dan wajah menghadap kamera.",
        });
        return;
      }

      let bestRecord: FaceRecord | null = null;
      let bestDistance = Number.POSITIVE_INFINITY;

      faceRecords.forEach((record) => {
        const distance = faceapiLib.euclideanDistance(
          detection.descriptor,
          record.descriptorVec
        );
        if (distance < bestDistance) {
          bestDistance = distance;
          bestRecord = record;
        }
      });

      if (!bestRecord || bestDistance > 0.45) {
        setFaceScanState({
          status: "error",
          message:
            "Wajah tidak ditemukan. Coba lagi atau daftar terlebih dahulu.",
        });
        return;
      }
      const matchedRecord = bestRecord as FaceRecord;

      const now = new Date();
      const time = now.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      });
      const saved = await updateAttendance(
        matchedRecord.studentId,
        "Hadir",
        time
      );
      if (saved) {
        setFaceScanState({
          status: "success",
          message: `Absen berhasil untuk ${matchedRecord.studentName}!`,
          scannedId: matchedRecord.studentId,
          studentName: matchedRecord.studentName,
          className: matchedRecord.className,
          timestamp: `${time} WIB`,
        });
      } else {
        setFaceScanState({
          status: "error",
          message: "Gagal menyimpan kehadiran, coba lagi.",
        });
      }
    } catch (error) {
      console.error(error);
      setFaceScanState({
        status: "error",
        message: "Terjadi kesalahan saat membaca wajah.",
      });
    } finally {
      setFacePending(false);
    }
  }, [facePending, mode, faceRecords, updateAttendance]);

  const handleGlobalAction = useCallback(() => {
    if (mode === "barcode") {
      setScanState({
        status: "idle",
        message: "Arahkan kamera ke barcode yang diberikan guru.",
      });
      setCameraKey((prev) => prev + 1);
      setHasPermissionIssue(false);
    } else {
      if (faceScanState.status === "success") {
        setFaceScanState({
          status: "idle",
          message: "Pastikan wajah terlihat jelas di kamera.",
        });
        setFacePending(false);
      } else if (!facePending) {
        void handleFaceAttendance();
      }
    }
  }, [mode, facePending, faceScanState.status, handleFaceAttendance]);

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <div className="rounded-full bg-slate-100 p-1 text-sm font-semibold text-slate-500">
        <div className="grid grid-cols-2 gap-1">
          <button
            type="button"
            onClick={() => setMode("barcode")}
            className={cn(
              "rounded-full px-4 py-2 text-center transition",
              mode === "barcode"
                ? "bg-white text-indigo-600 shadow-sm"
                : "hover:text-indigo-600"
            )}
          >
            Scan Barcode
          </button>
          <button
            type="button"
            onClick={() => setMode("face")}
            className={cn(
              "rounded-full px-4 py-2 text-center transition",
              mode === "face"
                ? "bg-white text-indigo-600 shadow-sm"
                : "hover:text-indigo-600"
            )}
          >
            Scan Wajah
          </button>
        </div>
      </div>

      {mode === "barcode" ? (
        <>
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
          {scanState.status !== "idle" && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/70 px-4 text-center">
              <div
                className={cn(
                  "inline-flex items-center gap-2 rounded-2xl bg-white/95 px-4 py-3 text-sm font-semibold shadow-lg",
                  scanState.status === "success"
                    ? "text-emerald-600 shadow-emerald-500/30"
                    : "text-rose-600 shadow-rose-500/30"
                )}
              >
                {scanState.status === "success" ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <XCircle className="h-5 w-5" />
                )}
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
          <p className="mt-4 text-xs">
            Simpan layar ini sebagai bukti jika diperlukan. Data tersimpan di
            sistem dan akan terlihat di menu status.
          </p>
        </section>
      )}
        </>
      ) : (
        <>
          <section className="rounded-3xl bg-white p-5 shadow-lg shadow-slate-200/40">
            <header className="flex flex-col gap-2">
              <p className="text-xs uppercase tracking-widest text-indigo-500">
                Scan Wajah
              </p>
              <h2 className="text-xl font-semibold text-slate-900">
                Arahkan wajah Anda ke kamera
              </h2>
              <p className="text-sm text-slate-500">
                Sistem akan mencocokkan wajah dengan data yang telah
                didaftarkan guru. Pastikan pencahayaan cukup dan wajah masuk ke
                dalam frame.
              </p>
            </header>

            <div className="relative mt-4 overflow-hidden rounded-3xl border border-slate-100 bg-black/80">
              {faceCameraError ? (
                <div className="p-6 text-center text-sm text-rose-400">
                  {faceCameraError}
                </div>
              ) : (
                <video
                  ref={faceVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="h-64 w-full rounded-3xl object-cover"
                />
              )}
              {faceScanState.status !== "idle" && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/70 px-4 text-center">
                  <div
                    className={cn(
                      "inline-flex items-center gap-2 rounded-2xl bg-white/95 px-4 py-3 text-sm font-semibold shadow-lg",
                      faceScanState.status === "success"
                        ? "text-emerald-600 shadow-emerald-500/30"
                        : faceScanState.status === "error"
                          ? "text-rose-600 shadow-rose-500/30"
                          : "text-slate-600 shadow-slate-400/30"
                    )}
                  >
                    {faceScanState.status === "success" ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : faceScanState.status === "error" ? (
                      <XCircle className="h-5 w-5" />
                    ) : (
                      <Info className="h-5 w-5" />
                    )}
                    {faceScanState.message}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold",
                  faceScanState.status === "success"
                    ? statusColor.Hadir
                    : faceScanState.status === "error"
                      ? statusColor.error
                      : statusColor.idle
                )}
              >
                {faceScanState.status === "success" ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : faceScanState.status === "error" ? (
                  <XCircle className="h-4 w-4" />
                ) : (
                  <Info className="h-4 w-4" />
                )}
                {faceScanState.message}
              </div>
            </div>

            {faceDataLoading && (
              <p className="mt-4 text-center text-xs text-slate-400">
                Memuat data wajah siswa…
              </p>
            )}
            {!faceDataLoading && faceRecords.length === 0 && (
              <p className="mt-4 text-center text-xs text-slate-400">
                Belum ada data wajah. Minta guru untuk mendaftarkan wajah Anda.
              </p>
            )}
          </section>

          {faceScanState.status === "success" && (
            <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-700 shadow-sm">
              <h3 className="text-lg font-semibold">
                Kehadiran tercatat untuk{" "}
                {faceScanState.studentName ?? faceScanState.scannedId}
              </h3>
              <p className="mt-1 text-sm">
                ID Siswa: <strong>{faceScanState.scannedId}</strong>
              </p>
              {faceScanState.className && (
                <p className="text-sm">
                  Kelas: <strong>{faceScanState.className}</strong>
                </p>
              )}
              <p className="text-sm">
                Jam Absen: <strong>{faceScanState.timestamp}</strong>
              </p>
              <p className="mt-4 text-xs">
                Simpan layar ini sebagai bukti jika diperlukan. Data tersimpan di
                sistem dan akan terlihat di menu status.
              </p>
            </section>
          )}
        </>
      )}
      {mode === "face" && (
        <div className="fixed bottom-4 left-0 right-0 z-50 px-4 sm:static sm:pb-6">
          <button
            type="button"
            onClick={handleGlobalAction}
            disabled={actionDisabled}
            className="flex w-full items-center justify-center rounded-full bg-indigo-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
          >
            <Camera className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
}
