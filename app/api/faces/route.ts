"use server";

import { NextResponse } from "next/server";
import type { PostgrestError } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const FACE_TABLE = "StudentFaces";

type StudentRow = {
  id: string;
  name: string;
  classId: string;
  class?: {
    name?: string | null;
  }[] | { name?: string | null } | null;
};

export async function GET() {
  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from(FACE_TABLE)
      .select("id,studentid,descriptor,created_at,updated_at");

    if (error) {
      if ((error as PostgrestError).code === "PGRST205") {
        console.warn(
          "[faces][GET]",
          "Tabel StudentFaces belum tersedia. Lewati permintaan."
        );
        return NextResponse.json([]);
      }
      console.error("[faces][GET]", error);
      return NextResponse.json(
        { error: "Gagal mengambil data wajah." },
        { status: 500 }
      );
    }

    const faceRows = data ?? [];
    if (faceRows.length === 0) {
      return NextResponse.json([]);
    }

    const studentIds = Array.from(
      new Set(faceRows.map((row) => row.studentid))
    );

    const { data: studentRows, error: studentError } = await supabase
      .from("Student")
      .select("id,name,classId,class:ClassGroup(name)")
      .in("id", studentIds);

    if (studentError) {
      console.error("[faces][students]", studentError);
      return NextResponse.json(
        { error: "Gagal mengambil data referensi siswa." },
        { status: 500 }
      );
    }

    const studentMap = new Map<
      string,
      { name: string; classId: string; className: string }
    >();
    (studentRows ?? []).forEach((student: StudentRow) => {
      const className = Array.isArray(student.class)
        ? student.class[0]?.name ?? "-"
        : student.class?.name ?? "-";
      studentMap.set(student.id, {
        name: student.name,
        classId: student.classId,
        className,
      });
    });

    const payload = faceRows
      .map((row) => {
        const meta = studentMap.get(row.studentid);
        if (!meta) return null;
        return {
          id: row.id,
          studentId: row.studentid,
          descriptor: row.descriptor,
          studentName: meta.name,
          classId: meta.classId,
          className: meta.className,
        };
      })
      .filter(Boolean);

    return NextResponse.json(payload);
  } catch (error) {
    console.error("[faces][GET][unknown]", error);
    return NextResponse.json(
      { error: "Gagal memproses permintaan." },
      { status: 500 }
    );
  }
}
