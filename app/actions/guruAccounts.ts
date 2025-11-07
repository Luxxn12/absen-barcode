"use server";

import { hash } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const ACCOUNT_TABLE = "GuruAccounts";
const ACCOUNT_PATH = "/guru/accounts";

export type GuruAccountRecord = {
  id: string;
  email: string;
  name: string;
  role: "guru" | "superadmin";
  createdAt: string;
  updatedAt: string;
};

function normalizeEmail(input: string) {
  return input.trim().toLowerCase();
}

function normalizeName(input: string) {
  return input.trim().replace(/\s+/g, " ");
}

function assertRole(input: string): asserts input is "guru" | "superadmin" {
  if (input !== "guru" && input !== "superadmin") {
    throw new Error("Role tidak valid. Gunakan guru atau superadmin.");
  }
}

export async function listGuruAccountsAction(): Promise<GuruAccountRecord[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from(ACCOUNT_TABLE)
    .select("id,email,name,role,created_at,updated_at")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[listGuruAccountsAction]", error);
    throw new Error("Gagal mengambil data akun guru.");
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    email: row.email,
    name: row.name,
    role:
      typeof row.role === "string" && row.role === "superadmin"
        ? "superadmin"
        : "guru",
    createdAt: row.created_at ?? "",
    updatedAt: row.updated_at ?? "",
  }));
}

export type CreateGuruAccountInput = {
  email: string;
  name: string;
  password: string;
  role?: "guru" | "superadmin";
};

export async function createGuruAccountAction(
  input: CreateGuruAccountInput
): Promise<GuruAccountRecord> {
  const email = normalizeEmail(input.email ?? "");
  const name = normalizeName(input.name ?? "");
  const password = input.password?.trim() ?? "";
  const role = input.role ?? "guru";

  if (!email || !email.includes("@")) {
    throw new Error("Email tidak valid.");
  }
  if (!name) {
    throw new Error("Nama wajib diisi.");
  }
  if (!password || password.length < 5) {
    throw new Error("Password minimal 5 karakter.");
  }
  assertRole(role);

  const supabase = createSupabaseServerClient();

  const { data: existing, error: existingError } = await supabase
    .from(ACCOUNT_TABLE)
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existingError && existingError.code !== "PGRST116") {
    console.error("[createGuruAccountAction][existing]", existingError);
    throw new Error("Gagal memeriksa email akun.");
  }

  if (existing) {
    throw new Error("Email sudah terdaftar sebagai akun guru.");
  }

  const passwordHash = await hash(password, 10);
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from(ACCOUNT_TABLE)
    .insert({
      email,
      name,
      password_hash: passwordHash,
      role,
      created_at: now,
      updated_at: now,
    })
    .select("id,email,name,role,created_at,updated_at")
    .single();

  if (error) {
    console.error("[createGuruAccountAction][insert]", error);
    throw new Error("Gagal membuat akun guru baru.");
  }

  revalidatePath(ACCOUNT_PATH);
  return {
    id: data.id,
    email: data.email,
    name: data.name,
    role: data.role === "superadmin" ? "superadmin" : "guru",
    createdAt: data.created_at ?? "",
    updatedAt: data.updated_at ?? "",
  };
}

export async function deleteGuruAccountAction(id: string): Promise<void> {
  const trimmed = id.trim();
  if (!trimmed) {
    throw new Error("ID akun tidak valid.");
  }
  const supabase = createSupabaseServerClient();

  const { error } = await supabase
    .from(ACCOUNT_TABLE)
    .delete()
    .eq("id", trimmed);

  if (error) {
    console.error("[deleteGuruAccountAction]", error);
    throw new Error("Gagal menghapus akun guru.");
  }

  revalidatePath(ACCOUNT_PATH);
}
