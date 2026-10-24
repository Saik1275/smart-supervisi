"use client";

import type { ReactNode } from "react";
import { calculateScore, formatDate, type Scores } from "../../lib/scoring";
import { ITEMS, type AssessmentItem } from "../../lib/instruments";
import type { Supervision } from "./context";

export const PANEL =
  "rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 transition-all";

export const CONTROL =
  "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-2xs outline-none transition-all placeholder:text-slate-400 focus:border-emerald-600 focus:ring-3 focus:ring-emerald-600/15 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/20";

export const BUTTON =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition-all hover:bg-emerald-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50";

export const SECONDARY =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-2xs transition-all hover:bg-slate-50 hover:text-slate-900 hover:border-slate-400 active:scale-[0.98] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700/80 dark:hover:border-slate-600";

export function StatusPill({ children }: { children: string }) {
  const isPositive =
    children === "Baik" ||
    children === "Masalah selesai" ||
    children === "Aktif" ||
    children === "Selesai" ||
    children === "Ditampilkan";

  const isWarning =
    children === "Cukup" ||
    children === "Sedang" ||
    children === "Sedang ditindaklanjuti" ||
    children === "Sudah dilaksanakan" ||
    children === "Sudah dievaluasi";

  const isDanger =
    children === "Kurang" ||
    children === "Tinggi" ||
    children.startsWith("Critical") ||
    children === "Terlewat" ||
    children === "Nonaktif" ||
    children === "Membutuhkan intervensi lanjutan" ||
    children === "0" ||
    children === "Skor 0";

  let colorClasses =
    "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300";
  let dotColor = "bg-slate-400";

  if (isPositive) {
    colorClasses =
      "border-emerald-200/80 bg-emerald-50 text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-300";
    dotColor = "bg-emerald-600";
  } else if (isWarning) {
    colorClasses =
      "border-amber-200/80 bg-amber-50 text-amber-800 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-300";
    dotColor = "bg-amber-500";
  } else if (isDanger) {
    colorClasses =
      "border-rose-200/80 bg-rose-50 text-rose-800 dark:border-rose-800/50 dark:bg-rose-950/40 dark:text-rose-300";
    dotColor = "bg-rose-500";
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${colorClasses}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
      <span>{children}</span>
    </span>
  );
}

export function EmptyState({ text, icon }: { text: string; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 px-6 py-12 text-center dark:border-slate-800 dark:bg-slate-900/40">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
        {icon ?? (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        )}
      </div>
      <p className="mt-3 max-w-sm text-sm font-medium text-slate-500 dark:text-slate-400">{text}</p>
    </div>
  );
}

export function ScoreSummary({ scores, items }: { scores: Scores; items?: AssessmentItem[] }) {
  const score = calculateScore(scores, items);

  const getPercentageColor = (pct: number) => {
    if (pct >= 76) return "from-emerald-600 to-teal-700";
    if (pct >= 56) return "from-amber-500 to-amber-600";
    return "from-rose-500 to-rose-600";
  };

  return (
    <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 text-white shadow-lg ring-1 ring-white/10 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Capaian Kepatuhan Klinis
            </p>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-5xl font-extrabold tracking-tight sm:text-6xl">{score.percentage}%</span>
            <span className="text-xs text-slate-400">
              ({score.total} dari skor ideal {score.max})
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-300">
            Kategori Kepatuhan: <b className="text-white">{score.category}</b> · Tingkat Prioritas: <b className="text-white">{score.priority}</b>
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <StatusPill>{score.category}</StatusPill>
          <StatusPill>{score.priority}</StatusPill>
        </div>
      </div>

      {/* Progress Bar Gauge */}
      <div className="mt-6">
        <div className="flex justify-between text-[11px] font-semibold text-slate-400 mb-1.5">
          <span>0% Kurang</span>
          <span>56% Cukup</span>
          <span>76% Baik (Target)</span>
          <span>100%</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-slate-800/80 p-0.5 ring-1 ring-white/10">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${getPercentageColor(
              score.percentage
            )} transition-all duration-500`}
            style={{ width: `${Math.min(100, Math.max(2, score.percentage))}%` }}
          />
        </div>
      </div>

      {score.criticalZero && (
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-rose-500/40 bg-rose-950/60 p-3.5 text-xs text-rose-200 backdrop-blur-sm">
          <svg className="h-5 w-5 shrink-0 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="font-bold text-white">Critical Patient Safety Issue Ditemukan!</p>
            <p className="text-rose-200/90 text-[11px]">
              Terdapat indikator klinis kritis yang mendapat skor 0 (tidak dilaksanakan). Memerlukan RTL prioritas tinggi maksimal 3 hari.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export function RecordsTable({
  rows,
  onOpen,
}: {
  rows: Supervision[];
  onOpen: (row: Supervision) => void;
}) {
  if (!rows.length) return <EmptyState text="Belum ada data supervisi terekam." />;

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800">
      <table className="w-full min-w-[760px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
            <th className="px-4 py-3.5">Tanggal</th>
            <th className="px-4 py-3.5">Unit / Ruangan</th>
            <th className="px-4 py-3.5">Perawat Disupervisi</th>
            <th className="px-4 py-3.5">Skor Kepatuhan</th>
            <th className="px-4 py-3.5">Kategori</th>
            <th className="px-4 py-3.5">Prioritas</th>
            <th className="px-4 py-3.5">Temuan RTL</th>
            <th className="px-4 py-3.5 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800/80 dark:bg-slate-900">
          {rows.map((row) => {
            const score = calculateScore(row.scores, row.assessment_items.length ? row.assessment_items : ITEMS);
            const open = row.follow_ups.filter((item) => item.status !== "Masalah selesai").length;
            return (
              <tr
                key={row.id}
                className="transition-colors hover:bg-emerald-50/30 dark:hover:bg-slate-800/50"
              >
                <td className="whitespace-nowrap px-4 py-3.5 text-xs text-slate-600 dark:text-slate-300 font-medium">
                  {formatDate(row.date)}
                </td>
                <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white">
                  {row.unit}
                </td>
                <td className="px-4 py-3.5 text-slate-700 dark:text-slate-200">
                  <div className="font-semibold">{row.nurse}</div>
                  <div className="text-[11px] text-slate-400">Supv: {row.supervisor}</div>
                </td>
                <td className="px-4 py-3.5 font-extrabold text-slate-900 dark:text-white">
                  <span
                    className={`inline-block rounded-lg px-2 py-0.5 text-xs font-bold ${
                      score.percentage >= 76
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                        : score.percentage >= 56
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                        : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                    }`}
                  >
                    {score.percentage}%
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <StatusPill>{score.category}</StatusPill>
                </td>
                <td className="px-4 py-3.5">
                  <StatusPill>{score.priority}</StatusPill>
                </td>
                <td className="px-4 py-3.5">
                  {open > 0 ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 dark:text-amber-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                      {open} temuan terbuka
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                      ✓ Selesai
                    </span>
                  )}
                </td>
                <td className="px-4 py-3.5 text-right">
                  <button
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:border-emerald-600 hover:bg-emerald-50 hover:text-emerald-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-emerald-500 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300"
                    onClick={() => onOpen(row)}
                  >
                    Detail →
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
      {label}
      {children}
    </label>
  );
}
