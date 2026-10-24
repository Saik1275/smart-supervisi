"use client";

import { useMemo, useState } from "react";
import { ITEMS, type AssessmentItem } from "../../../lib/instruments";
import { calculateScore } from "../../../lib/scoring";
import { useSupervisi } from "../context";
import { EmptyState, PANEL, RecordsTable } from "../ui";

export function RecapPage() {
  const { data, routerPush, startDraft } = useSupervisi();
  const [search, setSearch] = useState("");
  const [unitFilter, setUnitFilter] = useState("Semua Unit");
  const [scoreFilter, setScoreFilter] = useState("Semua");
  const [activeTab, setActiveTab] = useState<"riwayat" | "analisis">("riwayat");
  const [analysisFilter, setAnalysisFilter] = useState<"semua" | "kritis" | "lemah">("semua");

  // Extract unique units for filter dropdown
  const uniqueUnits = useMemo(() => {
    const set = new Set<string>();
    data.supervisions.forEach((s) => {
      if (s.unit) set.add(s.unit);
    });
    return Array.from(set).sort();
  }, [data.supervisions]);

  // Filtered supervisions
  const filteredRecords = useMemo(() => {
    return data.supervisions.filter((row) => {
      const term = search.trim().toLocaleLowerCase("id-ID");
      const score = calculateScore(row.scores, row.assessment_items.length ? row.assessment_items : ITEMS);
      const matchTerm =
        !term ||
        `${row.unit} ${row.nurse} ${row.supervisor}`.toLocaleLowerCase("id-ID").includes(term);
      const matchUnit = unitFilter === "Semua Unit" || row.unit === unitFilter;
      const matchScore =
        scoreFilter === "Semua" ||
        score.category === scoreFilter ||
        score.priority === scoreFilter ||
        (scoreFilter === "Kritis" && (score.criticalZero || score.criticalOne));

      return matchTerm && matchUnit && matchScore;
    });
  }, [data.supervisions, search, unitFilter, scoreFilter]);

  // Summary Metrics
  const summaryMetrics = useMemo(() => {
    const total = data.supervisions.length;
    if (total === 0) {
      return { total: 0, meanScore: 0, goodCount: 0, moderateCount: 0, lowCount: 0, criticalCount: 0 };
    }

    let sumScore = 0;
    let goodCount = 0;
    let moderateCount = 0;
    let lowCount = 0;
    let criticalCount = 0;

    data.supervisions.forEach((row) => {
      const s = calculateScore(row.scores, row.assessment_items.length ? row.assessment_items : ITEMS);
      sumScore += s.percentage;
      if (s.category === "Baik") goodCount++;
      else if (s.category === "Cukup") moderateCount++;
      else lowCount++;

      if (s.criticalZero || s.criticalOne || s.priority.startsWith("Critical")) {
        criticalCount++;
      }
    });

    return {
      total,
      meanScore: Math.round((sumScore / total) * 10) / 10,
      goodCount,
      moderateCount,
      lowCount,
      criticalCount,
    };
  }, [data.supervisions]);

  // Aggregate item analysis
  const aggregate = useMemo(() => {
    const valuesByTitle = new Map<string, { item: AssessmentItem; scores: Array<0 | 1 | 2> }>();
    for (const supervision of data.supervisions) {
      const items = supervision.assessment_items.length ? supervision.assessment_items : ITEMS;
      for (const item of items) {
        const value = supervision.scores[item.id];
        if (value === undefined || value === "na") continue;
        const key = item.title.trim().toLocaleLowerCase("id-ID");
        const entry = valuesByTitle.get(key) ?? { item, scores: [] };
        entry.scores.push(value);
        valuesByTitle.set(key, entry);
      }
    }
    return [...valuesByTitle.values()].map(({ item, scores }) => {
      const count = scores.length;
      const totalScore = scores.reduce<number>((sum, val) => sum + val, 0);
      const percentage = count ? Math.round((totalScore / (2 * count)) * 100) : null;
      const avgScore = count ? (totalScore / count).toFixed(2) : null;

      return {
        item,
        count,
        avgScore,
        percentage,
      };
    })
      .filter((row): row is typeof row & { percentage: number } => row.percentage !== null)
      .sort((a, b) => a.percentage - b.percentage);
  }, [data.supervisions]);

  // Filtered aggregate for analysis tab
  const filteredAggregate = useMemo(() => {
    return aggregate.filter((row) => {
      if (analysisFilter === "kritis") return row.item.critical;
      if (analysisFilter === "lemah") return row.percentage < 76;
      return true;
    });
  }, [aggregate, analysisFilter]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Rekapitulasi Supervisi Klinis
            </h2>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Audit kepatuhan SPO keperawatan, keselamatan pasien, dan analisis capaian unit.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            title="Cetak atau simpan PDF ringkasan"
          >
            <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Cetak Rekap
          </button>
          <button
            onClick={() => startDraft()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:from-emerald-500 hover:to-teal-500 hover:shadow"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Mulai Supervisi
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Total Supervisi */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>Total Evaluasi</span>
            <span className="rounded-md bg-emerald-500/10 p-1.5 text-emerald-700 dark:text-emerald-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {summaryMetrics.total}
          </div>
          <p className="mt-1 text-xs text-slate-500">Berkas audit tersimpan</p>
        </div>

        {/* Rata-rata Kepatuhan */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>Rerata Kepatuhan</span>
            <span className="rounded-md bg-emerald-500/10 p-1.5 text-emerald-600 dark:text-emerald-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1 text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
            {summaryMetrics.meanScore}
            <span className="text-sm font-semibold text-slate-500">%</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {summaryMetrics.meanScore >= 76 ? "Taraf Kepatuhan Baik" : "Perlu Pembinaan"}
          </p>
        </div>

        {/* Kategori Unggul / Baik */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>Kategori Baik (≥76%)</span>
            <span className="rounded-md bg-teal-500/10 p-1.5 text-teal-600 dark:text-teal-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {summaryMetrics.goodCount}
            <span className="text-xs font-normal text-slate-500">
              {" "}({summaryMetrics.total ? Math.round((summaryMetrics.goodCount / summaryMetrics.total) * 100) : 0}%)
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Memenuhi standar SPO</p>
        </div>

        {/* Temuan Kritis / RTL */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>Perhatian Kritis</span>
            <span className="rounded-md bg-rose-500/10 p-1.5 text-rose-600 dark:text-rose-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
            {summaryMetrics.criticalCount}
          </div>
          <p className="mt-1 text-xs text-slate-500">Skor 0 pada butir keselamatan</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab("riwayat")}
          className={`relative pb-3 text-sm font-semibold transition ${
            activeTab === "riwayat"
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          Daftar Berkas Supervisi ({filteredRecords.length})
          {activeTab === "riwayat" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("analisis")}
          className={`relative pb-3 text-sm font-semibold transition ${
            activeTab === "analisis"
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          Analisis Capaian Butir SPO ({aggregate.length})
          {activeTab === "analisis" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
          )}
        </button>
      </div>

      {/* TAB 1: Riwayat Supervisi */}
      {activeTab === "riwayat" && (
        <section className={PANEL}>
          {/* Filter Bar */}
          <div className="mb-4 grid gap-3 sm:grid-cols-12">
            <div className="relative sm:col-span-5">
              <svg
                className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-xs outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                aria-label="Cari supervisi"
                placeholder="Cari perawat, unit, supervisor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="sm:col-span-3">
              <select
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-700 outline-none transition focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                aria-label="Filter unit ruangan"
                value={unitFilter}
                onChange={(e) => setUnitFilter(e.target.value)}
              >
                <option value="Semua Unit">Semua Unit ({uniqueUnits.length})</option>
                {uniqueUnits.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-4">
              <select
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-700 outline-none transition focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                aria-label="Filter hasil"
                value={scoreFilter}
                onChange={(e) => setScoreFilter(e.target.value)}
              >
                <option value="Semua">Semua Kategori &amp; Prioritas</option>
                <option value="Baik">Kategori: Baik (≥76%)</option>
                <option value="Cukup">Kategori: Cukup (56-75%)</option>
                <option value="Kurang">Kategori: Kurang (&lt;56%)</option>
                <option value="Kritis">⚠️ Temuan Kritis (Critical)</option>
                <option value="Tinggi">Prioritas Tinggi</option>
                <option value="Sedang">Prioritas Sedang</option>
                <option value="Rendah">Prioritas Rendah</option>
              </select>
            </div>
          </div>

          <RecordsTable rows={filteredRecords} onOpen={(row) => routerPush(`/detail/${row.id}`)} />
        </section>
      )}

      {/* TAB 2: Analisis Butir SPO */}
      {activeTab === "analisis" && (
        <section className={`${PANEL} space-y-4`}>
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Analisis Capaian per Butir SPO (Urutan Terendah ke Tertinggi)
              </h3>
              <p className="text-xs text-slate-500">
                Membantu supervisor mengidentifikasi titik lemah keterampilan atau kepatuhan yang memerlukan pelatihan ulang.
              </p>
            </div>

            {/* Filter pills */}
            <div className="flex items-center gap-1.5 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
              <button
                onClick={() => setAnalysisFilter("semua")}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                  analysisFilter === "semua"
                    ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white"
                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
                }`}
              >
                Semua ({aggregate.length})
              </button>
              <button
                onClick={() => setAnalysisFilter("lemah")}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                  analysisFilter === "lemah"
                    ? "bg-amber-500 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
                }`}
              >
                Titik Lemah (&lt;76%)
              </button>
              <button
                onClick={() => setAnalysisFilter("kritis")}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                  analysisFilter === "kritis"
                    ? "bg-rose-500 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
                }`}
              >
                Butir Kritis
              </button>
            </div>
          </div>

          {filteredAggregate.length ? (
            <div className="grid gap-3.5 md:grid-cols-2">
              {filteredAggregate.map(({ item, percentage, avgScore, count }, index) => {
                const isWeak = percentage < 76;
                const isModerate = percentage >= 76 && percentage < 90;
                const barColor = isWeak ? "bg-rose-500" : isModerate ? "bg-amber-500" : "bg-emerald-500";
                const badgeColor = isWeak
                  ? "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300"
                  : isModerate
                    ? "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
                    : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300";

                return (
                  <div
                    key={item.id}
                    className="group relative flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm transition hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
                  >
                    <div>
                      <div className="mb-1.5 flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                            #{index + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {item.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {item.critical && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                              <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              Kritis
                            </span>
                          )}
                          <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${badgeColor}`}>
                            {percentage}%
                          </span>
                        </div>
                      </div>

                      <p className="line-clamp-2 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                        {item.description}
                      </p>
                    </div>

                    <div className="mt-3 pt-2">
                      <div className="mb-1 flex justify-between text-[10px] text-slate-500 dark:text-slate-400">
                        <span>Rata-rata: {avgScore} / 2.0</span>
                        <span>Dinilai {count}x</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState text="Tidak ada data butir untuk filter ini atau belum ada supervisi terekam." />
          )}
        </section>
      )}
    </div>
  );
}
