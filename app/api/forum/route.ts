import { NextResponse } from "next/server";
import { ForumMood } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const moodAliases: Record<string, ForumMood> = {
  Senang: ForumMood.Senang,
  Netral: ForumMood.Netral,
  Sedih: ForumMood.Sedih,
  "Perlu Perhatian": ForumMood.PerluPerhatian,
  PerluPerhatian: ForumMood.PerluPerhatian,
};

function serialize(entry: {
  id: string;
  studentId: string;
  student: {
    id: string;
    name: string;
    classId: string | null;
    class: { id: string; name: string } | null;
  } | null;
  mood: ForumMood;
  message: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  const classInfo = entry.student?.class ?? null;
  return {
    id: entry.id,
    studentId: entry.studentId,
    studentName: entry.student?.name ?? "Tidak diketahui",
    classId: entry.student?.classId ?? null,
    className: classInfo?.name ?? "-",
    mood: entry.mood,
    message: entry.message,
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
  };
}

export async function GET() {
  try {
    const entries = await prisma.forumEntry.findMany({
      include: {
        student: {
          include: {
            class: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return NextResponse.json(entries.map(serialize));
  } catch (error) {
    console.error("[forum][GET]", error);
    return NextResponse.json(
      { error: "Gagal mengambil data forum." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const studentId =
      typeof body.studentId === "string" ? body.studentId.trim() : "";
    const moodInput =
      typeof body.mood === "string" ? body.mood.trim() : "";
    const message =
      typeof body.message === "string" ? body.message.trim() : "";

    if (!studentId || !moodInput || !message) {
      return NextResponse.json(
        { error: "Data laporan belum lengkap." },
        { status: 400 }
      );
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { class: true },
    });
    if (!student) {
      return NextResponse.json(
        { error: "Siswa tidak ditemukan." },
        { status: 404 }
      );
    }

    const mood = moodAliases[moodInput];
    if (!mood) {
      return NextResponse.json(
        { error: "Mood tidak dikenali." },
        { status: 400 }
      );
    }

    const created = await prisma.forumEntry.create({
      data: {
        studentId,
        mood,
        message,
      },
      include: {
        student: {
          include: { class: true },
        },
      },
    });

    return NextResponse.json(serialize(created), { status: 201 });
  } catch (error) {
    console.error("[forum][POST]", error);
    return NextResponse.json(
      { error: "Gagal menyimpan laporan forum." },
      { status: 500 }
    );
  }
}
