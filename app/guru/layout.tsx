"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  LogOut,
  MessageSquare,
  QrCode,
  Users,
  BookOpen,
  Home,
  ListChecks,
  ShieldCheck,
} from "lucide-react";
import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";

const baseNavItems = [
  { href: "/guru/dashboard", label: "Dashboard", icon: Home },
  { href: "/guru/status", label: "Status Harian", icon: ListChecks },
  { href: "/guru/siswa", label: "Data Siswa", icon: Users },
  { href: "/guru/barcode", label: "QR Siswa", icon: QrCode },
  { href: "/guru/rekap", label: "Rekap Bulanan", icon: BarChart3 },
  { href: "/guru/forum", label: "Forum", icon: MessageSquare },
];

const baseMobileNav = [
  { href: "/guru/dashboard", label: "Home", icon: Home },
  { href: "/guru/status", label: "Status", icon: ListChecks },
  { href: "/guru/siswa", label: "Siswa", icon: Users },
  { href: "/guru/barcode", label: "QR", icon: QrCode },
  { href: "/guru/rekap", label: "Rekap", icon: BarChart3 },
  { href: "/guru/forum", label: "Forum", icon: MessageSquare },
];

export default function GuruLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { session, hydrated, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isSuperAdmin = session?.role === "superadmin";
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const guruName =
    session && (session.role === "guru" || session.role === "superadmin")
      ? session.name
      : "Guru / Admin";
  const guruEmail =
    session && (session.role === "guru" || session.role === "superadmin")
      ? session.email
      : "guru@example.com";
  const guruInitials =
    session && (session.role === "guru" || session.role === "superadmin")
      ? session.name
          .split(" ")
          .map((part) => part.charAt(0))
          .join("")
          .slice(0, 2)
          .toUpperCase()
      : "GA";

  const navItems = useMemo(() => {
    if (isSuperAdmin) {
      return [
        ...baseNavItems,
        { href: "/guru/accounts", label: "Kelola Akun Guru", icon: ShieldCheck },
      ];
    }
    return baseNavItems;
  }, [isSuperAdmin]);

  const mobileNav = useMemo(() => {
    if (isSuperAdmin) {
      return [
        ...baseMobileNav,
        { href: "/guru/accounts", label: "Akun", icon: ShieldCheck },
      ];
    }
    return baseMobileNav;
  }, [isSuperAdmin]);

  useEffect(() => {
    if (!hydrated) return;
    if (
      session?.role !== "guru" &&
      session?.role !== "superadmin"
    ) {
      router.replace("/login");
    }
  }, [hydrated, session, router]);

  useEffect(() => {
    startTransition(() => setIsProfileMenuOpen(false));
  }, [pathname]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (typeof window === "undefined") return;
      if (window.innerWidth >= 768) {
        setIsProfileMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  if (
    !hydrated ||
    (session?.role !== "guru" && session?.role !== "superadmin")
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="rounded-2xl border border-slate-200 bg-white px-8 py-12 text-center shadow-sm">
          <p className="text-lg font-medium text-slate-600">Memuat dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 text-slate-800">
      <aside className="hidden h-full w-72 flex-col overflow-y-auto border-r border-slate-200 bg-white px-6 py-8 md:flex">
        <div className="mb-10 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-lg font-semibold text-indigo-600">
            AB
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Absensi Barcode
            </p>
            <span className="text-xs text-slate-500">
              Mode {isSuperAdmin ? "Super Admin" : "Guru / Admin"}
            </span>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition hover:bg-indigo-50 hover:text-indigo-600",
                  isActive && "bg-indigo-100 text-indigo-600 shadow-sm"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-10 space-y-3">
          <div className="rounded-xl bg-slate-100 p-4 text-xs text-slate-500">
            Gunakan menu ini untuk memantau kehadiran harian, edit data siswa
            serta berkomunikasi dengan orang tua.
          </div>
          <button
            type="button"
            onClick={() => {
              logout();
              router.replace("/login");
            }}
            className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            <span className="inline-flex items-center gap-2">
              <LogOut className="h-5 w-5" />
              Keluar
            </span>
            <BookOpen className="h-5 w-5" />
          </button>
        </div>
      </aside>

      <div className="flex h-full flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-slate-200 bg-white/85 px-4 py-3 backdrop-blur md:px-8">
          <div>
            <p className="text-xs uppercase tracking-widest text-indigo-500">
              {isSuperAdmin ? "Super Admin" : "Guru / Admin"}
            </p>
            <h1 className="text-lg font-semibold text-slate-900">
              {navItems.find((item) => pathname.startsWith(item.href))?.label ??
                "Dashboard"}
            </h1>
          </div>
          <div
            ref={profileRef}
            className="relative flex items-center gap-2 md:gap-3"
          >
            <div className="hidden md:block">
              <ThemeToggle />
            </div>
            <div className="md:hidden">
              <ThemeToggle size="sm" />
            </div>
            <div className="hidden flex-col text-right text-xs text-slate-500 sm:flex">
              <span className="font-medium text-slate-700">
                {guruName}
              </span>
              <span>{guruEmail}</span>
            </div>
            <button
              type="button"
              onClick={() => setIsProfileMenuOpen((prev) => !prev)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-300 md:hidden"
              aria-haspopup="true"
              aria-expanded={isProfileMenuOpen}
            >
              {guruInitials || "GA"}
            </button>
            <span className="hidden h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white md:flex">
              {guruInitials || "GA"}
            </span>
            {isProfileMenuOpen && (
              <div className="absolute right-0 top-12 z-40 w-44 rounded-xl border border-slate-200 bg-white p-2 shadow-xl md:hidden">
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    logout();
                    router.replace("/login");
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-red-50 hover:text-red-600"
                >
                  <LogOut className="h-4 w-4" />
                  Keluar
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-6 pb-24 md:px-8 md:py-8 md:pb-8">
          {children}
        </main>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-slate-200 bg-white/95 px-4 py-2 backdrop-blur md:hidden">
        {mobileNav.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 rounded-full px-3 py-1 text-xs font-medium",
                isActive ? "text-indigo-600" : "text-slate-500"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "fill-indigo-100")} />
              <span className="text-[10px] uppercase tracking-widest">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
