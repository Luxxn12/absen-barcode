"use server";

import { NextResponse } from "next/server";
import type { PostgrestError } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const FACE_TABLE = "StudentFaces";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const studentId =
      typeof body.studentId === "string" ? body.studentId.trim() : "";
    const descriptorInput = Array.isArray(body.descriptor)
      ? body.descriptor
      : null;

    if (!studentId || !descriptorInput || descriptorInput.length !== 128) {
      return NextResponse.json(
        { error: "Data wajah tidak valid." },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient();
    const now = new Date().toISOString();

    const { data: existing } = await supabase
      .from(FACE_TABLE)
      .select("id")
      .eq("studentid", studentId)
      .maybeSingle();

    const payload = {
      studentid: studentId,
      descriptor: descriptorInput,
      updated_at: now,
    };

    if (existing) {
      const { error } = await supabase
        .from(FACE_TABLE)
        .update(payload)
        .eq("id", existing.id);
      if (error) {
        if ((error as PostgrestError).code === "PGRST205") {
          return NextResponse.json(
            {
              error:
                "Tabel StudentFaces belum dibuat. Tambahkan tabel lebih dulu sebelum menyimpan wajah.",
            },
            { status: 500 }
          );
        }
        console.error("[faces][register][update]", error);
        return NextResponse.json(
          { error: "Gagal memperbarui data wajah." },
          { status: 500 }
        );
      }
    } else {
      const { error } = await supabase.from(FACE_TABLE).insert({
        ...payload,
        created_at: now,
      });
      if (error) {
        if ((error as PostgrestError).code === "PGRST205") {
          return NextResponse.json(
            {
              error:
                "Tabel StudentFaces belum dibuat. Tambahkan tabel lebih dulu sebelum menyimpan wajah.",
            },
            { status: 500 }
          );
        }
        console.error("[faces][register][insert]", error);
        return NextResponse.json(
          { error: "Gagal menyimpan data wajah." },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[faces][register][POST]", error);
    return NextResponse.json(
      { error: "Gagal memproses permintaan." },
      { status: 500 }
    );
  }
}
