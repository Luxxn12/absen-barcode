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
import { fetchJSON } from "@/lib/fetchJSON";

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
      const [studentData, classData] = await Promise.all([
        fetchJSON<Student[]>("/api/students"),
        fetchJSON<ClassGroup[]>("/api/classes"),
      ]);
      setStudents(sortByName(studentData));
      setClasses(sortByName(classData));
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
        const created = await fetchJSON<Student>("/api/students", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        setStudents((prev) => sortByName([...prev, created]));
        return created;
      } catch (error) {
        console.error("Gagal menambahkan siswa:", error);
        return null;
      }
    },
    []
  );

  const updateStudent = useCallback(
    async (id: string, updates: UpdateStudentPayload) => {
      try {
        const updated = await fetchJSON<Student>(`/api/students/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        });
        setStudents((prev) =>
          sortByName(prev.map((student) => (student.id === id ? updated : student)))
        );
        return updated;
      } catch (error) {
        console.error("Gagal memperbarui siswa:", error);
        return null;
      }
    },
    []
  );

  const removeStudent = useCallback(async (id: string) => {
    try {
      await fetchJSON(`/api/students/${id}`, {
        method: "DELETE",
      });
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
      const created = await fetchJSON<ClassGroup>("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      setClasses((prev) => sortByName([...prev, created]));
      return created;
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
      const updated = await fetchJSON<ClassGroup>(`/api/classes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      setClasses((prev) =>
        sortByName(
          prev.map((classItem) => (classItem.id === id ? updated : classItem))
        )
      );
      setStudents((prev) =>
        prev.map((student) =>
          student.classId === id
            ? { ...student, className: updated.name }
            : student
        )
      );
      return updated;
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
      await fetchJSON(`/api/classes/${id}`, {
        method: "DELETE",
      });
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
