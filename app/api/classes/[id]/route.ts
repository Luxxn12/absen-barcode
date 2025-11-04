import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteParams = {
  id?: string;
};

type RouteContext = {
  params?: RouteParams | Promise<RouteParams>;
};

async function resolveClassId(
  request: Request,
  context: RouteContext
): Promise<string | null> {
  const params = await context.params;
  const contextId = params?.id;
  if (typeof contextId === "string" && contextId.trim().length) {
    return contextId.trim();
  }
  const url = new URL(request.url);
  const pathSegments = url.pathname.split("/");
  const fallbackId = pathSegments[pathSegments.length - 1]?.trim();
  return fallbackId && fallbackId.length ? fallbackId : null;
}

export async function PATCH(request: Request, context: RouteContext) {
  const id = await resolveClassId(request, context);
  if (!id) {
    return NextResponse.json(
      { error: "ID kelas tidak valid." },
      { status: 400 }
    );
  }

  try {
    const { name } = await request.json();
    const trimmed = typeof name === "string" ? name.trim() : "";
    if (!trimmed) {
      return NextResponse.json(
        { error: "Nama kelas wajib diisi." },
        { status: 400 }
      );
    }

    const exists = await prisma.classGroup.findUnique({
      where: { id },
    });
    if (!exists) {
      return NextResponse.json(
        { error: "Kelas tidak ditemukan." },
        { status: 404 }
      );
    }

    const duplicate = await prisma.classGroup.findFirst({
      where: {
        id: { not: id },
        name: trimmed,
      },
    });
    if (duplicate) {
      return NextResponse.json(
        { error: "Nama kelas sudah digunakan." },
        { status: 409 }
      );
    }

    const updated = await prisma.classGroup.update({
      where: { id },
      data: { name: trimmed },
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("[classes][PATCH]", error);
    return NextResponse.json(
      { error: "Gagal memperbarui kelas." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: RouteContext
) {
  const id = await resolveClassId(request, context);
  if (!id) {
    return NextResponse.json(
      { error: "ID kelas tidak valid." },
      { status: 400 }
    );
  }

  try {
    const exists = await prisma.classGroup.findUnique({
      where: { id },
    });
    if (!exists) {
      return NextResponse.json(
        { error: "Kelas tidak ditemukan." },
        { status: 404 }
      );
    }

    const attachedStudents = await prisma.student.count({
      where: { classId: id },
    });
    if (attachedStudents > 0) {
      return NextResponse.json(
        {
          error:
            "Kelas tidak dapat dihapus karena masih digunakan oleh data siswa.",
        },
        { status: 400 }
      );
    }

    await prisma.classGroup.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[classes][DELETE]", error);
    return NextResponse.json(
      { error: "Gagal menghapus kelas." },
      { status: 500 }
    );
  }
}
