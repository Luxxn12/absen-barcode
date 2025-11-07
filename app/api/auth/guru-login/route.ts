"use server";

import { NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const ACCOUNT_TABLE = "GuruAccounts";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const emailInput =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const passwordInput =
      typeof body.password === "string" ? body.password : "";

    if (!emailInput || !passwordInput) {
      return NextResponse.json(
        { error: "Email dan password wajib diisi." },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient();
    const { data: account, error } = await supabase
      .from(ACCOUNT_TABLE)
      .select("id,email,name,password_hash,role")
      .eq("email", emailInput)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      console.error("[guru-login][select]", error);
      return NextResponse.json(
        { error: "Gagal memeriksa akun guru." },
        { status: 500 }
      );
    }

    if (!account || !account.password_hash) {
      return NextResponse.json(
        { error: "Email atau password salah." },
        { status: 401 }
      );
    }

    const isValid = await compare(passwordInput, account.password_hash);
    if (!isValid) {
      return NextResponse.json(
        { error: "Email atau password salah." },
        { status: 401 }
      );
    }

    const role =
      typeof account.role === "string" && account.role.length
        ? (account.role as "guru" | "superadmin")
        : "guru";

    return NextResponse.json({
      success: true,
      user: {
        email: account.email,
        name: account.name,
        role,
      },
    });
  } catch (error) {
    console.error("[guru-login][POST]", error);
    return NextResponse.json(
      { error: "Gagal memproses permintaan login." },
      { status: 500 }
    );
  }
}
