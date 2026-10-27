"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Brand } from "./Brand";
import { useSupervisi } from "./context";

type NavItem = {
  href: string;
  label: string;
  badge?: number;
  icon: (active: boolean) => ReactNode;
};

function activePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/supervisi") return pathname === href || pathname.startsWith("/detail/");
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarNavbar() {
  const pathname = usePathname();
  const { isAdmin, openTasks, setLoginOpen, signOut, busy } = useSupervisi();

  const NAV_ITEMS: NavItem[] = [
    {
      href: "/",
      label: "Beranda",
      icon: (active) => (
        <svg className={`h-5 w-5 ${active ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      href: "/jadwal",
      label: "Agenda & Jadwal",
      icon: (active) => (
        <svg className={`h-5 w-5 ${active ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      href: "/supervisi",
      label: "Lembar Supervisi",
      icon: (active) => (
        <svg className={`h-5 w-5 ${active ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
    },
    {
      href: "/tindak-lanjut",
      label: "Tindak Lanjut (RTL)",
      badge: openTasks.length > 0 ? openTasks.length : undefined,
      icon: (active) => (
        <svg className={`h-5 w-5 ${active ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      href: "/rekap",
      label: "Rekap & Analisis",
      icon: (active) => (
        <svg className={`h-5 w-5 ${active ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      href: "/sop",
      label: "Dokumen SPO & Modul",
      icon: (active) => (
        <svg className={`h-5 w-5 ${active ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
    },
    ...(isAdmin
      ? [
        {
          href: "/perawat",
          label: "Kelola Perawat",
          icon: (active: boolean) => (
            <svg className={`h-5 w-5 ${active ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          ),
        },
      ]
      : []),
  ];

  return (
    <aside className="sticky top-0 z-30 hidden h-screen w-72 shrink-0 flex-col border-r border-slate-200/80 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 lg:flex">
      {/* Brand Header */}
      <div className="p-6 pb-4">
        <Link href="/" className="block focus:outline-none">
          <Brand />
        </Link>
      </div>

      {/* Navigation Menu */}
      <nav aria-label="Navigasi utama" className="flex-1 space-y-1 overflow-y-auto px-4 py-4">
        {NAV_ITEMS.map((item) => {
          const active = activePath(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`group flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all ${active
                ? "bg-emerald-50 text-emerald-900 shadow-sm shadow-emerald-500/5 dark:bg-emerald-950/40 dark:text-emerald-200"
                : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200"
                }`}
            >
              <div className="flex items-center gap-3">
                {item.icon(active)}
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-[10px] font-bold text-white shadow-sm">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Satu Tombol Biasa: Login atau Logout */}
      <div className="border-t border-slate-200/80 p-4 dark:border-slate-800">
        {isAdmin ? (
          <button
            type="button"
            onClick={() => void signOut()}
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50/70 py-2.5 text-xs font-bold text-rose-600 shadow-sm transition hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-400 dark:hover:bg-rose-950/50"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>{busy ? "Memproses…" : "Keluar (Logout)"}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setLoginOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-800 active:scale-[0.98] dark:bg-emerald-600 dark:hover:bg-emerald-500"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            <span>Login Admin</span>
          </button>
        )}
      </div>
    </aside>
  );
}

export function MobileNavbar() {
  const pathname = usePathname();
  const { isAdmin, setLoginOpen, signOut, busy } = useSupervisi();

  const NAV_ITEMS = [
    { href: "/", label: "Beranda", icon: "⌂" },
    { href: "/supervisi", label: "Supervisi", icon: "📋" },
    { href: "/tindak-lanjut", label: "RTL", icon: "✓" },
    { href: "/rekap", label: "Rekap", icon: "📊" },
    { href: "/jadwal", label: "Jadwal", icon: "📅" },
    { href: "/sop", label: "SPO", icon: "📖" },
    ...(isAdmin ? [{ href: "/perawat", label: "Perawat", icon: "👥" }] : []),
  ];

  return (
    <nav
      aria-label="Navigasi seluler"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/95 px-1 py-1 shadow-lg backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 lg:hidden"
    >
      <div className="flex items-center justify-around gap-0.5 overflow-x-auto no-scrollbar">
        {NAV_ITEMS.map((item) => {
          const active = activePath(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex flex-1 min-w-[46px] max-w-[62px] flex-col items-center justify-center rounded-xl py-1 text-[10px] font-semibold transition ${active
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 font-bold"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
            >
              <span className="text-base leading-none mb-0.5">{item.icon}</span>
              <span className="truncate max-w-[46px]">{item.label}</span>
            </Link>
          );
        })}

        {/* Mobile: Satu tombol biasa Login / Logout */}
        {isAdmin ? (
          <button
            type="button"
            onClick={() => void signOut()}
            disabled={busy}
            title="Keluar"
            className="flex flex-1 min-w-[46px] max-w-[62px] flex-col items-center justify-center rounded-xl py-1 text-[10px] font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
          >
            <span className="text-base leading-none mb-0.5">🚪</span>
            <span className="truncate max-w-[46px]">{busy ? "…" : "Keluar"}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setLoginOpen(true)}
            title="Login Admin"
            className="flex flex-1 min-w-[46px] max-w-[62px] flex-col items-center justify-center rounded-xl py-1 text-[10px] font-bold text-emerald-700 transition hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-950/40"
          >
            <span className="text-base leading-none mb-0.5">🔐</span>
            <span className="truncate max-w-[46px]">Login</span>
          </button>
        )}
      </div>
    </nav>
  );
}
