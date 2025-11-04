import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomPrefixedId } from "@/lib/ids";

function mapStudent(student: {
  id: string;
  name: string;
  classId: string;
  class: { id: string; name: string } | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: student.id,
    name: student.name,
    classId: student.classId,
    className: student.class?.name ?? "-",
    createdAt: student.createdAt,
    updatedAt: student.updatedAt,
  };
}

export async function GET() {
  try {
    const students = await prisma.student.findMany({
      include: { class: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(students.map(mapStudent));
  } catch (error) {
    console.error("[students][GET]", error);
    return NextResponse.json(
      { error: "Gagal mengambil data siswa." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { name, classId } = await request.json();
    const trimmed = typeof name === "string" ? name.trim() : "";
    const classIdValue = typeof classId === "string" ? classId.trim() : "";
    if (!trimmed || !classIdValue) {
      return NextResponse.json(
        { error: "Nama siswa dan kelas wajib diisi." },
        { status: 400 }
      );
    }

    const classExists = await prisma.classGroup.findUnique({
      where: { id: classIdValue },
    });
    if (!classExists) {
      return NextResponse.json(
        { error: "Kelas tidak ditemukan." },
        { status: 404 }
      );
    }

    const ids = await prisma.student.findMany({
      select: { id: true },
    });
    const id = randomPrefixedId(
      ids.map((entry) => entry.id),
      "STD-"
    );

    const created = await prisma.student.create({
      data: {
        id,
        name: trimmed,
        classId: classIdValue,
      },
      include: { class: true },
    });
    return NextResponse.json(mapStudent(created), { status: 201 });
  } catch (error) {
    console.error("[students][POST]", error);
    return NextResponse.json(
      { error: "Gagal menambahkan siswa." },
      { status: 500 }
    );
  }
}
