"use client";

import { useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "../../../lib/supabase/browser";
import { calculateScore } from "../../../lib/scoring";
import { ITEMS } from "../../../lib/instruments";
import { useSupervisi } from "../context";
import { BUTTON, CONTROL, EmptyState, PANEL, StatusPill } from "../ui";

export function NursesPage() {
  const { nurses, data, isAdmin, setError, setNotice, refreshData, startDraft, routerPush } =
    useSupervisi();
  const supabase = getSupabaseBrowserClient();

  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [unitFilter, setUnitFilter] = useState("Semua Unit");
  const [statusFilter, setStatusFilter] = useState<"semua" | "aktif" | "nonaktif">("semua");
  const [form, setForm] = useState({ full_name: "", unit: "" });

  const commonUnits = [
    "IGD (Instalasi Gawat Darurat)",
    "Rawat Inap Melati",
    "Rawat Inap Mawar",
    "ICU / ICCU",
    "Rawat Inap Bedah",
    "Poli Rawat Jalan",
    "Kamar Operasi (OK)",
    "Perinatologi / NICU",
  ];

  // Unique units from nurses data
  const uniqueUnits = useMemo(() => {
    const set = new Set<string>();
    nurses.forEach((n) => {
      if (n.unit) set.add(n.unit);
    });
    return Array.from(set).sort();
  }, [nurses]);

  // Statistics
  const metrics = useMemo(() => {
    const total = nurses.length;
    const active = nurses.filter((n) => n.active).length;
    const unitsCount = uniqueUnits.length;
    const totalSupervisions = data.supervisions.length;
    return { total, active, unitsCount, totalSupervisions };
  }, [nurses, uniqueUnits, data.supervisions]);

  // Map nurse supervision counts and average score
  const nurseStats = useMemo(() => {
    const stats: Record<string, { count: number; avgScore: number | null }> = {};

    nurses.forEach((nurse) => {
      const records = data.supervisions.filter(
        (s) => s.nurse_id === nurse.id || s.nurse.toLowerCase() === nurse.full_name.toLowerCase()
      );
      if (records.length === 0) {
        stats[nurse.id] = { count: 0, avgScore: null };
      } else {
        const sum = records.reduce((acc, cur) => acc + calculateScore(cur.scores, cur.assessment_items.length ? cur.assessment_items : ITEMS).percentage, 0);
        stats[nurse.id] = {
          count: records.length,
          avgScore: Math.round((sum / records.length) * 10) / 10,
        };
      }
    });

    return stats;
  }, [nurses, data.supervisions]);

  // Filtered nurses
  const filteredNurses = useMemo(() => {
    return nurses.filter((nurse) => {
      const term = search.trim().toLocaleLowerCase("id-ID");
      const matchSearch =
        !term ||
        `${nurse.full_name} ${nurse.unit}`.toLocaleLowerCase("id-ID").includes(term);

      const matchUnit = unitFilter === "Semua Unit" || nurse.unit === unitFilter;
      const matchStatus =
        statusFilter === "semua" ||
        (statusFilter === "aktif" && nurse.active) ||
        (statusFilter === "nonaktif" && !nurse.active);

      return matchSearch && matchUnit && matchStatus;
    });
  }, [nurses, search, unitFilter, statusFilter]);

  async function addNurse(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !isAdmin) return;
    if (!form.full_name.trim() || !form.unit.trim()) {
      setError("Nama lengkap dan unit perawat wajib diisi.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("nurses").insert({
      full_name: form.full_name.trim(),
      unit: form.unit.trim(),
    });
    setBusy(false);

    if (error) {
      setError(`Data perawat gagal disimpan: ${error.message}`);
    } else {
      setForm({ full_name: "", unit: "" });
      setShowForm(false);
      await refreshData();
      setNotice("Data perawat berhasil ditambahkan.");
    }
  }

  async function toggleNurse(id: string, active: boolean) {
    if (!supabase || !isAdmin) return;
    setBusy(true);
    const { error } = await supabase.from("nurses").update({ active: !active }).eq("id", id);
    setBusy(false);

    if (error) {
      setError(`Status perawat gagal diperbarui: ${error.message}`);
    } else {
      await refreshData();
      setNotice(`Status perawat berhasil diubah menjadi ${active ? "Nonaktif" : "Aktif"}.`);
    }
  }

  // Generate avatar initials
  const getInitials = (name: string) => {
    const parts = name.replace(/^(ns\.|dr\.|drg\.)\s*/i, "").trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0]?.slice(0, 2).toUpperCase() || "PR";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Direktori Tenaga Perawat
            </h2>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Daftar perawat klinis, unit penempatan tugas, riwayat evaluasi, dan status keaktifan.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowForm(!showForm)}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold shadow-sm transition ${showForm
              ? "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              : "bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500 hover:shadow"
              }`}
          >
            {showForm ? (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Tutup Formulir
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Tambah Perawat
              </>
            )}
          </button>
        )}
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs font-medium text-slate-500">Total Tenaga Perawat</div>
          <div className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {metrics.total}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">Dalam database klinis</div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs font-medium text-slate-500">Perawat Aktif</div>
          <div className="mt-1 text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
            {metrics.active}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">Siap untuk disupervisi</div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs font-medium text-slate-500">Unit / Ruangan</div>
          <div className="mt-1 text-2xl font-bold tracking-tight text-teal-700 dark:text-teal-400">
            {metrics.unitsCount}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">Cakupan instalasi RS</div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs font-medium text-slate-500">Supervisi Tuntas</div>
          <div className="mt-1 text-2xl font-bold tracking-tight text-teal-600 dark:text-teal-400">
            {metrics.totalSupervisions}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">Total audit tersimpan</div>
        </div>
      </div>

      {/* Form Tambah Perawat */}
      {isAdmin && showForm && (
        <form
          className={`${PANEL} animate-in fade-in slide-in-from-top-3 duration-200 space-y-4 border-2 border-emerald-500/20`}
          onSubmit={(e) => void addNurse(e)}
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Tambah Tenaga Perawat Baru
              </h3>
              <p className="text-xs text-slate-500">
                Data perawat akan langsung tersedia untuk pemilihan supervisi dan penjadwalan.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Nama Lengkap &amp; Gelar <span className="text-rose-500">*</span>
              </label>
              <input
                className={`${CONTROL} mt-1`}
                placeholder="Contoh: Ns. Rian Pratama, S.Kep"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Unit / Ruangan Penempatan <span className="text-rose-500">*</span>
              </label>
              <input
                className={`${CONTROL} mt-1`}
                list="unit-options"
                placeholder="Pilih atau ketik ruangan..."
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                required
              />
              <datalist id="unit-options">
                {commonUnits.map((u) => (
                  <option key={u} value={u} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Batal
            </button>
            <button className={BUTTON} disabled={busy}>
              {busy ? "Menyimpan..." : "Simpan Perawat"}
            </button>
          </div>
        </form>
      )}

      {/* Filter Bar */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative sm:w-80">
          <svg
            className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-xs outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            placeholder="Cari nama perawat atau unit..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            value={unitFilter}
            onChange={(e) => setUnitFilter(e.target.value)}
          >
            <option value="Semua Unit">Semua Unit ({uniqueUnits.length})</option>
            {uniqueUnits.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            <button
              onClick={() => setStatusFilter("semua")}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${statusFilter === "semua"
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
                }`}
            >
              Semua ({nurses.length})
            </button>
            <button
              onClick={() => setStatusFilter("aktif")}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${statusFilter === "aktif"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
                }`}
            >
              Aktif ({metrics.active})
            </button>
            <button
              onClick={() => setStatusFilter("nonaktif")}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${statusFilter === "nonaktif"
                ? "bg-slate-600 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
                }`}
            >
              Nonaktif ({metrics.total - metrics.active})
            </button>
          </div>
        </div>
      </div>

      {/* Nurses Grid */}
      {!filteredNurses.length ? (
        <EmptyState
          text={
            search
              ? "Tidak ditemukan perawat dengan kata kunci pencarian tersebut."
              : !nurses.length
                ? isAdmin
                  ? "Belum ada data perawat. Klik tombol '+ Tambah Perawat' di atas untuk mendaftarkan perawat."
                  : "Daftar perawat akan muncul setelah tersedia data supervisi."
                : "Tidak ada perawat sesuai filter yang dipilih."
          }
        />
      ) : (
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredNurses.map((nurse) => {
            const stats = nurseStats[nurse.id] || { count: 0, avgScore: null };
            const initials = getInitials(nurse.full_name);

            return (
              <div
                key={nurse.id}
                className={`relative flex flex-col justify-between rounded-2xl border p-4 shadow-sm transition hover:shadow-md ${nurse.active
                  ? "border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900"
                  : "border-slate-200/50 bg-slate-50/70 opacity-75 dark:border-slate-800/60 dark:bg-slate-900/50"
                  }`}
              >
                <div>
                  {/* Top: Avatar, Name, Unit, and Active Pill */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-bold text-xs shadow-sm ${nurse.active
                          ? "bg-gradient-to-tr from-emerald-600 to-teal-500 text-white"
                          : "bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                          }`}
                      >
                        {initials}
                      </div>

                      <div className="min-w-0">
                        <h4 className="truncate text-sm font-bold text-slate-900 dark:text-white">
                          {nurse.full_name}
                        </h4>
                        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                          <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          <span className="truncate">{nurse.unit}</span>
                        </div>
                      </div>
                    </div>

                    <StatusPill>{nurse.active ? "Aktif" : "Nonaktif"}</StatusPill>
                  </div>

                  {/* Supervision Stats Info */}
                  <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-2.5 text-center text-xs dark:bg-slate-950">
                    <div>
                      <div className="font-extrabold text-slate-900 dark:text-white">
                        {stats.count}x
                      </div>
                      <div className="text-[10px] text-slate-400">Telah Disupervisi</div>
                    </div>
                    <div>
                      <div
                        className={`font-extrabold ${stats.avgScore === null
                          ? "text-slate-400"
                          : stats.avgScore >= 76
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-amber-600 dark:text-amber-400"
                          }`}
                      >
                        {stats.avgScore !== null ? `${stats.avgScore}%` : "-"}
                      </div>
                      <div className="text-[10px] text-slate-400">Rerata Kepatuhan</div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                  {isAdmin && (
                    <button
                      onClick={() => void toggleNurse(nurse.id, nurse.active)}
                      className={`text-xs font-semibold transition ${nurse.active
                        ? "text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400"
                        : "text-emerald-600 hover:underline dark:text-emerald-400"
                        }`}
                      disabled={busy}
                    >
                      {nurse.active ? "Nonaktifkan" : "Aktifkan"}
                    </button>
                  )}

                  {nurse.active && (
                    <div className="flex items-center gap-1.5 ml-auto">
                      <button
                        onClick={() => routerPush("/jadwal")}
                        className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                        title="Buat jadwal supervisi untuk perawat ini"
                      >
                        Jadwalkan
                      </button>
                      <button
                        onClick={() => {
                          startDraft({
                            nurse_id: nurse.id,
                            unit: nurse.unit,
                          });
                        }}
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-500"
                      >
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Supervisi
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Admin credentials note */}
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900/60">
        <span>🔐 Akun Administrator Sistem: <b>admin@supervisi.com</b></span>
        <span className="text-[11px] text-slate-400">Hak Akses: Manajemen Perawat, Jadwal, &amp; Modul SOP</span>
      </div>
    </div>
  );
}
