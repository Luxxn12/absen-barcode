"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, LogOut, QrCode, UserCheck } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useStudents } from "@/contexts/StudentContext";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";

const navItems = [
  { href: "/siswa", icon: Home, label: "Home" },
  { href: "/siswa/scan", icon: QrCode, label: "Scan" },
  { href: "/siswa/status", icon: UserCheck, label: "Status" },
];

export default function SiswaLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { session, hydrated, logout } = useAuth();
  const { getStudentById, hydrated: studentHydrated } = useStudents();
  const router = useRouter();
  const pathname = usePathname();

  const isScanOnlyAccess = pathname === "/siswa/scan";
  const isScanPage = isScanOnlyAccess;
  const visibleNavItems =
    session?.role === "siswa"
      ? navItems
      : navItems.filter((item) => item.href === "/siswa/scan");
  const student = useMemo(() => {
    if (session?.role !== "siswa") return null;
    return getStudentById(session.studentId);
  }, [session, getStudentById]);

  const isReady = hydrated && studentHydrated;

  useEffect(() => {
    if (!isReady) return;
    if (session?.role !== "siswa" && !isScanOnlyAccess) {
      router.replace("/login");
    }
  }, [isReady, session, router, isScanOnlyAccess]);

  if (!isReady && !isScanOnlyAccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="rounded-2xl border border-slate-200 bg-white px-8 py-12 text-center shadow-sm">
          <p className="text-lg font-medium text-slate-600">Memuat menu siswa…</p>
        </div>
      </div>
    );
  }

  if (!isScanOnlyAccess && session?.role !== "siswa") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="rounded-2xl border border-slate-200 bg-white px-8 py-12 text-center shadow-sm">
          <p className="text-lg font-medium text-slate-600">Memuat menu siswa…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-slate-100 pb-20 sm:pb-0">
      <header className="relative sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white/90 px-4 py-4 backdrop-blur sm:justify-between">
        <div className="pr-24 sm:pr-0">
          <p className="text-xs uppercase tracking-widest text-indigo-500">
            Mode Siswa
          </p>
          <h1 className="text-lg font-semibold text-slate-900">
            {student ? student.name : "Menu Scan"}
          </h1>
          {student ? (
            <p className="text-xs text-slate-500">Kelas {student.className}</p>
          ) : (
            <p className="text-xs text-slate-500">
              Gunakan barcode unik Anda untuk melakukan absensi.
            </p>
          )}
        </div>
        <div className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center gap-2 sm:static sm:translate-y-0">
          <ThemeToggle size="sm" />
          {session?.role === "siswa" && (
            <button
              type="button"
              onClick={() => {
                logout();
                router.replace("/login");
              }}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500"
            >
              <LogOut className="h-4 w-4" />
              Keluar
            </button>
          )}
        </div>
      </header>

      <main
        className={cn(
          "flex-1 px-4 py-6 sm:px-6 sm:py-8",
          isScanPage ? "pb-32 sm:pb-8" : ""
        )}
      >
        {children}
      </main>

      {!isScanPage && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 px-6 py-3 backdrop-blur sm:static sm:border-t-0 sm:bg-transparent sm:px-0 sm:py-0">
        <div
          className={cn(
            "mx-auto flex max-w-md items-center sm:hidden",
            visibleNavItems.length === 1 ? "justify-center" : "justify-between"
          )}
        >
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/siswa" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex h-12 w-12 items-center justify-center rounded-full transition",
                  isActive ? "bg-indigo-600 text-white shadow-lg" : "text-slate-500"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="sr-only">{item.label}</span>
                {isActive && (
                  <span className="absolute -top-1 right-3 h-2 w-2 rounded-full bg-white" />
                )}
              </Link>
            );
          })}
        </div>
        <div className="hidden items-center justify-center gap-4 sm:flex">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/siswa" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition",
                  isActive
                    ? "bg-indigo-600 text-white shadow-lg"
                    : "border border-slate-200 text-slate-500 hover:border-indigo-200 hover:text-indigo-600"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
        </nav>
      )}
    </div>
  );
}
