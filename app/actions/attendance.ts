"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { randomUUID } from "node:crypto";

export type AttendanceStatus = "Hadir" | "Sakit" | "Izin" | "Alfa";

export type AttendanceRecord = {
  id: string;
  studentId: string;
  date: string;
  status: AttendanceStatus;
  checkIn: string;
  createdAt: string;
  updatedAt: string;
};

const ATTENDANCE_TABLE = "AttendanceRecord";
const STUDENT_TABLE = "Student";
const ALLOWED_STATUSES: AttendanceStatus[] = [
  "Hadir",
  "Sakit",
  "Izin",
  "Alfa",
];
const DEFAULT_TIME_ZONE =
  process.env.APP_TIMEZONE ??
  process.env.APP_TIME_ZONE ??
  process.env.NEXT_PUBLIC_APP_TIMEZONE ??
  process.env.NEXT_PUBLIC_APP_TIME_ZONE ??
  "Asia/Jakarta";

function assertValidStatus(status: string): asserts status is AttendanceStatus {
  if (!ALLOWED_STATUSES.includes(status as AttendanceStatus)) {
    throw new Error("Status kehadiran tidak valid.");
  }
}

type ListParams = {
  studentId?: string;
  date?: string;
  limit?: number;
};

export async function listAttendanceAction(
  params: ListParams = {}
): Promise<AttendanceRecord[]> {
  const supabase = createSupabaseServerClient();
  let query = supabase
    .from(ATTENDANCE_TABLE)
    .select("id,studentId,date,status,checkIn,createdAt,updatedAt")
    .order("date", { ascending: false })
    .order("updatedAt", { ascending: false });

  if (params.studentId) {
    query = query.eq("studentId", params.studentId.trim());
  }
  if (params.date) {
    query = query.eq("date", params.date.trim());
  }
  if (typeof params.limit === "number" && Number.isFinite(params.limit)) {
    query = query.limit(Math.max(0, params.limit));
  }

  const { data, error } = await query;

  if (error) {
    console.error("[listAttendanceAction]", error);
    throw new Error("Gagal mengambil data kehadiran.");
  }

  return (data ?? []).map((record) => ({
    id: record.id,
    studentId: record.studentId,
    date: record.date,
    status: record.status as AttendanceStatus,
    checkIn: record.checkIn,
    createdAt: record.createdAt ?? "",
    updatedAt: record.updatedAt ?? "",
  }));
}

type UpsertPayload = {
  studentId: string;
  status: AttendanceStatus;
  checkIn: string;
  date?: string;
  timeZone?: string;
};

function resolveDate(dateInput?: string, timeZone?: string) {
  const trimmed = typeof dateInput === "string" ? dateInput.trim() : "";
  if (trimmed) {
    return trimmed;
  }
  const tz = (timeZone ?? "").trim() || DEFAULT_TIME_ZONE;
  // Align default attendance date with the provided timezone so scans and admin view use the same day.
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  } catch (error) {
    console.warn("[attendance][resolveDate]", "Invalid timezone:", tz, error);
  }
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: DEFAULT_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export async function upsertAttendanceAction(
  payload: UpsertPayload
): Promise<AttendanceRecord> {
  const supabase = createSupabaseServerClient();
  const studentId =
    typeof payload.studentId === "string" ? payload.studentId.trim() : "";
  const status =
    typeof payload.status === "string" ? payload.status.trim() : "";
  const checkIn =
    typeof payload.checkIn === "string" ? payload.checkIn.trim() : "";
  const date = resolveDate(payload.date, payload.timeZone);

  if (!studentId || !checkIn) {
    throw new Error("Data kehadiran tidak lengkap.");
  }

  assertValidStatus(status);

  const { data: studentExists, error: studentError } = await supabase
    .from(STUDENT_TABLE)
    .select("id")
    .eq("id", studentId)
    .maybeSingle();

  if (studentError) {
    console.error("[upsertAttendanceAction][student]", studentError);
    throw new Error("Gagal memeriksa data siswa.");
  }

  if (!studentExists) {
    throw new Error("Siswa tidak ditemukan.");
  }

  const now = new Date().toISOString();
  const { data: existing, error: existingError } = await supabase
    .from(ATTENDANCE_TABLE)
    .select("id")
    .eq("studentId", studentId)
    .eq("date", date)
    .maybeSingle();

  if (existingError) {
    console.error("[upsertAttendanceAction][existing]", existingError);
    throw new Error("Gagal memeriksa data kehadiran.");
  }

  let data:
    | {
        id: string;
        studentId: string;
        date: string;
        status: string;
        checkIn: string;
        createdAt: string | null;
        updatedAt: string | null;
      }
    | null = null;

  if (existing) {
    const { data: updated, error: updateError } = await supabase
      .from(ATTENDANCE_TABLE)
      .update({
        status,
        checkIn,
        updatedAt: now,
      })
      .eq("studentId", studentId)
      .eq("date", date)
      .select("id,studentId,date,status,checkIn,createdAt,updatedAt")
      .single();

    if (updateError) {
      console.error("[upsertAttendanceAction][update]", updateError);
      throw new Error("Gagal memperbarui data kehadiran.");
    }

    data = updated;
  } else {
    const id = randomUUID();
    const { data: inserted, error: insertError } = await supabase
      .from(ATTENDANCE_TABLE)
      .insert({
        id,
        studentId,
        date,
        status,
        checkIn,
        createdAt: now,
        updatedAt: now,
      })
      .select("id,studentId,date,status,checkIn,createdAt,updatedAt")
      .single();

    if (insertError) {
      console.error("[upsertAttendanceAction][insert]", insertError);
      throw new Error("Gagal menyimpan data kehadiran.");
    }

    data = inserted;
  }

  revalidatePath("/guru/status");
  return {
    id: data.id,
    studentId: data.studentId,
    date: data.date,
    status: data.status as AttendanceStatus,
    checkIn: data.checkIn,
    createdAt: data.createdAt ?? "",
    updatedAt: data.updatedAt ?? "",
  };
}
