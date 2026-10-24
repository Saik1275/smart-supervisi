"use client";

import { useMemo, useState } from "react";
import { FOLLOW_UP_STATUSES } from "../../../lib/instruments";
import { formatDate } from "../../../lib/scoring";
import { useSupervisi } from "../context";
import { CONTROL, EmptyState, PANEL, StatusPill } from "../ui";

export function FollowUpPage() {
  const { allFollowUps, isAdmin, busy, currentDate, updateFollowUpStatus, startDraft } =
    useSupervisi();
  const [filter, setFilter] = useState("aktif");
  const [search, setSearch] = useState("");

  const stats = useMemo(() => {
    const total = allFollowUps.length;
    const selesai = allFollowUps.filter((item) => item.followUp.status === "Masalah selesai").length;
    const aktif = total - selesai;
    const overdue = allFollowUps.filter(
      (item) =>
        Boolean(currentDate && item.followUp.due_date && item.followUp.due_date < currentDate) &&
        item.followUp.status !== "Masalah selesai"
    ).length;
    return { total, selesai, aktif, overdue };
  }, [allFollowUps, currentDate]);

  const rows = useMemo(() => {
    return allFollowUps
      .filter(({ supervision, followUp }) => {
        // Status filter
        if (filter === "aktif" && followUp.status === "Masalah selesai") return false;
        if (filter === "selesai" && followUp.status !== "Masalah selesai") return false;
        if (filter === "overdue") {
          const isOverdue =
            Boolean(currentDate && followUp.due_date && followUp.due_date < currentDate) &&
            followUp.status !== "Masalah selesai";
          if (!isOverdue) return false;
        }

        // Search query
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
          followUp.problem.toLowerCase().includes(q) ||
          supervision.nurse.toLowerCase().includes(q) ||
          supervision.unit.toLowerCase().includes(q) ||
          followUp.pic.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => (a.followUp.due_date ?? "").localeCompare(b.followUp.due_date ?? ""));
  }, [allFollowUps, filter, search, currentDate]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Tindak Lanjut &amp; Monitoring RTL
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Pemantauan implementasi Rencana Tindak Lanjut (RTL) temuan hasil supervisi klinis keperawatan.
          </p>
        </div>
      </div>

      {/* Metric summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <button
          onClick={() => setFilter("semua")}
          className={`rounded-2xl border p-4 text-left transition ${
            filter === "semua"
              ? "border-emerald-500 bg-emerald-50/40 shadow-sm dark:bg-emerald-950/20"
              : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900"
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total RTL</span>
          <p className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">{stats.total}</p>
        </button>

        <button
          onClick={() => setFilter("aktif")}
          className={`rounded-2xl border p-4 text-left transition ${
            filter === "aktif"
              ? "border-emerald-500 bg-emerald-50/40 shadow-sm dark:bg-emerald-950/20"
              : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900"
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500">Dalam Proses</span>
          <p className="mt-1 text-2xl font-extrabold text-amber-600 dark:text-amber-400">{stats.aktif}</p>
        </button>

        <button
          onClick={() => setFilter("overdue")}
          className={`rounded-2xl border p-4 text-left transition ${
            filter === "overdue"
              ? "border-rose-500 bg-rose-50/40 shadow-sm dark:bg-rose-950/20"
              : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900"
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500">Lewat Tenggat</span>
          <p className="mt-1 text-2xl font-extrabold text-rose-600 dark:text-rose-400">{stats.overdue}</p>
        </button>

        <button
          onClick={() => setFilter("selesai")}
          className={`rounded-2xl border p-4 text-left transition ${
            filter === "selesai"
              ? "border-emerald-500 bg-emerald-50/40 shadow-sm dark:bg-emerald-950/20"
              : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900"
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">Selesai Tuntas</span>
          <p className="mt-1 text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{stats.selesai}</p>
        </button>
      </div>

      {/* Search and Filters */}
      <section className={`${PANEL} space-y-4`}>
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-wrap gap-1.5 text-xs">
            {[
              { key: "aktif", label: `Aktif (${stats.aktif})` },
              { key: "overdue", label: `Lewat Tenggat (${stats.overdue})` },
              { key: "selesai", label: `Selesai (${stats.selesai})` },
              { key: "semua", label: `Semua (${stats.total})` },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`rounded-xl px-3 py-1.5 font-semibold transition ${
                  filter === key
                    ? "bg-emerald-700 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="w-full sm:w-64">
            <input
              type="text"
              placeholder="Cari perawat, unit, masalah..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`${CONTROL} text-xs py-2`}
            />
          </div>
        </div>

        {/* RTL Items List */}
        {!rows.length ? (
          <EmptyState text="Tidak ada catatan RTL yang sesuai dengan filter yang dipilih." />
        ) : (
          <div className="space-y-4">
            {rows.map(({ supervision, followUp }) => {
              const isOverdue =
                Boolean(currentDate && followUp.due_date && followUp.due_date < currentDate) &&
                followUp.status !== "Masalah selesai";
              const isDone = followUp.status === "Masalah selesai";

              return (
                <article
                  key={followUp.id}
                  className={`rounded-2xl border p-5 transition-all ${
                    isOverdue
                      ? "border-rose-300 bg-rose-50/20 shadow-sm dark:border-rose-900/60 dark:bg-rose-950/10"
                      : isDone
                      ? "border-slate-200 bg-white/70 opacity-80 dark:border-slate-800 dark:bg-slate-900/40"
                      : "border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
                  }`}
                >
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusPill>{followUp.status}</StatusPill>
                        {isOverdue && <StatusPill>Terlewat</StatusPill>}
                        <span className="text-xs text-slate-400">·</span>
                        <span className="text-xs text-slate-500 font-medium">
                          Batas: <b>{formatDate(followUp.due_date)}</b>
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {followUp.problem}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Unit: <b className="text-slate-800 dark:text-slate-200">{supervision.unit}</b> · Perawat:{" "}
                        <b className="text-slate-800 dark:text-slate-200">{supervision.nurse}</b> · Disupervisi oleh:{" "}
                        {supervision.supervisor} ({formatDate(supervision.date)})
                      </p>
                    </div>

                    {isAdmin && (
                      <button
                        className="shrink-0 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:from-emerald-700 hover:to-teal-800"
                        onClick={() =>
                          startDraft({
                            unit: supervision.unit,
                            nurse_id: supervision.nurse_id,
                            parent_id: supervision.id,
                          })
                        }
                      >
                        ↻ Re-Supervisi Ulang
                      </button>
                    )}
                  </div>

                  {/* Detail Grid */}
                  <div className="mt-4 grid gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-4 text-xs sm:grid-cols-2 lg:grid-cols-3 dark:border-slate-800 dark:bg-slate-800/40">
                    <div>
                      <span className="block font-bold text-slate-400 uppercase text-[10px]">Akar Masalah</span>
                      <p className="mt-0.5 text-slate-700 dark:text-slate-300">{followUp.cause || "-"}</p>
                    </div>
                    <div>
                      <span className="block font-bold text-slate-400 uppercase text-[10px]">Bentuk Intervensi</span>
                      <p className="mt-0.5 text-slate-700 dark:text-slate-300">{followUp.intervention || "-"}</p>
                    </div>
                    <div>
                      <span className="block font-bold text-slate-400 uppercase text-[10px]">PIC &amp; Target Capaian</span>
                      <p className="mt-0.5 text-slate-700 dark:text-slate-300 font-semibold">
                        {followUp.pic || "-"} ({followUp.target || "-"})
                      </p>
                    </div>
                    <div>
                      <span className="block font-bold text-slate-400 uppercase text-[10px]">Tenggat Waktu</span>
                      <p className={`mt-0.5 font-semibold ${isOverdue ? "text-rose-600" : "text-slate-700 dark:text-slate-300"}`}>
                        {formatDate(followUp.due_date)}
                      </p>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="block font-bold text-slate-400 uppercase text-[10px]">Metode Evaluasi</span>
                      <p className="mt-0.5 text-slate-700 dark:text-slate-300">{followUp.evaluation || "-"}</p>
                    </div>
                  </div>

                  {/* Admin Status Changer */}
                  {isAdmin && (
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 dark:border-slate-800">
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                        <span>Status RTL:</span>
                        <select
                          className={`${CONTROL} py-1.5 text-xs max-w-xs`}
                          disabled={busy}
                          value={followUp.status}
                          onChange={(event) => void updateFollowUpStatus(followUp.id, event.target.value)}
                        >
                          {FOLLOW_UP_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </label>
                      <span className="text-[11px] text-slate-400">
                        Pembaruan status langsung tersinkronisasi ke rekapitulasi mutu.
                      </span>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
