"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useStudents } from "@/contexts/StudentContext";

type RoleTab = "guru" | "siswa";

const guruCredentials = {
  email: "guru@sekolah.id",
  password: "12345",
};

export default function LoginPage() {
  const router = useRouter();
  const { session, hydrated: authHydrated, loginGuru } = useAuth();
  const { hydrated: studentHydrated } = useStudents();
  const [activeTab, setActiveTab] = useState<RoleTab>("guru");
  const [email, setEmail] = useState(guruCredentials.email);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const isReady = authHydrated && studentHydrated;

  useEffect(() => {
    if (!isReady) return;
    if (session?.role === "guru") {
      router.replace("/guru/dashboard");
    } else if (session?.role === "siswa") {
      router.replace("/siswa/scan");
    }
  }, [session, router, isReady]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (activeTab === "guru") {
      const success = await loginGuru(email, password);
      if (!success) {
        setError("Email atau password salah. Gunakan kredensial dummy di atas.");
        return;
      }
      router.replace("/guru/dashboard");
      return;
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 px-4 py-12">
      <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-xl backdrop-blur">
        {!isReady && (
          <div className="mb-6 flex items-center justify-center rounded-2xl bg-slate-100 px-4 py-2 text-sm text-slate-500">
            Memuat data akun… Harap tunggu sebentar.
          </div>
        )}
        <div className="mb-8 flex flex-col gap-3 text-center">
          <div className="inline-flex items-center justify-center gap-2">
            <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-indigo-600">
              Absensi Barcode
            </span>
          </div>
          <h1 className="text-3xl font-semibold text-slate-900">
            Masuk ke Portal Sekolah
          </h1>
          <p className="text-sm text-slate-500">
            Pilih role sesuai kebutuhan. Data hanya simulasi dan disimpan di
            browser Anda.
          </p>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-2 rounded-full bg-slate-100 p-1 text-sm font-medium text-slate-500">
          <button
            type="button"
            onClick={() => setActiveTab("guru")}
            className={`rounded-full px-4 py-2 transition ${
              activeTab === "guru"
                ? "bg-white text-indigo-600 shadow-sm"
                : "hover:text-indigo-600"
            }`}
          >
            Guru / Admin
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("siswa")}
            className={`rounded-full px-4 py-2 transition ${
              activeTab === "siswa"
                ? "bg-white text-indigo-600 shadow-sm"
                : "hover:text-indigo-600"
            }`}
          >
            Siswa
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {activeTab === "guru" ? (
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-600">
                  Email Guru
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none ring-indigo-500 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2"
                  placeholder="guru@sekolah.id"
                  autoComplete="email"
                  disabled={!isReady}
                />
                <p className="mt-1 text-xs text-slate-400">
                  Dummy login: guru@sekolah.id / 12345
                </p>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-600">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none ring-indigo-500 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2"
                  placeholder="•••••"
                  autoComplete="current-password"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-700">
                  Akses Cepat untuk Siswa
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  Setiap kartu barcode sudah berisi identitas unik siswa. Cukup
                  tekan tombol di bawah untuk langsung masuk ke halaman scan
                  tanpa perlu memilih nama.
                </p>
              </div>
            </div>
          )}

          {error && (
            <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          {activeTab === "guru" ? (
            <button
              type="submit"
              disabled={!isReady}
              className="inline-flex w-full items-center justify-center rounded-xl bg-indigo-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:bg-indigo-300 disabled:shadow-none"
            >
              Masuk Sekarang
            </button>
          ) : (
            <Link
              href="/siswa/scan"
              className="inline-flex w-full items-center justify-center rounded-xl bg-indigo-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Buka Halaman Scan
            </Link>
          )}
        </form>

        <div className="mt-8">
          <div className="flex items-center justify-between text-xs uppercase tracking-wider text-slate-400">
            <span className="h-px flex-1 bg-slate-200" />
            <span className="px-3">Informasi</span>
            <span className="h-px flex-1 bg-slate-200" />
          </div>
          <div className="mt-4 grid gap-3 text-xs text-slate-500 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-100 px-4 py-3">
              Role guru memiliki akses penuh untuk mengelola data siswa, barcode,
              rekap dan forum komunikasi.
            </div>
            <div className="rounded-xl bg-slate-100 px-4 py-3">
              Role siswa hanya dapat melakukan scan barcode dari guru dan melihat
              status kehadiran hari ini.
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-slate-400">
          Dengan masuk Anda menyetujui penggunaan data dummy di perangkat ini.
          <br />
          Buat laporan? Hubungi <Link href="mailto:admin@sekolah.id" className="text-indigo-500 underline">admin@sekolah.id</Link>
        </p>
      </div>
    </div>
  );
}
