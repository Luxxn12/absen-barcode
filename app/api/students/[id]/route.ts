import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type StudentWithClass = {
  id: string;
  name: string;
  classId: string;
  class: { id: string; name: string } | null;
  createdAt: Date;
  updatedAt: Date;
};

function mapStudent(student: StudentWithClass) {
  return {
    id: student.id,
    name: student.name,
    classId: student.classId,
    className: student.class?.name ?? "-",
    createdAt: student.createdAt,
    updatedAt: student.updatedAt,
  };
}

type RouteParams = {
  id?: string;
};

type RouteContext = {
  params?: RouteParams | Promise<RouteParams>;
};

async function resolveStudentId(
  request: Request,
  context: RouteContext
): Promise<string | null> {
  const params = await context.params;
  const contextId = params?.id;
  if (typeof contextId === "string" && contextId.trim().length) {
    return contextId.trim();
  }
  const url = new URL(request.url);
  const parts = url.pathname.split("/");
  const fallbackId = parts[parts.length - 1]?.trim();
  return fallbackId && fallbackId.length ? fallbackId : null;
}

export async function PATCH(request: Request, context: RouteContext) {
  const id = await resolveStudentId(request, context);

  if (!id) {
    return NextResponse.json(
      { error: "ID siswa tidak valid." },
      { status: 400 }
    );
  }

  try {
    const { name, classId } = await request.json();
    const trimmedName =
      typeof name === "string" && name.trim().length ? name.trim() : undefined;
    const classIdValue =
      typeof classId === "string" && classId.trim().length
        ? classId.trim()
        : undefined;

    if (!trimmedName && !classIdValue) {
      return NextResponse.json(
        { error: "Tidak ada perubahan yang dikirimkan." },
        { status: 400 }
      );
    }

    const existing = await prisma.student.findUnique({
      where: { id },
      include: { class: true },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Siswa tidak ditemukan." },
        { status: 404 }
      );
    }

    if (classIdValue) {
      const classExists = await prisma.classGroup.findUnique({
        where: { id: classIdValue },
      });
      if (!classExists) {
        return NextResponse.json(
          { error: "Kelas tujuan tidak ditemukan." },
          { status: 404 }
        );
      }
    }

    const nextData: { name?: string; classId?: string } = {};
    if (trimmedName && trimmedName !== existing.name) {
      nextData.name = trimmedName;
    }
    if (classIdValue && classIdValue !== existing.classId) {
      nextData.classId = classIdValue;
    }

    if (Object.keys(nextData).length === 0) {
      return NextResponse.json(mapStudent(existing));
    }

    const updated = await prisma.student.update({
      where: { id },
      data: nextData,
      include: { class: true },
    });

    return NextResponse.json(mapStudent(updated));
  } catch (error) {
    console.error("[students][PATCH]", error);
    return NextResponse.json(
      { error: "Gagal memperbarui siswa." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: RouteContext
) {
  const id = await resolveStudentId(request, context);

  if (!id) {
    return NextResponse.json(
      { error: "ID siswa tidak valid." },
      { status: 400 }
    );
  }

  try {
    const existing = await prisma.student.findUnique({
      where: { id },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Siswa tidak ditemukan." },
        { status: 404 }
      );
    }

    await prisma.attendanceRecord.deleteMany({
      where: { studentId: id },
    });

    await prisma.student.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[students][DELETE]", error);
    return NextResponse.json(
      { error: "Gagal menghapus siswa." },
      { status: 500 }
    );
  }
}
