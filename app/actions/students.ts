"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { randomPrefixedId } from "@/lib/ids";

const STUDENT_TABLE = "Student";
const CLASS_TABLE = "ClassGroup";

export type ClassGroupRecord = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type StudentRecord = {
  id: string;
  name: string;
  classId: string;
  createdAt: string;
  updatedAt: string;
};

function assertNonEmpty(value: string, message: string) {
  if (!value.trim().length) {
    throw new Error(message);
  }
}

export async function listClassesAction(): Promise<ClassGroupRecord[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from(CLASS_TABLE)
    .select("id,name,createdAt,updatedAt")
    .order("name", { ascending: true });

  if (error) {
    console.error("[listClassesAction]", error);
    throw new Error("Gagal mengambil data kelas.");
  }

  return (data ?? []).map((entry) => ({
    id: entry.id,
    name: entry.name,
    createdAt: entry.createdAt ?? "",
    updatedAt: entry.updatedAt ?? "",
  }));
}

export async function createClassAction(name: string): Promise<ClassGroupRecord> {
  const supabase = createSupabaseServerClient();
  const trimmed = typeof name === "string" ? name.trim() : "";
  assertNonEmpty(trimmed, "Nama kelas wajib diisi.");

  const { data: duplicate, error: duplicateError } = await supabase
    .from(CLASS_TABLE)
    .select("id")
    .eq("name", trimmed)
    .maybeSingle();

  if (duplicateError) {
    console.error("[createClassAction][duplicate]", duplicateError);
    throw new Error("Gagal memeriksa duplikasi kelas.");
  }

  if (duplicate) {
    throw new Error("Kelas sudah terdaftar.");
  }

  const { data: existingIds, error: listError } = await supabase
    .from(CLASS_TABLE)
    .select("id");

  if (listError) {
    console.error("[createClassAction][ids]", listError);
    throw new Error("Gagal menghitung ID kelas.");
  }

  const id = randomPrefixedId(
    (existingIds ?? []).map((entry) => entry.id),
    "CLS-"
  );

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from(CLASS_TABLE)
    .insert({ id, name: trimmed, createdAt: now, updatedAt: now })
    .select("id,name,createdAt,updatedAt")
    .single();

  if (error) {
    console.error("[createClassAction][insert]", error);
    throw new Error("Gagal menambahkan kelas baru.");
  }

  revalidatePath("/guru/siswa");
  return {
    id: data.id,
    name: data.name,
    createdAt: data.createdAt ?? "",
    updatedAt: data.updatedAt ?? "",
  };
}

export async function updateClassAction(
  id: string,
  name: string
): Promise<ClassGroupRecord> {
  const supabase = createSupabaseServerClient();
  const trimmed = typeof name === "string" ? name.trim() : "";
  assertNonEmpty(id, "ID kelas wajib diisi.");
  assertNonEmpty(trimmed, "Nama kelas wajib diisi.");

  const { data: exists, error: existsError } = await supabase
    .from(CLASS_TABLE)
    .select("id")
    .eq("id", id)
    .maybeSingle();

  if (existsError) {
    console.error("[updateClassAction][exists]", existsError);
    throw new Error("Gagal memeriksa kelas.");
  }

  if (!exists) {
    throw new Error("Kelas tidak ditemukan.");
  }

  const { data: duplicate, error: dupError } = await supabase
    .from(CLASS_TABLE)
    .select("id")
    .eq("name", trimmed)
    .neq("id", id)
    .maybeSingle();

  if (dupError && dupError.code !== "PGRST116") {
    console.error("[updateClassAction][duplicate]", dupError);
    throw new Error("Gagal memeriksa duplikasi nama kelas.");
  }

  if (duplicate) {
    throw new Error("Nama kelas sudah digunakan.");
  }

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from(CLASS_TABLE)
    .update({ name: trimmed, updatedAt: now })
    .eq("id", id)
    .select("id,name,createdAt,updatedAt")
    .single();

  if (error) {
    console.error("[updateClassAction][update]", error);
    throw new Error("Gagal memperbarui kelas.");
  }

  revalidatePath("/guru/siswa");
  return {
    id: data.id,
    name: data.name,
    createdAt: data.createdAt ?? "",
    updatedAt: data.updatedAt ?? "",
  };
}

export async function deleteClassAction(id: string): Promise<void> {
  const supabase = createSupabaseServerClient();
  assertNonEmpty(id, "ID kelas wajib diisi.");

  const { data: exists, error: existsError } = await supabase
    .from(CLASS_TABLE)
    .select("id")
    .eq("id", id)
    .maybeSingle();

  if (existsError) {
    console.error("[deleteClassAction][exists]", existsError);
    throw new Error("Gagal memeriksa kelas.");
  }

  if (!exists) {
    throw new Error("Kelas tidak ditemukan.");
  }

  const { error: countError, count } = await supabase
    .from(STUDENT_TABLE)
    .select("id", { count: "exact", head: true })
    .eq("classId", id);

  if (countError) {
    console.error("[deleteClassAction][count]", countError);
    throw new Error("Gagal memeriksa relasi kelas.");
  }

  if ((count ?? 0) > 0) {
    throw new Error(
      "Kelas tidak dapat dihapus karena masih digunakan oleh data siswa."
    );
  }

  const { error } = await supabase.from(CLASS_TABLE).delete().eq("id", id);

  if (error) {
    console.error("[deleteClassAction][delete]", error);
    throw new Error("Gagal menghapus kelas.");
  }

  revalidatePath("/guru/siswa");
}

