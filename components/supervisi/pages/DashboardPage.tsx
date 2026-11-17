"use client";

import { useSupervisi } from "../context";
import { PANEL, RecordsTable } from "../ui";

export function DashboardPage() {
  const {
    data,
    isAdmin,
    meanScore,
    openTasks,
    overdueTasks,
    criticalCount,
    routerPush,
  } = useSupervisi();

  const recent = data.supervisions.slice(0, 5);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Hero Welcome Banner */}
      <div className="relative min-w-0 overflow-hidden rounded-3xl bg-gradient-to-br from-teal-800 via-teal-700 to-cyan-800 p-5 text-white shadow-lg shadow-teal-900/15 sm:p-8">
        <div className="relative z-10 flex min-w-0 flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div className="min-w-0 max-w-2xl">
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              Dashboard Supervisi Klinis Keperawatan
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-teal-50/90 sm:text-base">
              Pemantauan kepatuhan SPO, audit keselamatan pasien, dan tindak lanjut perbaikan mutu klinis RS Semen Gresik.
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-3">
            {isAdmin ? (
              <button
                type="button"
                onClick={() => routerPush("/supervisi")}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-teal-900 shadow-md transition hover:bg-teal-50 active:scale-95"
              >
                <span>Mulai Supervisi Baru</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => routerPush("/sop")}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-teal-900 shadow-md transition hover:bg-teal-50 active:scale-95"
              >
                <span>Pelajari Dokumen SPO</span>
              </button>
            )}
          </div>
        </div>
        <div className="pointer-events-none absolute -bottom-16 -right-10 h-56 w-56 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -top-16 -left-10 h-56 w-56 rounded-full bg-teal-300/20 blur-3xl" />
      </div>

      {/* KPI Statistic Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Card 1: Total Supervisi */}
        <div className={`${PANEL} flex min-w-0 flex-col justify-between`}>
          <div className="flex items-start justify-between gap-3">
            <span className="min-w-0 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Total Supervisi
            </span>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-950/50 dark:text-teal-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
          <div className="mt-3">
            <p className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {data.supervisions.length}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Sesi observasi klinis terekam
            </p>
          </div>
        </div>

        {/* Card 2: Rerata Kepatuhan */}
        <div className={`${PANEL} flex min-w-0 flex-col justify-between`}>
          <div className="flex items-start justify-between gap-3">
            <span className="min-w-0 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Rerata Kepatuhan
            </span>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
          <div className="mt-3">
            <div className="min-w-0">
              <p className="text-3xl font-extrabold text-slate-900 dark:text-white">
                {meanScore}%
              </p>
              <span className={`mt-1 block text-xs font-bold ${meanScore >= 76 ? "text-teal-700" : meanScore >= 56 ? "text-amber-600" : "text-rose-600"}`}>
                {meanScore >= 76 ? "Baik — target tercapai" : meanScore >= 56 ? "Cukup" : "Perlu peningkatan"}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Standar mutu target RS: ≥76%
            </p>
          </div>
        </div>

        {/* Card 3: Temuan RTL Terbuka */}
        <div className={`${PANEL} flex min-w-0 flex-col justify-between`}>
          <div className="flex items-start justify-between gap-3">
            <span className="min-w-0 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Temuan RTL Terbuka
            </span>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <div className="mt-3">
            <p className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {openTasks.length}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              RTL dalam proses pembinaan
            </p>
          </div>
        </div>

        {/* Card 4: Lewat Batas Waktu */}
        <div className={`${PANEL} flex min-w-0 flex-col justify-between`}>
          <div className="flex items-start justify-between gap-3">
            <span className="min-w-0 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Lewat Batas Waktu
            </span>
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${overdueTasks.length > 0 ? "bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"}`}>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-3">
            <p className={`text-3xl font-extrabold ${overdueTasks.length > 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-900 dark:text-white"}`}>
              {overdueTasks.length}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {overdueTasks.length > 0 ? "Memerlukan intervensi segera" : "Semua RTL tepat waktu"}
            </p>
          </div>
        </div>
      </div>

      {/* Critical Patient Safety Warning Alert */}
      {criticalCount > 0 && (
        <div className="flex min-w-0 flex-col items-start gap-4 rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-sm text-rose-950 shadow-sm sm:flex-row dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-white">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-bold text-rose-900 dark:text-rose-100">
              Perhatian Khusus Patient Safety: {criticalCount} Supervisi Mengandung Skor Item Kritis 0
            </h4>
            <p className="mt-1 text-xs text-rose-800 dark:text-rose-300">
              Ditemukan ketidakpatuhan pada tahapan kritis (misal: verifikasi identitas, hand hygiene, atau desinfeksi). Segera lakukan tindak lanjut dan re-supervisi ulang dalam 3 hari.
            </p>
          </div>
          <button
            onClick={() => routerPush("/tindak-lanjut")}
            className="shrink-0 rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-bold text-white shadow transition hover:bg-rose-700"
          >
            Tinjau Temuan →
          </button>
        </div>
      )}

      {/* Alur Closed-Loop Supervisi Keperawatan */}
      <section className={`${PANEL} space-y-4`}>
        <div className="flex min-w-0 flex-col justify-between gap-2 sm:flex-row sm:items-start">
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Alur Closed-Loop Supervisi Keperawatan
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Siklus 10 tahap pembinaan klinis suportif untuk peningkatan mutu berkelanjutan (Continuous Quality Improvement).
            </p>
          </div>
          <button
            className="shrink-0 text-xs font-bold text-teal-700 hover:underline dark:text-teal-400"
            onClick={() => routerPush("/rekap")}
          >
            Lihat Analisis Mutu →
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
          {[
            { step: "01", name: "SPO Standar", desc: "Pedoman klinis" },
            { step: "02", name: "Observasi", desc: "Observasi langsung" },
            { step: "03", name: "Scoring", desc: "Penilaian 0/1/2" },
            { step: "04", name: "Masalah", desc: "Identifikasi gap" },
            { step: "05", name: "Penyebab", desc: "Analisis faktor" },
            { step: "06", name: "Feedback", desc: "Model FAIR" },
            { step: "07", name: "Intervensi", desc: "Aksi perbaikan" },
            { step: "08", name: "RTL", desc: "Target & PIC" },
            { step: "09", name: "Follow Up", desc: "Pemantauan" },
            { step: "10", name: "Re-supervisi", desc: "Evaluasi tuntas" },
          ].map((item, index) => (
            <div
              key={item.step}
              className="relative min-w-0 overflow-hidden rounded-2xl border border-teal-100/80 bg-teal-50/40 p-3 text-center transition-all hover:border-teal-400 hover:bg-white hover:shadow-sm dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-teal-700"
            >
              <span className="block text-[10px] font-extrabold uppercase tracking-wider text-teal-700 dark:text-teal-400">
                Tahap {index + 1}
              </span>
              <span className="mt-1 block truncate text-xs font-bold text-slate-900 dark:text-white">
                {item.name}
              </span>
              <span className="mt-0.5 block text-[10px] leading-snug text-slate-500 dark:text-slate-400">
                {item.desc}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Supervisi Terbaru Section */}
      <section className={`${PANEL} space-y-4`}>
        <div className="flex min-w-0 flex-col justify-between gap-2 sm:flex-row sm:items-start">
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Catatan Supervisi Klinis Terbaru
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              5 sesi supervisi terkini yang telah dilaksanakan dan terdokumentasi.
            </p>
          </div>
          <button
            className="shrink-0 text-xs font-bold text-teal-700 hover:underline dark:text-teal-400"
            onClick={() => routerPush("/rekap")}
          >
            Buka Semua Rekapitulasi →
          </button>
        </div>

        <RecordsTable rows={recent} onOpen={(row) => routerPush(`/detail/${row.id}`)} />
      </section>
    </div>
  );
}
