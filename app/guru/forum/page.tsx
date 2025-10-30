"use client";

import { FormEvent, useState } from "react";
import { HeartPulse, MessageCircle, Send, Smile } from "lucide-react";
import { cn } from "@/lib/utils";

type Mood = "Senang" | "Netral" | "Sedih" | "Perlu Perhatian";

type ForumItem = {
  id: string;
  student: string;
  className: string;
  mood: Mood;
  message: string;
  createdAt: string;
};

const initialForum: ForumItem[] = [
  {
    id: "FOR-001",
    student: "Siti Rahma",
    className: "X IPA 2",
    mood: "Sedih",
    message:
      "Mengeluh sakit kepala sejak kemarin. Sudah izin pulang lebih awal, mohon pantauan untuk hari berikutnya.",
    createdAt: "10:15",
  },
  {
    id: "FOR-002",
    student: "Budi Santoso",
    className: "X IPS 1",
    mood: "Netral",
    message:
      "Butuh motivasi tambahan di kelas. Mungkin bisa diberi kesempatan presentasi agar lebih percaya diri.",
    createdAt: "09:40",
  },
  {
    id: "FOR-003",
    student: "Lina Kartika",
    className: "XI IPA 1",
    mood: "Senang",
    message:
      "Aktif mengikuti pembelajaran dan membantu teman. Terus berikan apresiasi.",
    createdAt: "08:55",
  },
];

const moodBadge: Record<Mood, string> = {
  Senang: "bg-emerald-100 text-emerald-600",
  Netral: "bg-slate-100 text-slate-600",
  Sedih: "bg-amber-100 text-amber-600",
  "Perlu Perhatian": "bg-rose-100 text-rose-600",
};

export default function GuruForumPage() {
  const [forumItems, setForumItems] = useState(initialForum);
  const [student, setStudent] = useState("");
  const [className, setClassName] = useState("");
  const [mood, setMood] = useState<Mood>("Senang");
  const [message, setMessage] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!student.trim() || !className.trim() || !message.trim()) return;

    setForumItems((prev) => [
      {
        id: `FOR-${(prev.length + 1).toString().padStart(3, "0")}`,
        student,
        className,
        mood,
        message,
        createdAt: new Date().toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
      ...prev,
    ]);

    setStudent("");
    setClassName("");
    setMood("Senang");
    setMessage("");
  };

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
          Catat kondisi emosional siswa agar wali kelas atau BK dapat menindaklanjuti.
          Data tersimpan secara lokal untuk simulasi.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-500">
              Nama siswa
            </label>
            <input
              value={student}
              onChange={(event) => setStudent(event.target.value)}
              required
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none ring-indigo-500 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2"
              placeholder="contoh: Ahmad Fauzi"
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-500">
              Kelas
            </label>
            <input
              value={className}
              onChange={(event) => setClassName(event.target.value)}
              required
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none ring-indigo-500 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2"
              placeholder="contoh: X IPA 2"
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-500">
              Mood
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(["Senang", "Netral", "Sedih", "Perlu Perhatian"] as Mood[]).map(
                (option) => (
                  <button
                    type="button"
                    key={option}
                    onClick={() => setMood(option)}
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition",
                      mood === option
                        ? "border-indigo-200 bg-indigo-50 text-indigo-600"
                        : "border-slate-200 text-slate-500 hover:border-indigo-200 hover:text-indigo-600"
                    )}
                  >
                    <Smile className="h-3.5 w-3.5" />
                    {option}
                  </button>
                )
              )}
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
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none ring-indigo-500 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2"
              placeholder="Tuliskan kondisi emosional atau catatan untuk orang tua/wali."
            />
          </div>
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-700"
          >
            <Send className="h-4 w-4" />
            Kirim Laporan
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
            Total {forumItems.length} laporan
          </span>
        </header>

        <div className="space-y-4">
          {forumItems.map((item) => (
            <article
              key={item.id}
              className="relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-5 text-sm shadow-sm transition hover:shadow-md"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-slate-900">
                    {item.student}
                  </p>
                  <p className="text-xs uppercase tracking-widest text-slate-400">
                    {item.className}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2 text-right">
                  <span
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold",
                      moodBadge[item.mood]
                    )}
                  >
                    <span className="h-2 w-2 rounded-full bg-current" />
                    {item.mood}
                  </span>
                  <span className="text-xs text-slate-400">
                    {item.createdAt} WIB
                  </span>
                </div>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                {item.message}
              </p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-indigo-600">
                <MessageCircle className="h-3.5 w-3.5" />
                Untuk ditindaklanjuti wali kelas
              </div>
            </article>
          ))}
        </div>

        {forumItems.length === 0 && (
          <div className="rounded-3xl border border-dashed border-slate-200 p-10 text-center text-sm text-slate-500">
            Belum ada laporan. Tambahkan catatan pertama Anda melalui formulir.
          </div>
        )}
      </section>
    </div>
  );
}
