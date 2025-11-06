"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  HeartPulse,
  Loader2,
  MessageCircle,
  Send,
  Smile,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useStudents } from "@/contexts/StudentContext";
import {
  listForumEntriesAction,
  createForumEntryAction,
  deleteForumEntryAction,
  type ForumMood,
  type ForumEntryRecord,
} from "@/app/actions/forum";

type ForumEntry = ForumEntryRecord;

const moodOptions: Array<{ value: ForumMood; label: string }> = [
  { value: "Senang", label: "Senang" },
  { value: "Netral", label: "Netral" },
  { value: "Sedih", label: "Sedih" },
  { value: "PerluPerhatian", label: "Perlu Perhatian" },
];

const moodBadge: Record<ForumMood, string> = {
  Senang: "bg-emerald-100 text-emerald-600",
  Netral: "bg-slate-100 text-slate-600",
  Sedih: "bg-amber-100 text-amber-600",
  PerluPerhatian: "bg-rose-100 text-rose-600",
};

const moodLabel: Record<ForumMood, string> = {
  Senang: "Senang",
  Netral: "Netral",
  Sedih: "Sedih",
  PerluPerhatian: "Perlu Perhatian",
};

export default function GuruForumPage() {
  const {
    students,
    classes,
    loading: studentsLoading,
  } = useStudents();
  const [entries, setEntries] = useState<ForumEntry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [mood, setMood] = useState<ForumMood>("Senang");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const data = await listForumEntriesAction();
        setEntries(data);
      } catch (err) {
        console.error(err);
        setError("Gagal memuat data forum.");
      } finally {
        setLoadingEntries(false);
      }
    }
    void load();
  }, []);

  useEffect(() => {
    if (studentsLoading) return;
    if (!students.length) {
      setSelectedStudentId("");
      return;
    }
    if (
      !selectedStudentId ||
      !students.some((student) => student.id === selectedStudentId)
    ) {
      setSelectedStudentId(students[0].id);
    }
  }, [studentsLoading, students, selectedStudentId]);

  const selectedStudent = useMemo(
    () => students.find((student) => student.id === selectedStudentId) ?? null,
    [students, selectedStudentId]
  );

  const classSummaries = useMemo(() => {
    const map = new Map<string, string>();
    classes.forEach((item) => {
      map.set(item.id, item.name);
    });
    return map;
  }, [classes]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (!selectedStudentId || !message.trim()) {
      setError("Lengkapi data siswa dan catatan.");
      return;
    }
    setSubmitting(true);
    try {
      const created = await createForumEntryAction({
        studentId: selectedStudentId,
        mood,
        message,
      });
      setEntries((prev) => [created, ...prev]);
      setMessage("");
      setMood("Senang");
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Gagal menyimpan laporan."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteError("");
    try {
      await deleteForumEntryAction(id);
      setEntries((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error(err);
      setDeleteError(
        err instanceof Error ? err.message : "Gagal menghapus laporan."
      );
    }
  };

  const totalReports = entries.length;
  const loading = loadingEntries || studentsLoading;

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <section className="rounded-3xl bg-white p-6 shadow-lg shadow-slate-200/40 lg:col-span-5">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-indigo-100 p-3 text-indigo-600">
            <HeartPulse className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-indigo-500">
              Forum Komunikasi
            </p>
            <h2 className="text-xl font-semibold text-slate-900">
              Tambah laporan emosional
            </h2>
          </div>
        </div>
        <p className="mt-3 text-sm text-slate-500">
          Catat kondisi emosional siswa agar wali kelas atau BK dapat
          menindaklanjuti. Data tersimpan di basis data dan dapat diakses oleh
          seluruh admin guru.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-500">
              Nama siswa
            </label>
            <select
              value={selectedStudentId}
              onChange={(event) => setSelectedStudentId(event.target.value)}
              disabled={studentsLoading || !students.length}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none ring-indigo-500 focus:border-indigo-500 focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-100"
            >
              {students.length === 0 ? (
                <option value="">Belum ada data siswa</option>
              ) : (
                students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name}
                  </option>
                ))
              )}
            </select>
            {selectedStudent && (
              <p className="mt-2 text-xs text-slate-500">
                Kelas:{" "}
                <span className="font-semibold text-slate-700">
                  {selectedStudent.className}
                </span>
              </p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-500">
              Mood
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {moodOptions.map((option) => (
                <button
                  type="button"
                  key={option.value}
                  onClick={() => setMood(option.value)}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition",
                    mood === option.value
                      ? "border-indigo-200 bg-indigo-50 text-indigo-600"
                      : "border-slate-200 text-slate-500 hover:border-indigo-200 hover:text-indigo-600"
                  )}
                >
                  <Smile className="h-3.5 w-3.5" />
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-500">
              Catatan
            </label>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              required
              rows={4}
              disabled={loading}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none ring-indigo-500 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-100"
              placeholder="Tuliskan kondisi emosional atau catatan untuk orang tua/wali."
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-100 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-600">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || submitting || !selectedStudentId}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300 disabled:shadow-none"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {submitting ? "Menyimpan..." : "Kirim Laporan"}
          </button>
        </form>
      </section>

      <section className="space-y-4 rounded-3xl bg-white p-6 shadow-lg shadow-slate-200/40 lg:col-span-7">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-indigo-500">
              Laporan Terbaru
            </p>
            <h2 className="text-xl font-semibold text-slate-900">
              Forum komunikasi orang tua
            </h2>
          </div>
          <span className="rounded-full bg-slate-100 px-4 py-1 text-xs font-semibold text-slate-500">
            Total {totalReports} laporan
          </span>
        </header>

        {deleteError && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-100 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-600">
            <AlertCircle className="h-4 w-4" />
            {deleteError}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center gap-2 rounded-3xl border border-dashed border-slate-200 p-10 text-sm text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
            Memuat data forum...
          </div>
        ) : entries.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 p-10 text-center text-sm text-slate-500">
            Belum ada laporan. Tambah catatan di sisi kiri.
          </div>
        ) : (
          <div className="space-y-4">
            {entries.map((item) => {
              const createdLabel = new Date(item.createdAt).toLocaleTimeString(
                "id-ID",
                {
                  hour: "2-digit",
                  minute: "2-digit",
                }
              );
              const className = item.classId
                ? classSummaries.get(item.classId) ?? item.className
                : item.className;
              return (
                <article
                  key={item.id}
                  className="relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-5 text-sm shadow-sm transition hover:shadow-md"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-slate-900">
                        {item.studentName}
                      </p>
                      <p className="text-xs uppercase tracking-widest text-slate-400">
                        {className}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold",
                        moodBadge[item.mood]
                      )}
                    >
                      <Smile className="h-3.5 w-3.5" />
                      {moodLabel[item.mood]}
                    </span>
                  </div>
                  <p className="mt-4 text-slate-600">{item.message}</p>
                  <footer className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
                    <div className="inline-flex items-center gap-2">
                      <MessageCircle className="h-3.5 w-3.5" />
                      <span>Dibuat {createdLabel}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span>ID: {item.id}</span>
                      <button
                        type="button"
                        onClick={() => void handleDelete(item.id)}
                        className="inline-flex items-center gap-1 rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-500 transition hover:bg-rose-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Hapus
                      </button>
                    </div>
                  </footer>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
