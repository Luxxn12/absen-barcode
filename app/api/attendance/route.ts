import { NextResponse } from "next/server";
import type { AttendanceStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const allowedStatuses: AttendanceStatus[] = ["Hadir", "Sakit", "Izin", "Alfa"];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId") ?? undefined;
    const date = searchParams.get("date") ?? undefined;
    const historyLimit = searchParams.get("limit");
    const limit = historyLimit ? Number.parseInt(historyLimit, 10) : undefined;

    const where: Prisma.AttendanceRecordWhereInput = {};
    if (studentId) {
      where.studentId = studentId;
    }
    if (date) {
      where.date = date;
    }

    const records = await prisma.attendanceRecord.findMany({
      where,
      orderBy: [
        { date: "desc" },
        { updatedAt: "desc" },
        { createdAt: "desc" },
      ],
      take: limit && !Number.isNaN(limit) ? limit : undefined,
    });

    return NextResponse.json(records);
  } catch (error) {
    console.error("[attendance][GET]", error);
    return NextResponse.json(
      { error: "Gagal mengambil data kehadiran." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const studentId =
      typeof body.studentId === "string" ? body.studentId.trim() : "";
    const status =
      typeof body.status === "string" ? (body.status.trim() as AttendanceStatus) : "";
    const checkIn =
      typeof body.checkIn === "string" ? body.checkIn.trim() : "";
    const date =
      typeof body.date === "string" && body.date.trim().length
        ? body.date.trim()
        : new Date().toISOString().split("T")[0];

    if (!studentId || !status) {
      return NextResponse.json(
        { error: "Data kehadiran tidak lengkap." },
        { status: 400 }
      );
    }

    if (!allowedStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Status kehadiran tidak valid." },
        { status: 400 }
      );
    }

    const studentExists = await prisma.student.findUnique({
      where: { id: studentId },
    });
    if (!studentExists) {
      return NextResponse.json(
        { error: "Siswa tidak ditemukan." },
        { status: 404 }
      );
    }

    const record = await prisma.attendanceRecord.upsert({
      where: {
        studentId_date: {
          studentId,
          date,
        },
      },
      update: {
        status,
        checkIn,
      },
      create: {
        studentId,
        date,
        status,
        checkIn,
      },
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error("[attendance][POST]", error);
    return NextResponse.json(
      { error: "Gagal menyimpan data kehadiran." },
      { status: 500 }
    );
  }
}

