import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Prisma, PrismaClient } from "@prisma/client";
import { prisma as globalPrisma } from "@/lib/prisma";

export const runtime = "nodejs";

type LoginPayload = {
  email?: unknown;
  password?: unknown;
};

export async function POST(request: Request) {
  const db = globalPrisma ?? new PrismaClient();

  try {
    const body = (await request.json()) as LoginPayload;
    const emailInput =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const passwordInput =
      typeof body.password === "string" ? body.password.trim() : "";

    if (!emailInput || !passwordInput) {
      return NextResponse.json(
        { error: "Email dan password wajib diisi." },
        { status: 400 }
      );
    }

    const userModel = (db as PrismaClient & {
      user?: {
        findUnique?: (
          args: Prisma.UserFindUniqueArgs
        ) => Promise<{
          id: string;
          email: string;
          passwordHash: string;
          name: string;
        } | null>;
      };
    }).user;

    type UserRecord = {
      id: string;
      email: string;
      passwordHash: string;
      name: string;
    };

    let user: UserRecord | null = null;

    if (userModel?.findUnique) {
      user = await userModel.findUnique({
        where: { email: emailInput },
      });
    } else {
      user = await db
        .$queryRaw<UserRecord[]>(Prisma.sql`
          SELECT "id", "email", "passwordHash", "name"
          FROM "User"
          WHERE "email" = ${emailInput}
          LIMIT 1
        `)
        .then((rows) => rows.at(0) ?? null);
    }

    if (!user) {
      return NextResponse.json(
        { error: "Email atau password salah." },
        { status: 401 }
      );
    }

    const isMatch = await bcrypt.compare(passwordInput, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Email atau password salah." },
        { status: 401 }
      );
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
    });
  } catch (error) {
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Terjadi kesalahan saat login.";
    console.error("[auth][login][POST]", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat login.", details: message },
      { status: 500 }
    );
  }
}
