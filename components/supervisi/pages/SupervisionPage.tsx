"use client";

import { useEffect, useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useSupervisi } from "../context";
import {
  FACTORS,
  FACTOR_DESCRIPTIONS,
  INTERVENTIONS,
} from "../../../lib/instruments";
import { addDays, calculateScore, formatDate, type ScoreValue } from "../../../lib/scoring";
import { BUTTON, CONTROL, EmptyState, PANEL, RecordsTable, SECONDARY, ScoreSummary } from "../ui";

function TextArea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
      {label}
      <textarea
        className={`${CONTROL} mt-1.5 min-h-24 resize-y font-normal`}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function DigitalSignature({
  value,
  onChange,
}: {
  value: string;
  onChange: (signature: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const hasStroke = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (!value) return;

    const image = new Image();
    image.onload = () => context.drawImage(image, 0, 0, canvas.width, canvas.height);
    image.src = value;
    return () => {
      image.onload = null;
    };
  }, [value]);

  function point(event: ReactPointerEvent<HTMLCanvasElement>) {
    const canvas = event.currentTarget;
    const bounds = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - bounds.left) * (canvas.width / bounds.width),
      y: (event.clientY - bounds.top) * (canvas.height / bounds.height),
    };
  }

  function startDrawing(event: ReactPointerEvent<HTMLCanvasElement>) {
    event.preventDefault();
    const canvas = event.currentTarget;
    const context = canvas.getContext("2d");
    if (!context) return;
    const currentPoint = point(event);
    isDrawing.current = true;
    hasStroke.current = false;
    canvas.setPointerCapture(event.pointerId);
    context.beginPath();
    context.moveTo(currentPoint.x, currentPoint.y);
    context.lineWidth = 3;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = "#0f172a";
  }

  function continueDrawing(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (!isDrawing.current) return;
    const context = event.currentTarget.getContext("2d");
    if (!context) return;
    const currentPoint = point(event);
    context.lineTo(currentPoint.x, currentPoint.y);
    context.stroke();
    hasStroke.current = true;
  }

  function finishDrawing(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    if (hasStroke.current) onChange(event.currentTarget.toDataURL("image/png"));
  }

  function clearSignature() {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (canvas && context) context.clearRect(0, 0, canvas.width, canvas.height);
    onChange("");
  }

  return (
    <div className="space-y-2">
      <canvas
        ref={canvasRef}
        width={900}
        height={220}
        aria-label="Area untuk menggambar tanda tangan"
        className="h-36 w-full touch-none rounded-xl border border-slate-300 bg-white dark:border-slate-600"
        onPointerDown={startDrawing}
        onPointerMove={continueDrawing}
        onPointerUp={finishDrawing}
        onPointerCancel={finishDrawing}
      />
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          Gambar tanda tangan dengan mouse, stylus, atau jari.
        </p>
        <button type="button" className="text-xs font-semibold text-rose-600 hover:underline" onClick={clearSignature}>
          Hapus tanda tangan
        </button>
      </div>
    </div>
  );
}

function hasDigitalSignature(fair: {
  signatureMode?: "draw" | "type";
  signatureData?: string;
  signatureName?: string;
}) {
  return Boolean(
    fair.signatureName?.trim() &&
    (fair.signatureMode === "type" || fair.signatureData)
  );
}

