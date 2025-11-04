import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const dates = await prisma.attendanceRecord.findMany({
      select: { date: true },
      distinct: ["date"],
      orderBy: { date: "desc" },
    });
    return NextResponse.json(dates.map((entry) => entry.date));
  } catch (error) {
    console.error("[attendance-dates][GET]", error);
    return NextResponse.json(
      { error: "Gagal mengambil daftar tanggal kehadiran." },
      { status: 500 }
    );
  }
}

