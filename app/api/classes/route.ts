import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomPrefixedId } from "@/lib/ids";

export async function GET() {
  try {
    const classes = await prisma.classGroup.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(classes);
  } catch (error) {
    console.error("[classes][GET]", error);
    return NextResponse.json(
      { error: "Gagal mengambil data kelas." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { name } = await request.json();
    const trimmed = typeof name === "string" ? name.trim() : "";
    if (!trimmed) {
      return NextResponse.json(
        { error: "Nama kelas wajib diisi." },
        { status: 400 }
      );
    }

    const existing = await prisma.classGroup.findUnique({
      where: {
        name: trimmed,
      },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Kelas sudah terdaftar." },
        { status: 409 }
      );
    }

    const ids = await prisma.classGroup.findMany({
      select: { id: true },
    });
    const id = randomPrefixedId(
      ids.map((entry) => entry.id),
      "CLS-"
    );

    const created = await prisma.classGroup.create({
      data: {
        id,
        name: trimmed,
      },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("[classes][POST]", error);
    return NextResponse.json(
      { error: "Gagal menambahkan kelas baru." },
      { status: 500 }
    );
  }
}
