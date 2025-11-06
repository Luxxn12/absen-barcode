"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useHydrated } from "@/hooks/useHydrated";
import {
  listStudentsAction,
  listClassesAction,
  createStudentAction,
  updateStudentAction,
  deleteStudentAction,
  createClassAction,
  updateClassAction,
  deleteClassAction,
} from "@/app/actions/students";

export type Student = {
  id: string;
  name: string;
  classId: string;
  className: string;
};

export type ClassGroup = {
  id: string;
  name: string;
};

export type AddStudentPayload = {
  name: string;
  classId: string;
};

export type UpdateStudentPayload = {
  name?: string;
  classId?: string;
};

type StudentContextValue = {
  students: Student[];
  classes: ClassGroup[];
  hydrated: boolean;
  loading: boolean;
  addStudent: (student: AddStudentPayload) => Promise<Student | null>;
  updateStudent: (
    id: string,
    updates: UpdateStudentPayload
  ) => Promise<Student | null>;
  removeStudent: (id: string) => Promise<boolean>;
  getStudentById: (id: string) => Student | undefined;
  addClass: (name: string) => Promise<ClassGroup | null>;
  updateClass: (id: string, name: string) => Promise<ClassGroup>;
  removeClass: (id: string) => Promise<boolean>;
  refresh: () => Promise<void>;
};

const StudentContext = createContext<StudentContextValue | null>(null);

function sortByName<T extends { name: string }>(data: T[]) {
  return [...data].sort((a, b) =>
    a.name.localeCompare(b.name, "id-ID", { sensitivity: "base" })
  );
}

export function StudentProvider({ children }: { children: React.ReactNode }) {
  const hydrated = useHydrated();
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [classRows, studentRows] = await Promise.all([
        listClassesAction(),
        listStudentsAction(),
      ]);
      const nextClasses = sortByName(
        classRows.map((entry) => ({
          id: entry.id,
          name: entry.name,
        }))
      );
      const classMap = new Map(nextClasses.map((item) => [item.id, item.name]));
      const nextStudents = sortByName(
        studentRows.map((entry) => ({
          id: entry.id,
          name: entry.name,
          classId: entry.classId,
          className: classMap.get(entry.classId) ?? "-",
        }))
      );
      setClasses(nextClasses);
      setStudents(nextStudents);
    } catch (error) {
      console.error("Gagal memuat data siswa/kelas:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    void refresh();
  }, [hydrated, refresh]);

  const addStudent = useCallback(
    async (payload: AddStudentPayload) => {
      try {
        const created = await createStudentAction(payload);
        const className =
          classes.find((item) => item.id === created.classId)?.name ?? "-";
        const mapped: Student = {
          id: created.id,
          name: created.name,
          classId: created.classId,
          className,
        };
        setStudents((prev) => sortByName([...prev, mapped]));
        return mapped;
      } catch (error) {
        console.error("Gagal menambahkan siswa:", error);
        return null;
      }
    },
    [classes]
  );

  const updateStudent = useCallback(
    async (id: string, updates: UpdateStudentPayload) => {
      try {
        const updated = await updateStudentAction(id, updates);
        const className =
          classes.find((item) => item.id === updated.classId)?.name ??
          students.find((item) => item.id === id)?.className ??
          "-";
        const mapped: Student = {
          id: updated.id,
          name: updated.name,
          classId: updated.classId,
          className,
        };
        setStudents((prev) =>
          sortByName(
            prev.map((student) => (student.id === id ? mapped : student))
          )
        );
        return mapped;
      } catch (error) {
        console.error("Gagal memperbarui siswa:", error);
        return null;
      }
    },
    [classes, students]
  );

  const removeStudent = useCallback(async (id: string) => {
    try {
      await deleteStudentAction(id);
      setStudents((prev) => prev.filter((student) => student.id !== id));
      return true;
    } catch (error) {
      console.error("Gagal menghapus siswa:", error);
      return false;
    }
  }, []);

  const addClass = useCallback(async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return null;
    try {
      const created = await createClassAction(trimmed);
      const mapped: ClassGroup = { id: created.id, name: created.name };
      setClasses((prev) => sortByName([...prev, mapped]));
      return mapped;
    } catch (error) {
      console.error("Gagal menambahkan kelas:", error);
      return null;
    }
  }, []);

  const updateClass = useCallback(async (id: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new Error("Nama kelas wajib diisi.");
    }
    try {
      const updated = await updateClassAction(id, trimmed);
      const mapped: ClassGroup = { id: updated.id, name: updated.name };
      setClasses((prev) =>
        sortByName(
          prev.map((classItem) => (classItem.id === id ? mapped : classItem))
        )
      );
      setStudents((prev) =>
        prev.map((student) =>
          student.classId === id
            ? { ...student, className: mapped.name }
            : student
        )
      );
      return mapped;
    } catch (error) {
      console.error("Gagal memperbarui kelas:", error);
      if (error instanceof Error && error.message.trim().length) {
        throw error;
      }
      throw new Error("Gagal memperbarui kelas. Coba lagi nanti.");
    }
  }, []);

  const removeClass = useCallback(async (id: string) => {
    try {
      await deleteClassAction(id);
      setClasses((prev) => prev.filter((classItem) => classItem.id !== id));
      setStudents((prev) =>
        prev.filter((student) => student.classId !== id)
      );
      return true;
    } catch (error) {
      console.error("Gagal menghapus kelas:", error);
      return false;
    }
  }, []);

  const value = useMemo<StudentContextValue>(
    () => ({
      students,
      classes,
      hydrated,
      loading,
      addStudent,
      updateStudent,
      removeStudent,
      getStudentById: (id: string) =>
        students.find((student) => student.id === id),
      addClass,
      updateClass,
      removeClass,
      refresh,
    }),
    [
      students,
      classes,
      hydrated,
      loading,
      addStudent,
      updateStudent,
      removeStudent,
      addClass,
      updateClass,
      removeClass,
      refresh,
    ]
  );

  return (
    <StudentContext.Provider value={value}>
      {children}
    </StudentContext.Provider>
  );
}

export function useStudents() {
  const context = useContext(StudentContext);
  if (!context) {
    throw new Error("useStudents must be used within StudentProvider");
  }
  return context;
}
