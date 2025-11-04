import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

function normalize(input: unknown) {
  return typeof input === "string" ? input.trim() : "";
}

export async function GET() {
  try {
    const announcements = await prisma.announcement.findMany({
      orderBy: [{ time: "asc" }, { createdAt: "asc" }],
    });
    return NextResponse.json(announcements);
  } catch (error) {
    console.error("[announcements][GET]", error);
    return NextResponse.json(
      { error: "Gagal mengambil data pengumuman." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const time = normalize(body?.time);
    const title = normalize(body?.title);

    if (!time || !TIME_PATTERN.test(time)) {
      return NextResponse.json(
        { error: "Format waktu tidak valid. Gunakan format HH:MM." },
        { status: 400 }
      );
    }

    if (!title) {
      return NextResponse.json(
        { error: "Isi pengumuman wajib diisi." },
        { status: 400 }
      );
    }

    const created = await prisma.announcement.create({
      data: {
        time,
        title,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("[announcements][POST]", error);
    return NextResponse.json(
      { error: "Gagal membuat pengumuman." },
      { status: 500 }
    );
  }
}
