import {
  PrismaClient,
  AttendanceStatus,
  ForumMood,
} from "@prisma/client";

const prisma = new PrismaClient();

const classGroups = [
  { id: "CLS-001", name: "X IPA 1" },
  { id: "CLS-002", name: "X IPA 2" },
  { id: "CLS-003", name: "X IPS 1" },
  { id: "CLS-004", name: "XI IPA 1" },
  { id: "CLS-005", name: "XI IPS 2" },
  { id: "CLS-006", name: "XII IPA 1" },
  { id: "CLS-007", name: "XII IPS 1" },
  { id: "CLS-008", name: "X IPA 3" },
  { id: "CLS-009", name: "XI IPA 2" },
  { id: "CLS-010", name: "XI IPS 1" },
  { id: "CLS-011", name: "XII IPA 2" },
];

const students = [
  {
    id: "STD-001",
    name: "Ahmad Fauzi",
    className: "X IPA 1",
  },
  {
    id: "STD-002",
    name: "Siti Rahma",
    className: "X IPA 2",
  },
  {
    id: "STD-003",
    name: "Budi Santoso",
    className: "X IPS 1",
  },
  {
    id: "STD-004",
    name: "Lina Kartika",
    className: "XI IPA 1",
  },
  {
    id: "STD-005",
    name: "Dewi Lestari",
    className: "XI IPS 2",
  },
  {
    id: "STD-006",
    name: "Rudi Hartono",
    className: "XII IPA 1",
  },
  {
    id: "STD-007",
    name: "Maria Ulfa",
    className: "XII IPS 1",
  },
  {
    id: "STD-008",
    name: "Eko Prasetyo",
    className: "X IPA 3",
  },
  {
    id: "STD-009",
    name: "Nina Safitri",
    className: "XI IPA 2",
  },
  {
    id: "STD-010",
    name: "Bagus Saputra",
    className: "XI IPS 1",
  },
  {
    id: "STD-011",
    name: "Intan Cahya",
    className: "X IPA 1",
  },
  {
    id: "STD-012",
    name: "Hendra Wijaya",
    className: "XII IPA 2",
  },
];

function formatDateWithOffset(offset: number) {
  const base = new Date();
  base.setDate(base.getDate() - offset);
  const local = new Date(base.getTime() - base.getTimezoneOffset() * 60000);
  return local.toISOString().split("T")[0];
}

type SeedAttendance = {
  studentId: string;
  date: string;
  status: AttendanceStatus;
  checkIn: string;
};

