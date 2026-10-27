"use client";

import { Suspense } from "react";
import type { ReactNode } from "react";
import { useSupervisi } from "./context";
import { SidebarNavbar, MobileNavbar } from "./Navbar";
import { AppHeader } from "./AppHeader";
import { BUTTON, CONTROL } from "./ui";

export function AppShell({ children }: { children: ReactNode }) {
  const {
    configured,
    loading,
    busy,
    error,
    notice,
    setError,
    setNotice,
    data,
    loginOpen,
    setLoginOpen,
    signIn,
    reload,
  } = useSupervisi();

  if (!configured) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 p-5 text-slate-900">
        <section className="max-w-xl rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
          <div className="mb-3 text-sm font-bold uppercase tracking-widest text-emerald-700">SMART-SUPERVISI</div>
          <h1 className="text-2xl font-bold">Konfigurasi Supabase diperlukan</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">Buat file <code className="rounded bg-slate-100 px-1">.env.local</code> dari <code className="rounded bg-slate-100 px-1">.env.example</code>, isi URL project dan anon key Supabase Anda, jalankan migrasi SQL, lalu muat ulang halaman. Data operasional tidak diganti dengan data demo.</p>
        </section>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-50">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <Suspense fallback={<aside aria-hidden="true" className="hidden w-72 shrink-0 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 lg:block" />}>
          <SidebarNavbar />
        </Suspense>
        <div className="min-w-0 flex-1">
          <AppHeader />
          <main className="min-w-0 flex-1 pb-24 lg:pb-8">
            <div className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:p-8">
              {(error || (loading && !data.supervisions.length)) && error && (
                <div role="alert" className="mb-4 flex items-start justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200">
                  <div><span>{error}</span>{!loading && !data.supervisions.length && <button className="ml-3 font-bold underline" onClick={() => void reload()}>Coba lagi</button>}</div>
                  <button aria-label="Tutup pesan" onClick={() => setError("")}>×</button>
                </div>
              )}
              {notice && (
                <div role="status" className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
                  <span>{notice}</span>
                  <button aria-label="Tutup notifikasi" onClick={() => setNotice("")}>×</button>
                </div>
              )}
              {loading && !data.supervisions.length && (
                <div className="mb-4 flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 text-xs font-medium text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent dark:border-emerald-400" />
                  <span>Memuat data supervisi dari database…</span>
                </div>
              )}
              {children}
            </div>
          </main>
        </div>
        <Suspense fallback={<nav aria-hidden="true" className="fixed inset-x-0 bottom-0 z-20 h-16 border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 lg:hidden" />}>
          <MobileNavbar />
        </Suspense>
      </div>
      {loginOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4" role="dialog" aria-modal="true" aria-labelledby="admin-login-title">
        <form onSubmit={(event) => void signIn(event)} className="w-full max-w-md space-y-4 rounded-3xl border border-slate-700 bg-slate-900 p-7 text-white shadow-2xl">
          <div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-widest text-emerald-300">SMART-SUPERVISI</p><h2 id="admin-login-title" className="mt-1 text-xl font-bold">Login Administrator</h2></div><button type="button" aria-label="Tutup" className="text-2xl text-slate-400" onClick={() => setLoginOpen(false)}>×</button></div>
          <p className="text-xs text-slate-300">Masukkan akun administrator sistem SMART-SUPERVISI.</p>
          <label className="block text-xs font-bold text-slate-200">Email<input className={`${CONTROL} mt-1`} name="email" type="email" required autoComplete="username" defaultValue="admin@supervisi.com" /></label>
          <label className="block text-xs font-bold text-slate-200">Password<input className={`${CONTROL} mt-1`} name="password" type="password" required autoComplete="new-password" /></label>
          <button className={`${BUTTON} w-full mt-2`} disabled={busy}>{busy ? "Memverifikasi…" : "Masuk sebagai Admin"}</button>
        </form>
      </div>}
    </div>
  );
}