export function SupervisionPage() {
  const {
    data,
    nurses,
    isAdmin,
    draft,
    setDraft,
    step,
    setStep,
    busy,
    error,
    setError,
    startDraft,
    updateDraft,
    updateFollowUp,
    generateConclusion,
    generateFair,
    generateRtl,
    saveDraft,
    routerPush,
    setLoginOpen,
  } = useSupervisi();

  // Read-only state for nurses / non-admin
  if (!isAdmin) {
    return (
      <section className="space-y-5">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              Lembar Supervisi Keperawatan
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Daftar rekam supervisi klinis yang telah diterbitkan oleh supervisor.
            </p>
          </div>
          <button
            onClick={() => setLoginOpen(true)}
            className={`${BUTTON} text-xs py-2`}
          >
            🔐 Masuk sebagai Admin untuk Mulai Supervisi
          </button>
        </div>

        <section className={PANEL}>
          <RecordsTable rows={data.supervisions} onOpen={(row) => routerPush(`/detail/${row.id}`)} />
        </section>
      </section>
    );
  }

  // Admin Initial View (Start Draft)
  if (!draft) {
    const schedules = data.schedules.filter((schedule) => !schedule.done);
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <section className={`${PANEL} text-center py-10 sm:py-12`}>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-700 text-3xl font-extrabold text-white shadow-md shadow-emerald-700/20">
            +
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
            Mulai Lembar Supervisi Baru
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Formulir closed-loop 7 tahap: observasi 8 butir inti Patient Safety dan 12 butir tindakan infus, analisis akar masalah, pemberian feedback model FAIR, dan RTL terukur.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              className={`${BUTTON} text-sm px-6 py-3 shadow-md`}
              onClick={() => startDraft()}
            >
              Mulai Observasi Sekarang →
            </button>
          </div>
        </section>

        {schedules.length > 0 && (
          <section className={`${PANEL} space-y-4`}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white">
                Pilih Dari Agenda Jadwal Terdekat
              </h3>
              <span className="text-xs text-slate-500">{schedules.length} jadwal menanti</span>
            </div>
            <div className="space-y-2.5">
              {schedules.slice(0, 4).map((schedule) => (
                <div
                  key={schedule.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-slate-50/60 p-3.5 transition hover:bg-white hover:shadow-sm dark:border-slate-800 dark:bg-slate-900/50"
                >
                  <div>
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      {schedule.unit}
                    </span>
                    <span className="mx-2 text-slate-400">·</span>
                    <span className="text-xs text-slate-600 dark:text-slate-300">
                      Target: <b>{schedule.target}</b>
                    </span>
                    <span className="mx-2 text-slate-400">·</span>
                    <span className="text-xs text-slate-500">{formatDate(schedule.date)}</span>
                  </div>
                  <button
                    className={`${SECONDARY} text-xs py-1.5`}
                    onClick={() => {
                      const nurse = nurses.find((item) => item.active && item.full_name === schedule.target);
                      startDraft({ unit: schedule.unit, nurse_id: nurse?.id ?? "", schedule_id: schedule.id });
                    }}
                  >
                    Mulai Sesuai Jadwal →
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    );
  }

  // Active Draft Wizard
  const score = calculateScore(draft.scores, draft.assessment_items);
  const modules = data.sops.filter((sop) => sop.assessment_items.length > 0);
  const selectedModule = modules.find((module) => module.id === draft.module_id);
  const steps = [
    { label: "Informasi", num: 1 },
    { label: "Observasi & Scoring", num: 2 },
    { label: "Kesimpulan & Risiko", num: 3 },
    { label: "Analisis Penyebab", num: 4 },
    { label: "Intervensi", num: 5 },
    { label: "FAIR Feedback", num: 6 },
    { label: "RTL Terukur", num: 7 },
  ];

  const text = (field: "date" | "unit" | "supervisor" | "nurse_id", value: string) =>
    updateDraft(field, value);

  function goToStep(index: number) {
    if (!draft) return;
    if (index > 0 && (!draft.date || !draft.unit.trim() || !draft.nurse_id || !draft.supervisor.trim() || !draft.module_id)) {
      setError("Lengkapi informasi umum dan pilih SOP terlebih dahulu.");
      setStep(0);
    } else if (index > 1 && score.missing.length) {
      setError(`Terdapat ${score.missing.length} butir observasi yang belum dinilai. Selesaikan butir observasi terlebih dahulu.`);
      setStep(1);
    } else {
      setError("");
      setStep(index);
    }
  }

  function selectSop(moduleId: string) {
    const selectedSop = modules.find((sop) => sop.id === moduleId);
    updateDraft("module_id", moduleId || null);
    updateDraft("assessment_items", selectedSop?.assessment_items ?? []);
    updateDraft("scores", {});
    updateDraft("follow_ups", []);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Re-supervision Banner Notice */}
      {draft.parent_id && (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50/90 p-4 text-xs text-amber-900 shadow-sm dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500 text-white font-bold">
            ↻
          </span>
          <div>
            <p className="font-bold">Mode Re-Supervisi Aktif</p>
            <p className="text-[11px] text-amber-800 dark:text-amber-300">
              Supervisi ini terhubung ke supervisi induk. Status RTL temuan sebelumnya akan otomatis ditandai &ldquo;Masalah Selesai&rdquo; jika butir terkait memperoleh skor 2.
            </p>
          </div>
        </div>
      )}

      {/* Stepper Header Navigation */}
      <div className="overflow-x-auto pb-2">
        <div className="flex min-w-[680px] items-center justify-between rounded-2xl border border-slate-200/80 bg-white p-2 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {steps.map((s, index) => {
            const isCurrent = step === index;
            const isCompleted = step > index;
            return (
              <button
                key={s.label}
                onClick={() => goToStep(index)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-2.5 py-2 text-xs font-semibold transition-all ${isCurrent
                    ? "bg-emerald-600 text-white shadow-sm font-bold"
                    : isCompleted
                      ? "text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300"
                      : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                  }`}
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${isCurrent
                      ? "bg-white text-emerald-800"
                      : isCompleted
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                    }`}
                >
                  {isCompleted ? "✓" : s.num}
                </span>
                <span className="truncate">{s.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Wizard Form Content Card */}
      <section className={`${PANEL} space-y-6`}>
        {/* STEP 0: Informasi Umum */}
        {step === 0 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Tahap 1: Informasi Umum &amp; Pelaksanaan
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Lengkapi identitas unit, tanggal observasi, modul, dan perawat yang dinilai.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Tanggal Observasi <span className="text-rose-500">*</span>
                <input
                  className={`${CONTROL} mt-1.5`}
                  type="date"
                  value={draft.date}
                  onChange={(event) => text("date", event.target.value)}
                  required
                />
              </label>

              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Unit / Ruangan Rawat <span className="text-rose-500">*</span>
                <input
                  className={`${CONTROL} mt-1.5`}
                  value={draft.unit}
                  placeholder="Contoh: Ruang Melati / ICU / IGD"
                  onChange={(event) => text("unit", event.target.value)}
                  required
                />
              </label>

              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Nama Supervisor <span className="text-rose-500">*</span>
                <input
                  className={`${CONTROL} mt-1.5`}
                  value={draft.supervisor}
                  placeholder="Nama lengkap supervisor klinis"
                  onChange={(event) => text("supervisor", event.target.value)}
                  required
                />
              </label>

              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Perawat yang Disupervisi <span className="text-rose-500">*</span>
                <select
                  className={`${CONTROL} mt-1.5`}
                  value={draft.nurse_id}
                  onChange={(event) => {
                    const selected = nurses.find((nurse) => nurse.id === event.target.value);
                    text("nurse_id", event.target.value);
                    if (selected) updateDraft("unit", selected.unit);
                  }}
                  required
                >
                  <option value="">-- Pilih perawat dari direktori --</option>
                  {nurses
                    .filter((nurse) => nurse.active)
                    .map((nurse) => (
                      <option key={nurse.id} value={nurse.id}>
                        {nurse.full_name} · Unit: {nurse.unit}
                      </option>
                    ))}
                </select>
              </label>

              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                SOP / Modul Supervisi <span className="text-rose-500">*</span>
                <select
                  className={`${CONTROL} mt-1.5`}
                  value={draft.module_id ?? ""}
                  onChange={(event) => selectSop(event.target.value)}
                  required
                >
                  <option value="">-- Pilih SOP / modul yang sudah diunggah --</option>
                  {modules.map((module) => (
                    <option key={module.id} value={module.id}>
                      {module.title} · {module.category}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {draft.module_id && selectedModule && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200">
                Checklist {draft.assessment_items.length} butir dari SOP ini sudah disetujui admin saat dokumen diunggah.
              </div>
            )}

            {data.sops.length === 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
                Belum ada SOP atau modul yang diunggah. Unggah dokumen terlebih dahulu melalui menu{" "}
                <button
                  type="button"
                  className="font-bold underline"
                  onClick={() => routerPush("/sop")}
                >
                  SPO &amp; Modul
                </button>
                .
              </div>
            )}
            {data.sops.length > 0 && modules.length === 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
                SOP yang tersedia belum memiliki checklist yang disetujui. Atur checklist satu kali di menu{" "}
                <button type="button" className="font-bold underline" onClick={() => routerPush("/sop")}>
                  SPO &amp; Modul
                </button>
                .
              </div>
            )}

            {!nurses.some((nurse) => nurse.active) && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
                ⚠️ Belum ada perawat aktif di direktori. Anda dapat menambahkan perawat terlebih dahulu melalui menu <b>Perawat</b>.
              </div>
            )}

            <div className="rounded-xl bg-slate-50 p-3 text-[11px] text-slate-500 dark:bg-slate-800/40 dark:text-slate-400">
              🛡️ <b>Kerahasiaan Medis:</b> Jangan mencantumkan nomor rekam medis atau nama lengkap pasien demi perlindungan data privasi pasien.
            </div>
          </div>
        )}

        {/* STEP 1: Observasi & Scoring */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="space-y-4 border-b border-slate-100 pb-4 dark:border-slate-800">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Tahap 2: Observasi Klinis &amp; Scoring Butir
                </h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Pilih nilai: <b>0</b> (Tidak dilakukan), <b>1</b> (Kurang lengkap/Sebagian), <b>2</b> (Lengkap sesuai SPO), atau <b>N/A</b> (Tidak dapat dinilai pada kasus ini).
                </p>
                {selectedModule && (
                  <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-300">
                    Prosedur sumber: <b>{selectedModule.title}</b>
                  </p>
                )}
              </div>

              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200">
                Checklist SOP sudah disetujui admin saat dokumen diunggah. Tidak perlu verifikasi ulang pada lembar supervisi.
              </div>

              {/* Real-time score indicator */}
              <div className="ml-auto flex w-fit shrink-0 items-center gap-3 rounded-2xl bg-slate-900 px-4 py-2.5 text-white shadow-md dark:bg-slate-800">
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-400 block">Progress Penilaian</span>
                  <span className="text-sm font-extrabold">
                    {draft.assessment_items.length - score.missing.length} / {draft.assessment_items.length} terisi
                  </span>
                </div>
                <div className="border-l border-slate-700 pl-3">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Skor Kepatuhan</span>
                  <span className="text-sm font-extrabold text-emerald-400">
                    {score.percentage}%
                  </span>
                </div>
              </div>
            </div>

            {draft.assessment_items.length ? (
              <div className="space-y-3">
                {draft.assessment_items.map((item, itemIndex) => {
                    const currentValue = draft.scores[item.id];
                    return (
                      <article
                        key={item.id}
                        className={`rounded-2xl border p-4 transition-all ${currentValue !== undefined
                            ? "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60"
                            : "border-amber-200/80 bg-amber-50/20 dark:border-amber-900/40"
                          }`}
                      >
                        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-extrabold text-slate-400">
                                #{itemIndex + 1}
                              </span>
                              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                {item.title}
                              </h4>
                              {item.critical && (
                                <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                                  Kritis
                                </span>
                              )}
                            </div>
                            <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                              {item.description}
                            </p>
                          </div>

                          {/* Score selector buttons */}
                          <div className="flex shrink-0 items-center gap-1.5">
                            {([
                              { val: 0, label: "0", desc: "Tidak dilakukan", activeBg: "bg-rose-600 border-rose-600 text-white" },
                              { val: 1, label: "1", desc: "Sebagian/belum lengkap", activeBg: "bg-amber-500 border-amber-500 text-white" },
                              { val: 2, label: "2", desc: "Sesuai SPO", activeBg: "bg-emerald-600 border-emerald-600 text-white" },
                              { val: "na" as const, label: "N/A", desc: "Tidak dapat dinilai pada kasus ini", activeBg: "bg-slate-700 border-slate-700 text-white" },
                            ]).map((opt) => {
                              const isSelected = currentValue === opt.val;
                              return (
                                <button
                                  key={String(opt.val)}
                                  type="button"
                                  onClick={() =>
                                    updateDraft("scores", { ...draft.scores, [item.id]: opt.val as ScoreValue })
                                  }
                                  className={`rounded-xl border px-3 py-2 text-xs font-bold transition-all shadow-sm ${isSelected
                                      ? opt.activeBg
                                      : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                    }`}
                                  title={opt.desc}
                                >
                                  {opt.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                      </article>
                    );
                  })}
              </div>
            ) : (
              <p className="rounded-xl bg-slate-50 p-4 text-xs text-slate-500 dark:bg-slate-800/40 dark:text-slate-400">
                Checklist SOP tidak tersedia. Kembali ke tahap informasi umum dan pilih SOP dengan checklist yang sudah disetujui.
              </p>
            )}
          </div>
        )}

        {/* STEP 2: Kesimpulan Masalah & Risiko */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Tahap 3: Kesimpulan Masalah &amp; Risiko Pasien
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Analisis poin kepatuhan, temuan gap, dan tingkat risiko klinis terhadap pasien.
              </p>
            </div>

            <ScoreSummary scores={draft.scores} items={draft.assessment_items} />

            <div className="flex justify-end">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-800 border border-emerald-300 transition hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800"
                onClick={generateConclusion}
              >
                <span>⚡ Buat Rekomendasi Kesimpulan Otomatis</span>
              </button>
            </div>

            <div className="space-y-4">
              <TextArea
                label="Praktik yang Sudah Sesuai Standar SPO"
                value={draft.conclusion.ok}
                placeholder="Uraikan tahapan yang telah dikerjakan dengan sangat baik..."
                onChange={(value) => updateDraft("conclusion", { ...draft.conclusion, ok: value })}
              />
              <TextArea
                label="Temuan Masalah / Gap Kepatuhan"
                value={draft.conclusion.masalah}
                placeholder="Uraikan butir tindakan yang belum lengkap atau terlewati..."
                onChange={(value) => updateDraft("conclusion", { ...draft.conclusion, masalah: value })}
              />
              <TextArea
                label="Potensi Dampak Risiko Terhadap Keselamatan Pasien"
                value={draft.conclusion.risiko}
                placeholder="Misal: Risiko flebitis, infeksi aliran darah, atau kesalahan identifikasi..."
                onChange={(value) => updateDraft("conclusion", { ...draft.conclusion, risiko: value })}
              />
            </div>
          </div>
        )}

        {/* STEP 3: Analisis Penyebab (Fishbone) */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Tahap 4: Analisis Akar Masalah (Model Fishbone / 5 Faktor)
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Identifikasi faktor kontributor sistemik agar pembinaan bersifat suportif tanpa saling menyalahkan (*No Blame Culture*).
              </p>
            </div>

            <div className="space-y-3">
              {FACTORS.map((factor) => {
                const isChecked = Boolean(draft.causes[factor]?.on);
                return (
                  <div
                    key={factor}
                    className={`rounded-2xl border p-4 transition-all ${isChecked
                        ? "border-emerald-500 bg-emerald-50/20 shadow-sm dark:bg-emerald-950/10"
                        : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                      }`}
                  >
                    <label className="flex cursor-pointer items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(event) =>
                          updateDraft("causes", {
                            ...draft.causes,
                            [factor]: { on: event.target.checked, note: draft.causes[factor]?.note ?? "" },
                          })
                        }
                        className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        Faktor: {factor}
                      </span>
                    </label>
                    <p className="mt-1 pl-7 text-xs text-slate-500 dark:text-slate-400">
                      {FACTOR_DESCRIPTIONS[factor]}
                    </p>

                    {isChecked && (
                      <div className="mt-3 pl-7">
                        <textarea
                          className={`${CONTROL} min-h-20 text-xs`}
                          placeholder={`Jelaskan secara spesifik faktor kontributor terkait ${factor}...`}
                          value={draft.causes[factor]?.note ?? ""}
                          onChange={(event) =>
                            updateDraft("causes", {
                              ...draft.causes,
                              [factor]: { ...draft.causes[factor], note: event.target.value },
                            })
                          }
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 4: Intervensi Perbaikan */}
        {step === 4 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Tahap 5: Pilihan Bentuk Intervensi Perbaikan
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Pilih satu atau lebih bentuk pembinaan yang disepakati bersama perawat.
              </p>
            </div>

            <div className="flex flex-wrap gap-2.5">
              {INTERVENTIONS.map((intervention) => {
                const isSelected = draft.interventions.includes(intervention);
                return (
                  <button
                    key={intervention}
                    type="button"
                    onClick={() =>
                      updateDraft(
                        "interventions",
                        isSelected
                          ? draft.interventions.filter((item) => item !== intervention)
                          : [...draft.interventions, intervention]
                      )
                    }
                    className={`rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all ${isSelected
                        ? "border-emerald-600 bg-emerald-600 text-white shadow-sm"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      }`}
                  >
                    {isSelected ? "✓ " : "+ "}
                    {intervention}
                  </button>
                );
              })}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Bentuk Intervensi Terpilih:
              </span>
              <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                {draft.interventions.length > 0
                  ? draft.interventions.join(" · ")
                  : "Belum ada intervensi dipilih (Klik opsi di atas)"}
              </p>
            </div>
          </div>
        )}

        {/* STEP 5: FAIR Feedback Model */}
        {step === 5 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Tahap 6: Umpan Balik Model FAIR
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                <b>F</b> (Fact), <b>A</b> (Analysis), <b>I</b> (Improvement), <b>R</b> (Review).
              </p>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-800 border border-emerald-300 transition hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800"
                onClick={generateFair}
              >
                <span>⚡ Generate Feedback FAIR Otomatis</span>
              </button>
            </div>

            <div className="space-y-4">
              <TextArea
                label="F - Fact: Fakta Objektif yang Diamati Saat Observasi"
                value={draft.fair.F}
                placeholder="Fakta tindakan yang teramati..."
                onChange={(value) => updateDraft("fair", { ...draft.fair, F: value })}
              />
              <TextArea
                label="A - Analysis: Analisis Dampak Risiko & Faktor Kontributor"
                value={draft.fair.A}
                placeholder="Dampak temuan terhadap keselamatan..."
                onChange={(value) => updateDraft("fair", { ...draft.fair, A: value })}
              />
              <TextArea
                label="I - Improvement: Komitmen & Rencana Peningkatan yang Disepakati"
                value={draft.fair.I}
                placeholder="Rencana aksi perbaikan yang disepakati bersama..."
                onChange={(value) => updateDraft("fair", { ...draft.fair, I: value })}
              />
              <TextArea
                label="R - Review: Periode Monitoring dan Kesepakatan Jadwal Evaluasi"
                value={draft.fair.R}
                placeholder="Jadwal pengawasan ulang..."
                onChange={(value) => updateDraft("fair", { ...draft.fair, R: value })}
              />

              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Target Tanggal Review / Evaluasi Ulang
                <input
                  type="date"
                  className={`${CONTROL} mt-1.5`}
                  value={draft.fair.review}
                  onChange={(event) => updateDraft("fair", { ...draft.fair, review: event.target.value })}
                />
              </label>

              <section className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Tanda Tangan Digital</h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Tanda tangan disimpan bersama lembar supervisi dan ikut tampil pada hasil cetak/PDF.
                  </p>
                </div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Nama penanda tangan
                  <input
                    className={`${CONTROL} mt-1.5`}
                    value={draft.fair.signatureName ?? ""}
                    onChange={(event) =>
                      updateDraft("fair", { ...draft.fair, signatureName: event.target.value })
                    }
                    placeholder="Masukkan nama penanda tangan"
                    required
                  />
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={draft.fair.signatureMode !== "type" ? BUTTON : SECONDARY}
                    onClick={() =>
                      updateDraft("fair", { ...draft.fair, signatureMode: "draw" })
                    }
                  >
                    Gambar tanda tangan
                  </button>
                  <button
                    type="button"
                    className={draft.fair.signatureMode === "type" ? BUTTON : SECONDARY}
                    onClick={() =>
                      updateDraft("fair", { ...draft.fair, signatureMode: "type" })
                    }
                  >
                    Ketik tanda tangan
                  </button>
                </div>
                {draft.fair.signatureMode === "type" ? (
                  <div className="flex min-h-36 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 dark:border-slate-600">
                    <span className="font-serif text-3xl italic text-slate-900 dark:text-slate-900">
                      {draft.fair.signatureName || "Nama penanda tangan"}
                    </span>
                  </div>
                ) : (
                  <DigitalSignature
                    value={draft.fair.signatureData ?? ""}
                    onChange={(signatureData) =>
                      updateDraft("fair", { ...draft.fair, signatureData })
                    }
                  />
                )}
              </section>
            </div>
          </div>
        )}

        {/* STEP 6: RTL Terukur */}
        {step === 6 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Tahap 7: Rencana Tindak Lanjut (RTL) Terukur
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Setiap temuan wajib memiliki PIC, target penyelesaian, dan metode evaluasi terukur.
              </p>
            </div>

            <div className="flex flex-wrap gap-2.5">
              <button className={BUTTON} onClick={generateRtl}>
                ⚡ Buat RTL Otomatis ({score.findings.length} temuan)
              </button>
              <button
                className={SECONDARY}
                onClick={() =>
                  updateDraft("follow_ups", [
                    ...draft.follow_ups,
                    {
                      item_id: null,
                      problem: "",
                      cause: "",
                      intervention: "",
                      pic: "Kepala Ruangan",
                      target: "100%",
                      due_date: addDays(draft.date, 7),
                      evaluation: "Supervisi ulang",
                      status: "Belum ditindaklanjuti",
                    },
                  ])
                }
              >
                Tambah RTL Manual
              </button>
            </div>

            {!draft.follow_ups.length ? (
              <EmptyState text="Belum ada item RTL. Klik tombol di atas untuk membuat RTL otomatis dari temuan observasi." />
            ) : (
              <div className="space-y-4">
                {draft.follow_ups.map((row, index) => (
                  <div
                    key={`${row.item_id ?? "manual"}-${index}`}
                    className="space-y-3.5 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-900/50"
                  >
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2.5 dark:border-slate-800">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        RTL Temuan #{index + 1}
                      </span>
                      <button
                        className="text-xs font-bold text-rose-600 hover:underline"
                        onClick={() =>
                          updateDraft(
                            "follow_ups",
                            draft.follow_ups.filter((_, rowIndex) => rowIndex !== index)
                          )
                        }
                      >
                        Hapus Baris RTL
                      </button>
                    </div>

                    <TextArea
                      label="Uraian Masalah"
                      value={row.problem}
                      onChange={(value) => updateFollowUp(index, "problem", value)}
                    />
                    <TextArea
                      label="Akar Masalah"
                      value={row.cause}
                      onChange={(value) => updateFollowUp(index, "cause", value)}
                    />
                    <TextArea
                      label="Bentuk Tindakan / Intervensi"
                      value={row.intervention}
                      onChange={(value) => updateFollowUp(index, "intervention", value)}
                    />

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Penanggung Jawab (PIC)
                        <input
                          className={`${CONTROL} mt-1`}
                          value={row.pic}
                          onChange={(event) => updateFollowUp(index, "pic", event.target.value)}
                        />
                      </label>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Target Capaian
                        <input
                          className={`${CONTROL} mt-1`}
                          value={row.target}
                          onChange={(event) => updateFollowUp(index, "target", event.target.value)}
                        />
                      </label>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Batas Waktu (Due Date)
                        <input
                          type="date"
                          className={`${CONTROL} mt-1`}
                          value={row.due_date ?? ""}
                          onChange={(event) => updateFollowUp(index, "due_date", event.target.value)}
                        />
                      </label>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Metode Evaluasi
                        <input
                          className={`${CONTROL} mt-1`}
                          value={row.evaluation}
                          onChange={(event) => updateFollowUp(index, "evaluation", event.target.value)}
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Stepper Navigation Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          className={SECONDARY}
          disabled={step === 0}
          onClick={() => {
            setError("");
            setStep(Math.max(0, step - 1));
          }}
        >
          ← Kembali
        </button>

        <div className="flex items-center gap-2">
          <button
            className={SECONDARY}
            onClick={() => {
              if (window.confirm("Batalkan draf supervisi saat ini?")) {
                setDraft(null);
                setStep(0);
                setError("");
              }
            }}
          >
            Batalkan
          </button>

          {step < 6 ? (
            <button
              className={BUTTON}
              onClick={() => {
                if (step === 0 && (!draft.date || !draft.unit.trim() || !draft.nurse_id || !draft.supervisor.trim() || !draft.module_id)) {
                  setError("Lengkapi tanggal, unit, nama supervisor, perawat, dan modul terlebih dahulu.");
                  return;
                }
                if (step === 0 && !draft.assessment_items.length) {
                  setError("SOP yang dipilih belum memiliki checklist yang disetujui. Atur checklist di menu SPO & Modul.");
                  return;
                }
                if (step === 1 && score.missing.length) {
                  setError(`Terdapat ${score.missing.length} butir observasi yang belum dinilai. Selesaikan butir observasi terlebih dahulu.`);
                  return;
                }
                if (step === 5 && !hasDigitalSignature(draft.fair)) {
                  setError("Isi nama penanda tangan dan gambar atau ketik tanda tangan sebelum melanjutkan.");
                  return;
                }
                setError("");
                setStep(step + 1);
              }}
            >
              Lanjut ke Tahap {step + 2} →
            </button>
          ) : (
            <button className={BUTTON} disabled={busy} onClick={() => void saveDraft()}>
              {busy ? "Menyimpan ke Database…" : "✓ Simpan & Terbitkan Supervisi"}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200"
        >
          <span>{error}</span>
          <button onClick={() => setError("")} className="text-sm font-bold">
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
