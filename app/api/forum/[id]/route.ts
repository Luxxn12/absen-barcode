import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteParams = {
  id?: string;
};

type RouteContext = {
  params?: RouteParams | Promise<RouteParams>;
};

async function resolveForumId(
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
  const id = await resolveForumId(request, context);
  if (!id) {
    return NextResponse.json(
      { error: "ID laporan tidak valid." },
      { status: 400 }
    );
  }

  try {
    const existing = await prisma.forumEntry.findUnique({
      where: { id },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Laporan tidak ditemukan." },
        { status: 404 }
      );
    }
    await prisma.forumEntry.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[forum][DELETE]", error);
    return NextResponse.json(
      { error: "Gagal menghapus laporan forum." },
      { status: 500 }
    );
  }
}
