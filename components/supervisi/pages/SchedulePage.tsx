"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { getSupabaseBrowserClient } from "../../../lib/supabase/browser";
import { addDays, formatDate, today } from "../../../lib/scoring";
import { useSupervisi } from "../context";
import { BUTTON, CONTROL, EmptyState, PANEL, StatusPill } from "../ui";

export function SchedulePage() {
  const {
    data,
    nurses,
    user,
    isAdmin,
    currentDate,
    refreshData,
    setError,
    setNotice,
    startDraft,
  } = useSupervisi();

  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [filterTab, setFilterTab] = useState<"semua" | "mendatang" | "lewat" | "selesai">("semua");
  const [search, setSearch] = useState("");
  const [selectedNurseId, setSelectedNurseId] = useState("");

  const [form, setForm] = useState({
    date: "",
    unit: "",
    target: "",
    note: "",
  });

  const toggleForm = () => {
    if (!showForm && !form.date) {
      setForm((prev) => ({
        ...prev,
        date: currentDate ? addDays(currentDate, 3) : addDays(today(), 3),
      }));
    }
    setShowForm((prev) => !prev);
  };

  const supabase = getSupabaseBrowserClient();

  // Active nurses list
  const activeNurses = useMemo(() => nurses.filter((n) => n.active), [nurses]);

  // Handle nurse dropdown selection
  const handleSelectNurse = (nurseId: string) => {
    setSelectedNurseId(nurseId);
    if (!nurseId) return;
    const selected = nurses.find((n) => n.id === nurseId);
    if (selected) {
      setForm((prev) => ({
        ...prev,
        target: selected.full_name,
        unit: selected.unit,
      }));
    }
  };

  // Quick date setter
  const setQuickDate = (daysAhead: number) => {
    setForm((prev) => ({ ...prev, date: addDays(today(), daysAhead) }));
  };

  // Add schedule
  async function addSchedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !user || !isAdmin) return;
    if (!form.date || !form.unit.trim() || !form.target.trim()) {
      setError("Isi tanggal pelaksanaan, unit ruangan, dan nama target perawat.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("schedules").insert({
      scheduled_for: form.date,
      unit: form.unit.trim(),
      target: form.target.trim(),
      note: form.note.trim(),
      created_by: user.id,
    });
    setBusy(false);

    if (error) {
      setError(`Jadwal gagal disimpan: ${error.message}`);
    } else {
      setForm({ date: addDays(today(), 3), unit: "", target: "", note: "" });
      setSelectedNurseId("");
      setShowForm(false);
      await refreshData();
      setNotice("Agenda jadwal supervisi berhasil ditambahkan.");
    }
  }

  // Toggle done status
  async function toggleDone(id: string, currentDone: boolean) {
    if (!supabase || !isAdmin) return;
    setBusy(true);
    const { error } = await supabase
      .from("schedules")
      .update({ done_at: currentDone ? null : new Date().toISOString() })
      .eq("id", id);
    setBusy(false);

    if (error) {
      setError(`Gagal memperbarui status jadwal: ${error.message}`);
    } else {
      await refreshData();
      setNotice(currentDone ? "Jadwal dikembalikan ke status aktif." : "Jadwal ditandai telah selesai.");
    }
  }

  // Delete schedule
  async function deleteSchedule(id: string) {
    if (!supabase || !isAdmin || !window.confirm("Hapus agenda jadwal supervisi ini?")) return;
    setBusy(true);
    const { error } = await supabase.from("schedules").delete().eq("id", id);
    setBusy(false);
    if (error) {
      setError(`Jadwal gagal dihapus: ${error.message}`);
    } else {
      await refreshData();
      setNotice("Agenda supervisi berhasil dihapus.");
    }
  }

  // Schedules classification & metrics
  const now = currentDate;

  const metrics = useMemo(() => {
    const total = data.schedules.length;
    let upcoming = 0;
    let overdue = 0;
    let done = 0;

    data.schedules.forEach((s) => {
      if (s.done) {
        done++;
      } else if (now && s.date < now) {
        overdue++;
      } else {
        upcoming++;
      }
    });

    return { total, upcoming, overdue, done };
  }, [data.schedules, now]);

  // Filtered schedules
  const filteredSchedules = useMemo(() => {
    return data.schedules.filter((item) => {
      const matchSearch =
        !search.trim() ||
        `${item.unit} ${item.target} ${item.note}`
          .toLocaleLowerCase("id-ID")
          .includes(search.trim().toLocaleLowerCase("id-ID"));

      if (!matchSearch) return false;

      if (filterTab === "mendatang") return !item.done && (!now || item.date >= now);
      if (filterTab === "lewat") return !item.done && Boolean(now && item.date < now);
      if (filterTab === "selesai") return item.done;
      return true;
    });
  }, [data.schedules, search, filterTab, now]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Jadwal &amp; Agenda Supervisi
            </h2>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Perencanaan observasi klinis berkala perawat ruangan dan target audit kepatuhan.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={toggleForm}
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
                + Buat Agenda Baru
              </>
            )}
          </button>
        )}
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <button
          onClick={() => setFilterTab("semua")}
          className={`rounded-2xl border p-4 text-left transition ${filterTab === "semua"
              ? "border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500 dark:border-emerald-500/50 dark:bg-emerald-950/20"
              : "border-slate-200/80 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900"
            }`}
        >
          <div className="text-xs font-medium text-slate-500">Total Agenda</div>
          <div className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {metrics.total}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">Seluruh jadwal tersimpan</div>
        </button>

        <button
          onClick={() => setFilterTab("mendatang")}
          className={`rounded-2xl border p-4 text-left transition ${filterTab === "mendatang"
              ? "border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600 dark:border-emerald-500/50 dark:bg-emerald-950/20"
              : "border-slate-200/80 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900"
            }`}
        >
          <div className="text-xs font-medium text-slate-500">Mendatang / Aktif</div>
          <div className="mt-1 text-2xl font-bold tracking-tight text-emerald-700 dark:text-emerald-400">
            {metrics.upcoming}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">Menanti pelaksanaan</div>
        </button>

        <button
          onClick={() => setFilterTab("lewat")}
          className={`rounded-2xl border p-4 text-left transition ${filterTab === "lewat"
              ? "border-amber-500 bg-amber-50/40 ring-1 ring-amber-500 dark:border-amber-500/50 dark:bg-amber-950/20"
              : "border-slate-200/80 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900"
            }`}
        >
          <div className="text-xs font-medium text-slate-500">Terlewat / Perlu Audit</div>
          <div className="mt-1 text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
            {metrics.overdue}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">Melewati target tanggal</div>
        </button>

        <button
          onClick={() => setFilterTab("selesai")}
          className={`rounded-2xl border p-4 text-left transition ${filterTab === "selesai"
              ? "border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500 dark:border-emerald-500/50 dark:bg-emerald-950/20"
              : "border-slate-200/80 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900"
            }`}
        >
          <div className="text-xs font-medium text-slate-500">Sudah Selesai</div>
          <div className="mt-1 text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
            {metrics.done}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">Telah diaudit &amp; ditutup</div>
        </button>
      </div>

      {/* Collapsible Form Tambah Jadwal */}
      {isAdmin && showForm && (
        <form
          className={`${PANEL} animate-in fade-in slide-in-from-top-3 duration-200 space-y-4 border-2 border-emerald-500/20`}
          onSubmit={(e) => void addSchedule(e)}
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Buat Agenda Supervisi Baru
              </h3>
              <p className="text-xs text-slate-500">
                Pilih perawat yang akan diobservasi atau masukkan target unit secara manual.
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

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Quick Pick Nurse */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Pilih dari Daftar Perawat
              </label>
              <select
                className={`${CONTROL} mt-1`}
                value={selectedNurseId}
                onChange={(e) => handleSelectNurse(e.target.value)}
              >
                <option value="">-- Ketik manual di bawah --</option>
                {activeNurses.map((nurse) => (
                  <option key={nurse.id} value={nurse.id}>
                    {nurse.full_name} ({nurse.unit})
                  </option>
                ))}
              </select>
            </div>

            {/* Target Perawat */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Target Perawat / Tim <span className="text-rose-500">*</span>
              </label>
              <input
                className={`${CONTROL} mt-1`}
                placeholder="Contoh: Ns. Maya, S.Kep / Tim Shift A"
                value={form.target}
                onChange={(e) => setForm({ ...form, target: e.target.value })}
                required
              />
            </div>

            {/* Unit / Ruangan */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Unit / Ruangan <span className="text-rose-500">*</span>
              </label>
              <input
                className={`${CONTROL} mt-1`}
                placeholder="Contoh: IGD / Rawat Inap Melati"
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                required
              />
            </div>

            {/* Tanggal */}
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Tanggal Pelaksanaan <span className="text-rose-500">*</span>
                </label>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setQuickDate(0)}
                    className="text-[10px] text-emerald-600 hover:underline dark:text-emerald-400"
                  >
                    Hari ini
                  </button>
                  <span className="text-[10px] text-slate-300">·</span>
                  <button
                    type="button"
                    onClick={() => setQuickDate(3)}
                    className="text-[10px] text-emerald-600 hover:underline dark:text-emerald-400"
                  >
                    +3h
                  </button>
                  <span className="text-[10px] text-slate-300">·</span>
                  <button
                    type="button"
                    onClick={() => setQuickDate(7)}
                    className="text-[10px] text-emerald-600 hover:underline dark:text-emerald-400"
                  >
                    +1m
                  </button>
                </div>
              </div>
              <input
                type="date"
                className={`${CONTROL} mt-1`}
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Catatan Khusus / Fokus Keterampilan
            </label>
            <input
              className={`${CONTROL} mt-1`}
              placeholder="Contoh: Fokus pada verifikasi 2 identitas pasien dan SPO desinfeksi insersi vena"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Batal
            </button>
            <button className={BUTTON} disabled={busy}>
              {busy ? "Menyimpan..." : "Simpan & Jadwalkan"}
            </button>
          </div>
        </form>
      )}

      {/* Filter and Search Bar */}
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
            placeholder="Cari target perawat, unit, catatan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          <button
            onClick={() => setFilterTab("semua")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${filterTab === "semua"
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
              }`}
          >
            Semua ({metrics.total})
          </button>
          <button
            onClick={() => setFilterTab("mendatang")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${filterTab === "mendatang"
                ? "bg-emerald-700 text-white shadow-xs"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
              }`}
          >
            Mendatang ({metrics.upcoming})
          </button>
          <button
            onClick={() => setFilterTab("lewat")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${filterTab === "lewat"
                ? "bg-amber-600 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
              }`}
          >
            Terlewat ({metrics.overdue})
          </button>
          <button
            onClick={() => setFilterTab("selesai")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${filterTab === "selesai"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
              }`}
          >
            Selesai ({metrics.done})
          </button>
        </div>
      </div>

      {/* Schedule Items List */}
      {!filteredSchedules.length ? (
        <EmptyState
          text={
            search
              ? "Tidak ada agenda yang cocok dengan pencarian Anda."
              : filterTab !== "semua"
                ? `Tidak ada agenda pada kategori "${filterTab}".`
                : "Belum ada agenda jadwal supervisi. Klik tombol '+ Buat Agenda Baru' untuk memulai."
          }
        />
      ) : (
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredSchedules.map((schedule) => {
            const isOverdue = !schedule.done && schedule.date < now;
            const isToday = !schedule.done && schedule.date === now;
            const statusLabel = schedule.done
              ? "Selesai"
              : isToday
                ? "Hari Ini"
                : isOverdue
                  ? "Terlewat"
                  : "Terjadwal";

            // Parse date for calendar badge
            const dateObj = new Date(`${schedule.date.slice(0, 10)}T00:00:00`);
            const dayNum = dateObj.getDate();
            const monthStr = dateObj
              .toLocaleDateString("id-ID", { month: "short" })
              .toUpperCase();

            // Match nurse object
            const matchedNurse = nurses.find(
              (item) => item.active && item.full_name === schedule.target
            );

            return (
              <article
                key={schedule.id}
                className={`relative flex flex-col justify-between rounded-2xl border p-4 shadow-sm transition hover:shadow-md ${schedule.done
                    ? "border-slate-200/60 bg-slate-50/50 opacity-80 dark:border-slate-800 dark:bg-slate-900/50"
                    : isToday
                      ? "border-emerald-500/50 bg-white ring-1 ring-emerald-500/30 dark:border-emerald-500/40 dark:bg-slate-900"
                      : isOverdue
                        ? "border-amber-300 bg-white dark:border-amber-900/50 dark:bg-slate-900"
                        : "border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900"
                  }`}
              >
                <div>
                  {/* Top Bar with Date Badge & Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {/* Mini Calendar Date Box */}
                      <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-center dark:border-slate-800 dark:bg-slate-950">
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                          {monthStr}
                        </span>
                        <span className="text-base font-extrabold leading-none text-slate-800 dark:text-white">
                          {dayNum}
                        </span>
                      </div>

                      <div>
                        <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {schedule.unit}
                        </span>
                        <h4 className="mt-1 font-bold text-slate-900 dark:text-white">
                          {schedule.target}
                        </h4>
                      </div>
                    </div>

                    <StatusPill>{statusLabel}</StatusPill>
                  </div>

                  {/* Date details and note */}
                  <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-3 text-xs dark:border-slate-800/80">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{formatDate(schedule.date)}</span>
                      {isToday && (
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          (Hari Ini)
                        </span>
                      )}
                    </div>

                    {schedule.note && (
                      <p className="line-clamp-2 rounded-lg bg-slate-50 p-2 text-[11px] leading-relaxed text-slate-600 dark:bg-slate-950 dark:text-slate-400">
                        💬 {schedule.note}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions bottom */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                  <div className="flex items-center gap-1.5">
                    {isAdmin && (
                      <button
                        onClick={() => void toggleDone(schedule.id, schedule.done)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${schedule.done
                            ? "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                            : "border border-slate-200 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                          }`}
                        title={schedule.done ? "Kembalikan ke jadwal aktif" : "Tandai sudah selesai"}
                        disabled={busy}
                      >
                        {schedule.done ? "Buka Kembali" : "Tandai Selesai"}
                      </button>
                    )}

                    {isAdmin && (
                      <button
                        onClick={() => void deleteSchedule(schedule.id)}
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                        title="Hapus agenda ini"
                        disabled={busy}
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>

                  {!schedule.done && (
                    <button
                      onClick={() => {
                        startDraft({
                          unit: schedule.unit,
                          nurse_id: matchedNurse?.id ?? "",
                          schedule_id: schedule.id,
                        });
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:from-emerald-500 hover:to-teal-500"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Mulai Supervisi
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
