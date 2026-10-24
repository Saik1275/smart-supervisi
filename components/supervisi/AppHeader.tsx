"use client";

import { useSupervisi } from "./context";
import { formatDate } from "../../lib/scoring";

export function AppHeader() {
  const { isAdmin, user, currentDate } = useSupervisi();

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 sm:px-6 lg:px-8">
      {/* Left: Department & System Header */}
      <div className="flex items-center gap-2.5">
        <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-600 dark:bg-emerald-500" />
        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 sm:text-sm">
          Sistem Pemantauan Keselamatan Pasien
        </span>
      </div>

      {/* Right: Date and Role Profile Card */}
      <div className="flex items-center gap-3">
        {/* Date indicator */}
        <div className="hidden items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50/80 px-3 py-1 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300 sm:flex">
          <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="font-medium">{formatDate(currentDate)}</span>
        </div>

        {/* User / Access Role Profile Card */}
        <div className="flex items-center gap-2.5">
          <div className="hidden text-right sm:block">
            <div className="flex items-center justify-end gap-1.5">
              <span className={`h-2 w-2 rounded-full ${isAdmin ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
              <p className="truncate text-xs font-bold text-slate-900 dark:text-white">
                {isAdmin ? user?.email || "Administrator" : "Mode Baca Perawat"}
              </p>
            </div>
            <p className="truncate text-[10px] font-medium text-slate-500 dark:text-slate-400">
              {isAdmin ? "Hak Akses Penuh (Admin)" : "Akses Publik (Read-only)"}
            </p>
          </div>
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold shadow-2xs ${
              isAdmin
                ? "bg-emerald-700 text-white"
                : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200"
            }`}
          >
            {isAdmin ? "ADM" : "PER"}
          </div>
        </div>
      </div>
    </header>
  );
}
