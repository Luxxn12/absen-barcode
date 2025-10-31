"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useHydrated } from "@/hooks/useHydrated";

export type Student = {
  id: string;
  name: string;
  className: string;
};

export type ClassGroup = {
  id: string;
  name: string;
};

type StudentContextValue = {
  students: Student[];
  classes: ClassGroup[];
  hydrated: boolean;
  addStudent: (student: AddStudentPayload) => void;
  updateStudent: (
    id: string,
    updates: Partial<Omit<Student, "id">>
  ) => void;
  removeStudent: (id: string) => void;
  getStudentById: (id: string) => Student | undefined;
  addClass: (name: string) => ClassGroup | null;
  updateClass: (id: string, name: string) => void;
  removeClass: (id: string) => boolean;
};

type AddStudentPayload = {
  name: string;
  className: string;
};

const StudentContext = createContext<StudentContextValue | null>(null);

const STORAGE_KEY = "absen-barcode-students";
const STORAGE_VERSION = 2;

const defaultClasses: ClassGroup[] = [
  { id: "CLS-001", name: "X IPA 1" },
  { id: "CLS-002", name: "X IPA 2" },
  { id: "CLS-003", name: "X IPS 1" },
  { id: "CLS-004", name: "XI IPA 1" },
  { id: "CLS-005", name: "XI IPS 2" },
  { id: "CLS-006", name: "XII IPA 1" },
  { id: "CLS-007", name: "XII IPS 1" },
  { id: "CLS-008", name: "X IPA 3" },
  { id: "CLS-009", name: "XI IPA 2" },
  { id: "CLS-010", name: "XI IPS 1" },
  { id: "CLS-011", name: "XII IPA 2" },
];

const defaultStudents: Student[] = [
  {
    id: "STD-001",
    name: "Ahmad Fauzi",
    className: "X IPA 1",
  },
  {
    id: "STD-002",
    name: "Siti Rahma",
    className: "X IPA 2",
  },
  {
    id: "STD-003",
    name: "Budi Santoso",
    className: "X IPS 1",
  },
  {
    id: "STD-004",
    name: "Lina Kartika",
    className: "XI IPA 1",
  },
  {
    id: "STD-005",
    name: "Dewi Lestari",
    className: "XI IPS 2",
  },
  {
    id: "STD-006",
    name: "Rudi Hartono",
    className: "XII IPA 1",
  },
  {
    id: "STD-007",
    name: "Maria Ulfa",
    className: "XII IPS 1",
  },
  {
    id: "STD-008",
    name: "Eko Prasetyo",
    className: "X IPA 3",
  },
  {
    id: "STD-009",
    name: "Nina Safitri",
    className: "XI IPA 2",
  },
  {
    id: "STD-010",
    name: "Bagus Saputra",
    className: "XI IPS 1",
  },
  {
    id: "STD-011",
    name: "Intan Cahya",
    className: "X IPA 1",
  },
  {
    id: "STD-012",
    name: "Hendra Wijaya",
    className: "XII IPA 2",
  },
];

export function StudentProvider({ children }: { children: React.ReactNode }) {
  const isClient = typeof window !== "undefined";
  const hydrated = useHydrated();
  const initialState = useMemo(() => {
    if (!isClient) {
      return {
        students: defaultStudents,
        classes: defaultClasses,
      };
    }
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return {
        students: defaultStudents,
        classes: defaultClasses,
      };
    }
    try {
      const parsed = JSON.parse(stored) as
        | Student[]
        | {
            version?: number;
            students: Student[];
            classes?: ClassGroup[];
          };
      if (Array.isArray(parsed)) {
        return {
          students: parsed,
          classes: defaultClasses,
        };
      }
      if (parsed && Array.isArray(parsed.students)) {
        return {
          students: parsed.students.length ? parsed.students : defaultStudents,
          classes:
            Array.isArray(parsed.classes) && parsed.classes.length
              ? parsed.classes
              : defaultClasses,
        };
      }
    } catch {
      // ignore malformed data and fall back to defaults
    }
    return {
      students: defaultStudents,
      classes: defaultClasses,
    };
  }, [isClient]);
  const [students, setStudents] = useState<Student[]>(initialState.students);
  const [classes, setClasses] = useState<ClassGroup[]>(initialState.classes);

  useEffect(() => {
    if (!hydrated || !isClient) return;
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: STORAGE_VERSION,
        students,
        classes,
      })
    );
  }, [hydrated, students, classes, isClient]);

  const value = useMemo<StudentContextValue>(
    () => ({
      students,
      classes,
      hydrated,
      addStudent: ({ name, className }) => {
        setStudents((prev) => [
          ...prev,
          {
            id: `STD-${(prev.length + 1).toString().padStart(3, "0")}`,
            name,
            className,
          },
        ]);
      },
      updateStudent: (id, updates) => {
        setStudents((prev) =>
          prev.map((student) =>
            student.id === id ? { ...student, ...updates } : student
          )
        );
      },
      removeStudent: (id) => {
        setStudents((prev) => prev.filter((student) => student.id !== id));
      },
      getStudentById: (id) => students.find((student) => student.id === id),
      addClass: (name) => {
        const trimmed = name.trim();
        if (!trimmed) return null;
        const exists = classes.some(
          (classItem) =>
            classItem.name.toLocaleLowerCase("id-ID") ===
            trimmed.toLocaleLowerCase("id-ID")
        );
        if (exists) {
          return classes.find(
            (classItem) =>
              classItem.name.toLocaleLowerCase("id-ID") ===
              trimmed.toLocaleLowerCase("id-ID")
          )!;
        }
        const newClass: ClassGroup = {
          id: `CLS-${(classes.length + 1).toString().padStart(3, "0")}`,
          name: trimmed,
        };
        setClasses((prev) => [...prev, newClass]);
        return newClass;
      },
      updateClass: (id, name) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        setClasses((prevClasses) => {
          const target = prevClasses.find((classItem) => classItem.id === id);
          if (!target) return prevClasses;
          if (target.name === trimmed) return prevClasses;
          setStudents((prevStudents) =>
            prevStudents.map((student) =>
              student.className === target.name
                ? { ...student, className: trimmed }
                : student
            )
          );
          return prevClasses.map((classItem) =>
            classItem.id === id ? { ...classItem, name: trimmed } : classItem
          );
        });
      },
      removeClass: (id) => {
        const target = classes.find((classItem) => classItem.id === id);
        if (!target) return false;
        const inUse = students.some(
          (student) =>
            student.className.toLocaleLowerCase("id-ID") ===
            target.name.toLocaleLowerCase("id-ID")
        );
        if (inUse) {
          return false;
        }
        setClasses((prevClasses) =>
          prevClasses.filter((classItem) => classItem.id !== id)
        );
        return true;
      },
    }),
    [students, classes, hydrated]
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
