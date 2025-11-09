"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Plus,
  Search,
  Trash2,
  Pencil,
  QrCode,
  X,
  Settings2,
  Loader2,
  ScanFace,
} from "lucide-react";
import { Student, useStudents } from "@/contexts/StudentContext";
import { cn } from "@/lib/utils";
import { loadFaceApiModels } from "@/lib/faceApi";

function StudentsSkeleton() {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-lg shadow-slate-200/40">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <div className="h-3 w-28 animate-pulse rounded bg-slate-200" />
          <div className="h-6 w-48 animate-pulse rounded bg-slate-200" />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="h-11 w-40 animate-pulse rounded-full bg-slate-200" />
          <div className="h-11 w-40 animate-pulse rounded-full bg-slate-200" />
        </div>
      </header>

      <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="h-11 w-full animate-pulse rounded-full bg-slate-200 lg:max-w-md" />
        <div className="flex gap-3">
          <div className="h-10 w-10 animate-pulse rounded-full bg-slate-200" />
          <div className="h-10 w-24 animate-pulse rounded-full bg-slate-200" />
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <article
            key={`student-card-skel-${index}`}
            className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 animate-pulse rounded-full bg-slate-200" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
                <div className="h-3 w-24 animate-pulse rounded bg-slate-200" />
              </div>
            </div>
            <div className="mt-4 h-10 animate-pulse rounded-2xl bg-slate-100" />
          </article>
        ))}
      </div>

      <div className="mt-6 h-10 w-32 animate-pulse rounded-full bg-slate-200" />
    </section>
  );
}

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
    loading,
  } = useStudents();
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [faceModalStudent, setFaceModalStudent] = useState<Student | null>(
    null
  );
  const [faceReadyIds, setFaceReadyIds] = useState<Set<string>>(new Set());
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
  const [studentError, setStudentError] = useState("");
  const [isSavingStudent, setIsSavingStudent] = useState(false);
  const [deletingStudentId, setDeletingStudentId] = useState<string | null>(
    null
  );
  const [creatingClass, setCreatingClass] = useState(false);
  const [savingClassId, setSavingClassId] = useState<string | null>(null);
  const [deletingClassId, setDeletingClassId] = useState<string | null>(null);
  const classActionInProgress = Boolean(
    creatingClass || savingClassId || deletingClassId
  );
  const refreshFaceStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/faces");
      if (!response.ok) return;
      const rows = (await response.json()) as Array<{ studentId: string }>;
      setFaceReadyIds(new Set(rows.map((row) => row.studentId)));
    } catch (error) {
      console.error("Gagal memuat status wajah:", error);
    }
  }, []);

  useEffect(() => {
    void refreshFaceStatus();
  }, [refreshFaceStatus]);

  const ITEMS_PER_PAGE = 10;

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const matchesSearch =
        !search.trim() ||
        student.name.toLowerCase().includes(search.toLowerCase()) ||
        student.className.toLowerCase().includes(search.toLowerCase()) ||
        student.id.toLowerCase().includes(search.toLowerCase());
      const matchesClass = classFilter ? student.classId === classFilter : true;
      return matchesSearch && matchesClass;
    });
  }, [students, search, classFilter]);

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
    paginatedStudents.length === 0 ? 0 : (safePage - 1) * ITEMS_PER_PAGE + 1;
  const endItem = (safePage - 1) * ITEMS_PER_PAGE + paginatedStudents.length;
  const totalFiltered = filteredStudents.length;

  const openAddModal = () => {
    if (loading && classes.length === 0) return;
    setEditingStudent(null);
    setFormState({
      name: "",
      classId: classes[0]?.id ?? "",
    });
    setStudentError("");
    setIsFormOpen(true);
  };

  const openEditModal = (student: Student) => {
    setEditingStudent(student);
    setFormState({
      name: student.name,
      classId: student.classId ?? "",
    });
    setStudentError("");
    setIsFormOpen(true);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSavingStudent) return;
    setStudentError("");
    const selectedClass = classes.find(
      (classItem) => classItem.id === formState.classId
    );
    if (!selectedClass) return;
    setIsSavingStudent(true);
    try {
      const result = editingStudent
        ? await updateStudent(editingStudent.id, {
            name: formState.name,
            classId: selectedClass.id,
          })
        : await addStudent({
            name: formState.name,
            classId: selectedClass.id,
          });

      if (!result) {
        setStudentError(
          editingStudent
            ? "Perubahan siswa gagal disimpan. Coba lagi."
            : "Data siswa gagal ditambahkan. Coba lagi."
        );
        return;
      }

      setIsFormOpen(false);
      setEditingStudent(null);
      setFormState({
        name: "",
        classId: classes[0]?.id ?? selectedClass.id ?? "",
      });
    } catch (error) {
      console.error(error);
      setStudentError(
        "Data siswa gagal disimpan. Mohon coba lagi dalam beberapa saat."
      );
    } finally {
      setIsSavingStudent(false);
    }
  };

  if (loading && students.length === 0) {
    return (
      <div className="space-y-6">
        <StudentsSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-lg shadow-slate-200/40">
        <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-indigo-500">
              Data Siswa
            </p>
            <h2 className="text-xl font-semibold text-slate-900">
              Kelola data siswa, barcode & wajah
            </h2>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              disabled={loading}
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
              className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-5 py-3 text-sm font-semibold text-indigo-600 shadow-md shadow-indigo-500/10 transition hover:border-indigo-200 hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Settings2 className="h-4 w-4" />
              Kelola Kelas
            </button>
            <button
              disabled={loading || classes.length === 0}
              onClick={openAddModal}
              className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-500/30 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
            >
              <Plus className="h-4 w-4" />
              Tambah Siswa
            </button>
          </div>
        </header>

        <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex w-full flex-col gap-3 lg:max-w-2xl lg:flex-row lg:items-center">
            <div className="relative flex-1">
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
            <div className="flex-1 lg:max-w-xs">
              <select
                value={classFilter}
                onChange={(event) => {
                  setClassFilter(event.target.value);
                  setPage(1);
                }}
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
                Total siswa ditampilkan: <strong>{totalFiltered}</strong>
              </>
            )}
          </p>
        </div>

        <div className="hidden overflow-hidden rounded-3xl border border-slate-100 lg:block">
          <table className="min-w-full bg-white text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-widest text-slate-500">
              <tr>
                <th className="px-6 py-3">Nama</th>
                <th className="px-6 py-3">Kelas</th>
                <th className="px-6 py-3">QR Code</th>
                <th className="px-6 py-3">Scan Wajah</th>
                <th className="px-6 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {paginatedStudents.map((student) => (
                <tr
                  key={student.id}
                  className="transition hover:bg-slate-50/60"
                >
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
                    {faceReadyIds.has(student.id) ? (
                      <span className=" inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-600">
                        <ScanFace className="h-4 w-4" />
                        Wajah siap
                      </span>
                    ) : (
                      <span className=" inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-600">
                        <ScanFace className="h-4 w-4" />
                        Belum ada data wajah
                      </span>
                    )}
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
                        onClick={() => setFaceModalStudent(student)}
                        className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-indigo-600 transition hover:border-indigo-200 hover:bg-indigo-50"
                      >
                        <ScanFace className="h-3.5 w-3.5" />
                        {faceReadyIds.has(student.id)
                          ? "Perbarui Wajah"
                          : "Daftarkan Wajah"}
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
              <p
                className={cn(
                  "mt-2 text-xs font-semibold",
                  faceReadyIds.has(student.id)
                    ? "text-emerald-600"
                    : "text-amber-600"
                )}
              >
                {faceReadyIds.has(student.id)
                  ? "Wajah sudah terdaftar"
                  : "Belum ada data wajah"}
              </p>
              <div className="mt-5 flex items-center gap-3">
                <button
                  onClick={() => openEditModal(student)}
                  className="flex-1 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-indigo-500/30 transition hover:bg-indigo-700"
                >
                  Edit Data
                </button>
                <button
                  onClick={() => setFaceModalStudent(student)}
                  className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-100"
                >
                  {faceReadyIds.has(student.id)
                    ? "Perbarui Wajah"
                    : "Daftarkan Wajah"}
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
            dari <strong className="text-slate-700">{totalFiltered}</strong>{" "}
            siswa
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
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
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
              className="absolute right-4 top-4 rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={() => {
                if (isSavingStudent) return;
                setIsFormOpen(false);
                setStudentError("");
              }}
              disabled={isSavingStudent}
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

              {studentError && (
                <p className="text-xs text-rose-500">{studentError}</p>
              )}

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    if (isSavingStudent) return;
                    setIsFormOpen(false);
                    setStudentError("");
                  }}
                  disabled={isSavingStudent}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingStudent}
                  className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
                >
                  {isSavingStudent ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {editingStudent ? "Menyimpan..." : "Menambah..."}
                    </>
                  ) : editingStudent ? (
                    "Simpan Perubahan"
                  ) : (
                    "Simpan Data"
                  )}
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
              className="absolute right-4 top-4 rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={() => {
                if (classActionInProgress) return;
                setIsClassManagerOpen(false);
                setClassError("");
                setNewClassName("");
              }}
              disabled={classActionInProgress}
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
                    onChange={(event) => {
                      setNewClassName(event.target.value);
                      setClassError("");
                    }}
                    placeholder="contoh: XII IPA 3"
                    className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none ring-indigo-500 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      if (creatingClass) return;
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
                      setCreatingClass(true);
                      try {
                        const created = await addClass(trimmed);
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
                      } finally {
                        setCreatingClass(false);
                      }
                    }}
                    disabled={creatingClass || !newClassName.trim()}
                    className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-500/30 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
                  >
                    {creatingClass ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Menambah...
                      </>
                    ) : (
                      "Tambah Kelas"
                    )}
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
                              setClassDrafts((prev) => {
                                setClassError("");
                                return {
                                  ...prev,
                                  [classItem.id]: event.target.value,
                                };
                              })
                            }
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none ring-indigo-500 focus:border-indigo-500 focus:ring-2"
                          />
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
                          <button
                            type="button"
                            onClick={async () => {
                              if (savingClassId === classItem.id) return;
                              const rawDraft =
                                classDrafts[classItem.id] ?? classItem.name;
                              const trimmedDraft = rawDraft.trim();
                              if (!trimmedDraft) {
                                setClassError("Nama kelas wajib diisi.");
                                setClassDrafts((prev) => ({
                                  ...prev,
                                  [classItem.id]: classItem.name,
                                }));
                                return;
                              }
                              if (trimmedDraft === classItem.name) {
                                setClassError("");
                                return;
                              }
                              setSavingClassId(classItem.id);
                              try {
                                const updated = await updateClass(
                                  classItem.id,
                                  trimmedDraft
                                );
                                setClassDrafts((prev) => ({
                                  ...prev,
                                  [classItem.id]: updated.name,
                                }));
                                setClassError("");
                              } catch (error) {
                                setClassDrafts((prev) => ({
                                  ...prev,
                                  [classItem.id]: classItem.name,
                                }));
                                setClassError(
                                  error instanceof Error && error.message
                                    ? error.message
                                    : "Nama kelas gagal disimpan. Coba lagi."
                                );
                              } finally {
                                setSavingClassId(null);
                              }
                            }}
                            disabled={
                              savingClassId === classItem.id ||
                              deletingClassId === classItem.id
                            }
                            className="inline-flex items-center justify-center rounded-full bg-indigo-50 px-4 py-2 text-xs font-semibold text-indigo-600 transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {savingClassId === classItem.id ? (
                              <>
                                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                                Menyimpan...
                              </>
                            ) : (
                              "Simpan Nama"
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              if (deletingClassId === classItem.id) return;
                              setDeletingClassId(classItem.id);
                              try {
                                const success = await removeClass(classItem.id);
                                if (!success) {
                                  setClassError(
                                    "Kelas tidak dapat dihapus karena masih digunakan oleh siswa."
                                  );
                                  return;
                                }
                                setClassError("");
                                const remaining = classes.filter(
                                  (item) => item.id !== classItem.id
                                );
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
                              } finally {
                                setDeletingClassId(null);
                              }
                            }}
                            disabled={
                              savingClassId === classItem.id ||
                              deletingClassId === classItem.id
                            }
                            className="inline-flex items-center justify-center rounded-full border border-rose-200 px-4 py-2 text-xs font-semibold text-rose-500 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {deletingClassId === classItem.id ? (
                              <>
                                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                                Menghapus...
                              </>
                            ) : (
                              "Hapus"
                            )}
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
                  if (classActionInProgress) return;
                  setIsClassManagerOpen(false);
                  setClassError("");
                  setNewClassName("");
                }}
                disabled={classActionInProgress}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
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
              Data {confirmDelete.name} akan dihapus dari basis data. Tindakan
              ini tidak dapat dibatalkan.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                onClick={() => {
                  if (deletingStudentId) return;
                  setConfirmDelete(null);
                }}
                disabled={Boolean(deletingStudentId)}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Batalkan
              </button>
              <button
                onClick={async () => {
                  if (!confirmDelete) return;
                  if (deletingStudentId) return;
                  setDeletingStudentId(confirmDelete.id);
                  try {
                    const success = await removeStudent(confirmDelete.id);
                    if (success) {
                      setConfirmDelete(null);
                    }
                  } finally {
                    setDeletingStudentId(null);
                  }
                }}
                disabled={Boolean(deletingStudentId)}
                className="rounded-xl bg-rose-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-400/30 transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:bg-rose-300"
              >
                {deletingStudentId ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menghapus...
                  </>
                ) : (
                  "Ya, Hapus"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {faceModalStudent && (
        <FaceEnrollmentModal
          student={faceModalStudent}
          onClose={() => setFaceModalStudent(null)}
          onSuccess={async () => {
            setFaceModalStudent(null);
            await refreshFaceStatus();
          }}
        />
      )}
    </div>
  );
}

