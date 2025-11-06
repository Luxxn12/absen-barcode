"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const ANNOUNCEMENT_TABLE = "Announcement";
const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

export type AnnouncementRecord = {
  id: string;
  time: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

function normalize(input: unknown) {
  return typeof input === "string" ? input.trim() : "";
}

export async function listAnnouncementsAction(): Promise<AnnouncementRecord[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from(ANNOUNCEMENT_TABLE)
    .select("id,time,title,createdAt,updatedAt")
    .order("time", { ascending: true })
    .order("createdAt", { ascending: true });

  if (error) {
    console.error("[listAnnouncementsAction]", error);
    throw new Error("Gagal mengambil data pengumuman.");
  }

  return (data ?? []).map((entry) => ({
    id: entry.id,
    time: entry.time,
    title: entry.title,
    createdAt: entry.createdAt ?? "",
    updatedAt: entry.updatedAt ?? "",
  }));
}

type CreateAnnouncementPayload = {
  time: string;
  title: string;
};

export async function createAnnouncementAction(
  payload: CreateAnnouncementPayload
): Promise<AnnouncementRecord> {
  const supabase = createSupabaseServerClient();
  const time = normalize(payload.time);
  const title = normalize(payload.title);

  if (!time || !TIME_PATTERN.test(time)) {
    throw new Error("Format waktu tidak valid. Gunakan format HH:MM.");
  }

  if (!title) {
    throw new Error("Isi pengumuman wajib diisi.");
  }

  const now = new Date().toISOString();
  const id = randomUUID();
  const { data, error } = await supabase
    .from(ANNOUNCEMENT_TABLE)
    .insert({
      id,
      time,
      title,
      createdAt: now,
      updatedAt: now,
    })
    .select("id,time,title,createdAt,updatedAt")
    .single();

  if (error) {
    console.error("[createAnnouncementAction][insert]", error);
    throw new Error("Gagal membuat pengumuman.");
  }

  revalidatePath("/guru/dashboard");
  return {
    id: data.id,
    time: data.time,
    title: data.title,
    createdAt: data.createdAt ?? "",
    updatedAt: data.updatedAt ?? "",
  };
}

export async function deleteAnnouncementAction(id: string): Promise<void> {
  const supabase = createSupabaseServerClient();
  const trimmed = normalize(id);
  if (!trimmed) {
    throw new Error("ID pengumuman tidak valid.");
  }

  const { data: existing, error: existsError } = await supabase
    .from(ANNOUNCEMENT_TABLE)
    .select("id")
    .eq("id", trimmed)
    .maybeSingle();

  if (existsError) {
    console.error("[deleteAnnouncementAction][exists]", existsError);
    throw new Error("Gagal memeriksa pengumuman.");
  }

  if (!existing) {
    throw new Error("Pengumuman tidak ditemukan.");
  }

  const { error } = await supabase
    .from(ANNOUNCEMENT_TABLE)
    .delete()
    .eq("id", trimmed);

  if (error) {
    console.error("[deleteAnnouncementAction][delete]", error);
    throw new Error("Gagal menghapus pengumuman.");
  }

  revalidatePath("/guru/dashboard");
}
