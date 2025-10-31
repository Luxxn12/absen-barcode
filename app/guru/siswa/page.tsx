"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Trash2,
  Pencil,
  QrCode,
  X,
  Settings2,
} from "lucide-react";
import { Student, useStudents } from "@/contexts/StudentContext";

export default function GuruSiswaPage() {
  const {
    students,
    classes,
    addStudent,
    updateStudent,
    removeStudent,
    addClass,
    updateClass,
    removeClass,
  } = useStudents();
  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Student | null>(null);
  const [formState, setFormState] = useState({
    name: "",
    classId: "",
  });
  const [page, setPage] = useState(1);
  const [isClassManagerOpen, setIsClassManagerOpen] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [classDrafts, setClassDrafts] = useState<Record<string, string>>({});
  const [classError, setClassError] = useState("");

  const ITEMS_PER_PAGE = 10;

  const filteredStudents = useMemo(() => {
    if (!search.trim()) return students;
    return students.filter(
      (student) =>
        student.name.toLowerCase().includes(search.toLowerCase()) ||
        student.className.toLowerCase().includes(search.toLowerCase()) ||
        student.id.toLowerCase().includes(search.toLowerCase())
    );
  }, [students, search]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredStudents.length / ITEMS_PER_PAGE)
  );

  const safePage = Math.min(page, totalPages);

  const paginatedStudents = useMemo(() => {
    const start = (safePage - 1) * ITEMS_PER_PAGE;
    return filteredStudents.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredStudents, safePage]);

  const startItem =
    paginatedStudents.length === 0
      ? 0
      : (safePage - 1) * ITEMS_PER_PAGE + 1;
  const endItem = (safePage - 1) * ITEMS_PER_PAGE + paginatedStudents.length;
  const totalFiltered = filteredStudents.length;

  const openAddModal = () => {
    setEditingStudent(null);
    setFormState({
      name: "",
      classId: classes[0]?.id ?? "",
    });
    setIsFormOpen(true);
  };

  const openEditModal = (student: Student) => {
    setEditingStudent(student);
    const existingClass =
      classes.find((classItem) => classItem.name === student.className) ??
      addClass(student.className);
    setFormState({
      name: student.name,
      classId: existingClass?.id ?? "",
    });
    setIsFormOpen(true);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const selectedClass = classes.find(
      (classItem) => classItem.id === formState.classId
    );
    if (!selectedClass) return;
    if (editingStudent) {
      updateStudent(editingStudent.id, {
        name: formState.name,
        className: selectedClass.name,
      });
    } else {
      addStudent({
        name: formState.name,
        className: selectedClass.name,
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
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              onClick={() => {
                setClassDrafts(
                  classes.reduce<Record<string, string>>((acc, item) => {
                    acc[item.id] = item.name;
                    return acc;
                  }, {})
                );
                setNewClassName("");
                setClassError("");
                setIsClassManagerOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-5 py-3 text-sm font-semibold text-indigo-600 shadow-md shadow-indigo-500/10 transition hover:border-indigo-200 hover:bg-indigo-100"
            >
              <Settings2 className="h-4 w-4" />
              Kelola Kelas
            </button>
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-500/30 transition hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" />
              Tambah Siswa
            </button>
          </div>
        </header>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              className="w-full rounded-2xl border border-slate-200 bg-white px-11 py-3 text-sm text-slate-700 outline-none ring-indigo-500 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2"
              placeholder="Cari nama, kelas, atau ID barcode siswa"
            />
          </div>
          <p className="text-xs text-slate-400">
            Total siswa ditampilkan: <strong>{totalFiltered}</strong>
          </p>
        </div>

        <div className="hidden overflow-hidden rounded-3xl border border-slate-100 lg:block">
          <table className="min-w-full bg-white text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-widest text-slate-500">
              <tr>
                <th className="px-6 py-3">Nama</th>
                <th className="px-6 py-3">Kelas</th>
                <th className="px-6 py-3">QR Code</th>
                <th className="px-6 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {paginatedStudents.map((student) => (
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
          {paginatedStudents.map((student) => (
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

        <div className="flex flex-col gap-3 rounded-3xl border border-slate-100 bg-white px-4 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Menampilkan{" "}
            <strong className="text-slate-700">
              {startItem === 0 ? 0 : `${startItem}-${endItem}`}
            </strong>{" "}
            dari{" "}
            <strong className="text-slate-700">{totalFiltered}</strong> siswa
          </p>
          <div className="flex items-center gap-2 text-[11px] sm:text-xs">
            <button
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={safePage === 1 || totalFiltered === 0}
              className="rounded-full border border-slate-200 px-3 py-2 font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Sebelumnya
            </button>
            <span className="font-semibold text-slate-700">
              Halaman {safePage} dari {totalPages}
            </span>
            <button
              onClick={() =>
                setPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={safePage === totalPages || totalFiltered === 0}
              className="rounded-full border border-slate-200 px-3 py-2 font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Berikutnya
            </button>
          </div>
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
                <label className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-widest text-slate-500">
                  <span>Kelas</span>
                  <button
                    type="button"
                    onClick={() => {
                      setClassDrafts(
                        classes.reduce<Record<string, string>>((acc, item) => {
                          acc[item.id] = item.name;
                          return acc;
                        }, {})
                      );
                      setNewClassName("");
                      setClassError("");
                      setIsClassManagerOpen(true);
                    }}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-[10px] font-semibold text-indigo-600 transition hover:border-indigo-200 hover:bg-indigo-50"
                  >
                    <Settings2 className="h-3 w-3" />
                    Kelola kelas
                  </button>
                </label>
                <select
                  value={formState.classId}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      classId: event.target.value,
                    }))
                  }
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none ring-indigo-500 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2"
                >
                  <option value="">Pilih kelas…</option>
                  {classes.map((classItem) => (
                    <option key={classItem.id} value={classItem.id}>
                      {classItem.name}
                    </option>
                  ))}
                </select>
                {classes.length === 0 && (
                  <p className="mt-2 text-xs text-rose-500">
                    Belum ada kelas. Tambahkan kelas terlebih dahulu.
                  </p>
                )}
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

      {isClassManagerOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 px-4 py-8 backdrop-blur-sm sm:items-center">
          <div className="relative w-full max-w-xl rounded-3xl bg-white p-6 shadow-xl">
            <button
              className="absolute right-4 top-4 rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              onClick={() => {
                setIsClassManagerOpen(false);
                setClassError("");
                setNewClassName("");
              }}
            >
              <X className="h-4 w-4" />
            </button>
            <h3 className="text-xl font-semibold text-slate-900">
              Kelola Daftar Kelas
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Tambahkan atau perbarui nama kelas. Perubahan akan otomatis
              diterapkan ke data siswa yang menggunakan kelas tersebut.
            </p>

            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-slate-200 p-4">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Tambah kelas baru
                </label>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    value={newClassName}
                    onChange={(event) => setNewClassName(event.target.value)}
                    placeholder="contoh: XII IPA 3"
                    className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none ring-indigo-500 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const trimmed = newClassName.trim();
                      if (!trimmed) return;
                      const exists = classes.some(
                        (classItem) =>
                          classItem.name.toLocaleLowerCase("id-ID") ===
                          trimmed.toLocaleLowerCase("id-ID")
                      );
                      if (exists) {
                        setClassError("Kelas sudah terdaftar.");
                        setNewClassName("");
                        return;
                      }
                      const created = addClass(trimmed);
                      if (created) {
                        setClassDrafts((prev) => ({
                          ...prev,
                          [created.id]: created.name,
                        }));
                        setNewClassName("");
                        setClassError("");
                        if (!formState.classId) {
                          setFormState((prev) => ({
                            ...prev,
                            classId: created.id,
                          }));
                        }
                      } else {
                        setClassError(
                          "Kelas baru gagal ditambahkan. Coba lagi nanti."
                        );
                      }
                    }}
                    disabled={!newClassName.trim()}
                    className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-500/30 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
                  >
                    Tambah Kelas
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs uppercase tracking-widest text-slate-500">
                  Daftar kelas tersedia
                </p>
                {classes.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                    Belum ada kelas. Tambahkan kelas baru terlebih dahulu.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                    {classes.map((classItem) => (
                      <div
                        key={classItem.id}
                        className="flex flex-col gap-3 rounded-2xl border border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex-1">
                          <input
                            value={
                              classDrafts[classItem.id] ?? classItem.name ?? ""
                            }
                            onChange={(event) =>
                              setClassDrafts((prev) => ({
                                ...prev,
                                [classItem.id]: event.target.value,
                              }))
                            }
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none ring-indigo-500 focus:border-indigo-500 focus:ring-2"
                          />
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const draftName =
                                classDrafts[classItem.id]?.trim() ??
                                classItem.name;
                              updateClass(classItem.id, draftName);
                              setClassDrafts((prev) => ({
                                ...prev,
                                [classItem.id]: draftName,
                              }));
                              setClassError("");
                            }}
                            className="inline-flex items-center justify-center rounded-full bg-indigo-50 px-4 py-2 text-xs font-semibold text-indigo-600 transition hover:bg-indigo-100"
                          >
                            Simpan Nama
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const remaining = classes.filter(
                                (item) => item.id !== classItem.id
                              );
                              const success = removeClass(classItem.id);
                              if (!success) {
                                setClassError(
                                  "Kelas tidak dapat dihapus karena masih digunakan oleh siswa."
                                );
                                return;
                              }
                              setClassError("");
                              setClassDrafts((prev) => {
                                const nextDrafts = { ...prev };
                                delete nextDrafts[classItem.id];
                                return nextDrafts;
                              });
                              setFormState((prev) => {
                                if (prev.classId === classItem.id) {
                                  return {
                                    ...prev,
                                    classId: remaining[0]?.id ?? "",
                                  };
                                }
                                return prev;
                              });
                            }}
                            className="inline-flex items-center justify-center rounded-full border border-rose-200 px-4 py-2 text-xs font-semibold text-rose-500 transition hover:bg-rose-50"
                          >
                            Hapus
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {classError && (
                  <p className="text-xs text-rose-500">{classError}</p>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsClassManagerOpen(false);
                  setClassError("");
                  setNewClassName("");
                }}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
              >
                Selesai
              </button>
            </div>
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