type FaceEnrollmentModalProps = {
  student: Student;
  onClose: () => void;
  onSuccess: () => void;
};

function FaceEnrollmentModal({
  student,
  onClose,
  onSuccess,
}: FaceEnrollmentModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState(
    "Pastikan wajah berada di tengah frame."
  );
  const [cameraError, setCameraError] = useState("");

  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;
    (async () => {
      try {
        await loadFaceApiModels();
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
        });
        if (cancelled) return;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (error) {
        console.error("Gagal membuka kamera:", error);
        setCameraError(
          "Tidak dapat mengakses kamera. Pastikan izin kamera diaktifkan."
        );
      }
    })();
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const handleCapture = useCallback(async () => {
    if (!videoRef.current) return;
    setStatus("loading");
    setMessage("Menganalisis wajah...");
    try {
      const faceapiLib = await loadFaceApiModels();
      const detection = await faceapiLib
        .detectSingleFace(
          videoRef.current,
          new faceapiLib.TinyFaceDetectorOptions()
        )
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        setStatus("error");
        setMessage("Wajah belum terdeteksi. Pastikan pencahayaan cukup.");
        return;
      }

      const descriptor = Array.from(detection.descriptor);
      const response = await fetch("/api/faces/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: student.id,
          descriptor,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(
          payload?.error ?? "Gagal menyimpan data wajah. Coba lagi."
        );
      }

      setStatus("success");
      setMessage("Data wajah tersimpan. Wajah siswa siap digunakan.");
      onSuccess();
    } catch (error) {
      console.error(error);
      setStatus("error");
      setMessage(
        error instanceof Error ? error.message : "Gagal menangkap wajah."
      );
    }
  }, [student.id, onSuccess]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-8 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-indigo-500">
              Pendaftaran Wajah
            </p>
            <h3 className="text-lg font-semibold text-slate-900">
              {student.name}
            </h3>
            <p className="text-sm text-slate-500">{student.className}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-4 rounded-3xl border border-slate-100 bg-slate-50 p-4">
          {cameraError ? (
            <p className="text-sm text-rose-500">{cameraError}</p>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="h-64 w-full rounded-2xl bg-black/60 object-cover"
            />
          )}
        </div>
        <p
          className={cn(
            "mt-4 rounded-2xl px-4 py-2 text-xs font-semibold",
            status === "success"
              ? "bg-emerald-50 text-emerald-600"
              : status === "error"
              ? "bg-rose-50 text-rose-600"
              : "bg-slate-50 text-slate-500"
          )}
        >
          {message}
        </p>
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={handleCapture}
            disabled={status === "loading" || Boolean(cameraError)}
            className="flex-1 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-indigo-500/30 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
          >
            {status === "loading" ? "Menganalisis…" : "Simpan Wajah"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