const attendanceRecords: SeedAttendance[] = [
  // Hari ini
  { studentId: "STD-001", date: formatDateWithOffset(0), status: "Hadir", checkIn: "07:05" },
  { studentId: "STD-002", date: formatDateWithOffset(0), status: "Sakit", checkIn: "-" },
  { studentId: "STD-003", date: formatDateWithOffset(0), status: "Hadir", checkIn: "07:10" },
  { studentId: "STD-004", date: formatDateWithOffset(0), status: "Izin", checkIn: "-" },
  { studentId: "STD-005", date: formatDateWithOffset(0), status: "Hadir", checkIn: "07:12" },
  { studentId: "STD-006", date: formatDateWithOffset(0), status: "Hadir", checkIn: "07:07" },
  { studentId: "STD-007", date: formatDateWithOffset(0), status: "Alfa", checkIn: "-" },
  { studentId: "STD-008", date: formatDateWithOffset(0), status: "Hadir", checkIn: "07:09" },
  { studentId: "STD-009", date: formatDateWithOffset(0), status: "Hadir", checkIn: "07:04" },
  { studentId: "STD-010", date: formatDateWithOffset(0), status: "Izin", checkIn: "-" },
  { studentId: "STD-011", date: formatDateWithOffset(0), status: "Hadir", checkIn: "07:06" },
  { studentId: "STD-012", date: formatDateWithOffset(0), status: "Hadir", checkIn: "07:08" },
  // Kemarin
  { studentId: "STD-001", date: formatDateWithOffset(1), status: "Hadir", checkIn: "07:03" },
  { studentId: "STD-002", date: formatDateWithOffset(1), status: "Hadir", checkIn: "07:16" },
  { studentId: "STD-003", date: formatDateWithOffset(1), status: "Hadir", checkIn: "07:11" },
  { studentId: "STD-004", date: formatDateWithOffset(1), status: "Hadir", checkIn: "07:15" },
  { studentId: "STD-005", date: formatDateWithOffset(1), status: "Izin", checkIn: "-" },
  { studentId: "STD-006", date: formatDateWithOffset(1), status: "Hadir", checkIn: "07:05" },
  { studentId: "STD-007", date: formatDateWithOffset(1), status: "Hadir", checkIn: "07:20" },
  { studentId: "STD-008", date: formatDateWithOffset(1), status: "Sakit", checkIn: "-" },
  { studentId: "STD-009", date: formatDateWithOffset(1), status: "Hadir", checkIn: "07:02" },
  { studentId: "STD-010", date: formatDateWithOffset(1), status: "Hadir", checkIn: "07:18" },
  { studentId: "STD-011", date: formatDateWithOffset(1), status: "Hadir", checkIn: "07:09" },
  { studentId: "STD-012", date: formatDateWithOffset(1), status: "Alfa", checkIn: "-" },
  // Dua hari lalu
  { studentId: "STD-001", date: formatDateWithOffset(2), status: "Hadir", checkIn: "07:08" },
  { studentId: "STD-002", date: formatDateWithOffset(2), status: "Hadir", checkIn: "07:05" },
  { studentId: "STD-003", date: formatDateWithOffset(2), status: "Izin", checkIn: "-" },
  { studentId: "STD-004", date: formatDateWithOffset(2), status: "Hadir", checkIn: "07:10" },
  { studentId: "STD-005", date: formatDateWithOffset(2), status: "Hadir", checkIn: "07:14" },
  { studentId: "STD-006", date: formatDateWithOffset(2), status: "Hadir", checkIn: "07:06" },
  { studentId: "STD-007", date: formatDateWithOffset(2), status: "Hadir", checkIn: "07:13" },
  { studentId: "STD-008", date: formatDateWithOffset(2), status: "Hadir", checkIn: "07:07" },
  { studentId: "STD-009", date: formatDateWithOffset(2), status: "Sakit", checkIn: "-" },
  { studentId: "STD-010", date: formatDateWithOffset(2), status: "Hadir", checkIn: "07:12" },
  { studentId: "STD-011", date: formatDateWithOffset(2), status: "Hadir", checkIn: "07:04" },
  { studentId: "STD-012", date: formatDateWithOffset(2), status: "Hadir", checkIn: "07:11" },
];

const announcements = [
  {
    time: "08:00",
    title: "Pertemuan wali kelas",
  },
  {
    time: "09:30",
    title: "Monitoring izin kelas XI IPA",
  },
  {
    time: "11:00",
    title: "Update forum komunikasi",
  },
];

async function main() {
  await prisma.attendanceRecord.deleteMany();
  await prisma.forumEntry.deleteMany();
  await prisma.student.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.classGroup.deleteMany();

  await prisma.classGroup.createMany({
    data: classGroups,
  });

  const classLookup = new Map(classGroups.map((entry) => [entry.name, entry.id]));

  for (const student of students) {
    const classId = classLookup.get(student.className);
    if (!classId) {
      throw new Error(`Class "${student.className}" not found for student ${student.id}`);
    }
    await prisma.student.create({
      data: {
        id: student.id,
        name: student.name,
        classId,
      },
    });
  }

  await prisma.attendanceRecord.createMany({
    data: attendanceRecords.map((record) => ({
      studentId: record.studentId,
      date: record.date,
      status: record.status,
      checkIn: record.checkIn,
    })),
  });

  await prisma.announcement.createMany({
    data: announcements,
  });

  await prisma.forumEntry.createMany({
    data: [
      {
        studentId: "STD-002",
        mood: ForumMood.Sedih,
        message:
          "Mengeluh sakit kepala sejak kemarin. Sudah izin pulang lebih awal, mohon pantauan untuk hari berikutnya.",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        studentId: "STD-003",
        mood: ForumMood.Netral,
        message:
          "Butuh motivasi tambahan di kelas. Mungkin bisa diberi kesempatan presentasi agar lebih percaya diri.",
        createdAt: new Date(Date.now() - 1000 * 60 * 45),
        updatedAt: new Date(Date.now() - 1000 * 60 * 45),
      },
      {
        studentId: "STD-004",
        mood: ForumMood.Senang,
        message:
          "Aktif mengikuti pembelajaran dan membantu teman. Terus berikan apresiasi.",
        createdAt: new Date(Date.now() - 1000 * 60 * 90),
        updatedAt: new Date(Date.now() - 1000 * 60 * 90),
      },
    ],
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
