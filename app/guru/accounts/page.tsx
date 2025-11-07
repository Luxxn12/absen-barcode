"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, RefreshCw, Trash2 } from "lucide-react";
import {
  createGuruAccountAction,
  deleteGuruAccountAction,
  listGuruAccountsAction,
  type GuruAccountRecord,
} from "@/app/actions/guruAccounts";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

type FormState = {
  email: string;
  name: string;
  password: string;
  role: "guru" | "superadmin";
};

const defaultForm: FormState = {
  email: "",
  name: "",
  password: "",
  role: "guru",
};

export default function GuruAccountsPage() {
  const router = useRouter();
  const { session, hydrated } = useAuth();
  const [accounts, setAccounts] = useState<GuruAccountRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [formState, setFormState] = useState<FormState>(defaultForm);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const isSuperAdmin = session?.role === "superadmin";

  useEffect(() => {
    if (!hydrated) return;
    if (!isSuperAdmin) {
      router.replace("/login");
    }
  }, [hydrated, isSuperAdmin, router]);

  useEffect(() => {
    if (!hydrated || !isSuperAdmin) return;
    void refreshAccounts();
  }, [hydrated, isSuperAdmin]);

  const refreshAccounts = async () => {
    setRefreshing(true);
    setError("");
    try {
      const data = await listGuruAccountsAction();
      setAccounts(data);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Gagal memuat akun guru. Coba lagi."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (creating) return;
    setError("");
    setSuccessMessage("");

    const email = formState.email.trim();
    const name = formState.name.trim();
    const password = formState.password.trim();

    if (!email || !name || !password) {
      setError("Lengkapi email, nama, dan password akun baru.");
      return;
    }

    setCreating(true);
    try {
      const created = await createGuruAccountAction({
        email,
        name,
        password,
        role: formState.role,
      });
      setAccounts((prev) =>
        [...prev, created].sort((a, b) => a.email.localeCompare(b.email))
      );
      setFormState(defaultForm);
      setSuccessMessage(
        `Akun ${created.email} berhasil dibuat sebagai ${created.role}.`
      );
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Gagal membuat akun guru baru."
      );
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (deletingId) return;
    const account = accounts.find((item) => item.id === id);
    if (!account) return;
    if (
      session?.role === "superadmin" &&
      account.email === session.email
    ) {
      setError("Anda tidak dapat menghapus akun Anda sendiri.");
      return;
    }
    setDeletingId(id);
    setError("");
    setSuccessMessage("");
    try {
      await deleteGuruAccountAction(id);
      setAccounts((prev) => prev.filter((item) => item.id !== id));
      setSuccessMessage(`Akun ${account.email} berhasil dihapus.`);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Gagal menghapus akun guru."
      );
    } finally {
      setDeletingId(null);
    }
  };

  const totalGuru = useMemo(
    () => accounts.filter((item) => item.role === "guru").length,
    [accounts]
  );
  const totalSuperAdmin = useMemo(
    () => accounts.filter((item) => item.role === "superadmin").length,
    [accounts]
  );

  if (!hydrated || !isSuperAdmin) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="rounded-2xl border border-slate-200 bg-white px-8 py-10 text-center shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Memuat akses super admin…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-white p-6 shadow-lg shadow-slate-200/40">
        <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-indigo-500">
              Super Admin
            </p>
            <h2 className="text-xl font-semibold text-slate-900">
              Kelola akun guru & admin
            </h2>
            <p className="text-sm text-slate-500">
              Tambahkan akun baru untuk guru atau admin. Password tersimpan
              dalam bentuk terenkripsi.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void refreshAccounts()}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              className={cn(
                "h-4 w-4",
                refreshing && "animate-spin text-indigo-500"
              )}
            />
            Muat ulang data
          </button>
        </header>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Akun" value={accounts.length} accent="text-indigo-600 bg-indigo-100" />
          <StatCard label="Guru" value={totalGuru} accent="text-emerald-600 bg-emerald-100" />
          <StatCard label="Super Admin" value={totalSuperAdmin} accent="text-amber-600 bg-amber-100" />
          <StatCard label="Menunggu Verifikasi" value={0} accent="text-slate-600 bg-slate-100" />
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-3xl border border-slate-100 bg-slate-50/60 p-6">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Plus className="h-4 w-4 text-indigo-500" />
            Tambah akun baru
          </h3>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                Email
              </label>
              <input
                type="email"
                value={formState.email}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, email: event.target.value }))
                }
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none ring-indigo-500 focus:border-indigo-500 focus:ring-2"
                placeholder="guru.baru@sekolah.id"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                Nama lengkap
              </label>
              <input
                value={formState.name}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, name: event.target.value }))
                }
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none ring-indigo-500 focus:border-indigo-500 focus:ring-2"
                placeholder="Nama lengkap guru"
                required
              />
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                Password awal
              </label>
              <input
                type="text"
                value={formState.password}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    password: event.target.value,
                  }))
                }
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none ring-indigo-500 focus:border-indigo-500 focus:ring-2"
                placeholder="Password minimal 5 karakter"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                Role
              </label>
              <select
                value={formState.role}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    role: event.target.value as "guru" | "superadmin",
                  }))
                }
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none ring-indigo-500 focus:border-indigo-500 focus:ring-2"
              >
                <option value="guru">Guru / Admin</option>
                <option value="superadmin">Super Admin</option>
              </select>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-400">
              Password dapat diganti oleh guru setelah login.
            </div>
            <button
              type="submit"
              disabled={creating}
              className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
            >
              {creating ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Menyimpan…
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Simpan Akun
                </>
              )}
            </button>
          </div>
          {error && (
            <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-600">
              {error}
            </p>
          )}
          {successMessage && (
            <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-600">
              {successMessage}
            </p>
          )}
        </form>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-lg shadow-slate-200/40">
        <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-indigo-500">
              Daftar Akun
            </p>
            <h3 className="text-lg font-semibold text-slate-900">
              {accounts.length} akun terdaftar
            </h3>
          </div>
        </header>

        {loading ? (
          <div className="mt-6 space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={`account-skel-${index}`}
                className="flex items-center justify-between rounded-3xl border border-slate-100 bg-slate-50 px-5 py-4"
              >
                <div className="space-y-2">
                  <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
                  <div className="h-3 w-24 animate-pulse rounded bg-slate-200" />
                </div>
                <div className="h-8 w-24 animate-pulse rounded-full bg-slate-200" />
              </div>
            ))}
          </div>
        ) : accounts.length === 0 ? (
          <div className="mt-6 rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center text-sm text-slate-500">
            Belum ada akun guru. Tambahkan melalui formulir di atas.
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {accounts.map((account) => {
              const isSelf = account.email === session?.email;
              return (
                <article
                  key={account.id}
                  className="flex flex-col gap-4 rounded-3xl border border-slate-100 bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {account.name}
                    </p>
                    <p className="text-xs text-slate-500">{account.email}</p>
                    <p className="mt-1 text-[11px] uppercase tracking-widest text-indigo-500">
                      {account.role === "superadmin"
                        ? "Super Admin"
                        : "Guru / Admin"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] uppercase tracking-widest text-slate-400">
                      Dibuat{" "}
                      {account.createdAt
                        ? new Date(account.createdAt).toLocaleDateString("id-ID")
                        : "-"}
                    </span>
                    <button
                      type="button"
                      onClick={() => void handleDelete(account.id)}
                      disabled={isSelf || deletingId === account.id}
                      className="inline-flex items-center gap-2 rounded-full border border-rose-200 px-4 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {deletingId === account.id ? (
                        <>
                          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-rose-500 border-t-transparent" />
                          Menghapus…
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-3.5 w-3.5" />
                          Hapus
                        </>
                      )}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
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
  value: number;
  accent: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
      <p className="text-xs uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-slate-900">{value}</p>
      <div
        className={cn(
          "mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-widest",
          accent
        )}
      >
        {label}
      </div>
    </div>
  );
}
