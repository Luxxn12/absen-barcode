"use client";

import { FormEvent, useMemo, useState } from "react";
import { Plus, Search, Trash2, Pencil, QrCode, X } from "lucide-react";
import {
  AttendanceStatus,
  Student,
  useStudents,
} from "@/contexts/StudentContext";
import { cn } from "@/lib/utils";

const statusOptions: AttendanceStatus[] = ["Hadir", "Sakit", "Izin", "Alfa"];

export default function GuruSiswaPage() {
  const { students, addStudent, updateStudent, removeStudent } = useStudents();
  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Student | null>(null);
  const [formState, setFormState] = useState({
    name: "",
    className: "",
    lastStatus: "Hadir" as AttendanceStatus,
    lastCheckIn: "07:00",
  });

  const filteredStudents = useMemo(() => {
    if (!search.trim()) return students;
    return students.filter(
      (student) =>
        student.name.toLowerCase().includes(search.toLowerCase()) ||
        student.className.toLowerCase().includes(search.toLowerCase()) ||
        student.id.toLowerCase().includes(search.toLowerCase())
    );
  }, [students, search]);

  const openAddModal = () => {
    setEditingStudent(null);
    setFormState({
      name: "",
      className: "",
      lastStatus: "Hadir",
      lastCheckIn: "07:00",
    });
    setIsFormOpen(true);
  };

  const openEditModal = (student: Student) => {
    setEditingStudent(student);
    setFormState({
      name: student.name,
      className: student.className,
      lastStatus: student.lastStatus,
      lastCheckIn: student.lastCheckIn,
    });
    setIsFormOpen(true);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (editingStudent) {
      updateStudent(editingStudent.id, {
        name: formState.name,
        className: formState.className,
        lastStatus: formState.lastStatus,
        lastCheckIn: formState.lastCheckIn,
      });
    } else {
      addStudent({
        name: formState.name,
        className: formState.className,
        lastStatus: formState.lastStatus,
        lastCheckIn: formState.lastCheckIn,
      });
    }
    setIsFormOpen(false);
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-lg shadow-slate-200/40">
        <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-indigo-500">
              Data Siswa
            </p>
            <h2 className="text-xl font-semibold text-slate-900">
              Kelola data siswa & barcode
            </h2>
          </div>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-500/30 transition hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            Tambah Siswa
          </button>
        </header>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-11 py-3 text-sm text-slate-700 outline-none ring-indigo-500 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2"
              placeholder="Cari nama, kelas, atau ID barcode siswa"
            />
          </div>
          <p className="text-xs text-slate-400">
            Total siswa terdaftar: <strong>{students.length}</strong>
          </p>
        </div>

        <div className="hidden overflow-hidden rounded-3xl border border-slate-100 lg:block">
          <table className="min-w-full bg-white text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-widest text-slate-500">
              <tr>
                <th className="px-6 py-3">Nama</th>
                <th className="px-6 py-3">Kelas</th>
                <th className="px-6 py-3">QR Code</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="transition hover:bg-slate-50/60">
                  <td className="px-6 py-4 font-semibold text-slate-900">
                    {student.name}
                  </td>
                  <td className="px-6 py-4">{student.className}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-500">
                      <QrCode className="h-4 w-4" />
                      {student.id}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={cn(
                        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold",
                        statusBadge(student.lastStatus)
                      )}
                    >
                      <span className="h-2 w-2 rounded-full bg-current" />
                      {student.lastStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => openEditModal(student)}
                        className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-indigo-600 transition hover:border-indigo-200 hover:bg-indigo-50"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      <button
                        onClick={() => setConfirmDelete(student)}
                        className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-rose-500 transition hover:border-rose-200 hover:bg-rose-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredStudents.length === 0 && (
            <div className="p-10 text-center text-sm text-slate-500">
              Tidak ada data siswa. Tambah data baru atau ubah kata kunci
              pencarian.
            </div>
          )}
        </div>

        <div className="space-y-4 lg:hidden">
          {filteredStudents.map((student) => (
            <div
              key={student.id}
              className="relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-slate-900">
                    {student.name}
                  </p>
                  <p className="text-sm text-slate-500">{student.className}</p>
                </div>
                <span className="rounded-2xl bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                  {student.id}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <span
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-3 py-1 font-semibold",
                    statusBadge(student.lastStatus)
                  )}
                >
                  <span className="h-2 w-2 rounded-full bg-current" />
                  {student.lastStatus}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-500">
                  Jam {student.lastCheckIn === "—" ? "-" : student.lastCheckIn}
                </span>
              </div>
              <div className="mt-5 flex items-center gap-3">
                <button
                  onClick={() => openEditModal(student)}
                  className="flex-1 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-indigo-500/30 transition hover:bg-indigo-700"
                >
                  Edit Data
                </button>
                <button
                  onClick={() => setConfirmDelete(student)}
                  className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-500 transition hover:bg-rose-100"
                >
                  Hapus
                </button>
              </div>
            </div>
          ))}
          {filteredStudents.length === 0 && (
            <div className="rounded-3xl border border-dashed border-slate-200 p-10 text-center text-sm text-slate-500">
              Tidak ada data siswa sesuai pencarian.
            </div>
          )}
        </div>
      </section>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 px-4 py-8 backdrop-blur-sm sm:items-center">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl">
            <button
              className="absolute right-4 top-4 rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              onClick={() => setIsFormOpen(false)}
            >
              <X className="h-4 w-4" />
            </button>
            <h3 className="text-xl font-semibold text-slate-900">
              {editingStudent ? "Edit Data Siswa" : "Tambah Siswa Baru"}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              QR code otomatis mengikuti ID siswa. Pastikan nama dan kelas sudah
              benar.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Nama Lengkap
                </label>
                <input
                  value={formState.name}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      name: event.target.value,
                    }))
                  }
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
                  value={formState.className}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      className: event.target.value,
                    }))
                  }
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none ring-indigo-500 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2"
                  placeholder="contoh: XI IPA 1"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-500">
                    Status Kehadiran
                  </label>
                  <select
                    value={formState.lastStatus}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        lastStatus: event.target.value as AttendanceStatus,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none ring-indigo-500 focus:border-indigo-500 focus:ring-2"
                  >
                    {statusOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-500">
                    Jam Masuk
                  </label>
                  <input
                    value={formState.lastCheckIn}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        lastCheckIn: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none ring-indigo-500 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2"
                    placeholder="07:00"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-700"
                >
                  {editingStudent ? "Simpan Perubahan" : "Simpan Data"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-xl">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-500">
              <Trash2 className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-slate-900">
              Hapus Data Siswa?
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Data {confirmDelete.name} akan dihapus dari perangkat ini. Tindakan
              ini tidak dapat dibatalkan.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                onClick={() => setConfirmDelete(null)}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
              >
                Batalkan
              </button>
              <button
                onClick={() => {
                  removeStudent(confirmDelete.id);
                  setConfirmDelete(null);
                }}
                className="rounded-xl bg-rose-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-400/30 transition hover:bg-rose-600"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function statusBadge(status: AttendanceStatus) {
  switch (status) {
    case "Hadir":
      return "bg-emerald-100 text-emerald-600";
    case "Sakit":
      return "bg-amber-100 text-amber-600";
    case "Izin":
      return "bg-blue-100 text-blue-600";
    case "Alfa":
      return "bg-rose-100 text-rose-600";
    default:
      return "bg-slate-100 text-slate-600";
  }
}
