"use server";

import { NextResponse } from "next/server";
import type { PostgrestError } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const FACE_TABLE = "StudentFaces";
const FACE_DUPLICATE_THRESHOLD = 0.35;

function euclideanDistance(a: number[], b: number[]) {
  let sum = 0;
  for (let index = 0; index < a.length; index += 1) {
    const diff = a[index] - b[index];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const studentId =
      typeof body.studentId === "string" ? body.studentId.trim() : "";
    const descriptorInput = Array.isArray(body.descriptor)
      ? body.descriptor.map((value: number | string) => Number(value))
      : null;

    if (!studentId || !descriptorInput || descriptorInput.length !== 128) {
      return NextResponse.json(
        { error: "Data wajah tidak valid." },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient();
    const now = new Date().toISOString();

    const { data: existingFaces, error: faceQueryError } = await supabase
      .from(FACE_TABLE)
      .select("id,studentid,descriptor");

    if (faceQueryError) {
      if ((faceQueryError as PostgrestError).code === "PGRST205") {
        return NextResponse.json(
          {
            error:
              "Tabel StudentFaces belum dibuat. Tambahkan tabel lebih dulu sebelum menyimpan wajah.",
          },
          { status: 500 }
        );
      }
      console.error("[faces][register][select]", faceQueryError);
      return NextResponse.json(
        { error: "Gagal membaca data wajah yang tersedia." },
        { status: 500 }
      );
    }

    const duplicateEntry = (existingFaces ?? []).find((row) => {
      if (!row.descriptor || row.studentid === studentId) {
        return false;
      }
      const otherDescriptor = Array.isArray(row.descriptor)
        ? row.descriptor.map((value: number | string) => Number(value))
        : [];
      if (otherDescriptor.length !== descriptorInput.length) {
        return false;
      }
      const distance = euclideanDistance(descriptorInput, otherDescriptor);
      return distance <= FACE_DUPLICATE_THRESHOLD;
    });

    if (duplicateEntry) {
      const { data: conflictStudent } = await supabase
        .from("Student")
        .select("name")
        .eq("id", duplicateEntry.studentid)
        .maybeSingle();
      const name = conflictStudent?.name ?? duplicateEntry.studentid;
      return NextResponse.json(
        {
          error: `Wajah sudah terdaftar atas nama ${name}. Silakan hapus data wajah sebelumnya sebelum menambahkan yang baru.`,
        },
        { status: 409 }
      );
    }

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
