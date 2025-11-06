"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const FORUM_TABLE = "ForumEntry";
const STUDENT_TABLE = "Student";

export type ForumMood = "Senang" | "Netral" | "Sedih" | "PerluPerhatian";

export type ForumEntryRecord = {
  id: string;
  studentId: string;
  studentName: string;
  classId: string | null;
  className: string;
  mood: ForumMood;
  message: string;
  createdAt: string;
  updatedAt: string;
};

const moodAliases: Record<string, ForumMood> = {
  Senang: "Senang",
  Netral: "Netral",
  Sedih: "Sedih",
  "Perlu Perhatian": "PerluPerhatian",
  PerluPerhatian: "PerluPerhatian",
};

function normalize(input: unknown) {
  return typeof input === "string" ? input.trim() : "";
}

type ForumEntryQueryRow = {
  id: string;
  studentId: string;
  mood: ForumMood;
  message: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  student: {
    id: string;
    name: string | null;
    classId: string | null;
    class: {
      id: string;
      name: string | null;
    } | null;
  } | null;
};

type StudentWithClass = NonNullable<ForumEntryQueryRow["student"]>;

export async function listForumEntriesAction(): Promise<ForumEntryRecord[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from(FORUM_TABLE)
    .select(
      `
        id,
        studentId,
        mood,
        message,
        createdAt,
        updatedAt,
        student:${STUDENT_TABLE} (
          id,
          name,
          classId,
          class:ClassGroup (
            id,
            name
          )
        )
      `
    )
    .order("createdAt", { ascending: false });

  if (error) {
    console.error("[listForumEntriesAction]", error);
    throw new Error("Gagal mengambil data forum.");
  }

  const entries = (data ?? []) as unknown as ForumEntryQueryRow[];

  return entries.map((entry) => {
    const studentInfo = entry.student;
    const classInfo = studentInfo?.class ?? null;
    return {
      id: entry.id,
      studentId: entry.studentId,
      studentName: studentInfo?.name ?? "Tidak diketahui",
      classId: studentInfo?.classId ?? null,
      className: classInfo?.name ?? "-",
      mood: (entry.mood ?? "Netral") as ForumMood,
      message: entry.message ?? "",
      createdAt: entry.createdAt ?? "",
      updatedAt: entry.updatedAt ?? "",
    };
  });
}

type CreateForumEntryPayload = {
  studentId: string;
  mood: ForumMood | string;
  message: string;
};

export async function createForumEntryAction(
  payload: CreateForumEntryPayload
): Promise<ForumEntryRecord> {
  const supabase = createSupabaseServerClient();
  const studentId = normalize(payload.studentId);
  const moodInput = normalize(payload.mood);
  const message = normalize(payload.message);

  if (!studentId || !moodInput || !message) {
    throw new Error("Data laporan belum lengkap.");
  }

  const mood = moodAliases[moodInput];
  if (!mood) {
    throw new Error("Mood tidak dikenali.");
  }

  const { data: student, error: studentError } = await supabase
    .from(STUDENT_TABLE)
    .select(
      `
        id,
        name,
        classId,
        class:ClassGroup (
          id,
          name
        )
      `
    )
    .eq("id", studentId)
    .maybeSingle();

  if (studentError) {
    console.error("[createForumEntryAction][student]", studentError);
    throw new Error("Gagal memeriksa data siswa.");
  }

  const studentData = student as StudentWithClass | null;

  if (!studentData) {
    throw new Error("Siswa tidak ditemukan.");
  }

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from(FORUM_TABLE)
    .insert({
      studentId,
      mood,
      message,
      createdAt: now,
      updatedAt: now,
    })
    .select(
      `
        id,
        studentId,
        mood,
        message,
        createdAt,
        updatedAt
      `
    )
    .single();

  if (error) {
    console.error("[createForumEntryAction][insert]", error);
    throw new Error("Gagal menyimpan laporan forum.");
  }

  revalidatePath("/guru/forum");
  return {
    id: data.id,
    studentId: data.studentId,
    studentName: studentData.name ?? "Tidak diketahui",
    classId: studentData.classId ?? null,
    className: studentData.class?.name ?? "-",
    mood: (data.mood ?? "Netral") as ForumMood,
    message: data.message ?? "",
    createdAt: data.createdAt ?? "",
    updatedAt: data.updatedAt ?? "",
  };
}

export async function deleteForumEntryAction(id: string): Promise<void> {
  const supabase = createSupabaseServerClient();
  const trimmed = normalize(id);
  if (!trimmed) {
    throw new Error("ID laporan tidak valid.");
  }

  const { data: existing, error: existsError } = await supabase
    .from(FORUM_TABLE)
    .select("id")
    .eq("id", trimmed)
    .maybeSingle();

  if (existsError) {
    console.error("[deleteForumEntryAction][exists]", existsError);
    throw new Error("Gagal memeriksa data forum.");
  }

  if (!existing) {
    throw new Error("Laporan tidak ditemukan.");
  }

  const { error } = await supabase
    .from(FORUM_TABLE)
    .delete()
    .eq("id", trimmed);

  if (error) {
    console.error("[deleteForumEntryAction][delete]", error);
    throw new Error("Gagal menghapus laporan forum.");
  }

  revalidatePath("/guru/forum");
}
