"use client";

import type { ReactNode } from "react";
import { calculateScore, formatDate, type Scores } from "../../lib/scoring";
import { ITEMS, type AssessmentItem } from "../../lib/instruments";
import type { Supervision } from "./context";

export const CARD_SURFACE =
  "min-w-0 overflow-hidden rounded-2xl border border-teal-100/90 bg-white shadow-sm shadow-teal-900/5 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none";

export const PANEL = `${CARD_SURFACE} p-4 transition-colors sm:p-6`;

export const CONTROL =
  "w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 shadow-2xs outline-none transition-all placeholder:text-slate-400 focus:border-teal-600 focus:ring-3 focus:ring-teal-600/15 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-teal-400 dark:focus:ring-teal-400/20";

export const BUTTON =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition-all hover:bg-teal-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50";

export const SECONDARY =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-2xs transition-all hover:border-teal-200 hover:bg-teal-50/70 hover:text-teal-900 active:scale-[0.98] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700/80 dark:hover:border-slate-600";

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
      "border-teal-200/80 bg-teal-50 text-teal-800 dark:border-teal-800/50 dark:bg-teal-950/40 dark:text-teal-300";
    dotColor = "bg-teal-600";
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
      className={`inline-flex max-w-full min-w-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${colorClasses}`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotColor}`} />
      <span className="min-w-0 truncate">{children}</span>
    </span>
  );
}

export function EmptyState({ text, icon }: { text: string; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-teal-100 bg-teal-50/40 px-6 py-12 text-center dark:border-slate-800 dark:bg-slate-900/40">
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
    if (pct >= 76) return "from-teal-500 to-cyan-600";
    if (pct >= 56) return "from-amber-400 to-amber-500";
    return "from-rose-400 to-rose-500";
  };

  return (
    <div className="min-w-0 overflow-hidden rounded-2xl bg-gradient-to-br from-teal-800 via-teal-700 to-cyan-800 p-5 text-white shadow-lg shadow-teal-900/20 sm:p-6">
      <div className="flex min-w-0 flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 shrink-0 rounded-full bg-teal-200 animate-pulse" />
            <p className="text-xs font-bold uppercase tracking-wider text-teal-100">
              Capaian Kepatuhan Klinis
            </p>
          </div>
          <div className="mt-2 flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="text-4xl font-extrabold tracking-tight sm:text-5xl">{score.percentage}%</span>
            <span className="text-xs text-teal-100/80">
              ({score.total} dari skor ideal {score.max})
            </span>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-teal-50/90">
            Kategori: <b className="text-white">{score.category}</b>
            <span className="mx-1.5 text-teal-200/60">·</span>
            Prioritas: <b className="text-white">{score.priority}</b>
          </p>
        </div>

        <div className="flex min-w-0 flex-wrap gap-2">
          <StatusPill>{score.category}</StatusPill>
          <StatusPill>{score.priority}</StatusPill>
        </div>
      </div>

      <div className="mt-6 min-w-0">
        <div className="mb-1.5 grid grid-cols-2 gap-1 text-[10px] font-semibold text-teal-100/80 sm:grid-cols-4 sm:text-[11px]">
          <span>0% Kurang</span>
          <span className="sm:text-center">56% Cukup</span>
          <span className="sm:text-center">76% Baik</span>
          <span className="text-right">100%</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-black/20 p-0.5">
          <div
            className={`h-full max-w-full rounded-full bg-gradient-to-r ${getPercentageColor(
              score.percentage
            )} transition-all duration-500`}
            style={{ width: `${Math.min(100, Math.max(2, score.percentage))}%` }}
          />
        </div>
      </div>

      {score.criticalZero && (
        <div className="mt-4 flex min-w-0 items-start gap-3 rounded-xl border border-rose-300/40 bg-rose-950/50 p-3.5 text-xs text-rose-100">
          <svg className="h-5 w-5 shrink-0 text-rose-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div className="min-w-0">
            <p className="font-bold text-white">Critical Patient Safety Issue Ditemukan!</p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-rose-100/90">
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
    <div className="-mx-1 min-w-0 overflow-x-auto rounded-xl border border-teal-100/80 dark:border-slate-800">
      <table className="w-full min-w-[720px] table-fixed border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-teal-100 bg-teal-50/70 text-xs font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
            <th className="w-[14%] px-3 py-3.5 sm:px-4">Tanggal</th>
            <th className="w-[16%] px-3 py-3.5 sm:px-4">Unit</th>
            <th className="w-[18%] px-3 py-3.5 sm:px-4">Perawat</th>
            <th className="w-[10%] px-3 py-3.5 sm:px-4">Skor</th>
            <th className="w-[12%] px-3 py-3.5 sm:px-4">Kategori</th>
            <th className="w-[12%] px-3 py-3.5 sm:px-4">Prioritas</th>
            <th className="w-[12%] px-3 py-3.5 sm:px-4">RTL</th>
            <th className="w-[6%] px-3 py-3.5 text-right sm:px-4">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800/80 dark:bg-slate-900">
          {rows.map((row) => {
            const score = calculateScore(row.scores, row.assessment_items.length ? row.assessment_items : ITEMS);
            const open = row.follow_ups.filter((item) => item.status !== "Masalah selesai").length;
            return (
              <tr
                key={row.id}
                className="transition-colors hover:bg-teal-50/50 dark:hover:bg-slate-800/50"
              >
                <td className="whitespace-nowrap px-3 py-3.5 text-xs font-medium text-slate-600 dark:text-slate-300 sm:px-4">
                  {formatDate(row.date)}
                </td>
                <td className="max-w-0 truncate px-3 py-3.5 font-semibold text-slate-900 dark:text-white sm:px-4" title={row.unit}>
                  {row.unit}
                </td>
                <td className="max-w-0 px-3 py-3.5 text-slate-700 dark:text-slate-200 sm:px-4">
                  <div className="truncate font-semibold" title={row.nurse}>{row.nurse}</div>
                  <div className="truncate text-[11px] text-slate-400" title={row.supervisor}>Supv: {row.supervisor}</div>
                </td>
                <td className="px-3 py-3.5 sm:px-4">
                  <span
                    className={`inline-block rounded-lg px-2 py-0.5 text-xs font-bold ${
                      score.percentage >= 76
                        ? "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300"
                        : score.percentage >= 56
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                        : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                    }`}
                  >
                    {score.percentage}%
                  </span>
                </td>
                <td className="px-3 py-3.5 sm:px-4">
                  <StatusPill>{score.category}</StatusPill>
                </td>
                <td className="px-3 py-3.5 sm:px-4">
                  <StatusPill>{score.priority}</StatusPill>
                </td>
                <td className="px-3 py-3.5 sm:px-4">
                  {open > 0 ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 dark:text-amber-400">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                      <span className="truncate">{open} terbuka</span>
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-teal-700 dark:text-teal-400">
                      Selesai
                    </span>
                  )}
                </td>
                <td className="px-3 py-3.5 text-right sm:px-4">
                  <button
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:border-teal-500 hover:bg-teal-50 hover:text-teal-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-teal-400 dark:hover:bg-teal-950/40 dark:hover:text-teal-300"
                    onClick={() => onOpen(row)}
                  >
                    Detail
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
    <label className="block min-w-0 text-sm font-semibold text-slate-700 dark:text-slate-300">
      {label}
      {children}
    </label>
  );
}
