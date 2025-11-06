"use server";

import { NextResponse } from "next/server";
import { ensureGuruAccount } from "@/lib/supabase/admin";

export async function POST() {
  try {
    const result = await ensureGuruAccount();
    return NextResponse.json(
      {
        success: true,
        created: result.created,
        email: result.email,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[ensure-guru][POST]", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Gagal memastikan akun guru.",
      },
      { status: 500 }
    );
  }
}