export async function listStudentsAction(): Promise<StudentRecord[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from(STUDENT_TABLE)
    .select("id,name,classId,createdAt,updatedAt")
    .order("name", { ascending: true });

  if (error) {
    console.error("[listStudentsAction]", error);
    throw new Error("Gagal mengambil data siswa.");
  }

  return (data ?? []).map((entry) => ({
    id: entry.id,
    name: entry.name,
    classId: entry.classId,
    createdAt: entry.createdAt ?? "",
    updatedAt: entry.updatedAt ?? "",
  }));
}

export type CreateStudentPayload = {
  name: string;
  classId: string;
};

export async function createStudentAction(
  payload: CreateStudentPayload
): Promise<StudentRecord> {
  const supabase = createSupabaseServerClient();
  const name = typeof payload.name === "string" ? payload.name.trim() : "";
  const classId =
    typeof payload.classId === "string" ? payload.classId.trim() : "";

  assertNonEmpty(name, "Nama siswa wajib diisi.");
  assertNonEmpty(classId, "Kelas wajib dipilih.");

  const { data: classExists, error: classError } = await supabase
    .from(CLASS_TABLE)
    .select("id")
    .eq("id", classId)
    .maybeSingle();

  if (classError) {
    console.error("[createStudentAction][classExists]", classError);
    throw new Error("Gagal memeriksa data kelas.");
  }

  if (!classExists) {
    throw new Error("Kelas tidak ditemukan.");
  }

  const { data: idRows, error: idError } = await supabase
    .from(STUDENT_TABLE)
    .select("id");

  if (idError) {
    console.error("[createStudentAction][ids]", idError);
    throw new Error("Gagal memeriksa data siswa.");
  }

  const id = randomPrefixedId(
    (idRows ?? []).map((entry) => entry.id),
    "STD-"
  );

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from(STUDENT_TABLE)
    .insert({
      id,
      name,
      classId,
      createdAt: now,
      updatedAt: now,
    })
    .select("id,name,classId,createdAt,updatedAt")
    .single();

  if (error) {
    console.error("[createStudentAction][insert]", error);
    throw new Error("Gagal menambahkan siswa.");
  }

  revalidatePath("/guru/siswa");
  return {
    id: data.id,
    name: data.name,
    classId: data.classId,
    createdAt: data.createdAt ?? "",
    updatedAt: data.updatedAt ?? "",
  };
}

export type UpdateStudentPayload = {
  name?: string;
  classId?: string;
};

export async function updateStudentAction(
  id: string,
  updates: UpdateStudentPayload
): Promise<StudentRecord> {
  const supabase = createSupabaseServerClient();
  assertNonEmpty(id, "ID siswa wajib diisi.");

  const { data: existing, error: existingError } = await supabase
    .from(STUDENT_TABLE)
    .select("id")
    .eq("id", id)
    .maybeSingle();

  if (existingError) {
    console.error("[updateStudentAction][exists]", existingError);
    throw new Error("Gagal memeriksa data siswa.");
  }

  if (!existing) {
    throw new Error("Siswa tidak ditemukan.");
  }

  const payload: Record<string, string> = {};

  if (typeof updates.name === "string") {
    const trimmed = updates.name.trim();
    assertNonEmpty(trimmed, "Nama siswa wajib diisi.");
    payload.name = trimmed;
  }

  if (typeof updates.classId === "string") {
    const trimmed = updates.classId.trim();
    assertNonEmpty(trimmed, "Kelas wajib dipilih.");

    const { data: classExists, error: classError } = await supabase
      .from(CLASS_TABLE)
      .select("id")
      .eq("id", trimmed)
      .maybeSingle();

    if (classError) {
      console.error("[updateStudentAction][classExists]", classError);
      throw new Error("Gagal memeriksa data kelas.");
    }

    if (!classExists) {
      throw new Error("Kelas tidak ditemukan.");
    }

    payload.classId = trimmed;
  }

  if (Object.keys(payload).length === 0) {
    throw new Error("Tidak ada perubahan yang diberikan.");
  }

  payload.updatedAt = new Date().toISOString();

  const { data, error } = await supabase
    .from(STUDENT_TABLE)
    .update(payload)
    .eq("id", id)
    .select("id,name,classId,createdAt,updatedAt")
    .single();

  if (error) {
    console.error("[updateStudentAction][update]", error);
    throw new Error("Gagal memperbarui siswa.");
  }

  revalidatePath("/guru/siswa");
  return {
    id: data.id,
    name: data.name,
    classId: data.classId,
    createdAt: data.createdAt ?? "",
    updatedAt: data.updatedAt ?? "",
  };
}

export async function deleteStudentAction(id: string): Promise<void> {
  const supabase = createSupabaseServerClient();
  assertNonEmpty(id, "ID siswa wajib diisi.");

  const { data: existing, error: existingError } = await supabase
    .from(STUDENT_TABLE)
    .select("id")
    .eq("id", id)
    .maybeSingle();

  if (existingError) {
    console.error("[deleteStudentAction][exists]", existingError);
    throw new Error("Gagal memeriksa data siswa.");
  }

  if (!existing) {
    throw new Error("Siswa tidak ditemukan.");
  }

  const { error } = await supabase.from(STUDENT_TABLE).delete().eq("id", id);

  if (error) {
    console.error("[deleteStudentAction][delete]", error);
    throw new Error("Gagal menghapus siswa.");
  }

  revalidatePath("/guru/siswa");
}
