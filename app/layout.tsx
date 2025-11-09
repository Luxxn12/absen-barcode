import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { StudentProvider } from "@/contexts/StudentContext";
import { AttendanceProvider } from "@/contexts/AttendanceContext";
import { AnnouncementProvider } from "@/contexts/AnnouncementContext";
import { ThemeProvider } from "@/contexts/ThemeContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Absensi Barcode & Wajah Sekolah",
  description:
    "Dashboard absensi barcode & wajah dengan role Guru dan Siswa. UI interaktif dan mobile friendly.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-slate-100 text-slate-900 antialiased`}
      >
        <ThemeProvider>
          <StudentProvider>
            <AttendanceProvider>
              <AnnouncementProvider>
                <AuthProvider>{children}</AuthProvider>
              </AnnouncementProvider>
            </AttendanceProvider>
          </StudentProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
