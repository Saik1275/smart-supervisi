"use client";

import { useState } from "react";
import Link from "next/link";
import { useSupervisi } from "../context";
import { Brand } from "../Brand";
import { BUTTON, CONTROL, PANEL } from "../ui";

export function LoginPage() {
  const { isAdmin, user, busy, signIn, signOut } = useSupervisi();
  const [email, setEmail] = useState("admin@supervisi.com");
  const [password, setPassword] = useState("adminsupervisi123");

  if (isAdmin) {
    return (
      <div className="mx-auto max-w-xl py-12">
        <div className={`${PANEL} p-8 text-center`}>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Sesi Aktif
          </span>
          <h1 className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">Anda Telah Masuk</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Terautentikasi sebagai <strong className="text-slate-800 dark:text-slate-200">{user?.email || "Administrator"}</strong> dengan hak akses penuh supervisi.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/supervisi"
              className={`${BUTTON} inline-flex items-center justify-center gap-2`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <span>Lembar Supervisi</span>
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              Kembali ke Beranda
            </Link>
            <button
              onClick={() => void signOut()}
              disabled={busy}
              className="inline-flex items-center justify-center rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-xs font-bold text-rose-600 shadow-sm transition hover:bg-rose-50 dark:border-rose-900/60 dark:bg-slate-800 dark:text-rose-400 dark:hover:bg-rose-950/30"
            >
              {busy ? "Memproses…" : "Keluar (Logout)"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md py-8">
      <div className={`${PANEL} overflow-hidden p-6 sm:p-8`}>
        {/* Header */}
        <div className="text-center">
          <div className="mb-4 inline-flex items-center justify-center">
            <Brand compact />
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white sm:text-2xl">
            Login Administrator
          </h1>
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
            Masuk untuk mengisi lembar supervisi, menindaklanjuti RTL, dan mengelola perawat di RS Semen Gresik.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={(e) => void signIn(e)} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300" htmlFor="login-email">
              Email Administrator
            </label>
            <input
              id="login-email"
              name="email"
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`${CONTROL} mt-1.5`}
              placeholder="admin@supervisi.com"
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300" htmlFor="login-password">
                Password
              </label>
            </div>
            <input
              id="login-password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${CONTROL} mt-1.5`}
              placeholder="••••••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={busy}
            className={`${BUTTON} mt-2 w-full justify-center py-3 text-sm`}
          >
            {busy ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Memverifikasi akun…</span>
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                <span>Masuk sebagai Administrator</span>
              </span>
            )}
          </button>
        </form>

        {/* Back Link */}
        <div className="mt-6 border-t border-slate-200/80 pt-4 text-center dark:border-slate-800">
          <Link
            href="/"
            className="text-xs font-semibold text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400"
          >
            ← Kembali ke Beranda (Mode Tamu)
          </Link>
        </div>
      </div>
    </div>
  );
}
