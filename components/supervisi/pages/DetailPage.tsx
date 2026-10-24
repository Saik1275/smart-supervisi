"use client";

import { useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSupervisi } from "../context";
import { getSupabaseBrowserClient } from "../../../lib/supabase/browser";
import { ITEMS, type AssessmentItem } from "../../../lib/instruments";
import { calculateScore, formatDate } from "../../../lib/scoring";
import { EmptyState, PANEL, ScoreSummary, StatusPill } from "../ui";

export function DetailPage({ id }: { id: string }) {
  const router = useRouter();
  const { data, isAdmin, startDraft, setError, setNotice, refreshData } = useSupervisi();
  const detail = data.supervisions.find((row) => row.id === id);
  const supabase = getSupabaseBrowserClient();

  const scoreResult = useMemo(() => {
    if (!detail) return null;
    return calculateScore(detail.scores, detail.assessment_items.length ? detail.assessment_items : ITEMS);
  }, [detail]);

  // Root cause 6M factors that were checked
  const activeCauses = useMemo(() => {
    if (!detail?.causes) return [];
    return Object.entries(detail.causes)
      .filter(([, val]) => val.on)
      .map(([key, val]) => ({ factor: key, note: val.note }));
  }, [detail]);

  async function deleteSupervision() {
    if (
      !supabase ||
      !detail ||
      !isAdmin ||
      !window.confirm("Hapus permanen lembar supervisi ini beserta seluruh data RTL terkait?")
    ) {
      return;
    }
    const { error } = await supabase.from("supervisions").delete().eq("id", detail.id);
    if (error) {
      setError(`Supervisi gagal dihapus: ${error.message}`);
    } else {
      setNotice("Supervisi dan RTL terkait berhasil dihapus.");
      await refreshData();
      router.push("/rekap");
    }
  }

  if (!detail) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => router.push("/rekap")}
          className="text-xs font-semibold text-emerald-600 hover:underline dark:text-emerald-400"
        >
          ← Kembali ke Rekapitulasi
        </button>
        <EmptyState text="Berkas hasil supervisi tidak ditemukan atau telah dihapus." />
      </div>
    );
  }

  const renderItemRow = (item: AssessmentItem) => {
    const score = detail.scores[item.id];
    if (score === undefined) return null;

    const scorePill =
      score === 2 ? (
        <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
          <svg className="h-3.5 w-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          Skor 2 (Sesuai SPO)
        </span>
      ) : score === 1 ? (
        <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
          <svg className="h-3.5 w-3.5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Skor 1 (Kurang Sempurna)
        </span>
      ) : score === 0 ? (
        <span className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
          <svg className="h-3.5 w-3.5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Skor 0 (Tidak Dilakukan)
        </span>
      ) : (
        <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
          N/A (Tidak Relevan)
        </span>
      );

    return (
      <div
        key={item.id}
        className="flex flex-col justify-between gap-2 border-b border-slate-100 py-3 last:border-0 sm:flex-row sm:items-center dark:border-slate-800"
      >
        <div className="space-y-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              {item.title}
            </span>
            {item.critical && (
              <span className="inline-flex items-center gap-0.5 rounded-md bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-700 dark:bg-rose-950/70 dark:text-rose-300">
                <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Poin Kritis Patient Safety
              </span>
            )}
          </div>
          <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
            {item.description}
          </p>
        </div>
        <div className="shrink-0">{scorePill}</div>
      </div>
    );
  };

  return (
    <div className="printable-report space-y-6">
      {/* Top Bar with Navigation & Actions */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <button
            onClick={() => router.push("/rekap")}
            className="no-print mb-1 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:underline dark:text-emerald-400"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Kembali ke Rekapitulasi
          </button>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Lembar Hasil Supervisi Klinis
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Audit kepatuhan pelaksanaan tindakan keperawatan dan rencana tindak lanjut
          </p>
        </div>

        <div className="no-print flex flex-wrap items-center gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            title="Cetak lembar audit atau simpan PDF"
          >
            <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Cetak / Simpan PDF
          </button>

          {isAdmin && (
            <>
              <button
                onClick={() =>
                  startDraft({
                    unit: detail.unit,
                    nurse_id: detail.nurse_id,
                    module_id: detail.module_id,
                    assessment_items: detail.assessment_items,
                    parent_id: detail.id,
                  })
                }
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:from-emerald-500 hover:to-teal-500"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Re-Supervisi Ulang
              </button>

              <button
                onClick={() => void deleteSupervision()}
                className="inline-flex items-center gap-1 rounded-xl border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 dark:border-rose-900/60 dark:text-rose-400 dark:hover:bg-rose-950/40"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Hapus
              </button>
            </>
          )}
        </div>
      </div>

      {/* Clinical Meta Card */}
      <div className="grid grid-cols-2 gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:grid-cols-5 dark:border-slate-800 dark:bg-slate-900">
        <div>
          <span className="text-[11px] font-medium text-slate-400">SOP / Modul Supervisi</span>
          <div className="mt-0.5 text-sm font-bold text-slate-900 dark:text-white">
            {detail.module_title || "Tidak tersedia"}
          </div>
        </div>
        <div>
          <span className="text-[11px] font-medium text-slate-400">Unit / Ruangan</span>
          <div className="mt-0.5 text-sm font-bold text-slate-900 dark:text-white">
            {detail.unit}
          </div>
        </div>
        <div>
          <span className="text-[11px] font-medium text-slate-400">Perawat Dinilai</span>
          <div className="mt-0.5 text-sm font-bold text-slate-900 dark:text-white">
            {detail.nurse}
          </div>
        </div>
        <div>
          <span className="text-[11px] font-medium text-slate-400">Supervisor</span>
          <div className="mt-0.5 text-sm font-bold text-slate-900 dark:text-white">
            {detail.supervisor || "Supervisor Keperawatan"}
          </div>
        </div>
        <div>
          <span className="text-[11px] font-medium text-slate-400">Tanggal Observasi</span>
          <div className="mt-0.5 text-sm font-bold text-slate-900 dark:text-white">
            {formatDate(detail.date)}
          </div>
        </div>
      </div>

      {/* Gauge and Score Summary */}
      <ScoreSummary
        scores={detail.scores}
        items={detail.assessment_items.length ? detail.assessment_items : ITEMS}
      />

      {/* Rincian Butir Penilaian Grouped */}
      <section className={`${PANEL} space-y-4`}>
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Rincian Lembar Observasi Tindakan
            </h3>
            <p className="text-xs text-slate-500">
              Evaluasi kepatuhan butir per butir standar operasional prosedur keperawatan.
            </p>
          </div>
          {scoreResult && (
            <div className="text-right">
              <span className="text-xs font-semibold text-slate-500">
                {scoreResult.count} dari {(detail.assessment_items.length ? detail.assessment_items : ITEMS).length} butir dinilai
              </span>
            </div>
          )}
        </div>

        <div className="divide-y divide-slate-100 px-1 dark:divide-slate-800">
          {(detail.assessment_items.length ? detail.assessment_items : ITEMS).map((item) => renderItemRow(item))}
        </div>
      </section>

      {/* Kesimpulan Klinis & Analisis Risiko */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Praktik Sesuai Standar
          </div>
          <p className="mt-2 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
            {detail.conclusion.ok || "Tidak ada catatan khusus."}
          </p>
        </div>

        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/40 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Penyimpangan / Masalah Ditemukan
          </div>
          <p className="mt-2 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
            {detail.conclusion.masalah || "Seluruh butir berjalan sesuai standar."}
          </p>
        </div>

        <div className="rounded-2xl border border-rose-200/80 bg-rose-50/40 p-4 dark:border-rose-900/40 dark:bg-rose-950/20">
          <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800 dark:text-rose-300">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Potensi Risiko Bagi Pasien
          </div>
          <p className="mt-2 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
            {detail.conclusion.risiko || "Risiko keselamatan terkendali."}
          </p>
        </div>
      </div>

      {/* Akar Masalah & Intervensi Terpilih */}
      {(activeCauses.length > 0 || (detail.interventions && detail.interventions.length > 0)) && (
        <div className="grid gap-4 md:grid-cols-2">
          {/* 6M Root Causes */}
          <section className={`${PANEL} space-y-3`}>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Identifikasi Faktor Penyebab (Analisis 6M)
            </h3>
            {activeCauses.length > 0 ? (
              <div className="space-y-2">
                {activeCauses.map(({ factor, note }) => (
                  <div
                    key={factor}
                    className="rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-xs dark:border-slate-800 dark:bg-slate-950"
                  >
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">
                      Faktor {factor}
                    </span>
                    {note && <p className="mt-0.5 text-slate-600 dark:text-slate-400">{note}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">Tidak ada faktor kendala khusus.</p>
            )}
          </section>

          {/* Intervensi Supervisi */}
          <section className={`${PANEL} space-y-3`}>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Metode Pembinaan &amp; Intervensi Terpilih
            </h3>
            {detail.interventions && detail.interventions.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {detail.interventions.map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center rounded-lg bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-800 dark:bg-teal-950/60 dark:text-teal-300"
                  >
                    ✓ {item}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">Tidak ada intervensi tambahan.</p>
            )}
          </section>
        </div>
      )}

      {/* Umpan Balik Metode FAIR */}
      <section className={`${PANEL} space-y-3`}>
        <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Umpan Balik Konstruktif (FAIR Feedback Model)
            </h3>
            <p className="text-xs text-slate-500">
              Kerangka komunikasi dua arah antara supervisor dan perawat yang disupervisi.
            </p>
          </div>
          {detail.fair.review && (
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              📅 Target Evaluasi Ulang: {formatDate(detail.fair.review)}
            </span>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-950">
            <span className="font-extrabold text-emerald-800 dark:text-emerald-300">F - Fact (Fakta)</span>
            <p className="mt-1 leading-relaxed text-slate-600 dark:text-slate-400">
              {detail.fair.F || "-"}
            </p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-950">
            <span className="font-extrabold text-amber-700 dark:text-amber-400">A - Analysis (Analisis)</span>
            <p className="mt-1 leading-relaxed text-slate-600 dark:text-slate-400">
              {detail.fair.A || "-"}
            </p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-950">
            <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
              I - Improvement (Solusi)
            </span>
            <p className="mt-1 leading-relaxed text-slate-600 dark:text-slate-400">
              {detail.fair.I || "-"}
            </p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-950">
            <span className="font-extrabold text-teal-700 dark:text-teal-300">
              R - Result &amp; Review
            </span>
            <p className="mt-1 leading-relaxed text-slate-600 dark:text-slate-400">
              {detail.fair.R || "-"}
            </p>
          </div>
        </div>

        {(detail.fair.signatureName || detail.fair.signatureData) && (
          <div className="ml-auto mt-5 w-full max-w-xs border-t border-slate-300 pt-3 text-center">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">Tanda Tangan</p>
            <div className="flex h-24 items-center justify-center">
              {detail.fair.signatureMode === "type" ? (
                <span className="font-serif text-2xl italic text-slate-900 dark:text-white">
                  {detail.fair.signatureName}
                </span>
              ) : detail.fair.signatureData ? (
                <Image
                  src={detail.fair.signatureData}
                  alt={`Tanda tangan ${detail.fair.signatureName ?? ""}`}
                  width={600}
                  height={150}
                  unoptimized
                  className="max-h-24 max-w-full object-contain"
                />
              ) : null}
            </div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              {detail.fair.signatureName}
            </p>
          </div>
        )}
      </section>

      {/* Rencana Tindak Lanjut (RTL) */}
      <section className={`${PANEL} space-y-3`}>
        <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Rencana Tindak Lanjut Terkait (RTL)
            </h3>
            <p className="text-xs text-slate-500">
              Komitmen perbaikan mutu dan monitoring tindak lanjut.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {detail.follow_ups.length} Agenda RTL
          </span>
        </div>

        {detail.follow_ups.length ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {detail.follow_ups.map((row) => (
              <div
                key={row.id}
                className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      {row.problem}
                    </h4>
                    <StatusPill>{row.status}</StatusPill>
                  </div>
                  {row.intervention && (
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                      💡 <b>Intervensi:</b> {row.intervention}
                    </p>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] text-slate-500 dark:border-slate-800">
                  <span>PIC: <b>{row.pic || "-"}</b></span>
                  <span>Tenggat: <b>{formatDate(row.due_date)}</b></span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500">Tidak ada agenda tindak lanjut untuk supervisi ini.</p>
        )}
      </section>
    </div>
  );
}
