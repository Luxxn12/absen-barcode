import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteParams = {
  id?: string;
};

type RouteContext = {
  params?: RouteParams | Promise<RouteParams>;
};

async function resolveAnnouncementId(
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

export async function DELETE(request: Request, context: RouteContext) {
  const id = await resolveAnnouncementId(request, context);
  if (!id) {
    return NextResponse.json(
      { error: "ID pengumuman tidak valid." },
      { status: 400 }
    );
  }

  try {
    const existing = await prisma.announcement.findUnique({
      where: { id },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Pengumuman tidak ditemukan." },
        { status: 404 }
      );
    }

    await prisma.announcement.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[announcements][DELETE]", error);
    return NextResponse.json(
      { error: "Gagal menghapus pengumuman." },
      { status: 500 }
    );
  }
}
