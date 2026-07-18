"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { href: "/admin/courses", label: "Courses", icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" },
  { href: "/admin/batches", label: "Batches", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
  { href: "/admin/applications", label: "Applications", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
  { href: "/admin/classes", label: "Classes", icon: "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" },
  { href: "/admin/students", label: "Students", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.push("/auth/login");
    }
  }, [isLoading, isAdmin, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-light">
        <div className="w-8 h-8 border-2 border-brand-green/30 border-t-brand-green rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) return null;

  const handleLogout = async () => {
    await logout();
    router.push("/auth/login");
  };

  return (
    <div className="min-h-screen flex bg-bg-light">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 bg-white border-r border-border-light flex flex-col justify-between py-6">
        <div>
          {/* Logo */}
          <div className="px-6 pb-6 border-b border-border-light">
            <Link href="/admin" className="flex items-center gap-2 group no-underline">
              <div className="w-9 h-9 rounded-full bg-brand-green flex items-center justify-center">
                <span className="text-accent-gold text-xs font-bold">P</span>
              </div>
              <div>
                <span className="font-bold text-sm text-text-primary block">Premier</span>
                <span className="text-[10px] text-text-secondary block -mt-0.5">Admin Panel</span>
              </div>
            </Link>
          </div>

          {/* Nav Links */}
          <nav className="px-4 py-6 space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/admin" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors no-underline ${
                    isActive
                      ? "text-brand-green bg-brand-green/5 font-semibold"
                      : "text-text-secondary hover:text-text-primary hover:bg-gray-50"
                  }`}
                >
                  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                  </svg>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Card + Logout */}
        <div className="px-6 border-t border-border-light pt-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-brand-green/10 flex items-center justify-center">
              <span className="text-xs font-bold text-brand-green">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-text-primary truncate m-0">{user?.name}</p>
              <p className="text-[10px] text-text-secondary truncate m-0">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold py-2 rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
