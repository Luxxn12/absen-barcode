"use client";

import { FormEvent, useCallback, useMemo, useState } from "react";
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  Clock,
  School,
  Loader2,
  X,
  Users,
} from "lucide-react";
import { useStudents } from "@/contexts/StudentContext";
import {
  AttendanceRecord,
  AttendanceStatus,
  useAttendance,
} from "@/contexts/AttendanceContext";
import { useAnnouncements } from "@/contexts/AnnouncementContext";
import { cn } from "@/lib/utils";

const statusColors: Record<
  AttendanceStatus | "Belum Absen",
  string
> = {
  Hadir: "bg-emerald-100 text-emerald-600",
  Sakit: "bg-amber-100 text-amber-600",
  Izin: "bg-blue-100 text-blue-600",
  Alfa: "bg-rose-100 text-rose-600",
  "Belum Absen": "bg-slate-100 text-slate-600",
};

type AbsenceAlert = {
  studentId: string;
  studentName: string;
  className: string;
  streak: number;
};

const ABSENCE_THRESHOLD = 3;

function formatDisplayTime(time: string) {
  if (!time) return "-";
  return time.replace(":", ".");
}

export default function GuruDashboardPage() {
  const { students, loading: studentsLoading } = useStudents();
  const { records, getRecordsByDate, loading: attendanceLoading } =
    useAttendance();
  const {
    announcements,
    loading: announcementsLoading,
    addAnnouncement,
  } = useAnnouncements();
  const isLoading = studentsLoading || attendanceLoading;
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
  const [announcementError, setAnnouncementError] = useState("");
  const [isSavingAnnouncement, setIsSavingAnnouncement] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({
    time: "",
    title: "",
  });

  const todayKey = useMemo(() => {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return local.toISOString().split("T")[0];
  }, []);

  const todayRecords = useMemo(
    () => getRecordsByDate(todayKey),
    [getRecordsByDate, todayKey]
  );

  const recordMap = useMemo(() => {
    const map = new Map<string, { status: AttendanceStatus; checkIn: string }>();
    todayRecords.forEach((record) => {
      map.set(record.studentId, {
        status: record.status,
        checkIn: record.checkIn,
      });
    });
    return map;
  }, [todayRecords]);

  const totalStudents = students.length;
  const hadirCount = todayRecords.filter((record) => record.status === "Hadir").length;
  const sakitCount = todayRecords.filter((record) => record.status === "Sakit").length;
  const izinCount = todayRecords.filter((record) => record.status === "Izin").length;
  const alfaCount = todayRecords.filter((record) => record.status === "Alfa").length;
  const unrecordedCount = students.reduce(
    (total, student) => total + (recordMap.has(student.id) ? 0 : 1),
    0
  );
  const tanpaKeteranganCount = alfaCount + unrecordedCount;

  const today = useMemo(
    () =>
      new Date().toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }),
    []
  );

  const absenceAlerts = useMemo<AbsenceAlert[]>(() => {
    if (!records.length) return [];
    const grouped = new Map<string, AttendanceRecord[]>();
    records.forEach((record) => {
      const list = grouped.get(record.studentId);
      if (list) {
        list.push(record);
      } else {
        grouped.set(record.studentId, [record]);
      }
    });
    const studentMap = new Map(students.map((student) => [student.id, student]));
    const alerts: AbsenceAlert[] = [];
    grouped.forEach((studentRecords, studentId) => {
      const sorted = [...studentRecords].sort((a, b) =>
        b.date.localeCompare(a.date)
      );
      let streak = 0;
      for (const entry of sorted) {
        if (entry.status === "Hadir") {
          break;
        }
        streak += 1;
      }
      if (streak >= ABSENCE_THRESHOLD) {
        const student = studentMap.get(studentId);
        alerts.push({
          studentId,
          studentName: student?.name ?? studentId,
          className: student?.className ?? "-",
          streak,
        });
      }
    });
    return alerts.sort((a, b) => b.streak - a.streak);
  }, [records, students]);

  const absenceMessage = useMemo(() => {
    if (!absenceAlerts.length) {
      return `Semua siswa tercatat hadir dalam ${ABSENCE_THRESHOLD} hari terakhir. Tidak ada pengumuman mendesak.`;
    }
    const highlighted = absenceAlerts.slice(0, 2);
    const names = highlighted.map((alert) => alert.studentName).join(", ");
    const others = absenceAlerts.length - highlighted.length;
    const suffix =
      others > 0 ? ` dan ${others} siswa lainnya` : "";
    const days = absenceAlerts[0]?.streak ?? ABSENCE_THRESHOLD;
    return `Kirim pengingat kepada orang tua ${names}${suffix} karena tidak hadir ${days} hari berturut-turut.`;
  }, [absenceAlerts]);

  const openAnnouncementForm = () => {
    setAnnouncementError("");
    setNewAnnouncement({ time: "", title: "" });
    setIsSavingAnnouncement(false);
    setIsAnnouncementModalOpen(true);
  };

  const handleAnnouncementSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    if (isSavingAnnouncement) return;
    const trimmedTitle = newAnnouncement.title.trim();
    const trimmedTime = newAnnouncement.time.trim();
    if (!trimmedTime || !trimmedTitle) {
      setAnnouncementError("Waktu dan isi pengumuman wajib diisi.");
      return;
    }
    setIsSavingAnnouncement(true);
    const created = await addAnnouncement({
      time: trimmedTime,
      title: trimmedTitle,
    });
    if (!created) {
      setAnnouncementError("Pengumuman gagal disimpan. Coba lagi.");
      setIsSavingAnnouncement(false);
      return;
    }
    setIsAnnouncementModalOpen(false);
    setAnnouncementError("");
    setNewAnnouncement({ time: "", title: "" });
    setIsSavingAnnouncement(false);
  };

  const handleAnnouncementCancel = () => {
    setIsAnnouncementModalOpen(false);
    setAnnouncementError("");
    setNewAnnouncement({ time: "", title: "" });
    setIsSavingAnnouncement(false);
  };

  const miniTable = useMemo(
    () =>
      students.slice(0, 6).map((student) => {
        const record = recordMap.get(student.id);
        return {
          ...student,
          status: record?.status ?? ("Belum Absen" as const),
          checkIn: record?.checkIn ?? "-",
        };
      }),
    [students, recordMap]
  );

  const exportCsv = useCallback(() => {
    if (isLoading) return;
    const rows = students.map((student) => {
      const record = recordMap.get(student.id);
      return {
        id: student.id,
        name: student.name,
        className: student.className,
        status: record?.status ?? "Belum Absen",
        checkIn:
          record?.checkIn && record.checkIn !== "-"
            ? `${record.checkIn} WIB`
            : "-",
      };
    });
    if (!rows.length) return;
    const headers = ["ID", "Nama", "Kelas", "Status", "Jam Masuk"];
    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        [
          row.id,
          `"${row.name.replace(/"/g, '""')}"`,
          `"${row.className.replace(/"/g, '""')}"`,
          row.status,
          row.checkIn,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([`\ufeff${csvContent}`], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const todayLabel = new Date()
      .toISOString()
      .split("T")[0]
      .replace(/-/g, "");
    link.download = `rekap-harian-${todayLabel}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [students, recordMap, isLoading]);

  return (
    <div className="space-y-8">
      <section className="grid gap-4 lg:grid-cols-4">
        <SummaryCard
          title="Total Siswa"
          value={isLoading ? "Memuat..." : `${totalStudents} siswa`}
          icon={Users}
          accent="from-indigo-500 to-purple-500"
        />
        <SummaryCard
          title="Hadir Hari Ini"
          value={isLoading ? "Memuat..." : `${hadirCount} siswa`}
          icon={CheckCircle2}
          accent="from-emerald-500 to-lime-500"
        />
        <SummaryCard
          title="Sakit / Izin"
          value={isLoading ? "Memuat..." : `${sakitCount + izinCount} siswa`}
          icon={Activity}
          accent="from-amber-500 to-orange-500"
        />
        <SummaryCard
          title="Tanpa Keterangan"
          value={isLoading ? "Memuat..." : `${tanpaKeteranganCount} siswa`}
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
            <button
              onClick={exportCsv}
              disabled={isLoading || !students.length}
              className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-500/30 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300 disabled:shadow-none"
            >
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
              {isLoading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={`loading-${index}`}
                    className="grid animate-pulse grid-cols-1 gap-y-1 px-4 py-4 text-sm sm:grid-cols-4 sm:items-center sm:gap-3"
                  >
                    <div className="h-4 w-32 rounded-full bg-slate-200" />
                    <div className="hidden h-4 w-20 rounded-full bg-slate-200 sm:block" />
                    <div className="h-4 w-24 rounded-full bg-slate-200" />
                    <div className="h-4 w-16 rounded-full bg-slate-200" />
                  </div>
                ))
              ) : miniTable.length ? (
                miniTable.map((row) => (
                  <div
                    key={row.id}
                    className="grid grid-cols-1 gap-y-1 px-4 py-4 text-sm sm:grid-cols-4 sm:items-center sm:gap-3"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">
                        {row.name}
                      </p>
                      <p className="text-xs text-slate-400 sm:hidden">
                        {row.className}
                      </p>
                    </div>
                    <div className="text-slate-500 max-sm:hidden">
                      {row.className}
                    </div>
                    <div>
                      <span
                        className={cn(
                          "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold",
                          statusColors[row.status] ?? "bg-slate-100 text-slate-600"
                        )}
                      >
                        <span className="h-2 w-2 rounded-full bg-current" />
                        {row.status}
                      </span>
                    </div>
                    <div className="text-slate-500">
                      {row.checkIn === "-" ? "Belum tercatat" : `${row.checkIn} WIB`}
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-4 py-6 text-sm text-slate-500">
                  Belum ada data siswa.
                </div>
              )}
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
              <p className="text-sm text-indigo-100">{absenceMessage}</p>
              {absenceAlerts.length > 0 && (
                <ul className="mt-3 space-y-1 text-xs text-indigo-100">
                  {absenceAlerts.map((alert) => (
                    <li
                      key={alert.studentId}
                      className="rounded-full bg-white/10 px-3 py-1 backdrop-blur"
                    >
                      {alert.studentName} ({alert.className}) •{" "}
                      {alert.streak} hari berturut-turut
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <ul className="space-y-3 text-sm text-indigo-50">
            {announcementsLoading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <li
                  key={`announcement-loading-${index}`}
                  className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 backdrop-blur"
                >
                  <span className="h-6 w-16 animate-pulse rounded-full bg-white/20" />
                  <span className="h-4 flex-1 animate-pulse rounded-full bg-white/10" />
                </li>
              ))
            ) : announcements.length === 0 ? (
              <li className="rounded-2xl bg-white/10 px-4 py-3 text-indigo-100/80 backdrop-blur">
                Belum ada pengumuman terjadwal.
              </li>
            ) : (
              announcements.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 backdrop-blur"
                >
                  <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white">
                    {formatDisplayTime(item.time)}
                  </span>
                  <span className="flex-1">{item.title}</span>
                </li>
              ))
            )}
          </ul>
          <button
            onClick={openAnnouncementForm}
            disabled={announcementsLoading}
            className="mt-auto inline-flex items-center justify-center rounded-full bg-white px-4 py-3 text-sm font-semibold text-indigo-600 shadow-md shadow-indigo-500/30 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Tambah Pengumuman
          </button>
        </aside>
      </section>
      {isAnnouncementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Jadwalkan Pengumuman
                </h3>
                <p className="text-sm text-slate-500">
                  Tentukan waktu dan isi pesan yang ingin dikirimkan.
                </p>
              </div>
              <button
                onClick={handleAnnouncementCancel}
                className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleAnnouncementSubmit} className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Waktu
                </label>
                <input
                  type="time"
                  value={newAnnouncement.time}
                  onChange={(event) => {
                    setAnnouncementError("");
                    setNewAnnouncement((prev) => ({
                      ...prev,
                      time: event.target.value,
                    }));
                  }}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none ring-indigo-500 focus:border-indigo-500 focus:ring-2"
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Isi Pengumuman
                </label>
                <input
                  value={newAnnouncement.title}
                  onChange={(event) => {
                    setAnnouncementError("");
                    setNewAnnouncement((prev) => ({
                      ...prev,
                      title: event.target.value,
                    }));
                  }}
                  placeholder="Contoh: Reminder pengumpulan tugas"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none ring-indigo-500 focus:border-indigo-500 focus:ring-2"
                  required
                />
              </div>
              {announcementError && (
                <p className="text-xs text-rose-500">{announcementError}</p>
              )}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleAnnouncementCancel}
                  disabled={isSavingAnnouncement}
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingAnnouncement}
                  className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-500/30 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
                >
                  {isSavingAnnouncement ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    "Simpan"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
