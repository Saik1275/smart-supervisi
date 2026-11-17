"use client";

import { useId, useMemo, useRef, useState } from "react";
import type { DragEvent, FormEvent } from "react";
import { formatDate } from "../../../lib/scoring";
import type { AssessmentItem } from "../../../lib/instruments";
import { extractSopProcedureItems } from "../../../lib/supabase/extract-sop-procedure";
import {
  deleteSopPdf,
  getSopSignedUrl,
  isModuleDocument,
  toggleSopPublished,
  updateSopAssessmentItems,
  updateSopDocument,
  uploadSopPdf,
} from "../../../lib/supabase/sop-documents";
import { getSupabaseBrowserClient } from "../../../lib/supabase/browser";
import { useSupervisi, type Sop } from "../context";
import { BUTTON, CONTROL, EmptyState, PANEL, SECONDARY, StatusPill } from "../ui";

const CATEGORY_PRESETS = [
  "Keperawatan Dasar",
  "Pemasangan Infus (IV)",
  "Pencegahan Infeksi (PPI)",
  "Patient Safety",
  "Modul Pelatihan Klinis",
];

function AssessmentChecklistEditor({
  items,
  onChange,
  reviewed,
  onConfirm,
  onEdit,
  disabled = false,
  title = "Periksa checklist hasil ekstraksi SOP",
  description = "Pastikan langkah hasil ekstraksi sesuai isi PDF. Edit, hapus, tambahkan langkah yang terlewat, dan tandai langkah kritis. PDF hasil scan tanpa teks perlu diisi manual.",
}: {
  items: AssessmentItem[];
  onChange: (items: AssessmentItem[]) => void;
  reviewed: boolean;
  onConfirm: () => void;
  onEdit: () => void;
  disabled?: boolean;
  title?: string;
  description?: string;
}) {
  function addItem() {
    if (items.length >= 50) return;
    onChange([
      ...items,
      {
        id: `sop_manual_${crypto.randomUUID()}`,
        title: "",
        description: "Nilai pelaksanaan langkah ini sesuai urutan dan ketentuan dalam SOP.",
      },
    ]);
  }

  function moveItem(index: number, direction: "up" | "down") {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;
    const newItems = [...items];
    const [removed] = newItems.splice(index, 1);
    newItems.splice(targetIndex, 0, removed);
    onChange(newItems);
  }

  return (
    <section className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-900/60 dark:bg-amber-950/20">
      <div>
        <h4 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h4>
        <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
          {description}
        </p>
      </div>
      {!items.length && (
        <p className="rounded-lg bg-white/70 p-3 text-xs text-amber-900 dark:bg-slate-900/60 dark:text-amber-200">
          Belum ada langkah yang terbaca. Tambahkan langkah prosedur dari SOP secara manual.
        </p>
      )}
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={item.id} className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900 sm:flex-row sm:items-start">
            <div className="flex shrink-0 items-center gap-1 sm:pt-2">
              <span className="text-xs font-bold text-slate-400">#{index + 1}</span>
              {!reviewed && (
                <div className="flex flex-col">
                  <button
                    type="button"
                    disabled={disabled || index === 0}
                    onClick={() => moveItem(index, "up")}
                    className="rounded px-1 py-0 text-[10px] text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-20 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                    title="Geser langkah ke atas"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    disabled={disabled || index === items.length - 1}
                    onClick={() => moveItem(index, "down")}
                    className="rounded px-1 py-0 text-[10px] text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-20 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                    title="Geser langkah ke bawah"
                  >
                    ▼
                  </button>
                </div>
              )}
            </div>
            <textarea
              className={`${CONTROL} min-h-16 resize-y`}
              aria-label={`Langkah prosedur ${index + 1}`}
              value={item.title}
              disabled={disabled || reviewed}
              onChange={(event) => onChange(items.map((current) =>
                current.id === item.id ? { ...current, title: event.target.value } : current
              ))}
            />
            <label className="flex shrink-0 items-center gap-1.5 pt-2 text-xs font-semibold text-rose-700 dark:text-rose-300">
              <input
                type="checkbox"
                checked={Boolean(item.critical)}
                disabled={disabled || reviewed}
                onChange={(event) => onChange(items.map((current) =>
                  current.id === item.id ? { ...current, critical: event.target.checked } : current
                ))}
              />
              Kritis
            </label>
            {!reviewed && (
              <button
                type="button"
                disabled={disabled}
                className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50 dark:hover:bg-rose-950/40"
                onClick={() => onChange(items.filter((current) => current.id !== item.id))}
              >
                Hapus
              </button>
            )}
          </div>
        ))}
      </div>
      {!reviewed && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={SECONDARY}
            disabled={disabled || items.length >= 50}
            onClick={addItem}
          >
            + Tambah langkah
          </button>
          <button
            type="button"
            className={BUTTON}
            disabled={disabled || !items.length || items.some((item) => !item.title.trim())}
            onClick={onConfirm}
          >
            ✓ Checklist sudah sesuai SOP
          </button>
        </div>
      )}
      {reviewed && (
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            Checklist telah disetujui dan siap digunakan saat supervisi.
          </p>
          <button type="button" className={SECONDARY} disabled={disabled} onClick={onEdit}>
            Ubah checklist
          </button>
        </div>
      )}
    </section>
  );
}

export function SopPage() {
  const { data, isAdmin, user, setError, setNotice, refreshData, setLoginOpen } = useSupervisi();
  const supabase = getSupabaseBrowserClient();
  const titleInputId = useId();
  const categoryInputId = useId();
  const descriptionInputId = useId();
  const fileInputId = useId();
  const publishInputId = useId();
  const fileRequest = useRef(0);

  const [busy, setBusy] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [form, setForm] = useState({
    title: "",
    category: "Keperawatan Dasar",
    description: "",
    published: true,
  });
  const [file, setFile] = useState<File | null>(null);
  const [assessmentItems, setAssessmentItems] = useState<AssessmentItem[]>([]);
  const [assessmentReviewed, setAssessmentReviewed] = useState(false);
  const [extractingAssessment, setExtractingAssessment] = useState(false);
  const [assessmentError, setAssessmentError] = useState("");
  const [editingSopId, setEditingSopId] = useState<string | null>(null);
  const [editingForm, setEditingForm] = useState({
    title: "",
    category: "Keperawatan Dasar",
    description: "",
  });
  const [editingChecklistItems, setEditingChecklistItems] = useState<AssessmentItem[]>([]);
  const [editingChecklistReviewed, setEditingChecklistReviewed] = useState(false);
  const [editingChecklistBusy, setEditingChecklistBusy] = useState(false);
  const [viewingChecklistId, setViewingChecklistId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // PDF Viewer states
  const [inlinePdfId, setInlinePdfId] = useState<string | null>(null);
  const [modalPdfUrl, setModalPdfUrl] = useState<{ url: string; title: string } | null>(null);
  const [pdfUrls, setPdfUrls] = useState<Record<string, string>>({});
  const [loadingPdfId, setLoadingPdfId] = useState<string | null>(null);

  async function resolvePdfUrl(sop: Sop): Promise<string | null> {
    if (pdfUrls[sop.id]) return pdfUrls[sop.id];
    if (!supabase) return null;

    setLoadingPdfId(sop.id);
    try {
      const url = await getSopSignedUrl(supabase, sop.storage_path);
      setPdfUrls((prev) => ({ ...prev, [sop.id]: url }));
      return url;
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Dokumen SPO/Modul tidak dapat dibuka.");
      return null;
    } finally {
      setLoadingPdfId(null);
    }
  }

  async function handleToggleInlinePdf(sop: Sop) {
    if (inlinePdfId === sop.id) {
      setInlinePdfId(null);
      return;
    }
    const url = await resolvePdfUrl(sop);
    if (url) {
      setInlinePdfId(sop.id);
    }
  }

  async function handleOpenModalPdf(sop: Sop) {
    const url = await resolvePdfUrl(sop);
    if (url) {
      setModalPdfUrl({ url, title: sop.title });
    }
  }

  async function handleFileSelect(selectedFile: File | null) {
    const request = ++fileRequest.current;
    if (!selectedFile) return;
    if (selectedFile.type !== "application/pdf" || !selectedFile.name.toLowerCase().endsWith(".pdf")) {
      setFile(null);
      setAssessmentItems([]);
      setAssessmentReviewed(false);
      setExtractingAssessment(false);
      setAssessmentError("");
      setError("Format file tidak didukung. Harap pilih dokumen berformat PDF.");
      return;
    }
    if (selectedFile.size === 0 || selectedFile.size > 3 * 1024 * 1024) {
      setFile(null);
      setAssessmentItems([]);
      setAssessmentReviewed(false);
      setExtractingAssessment(false);
      setAssessmentError("");
      setError("Ukuran file harus lebih dari 0 dan maksimum 3 MB.");
      return;
    }
    setError("");
    setFile(selectedFile);
    setAssessmentItems([]);
    setAssessmentReviewed(false);
    setAssessmentError("");
    setExtractingAssessment(true);
    if (!form.title.trim()) {
      const cleanName = selectedFile.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
      setForm((prev) => ({ ...prev, title: cleanName }));
    }
    const objectUrl = URL.createObjectURL(selectedFile);
    try {
      const extracted = await extractSopProcedureItems(objectUrl);
      if (request !== fileRequest.current) return;
      setAssessmentItems(extracted);
      if (!extracted.length) {
        setAssessmentError("Tidak ada langkah yang dapat diekstrak. Jika PDF berupa scan, tambahkan butir secara manual.");
      }
    } catch (reason) {
      if (request !== fileRequest.current) return;
      setAssessmentError(reason instanceof Error ? reason.message : "Ekstraksi teks SOP gagal.");
    } finally {
      URL.revokeObjectURL(objectUrl);
      if (request === fileRequest.current) setExtractingAssessment(false);
    }
  }

  function onDropFile(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0] ?? null;
    void handleFileSelect(droppedFile);
  }

  async function saveSop(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !user || !isAdmin) return;
    if (!file) {
      setError("Pilih file PDF terlebih dahulu.");
      return;
    }
    if (!form.title.trim()) {
      setError("Judul dokumen SPO/Modul wajib diisi.");
      return;
    }
    if (extractingAssessment) {
      setError("Tunggu sampai ekstraksi teks SOP selesai.");
      return;
    }
    if (!assessmentReviewed || !assessmentItems.length || assessmentItems.some((item) => !item.title.trim())) {
      setError("Periksa dan setujui checklist SOP sebelum mengunggah dokumen.");
      return;
    }
    if (assessmentItems.length > 50 || new Set(assessmentItems.map((item) => item.id)).size !== assessmentItems.length) {
      setError("Checklist harus berisi maksimal 50 butir dengan ID unik.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await uploadSopPdf(supabase, user, { ...form, assessment_items: assessmentItems }, file);
      setForm({ title: "", category: "Keperawatan Dasar", description: "", published: true });
      setFile(null);
      setAssessmentItems([]);
      setAssessmentReviewed(false);
      setShowUploadForm(false);
      await refreshData();
      setNotice("Dokumen SPO/Modul berhasil diunggah.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Upload dokumen SPO gagal.");
    } finally {
      setBusy(false);
    }
  }

  function startEditingSop(sop: Sop) {
    setEditingSopId(sop.id);
    setEditingForm({
      title: sop.title,
      category: sop.category,
      description: sop.description || "",
    });
    const items: AssessmentItem[] = Array.isArray(sop.assessment_items) && sop.assessment_items.length > 0
      ? JSON.parse(JSON.stringify(sop.assessment_items))
      : [];
    setEditingChecklistItems(items);
    setEditingChecklistReviewed(false);
    setAssessmentError("");
    if (viewingChecklistId === sop.id) {
      setViewingChecklistId(null);
    }
  }

  function cancelEditing() {
    setEditingSopId(null);
    setEditingForm({ title: "", category: "Keperawatan Dasar", description: "" });
    setEditingChecklistItems([]);
    setEditingChecklistReviewed(false);
    setAssessmentError("");
  }

  async function saveEditedSop(sopId: string) {
    if (!supabase || !isAdmin) return;
    if (!editingForm.title.trim()) {
      setError("Judul dokumen SPO/Modul wajib diisi.");
      return;
    }
    if (!editingForm.category.trim()) {
      setError("Kategori dokumen wajib diisi.");
      return;
    }
    if (!editingChecklistItems.length) {
      setError("Checklist SOP harus memiliki minimal 1 langkah prosedur.");
      return;
    }
    if (editingChecklistItems.some((item) => !item.title.trim())) {
      setError("Semua butir langkah prosedur harus memiliki uraian (tidak boleh kosong).");
      return;
    }
    if (
      editingChecklistItems.length > 50 ||
      new Set(editingChecklistItems.map((item) => item.id)).size !== editingChecklistItems.length
    ) {
      setError("Checklist harus berisi maksimal 50 butir dengan ID unik.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      await updateSopDocument(supabase, sopId, {
        title: editingForm.title,
        category: editingForm.category,
        description: editingForm.description,
        assessment_items: editingChecklistItems,
      });
      setEditingSopId(null);
      setEditingChecklistReviewed(false);
      await refreshData();
      setNotice(`Dokumen dan isi langkah SPO "${editingForm.title}" berhasil diperbarui.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Gagal menyimpan perubahan SPO.");
    } finally {
      setBusy(false);
    }
  }

  async function reExtractExistingSop(sop: Sop) {
    if (!supabase || !isAdmin) return;
    if (
      editingChecklistItems.length > 0 &&
      !window.confirm(
        "Ekstraksi ulang akan membaca kembali teks dari berkas PDF asli dan menggantikan butir langkah saat ini. Lanjutkan?"
      )
    ) {
      return;
    }

    setEditingChecklistBusy(true);
    setAssessmentError("");
    try {
      const url = await getSopSignedUrl(supabase, sop.storage_path);
      const extracted = await extractSopProcedureItems(url);
      setEditingChecklistItems(extracted);
      setEditingChecklistReviewed(false);
      if (!extracted.length) {
        setAssessmentError(
          "Tidak ada langkah yang dapat diekstrak dari PDF. Anda dapat menambahkan butir langkah secara manual."
        );
      }
    } catch (reason) {
      setAssessmentError(reason instanceof Error ? reason.message : "Ekstraksi teks SOP gagal.");
    } finally {
      setEditingChecklistBusy(false);
    }
  }

  async function togglePublish(sop: Sop) {
    if (!supabase || !isAdmin) return;
    setBusy(true);
    try {
      const newStatus = !(sop.published ?? true);
      await toggleSopPublished(supabase, sop.id, newStatus);
      await refreshData();
      setNotice(`Dokumen "${sop.title}" ${newStatus ? "sekarang ditampilkan ke perawat" : "disembunyikan (khusus admin)"}.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Gagal memperbarui status publikasi dokumen.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteSop(sop: Sop) {
    if (!supabase || !isAdmin || !window.confirm(`Hapus dokumen "${sop.title}"? Dokumen PDF yang dihapus tidak dapat dipulihkan.`)) return;
    setBusy(true);
    try {
      await deleteSopPdf(supabase, sop.id, sop.storage_path);
      if (inlinePdfId === sop.id) setInlinePdfId(null);
      if (modalPdfUrl && modalPdfUrl.title === sop.title) setModalPdfUrl(null);
      if (editingSopId === sop.id) cancelEditing();
      if (viewingChecklistId === sop.id) setViewingChecklistId(null);
      await refreshData();
      setNotice("Dokumen SPO berhasil dihapus.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Dokumen SPO gagal dihapus.");
    } finally {
      setBusy(false);
    }
  }

  // Filter & Search logic
  const filteredSops = useMemo(() => {
    return data.sops.filter((sop) => {
      // Tab filter
      if (activeTab === "sop" && !sop.title.toLowerCase().includes("spo") && !sop.category.toLowerCase().includes("spo")) {
        return false;
      }
      if (activeTab === "modul" && !isModuleDocument(sop)) {
        return false;
      }
      if (activeTab === "hidden" && (sop.published !== false)) {
        return false;
      }

      // Search query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        sop.title.toLowerCase().includes(q) ||
        sop.category.toLowerCase().includes(q) ||
        sop.description.toLowerCase().includes(q) ||
        sop.file_name.toLowerCase().includes(q)
      );
    });
  }, [data.sops, activeTab, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Panduan &amp; Daftar SPO Keperawatan
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Akses dokumen Standar Prosedur Operasional (SPO) dan Modul Pelatihan Keperawatan terverifikasi.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {isAdmin ? (
            <button
              onClick={() => setShowUploadForm(!showUploadForm)}
              className={`${BUTTON} flex items-center gap-2 shadow-sm`}
            >
              <span>{showUploadForm ? "Tutup Form Upload" : "+ Upload Dokumen (PDF)"}</span>
            </button>
          ) : (
            <button
              onClick={() => setLoginOpen(true)}
              className={`${SECONDARY} flex items-center gap-2 text-emerald-700 hover:border-emerald-600 hover:text-emerald-800 dark:text-emerald-400`}
              title="Masuk sebagai administrator untuk mengunggah dokumen SPO"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Login Admin untuk Upload</span>
            </button>
          )}
        </div>
      </div>

      {/* Mode Information Banner for Non-Admin */}
      {!isAdmin && (
        <div className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50/70 to-teal-50/50 p-4 text-xs text-emerald-950 sm:flex-row sm:items-center dark:border-emerald-900/60 dark:from-emerald-950/30 dark:to-teal-950/20 dark:text-emerald-200">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold">
              P
            </span>
            <div>
              <p className="font-bold text-sm text-emerald-900 dark:text-emerald-100">
                Mode Akses Baca Perawat (Read-only)
              </p>
              <p className="text-emerald-700 dark:text-emerald-300">
                Anda dapat membaca dan menampilkan seluruh dokumen SPO dan Modul aktif. Untuk mengunggah dokumen PDF baru, silakan masuk sebagai Administrator.
              </p>
            </div>
          </div>
          <button
            onClick={() => setLoginOpen(true)}
            className="shrink-0 rounded-lg bg-emerald-600 px-3 py-1.5 font-semibold text-white shadow-sm transition hover:bg-emerald-700"
          >
            Masuk sebagai Admin
          </button>
        </div>
      )}

      {/* Upload Form (for Admin or triggered by user) */}
      {isAdmin && showUploadForm && (
        <form
          className={`${PANEL} space-y-4 border-emerald-300/70 bg-emerald-50/20 dark:border-emerald-800/80 dark:bg-slate-900/80`}
          onSubmit={(event) => void saveSop(event)}
        >
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-3 dark:border-slate-700">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Upload Dokumen SPO / Modul PDF
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                File PDF akan disimpan di bucket privat dan dapat ditampilkan langsung di halaman ini. Ukuran maksimum 3 MB.
              </p>
            </div>
            <button
              type="button"
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold"
              onClick={() => setShowUploadForm(false)}
            >
              ✕
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label htmlFor={titleInputId} className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Judul Dokumen SPO / Modul <span className="text-rose-500">*</span>
              <input
                id={titleInputId}
                className={`${CONTROL} mt-1`}
                placeholder="Contoh: SPO Pemasangan Infus (IV) atau Modul Patient Safety"
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                required
              />
            </label>

            <div>
              <label htmlFor={categoryInputId} className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Kategori Dokumen <span className="text-rose-500">*</span>
                <input
                  id={categoryInputId}
                  className={`${CONTROL} mt-1`}
                  value={form.category}
                  onChange={(event) => setForm({ ...form, category: event.target.value })}
                  placeholder="Kategori dokumen"
                  required
                />
              </label>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {CATEGORY_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setForm({ ...form, category: preset })}
                    className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <label htmlFor={descriptionInputId} className="text-xs font-semibold text-slate-700 dark:text-slate-300 sm:col-span-2">
              Deskripsi Singkat / Catatan Versi (Opsional)
              <textarea
                id={descriptionInputId}
                className={`${CONTROL} mt-1 min-h-20`}
                placeholder="Jelaskan ringkasan prosedur, nomor revisi, atau unit target dokumen ini..."
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
              />
            </label>

            {/* Drag & Drop File Upload Area */}
            <div className="sm:col-span-2">
              <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Berkas PDF (Maksimal 3 MB) <span className="text-rose-500">*</span>
              </span>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onDropFile}
                className={`mt-1.5 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 transition ${isDragging
                  ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30"
                  : file
                    ? "border-emerald-300 bg-emerald-50/40 dark:border-emerald-800 dark:bg-emerald-950/20"
                    : "border-slate-300 bg-slate-50/50 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/50"
                  }`}
              >
                {file ? (
                  <div className="flex flex-col items-center text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="mt-2 text-sm font-bold text-slate-800 dark:text-slate-100">{file.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Ukuran: {(file.size / (1024 * 1024)).toFixed(2)} MB · Format PDF Valid
                    </p>
                    <div className="mt-3 flex gap-2">
                      <label htmlFor={fileInputId} className="cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200">
                        Ganti File
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          fileRequest.current += 1;
                          setFile(null);
                          setAssessmentItems([]);
                          setAssessmentReviewed(false);
                          setExtractingAssessment(false);
                          setAssessmentError("");
                        }}
                        className="rounded-lg px-3 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-center">
                    <svg className="h-10 w-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                      Tarik dan lepas file PDF ke sini, atau{" "}
                      <label htmlFor={fileInputId} className="cursor-pointer text-emerald-600 underline hover:text-emerald-700 dark:text-emerald-400">
                        pilih dari komputer
                      </label>
                    </p>
                    <p className="mt-1 text-xs text-slate-400">Hanya dokumen PDF (maks. 3 MB)</p>
                  </div>
                )}
                <input
                  id={fileInputId}
                  className="hidden"
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={(event) => {
                    const selectedFile = event.target.files?.[0] ?? null;
                    event.currentTarget.value = "";
                    void handleFileSelect(selectedFile);
                  }}
                />
              </div>
            </div>

            {extractingAssessment && (
              <p className="sm:col-span-2 rounded-xl border border-sky-200 bg-sky-50 p-3 text-xs text-sky-900 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-200">
                Mengekstrak langkah dari PDF di browser. Berkas belum diunggah ke server.
              </p>
            )}
            {assessmentError && !editingSopId && (
              <p className="sm:col-span-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
                {assessmentError}
              </p>
            )}
            {file && !extractingAssessment && (
              <div className="sm:col-span-2">
                <AssessmentChecklistEditor
                  items={assessmentItems}
                  onChange={(items) => {
                    setAssessmentItems(items);
                    setAssessmentReviewed(false);
                  }}
                  reviewed={assessmentReviewed}
                  onConfirm={() => setAssessmentReviewed(true)}
                  onEdit={() => setAssessmentReviewed(false)}
                />
              </div>
            )}

            {/* Publication Visibility Option */}
            <div className="sm:col-span-2 rounded-xl border border-slate-200 bg-white p-3.5 dark:border-slate-700 dark:bg-slate-900">
              <label htmlFor={publishInputId} className="flex cursor-pointer items-start gap-3">
                <input
                  id={publishInputId}
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  checked={form.published}
                  onChange={(e) => setForm({ ...form, published: e.target.checked })}
                />
                <span className="text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    Tampilkan langsung ke seluruh perawat (Publik)
                  </span>
                  <span className="block text-slate-500 dark:text-slate-400">
                    Bila dicentang, dokumen langsung dapat dibaca oleh staf perawat. Jika dimatikan, dokumen tersimpan sebagai draf dan hanya terlihat oleh administrator.
                  </span>
                </span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              className={SECONDARY}
              onClick={() => setShowUploadForm(false)}
              disabled={busy}
            >
              Batal
            </button>
            <button className={BUTTON} disabled={
              busy || extractingAssessment || !file || !assessmentReviewed ||
              !assessmentItems.length || assessmentItems.some((item) => !item.title.trim())
            }>
              {busy ? "Mengunggah PDF ke Server…" : "Simpan & Upload PDF"}
            </button>
          </div>
        </form>
      )}

      {/* Main Section: Daftar Dokumen SPO & Modul */}
      <section className={`${PANEL} space-y-4`}>
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Daftar Dokumen SPO &amp; Modul Aktif
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {data.sops.length} dokumen tersimpan. Klik &ldquo;Tampilkan PDF&rdquo; untuk membaca dokumen langsung.
            </p>
          </div>

          {/* Search Box */}
          <div className="w-full sm:w-64">
            <input
              type="text"
              placeholder="Cari judul atau kategori..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`${CONTROL} text-xs py-2`}
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 pb-3 text-xs dark:border-slate-700">
          <button
            onClick={() => setActiveTab("all")}
            className={`rounded-lg px-3 py-1.5 font-semibold transition ${activeTab === "all"
              ? "bg-slate-900 text-white dark:bg-emerald-600 dark:text-white"
              : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
          >
            Semua Dokumen ({data.sops.length})
          </button>
          <button
            onClick={() => setActiveTab("sop")}
            className={`rounded-lg px-3 py-1.5 font-semibold transition ${activeTab === "sop"
              ? "bg-slate-900 text-white dark:bg-emerald-600 dark:text-white"
              : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
          >
            SPO Keperawatan
          </button>
          <button
            onClick={() => setActiveTab("modul")}
            className={`rounded-lg px-3 py-1.5 font-semibold transition ${activeTab === "modul"
              ? "bg-slate-900 text-white dark:bg-emerald-600 dark:text-white"
              : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
          >
            Modul Pelatihan
          </button>
          {isAdmin && (
            <button
              onClick={() => setActiveTab("hidden")}
              className={`rounded-lg px-3 py-1.5 font-semibold transition ${activeTab === "hidden"
                ? "bg-amber-600 text-white"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
            >
              Draf / Disembunyikan ({data.sops.filter((s) => s.published === false).length})
            </button>
          )}
        </div>

        {/* Document List */}
        {!filteredSops.length ? (
          <div className="space-y-3">
            <EmptyState
              text={
                data.sops.length === 0
                  ? "Belum ada dokumen SPO atau modul yang diunggah. Administrator dapat menambahkan dokumen baru menggunakan tombol upload di atas."
                  : "Tidak ditemukan dokumen SPO/Modul yang sesuai dengan filter pencarian."
              }
            />
            {data.sops.length === 0 && (
              <div className="flex justify-center">
                {isAdmin ? (
                  <button
                    onClick={() => setShowUploadForm(true)}
                    className={`${BUTTON} text-xs`}
                  >
                    + Unggah Dokumen SPO Pertama
                  </button>
                ) : (
                  <button
                    onClick={() => setLoginOpen(true)}
                    className={`${SECONDARY} text-xs`}
                  >
                    Masuk sebagai Admin untuk Mengunggah
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSops.map((sop) => {
              const isInlineOpen = inlinePdfId === sop.id;
              const isPdfLoading = loadingPdfId === sop.id;
              const isPublished = sop.published ?? true;

              return (
                <article
                  key={sop.id}
                  className={`min-w-0 overflow-hidden rounded-2xl border transition ${isInlineOpen}
                    ? "border-emerald-500 bg-white shadow-md dark:border-emerald-600 dark:bg-slate-900"
                    : "border-slate-200 bg-slate-50/60 hover:border-slate-300 dark:border-slate-700/80 dark:bg-slate-900/50"
                    } p-4 sm:p-5`}
                >
                  <div className="flex min-w-0 flex-col justify-between gap-4 sm:flex-row sm:items-start">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusPill>{sop.category}</StatusPill>
                        {isPublished ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Ditampilkan (Publik)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700 border border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                            Disembunyikan (Draf Admin)
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-0.5 text-[11px] font-semibold text-sky-700 border border-sky-200/60 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/40">
                          {sop.assessment_items?.length ?? 0} Langkah SPO
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          Diperbarui: {formatDate(sop.updated_on)}
                        </span>
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                          {sop.file_name} · {Math.round(sop.file_size / 1024)} KB
                        </span>
                      </div>

                      <h4 className="mt-2 text-base font-bold text-slate-900 dark:text-white">
                        {sop.title}
                      </h4>

                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                        {sop.description || "Tidak ada deskripsi tambahan."}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex min-w-0 shrink-0 flex-wrap items-center gap-2 sm:max-w-[46%]">
                      {/* Toggle Inline Preview */}
                      <button
                        className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition ${isInlineOpen
                          ? "bg-slate-900 text-white dark:bg-slate-700 dark:text-white"
                          : "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                          }`}
                        onClick={() => void handleToggleInlinePdf(sop)}
                        disabled={isPdfLoading}
                      >
                        {isPdfLoading ? "Memuat…" : isInlineOpen ? "✕ Sembunyikan PDF" : "Tampilkan PDF"}
                      </button>

                      {/* Open Fullscreen Modal */}
                      <button
                        className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                        onClick={() => void handleOpenModalPdf(sop)}
                        title="Buka PDF di tampilan layar penuh"
                      >
                        Layar Penuh
                      </button>

                      {/* Toggle View Checklist */}
                      <button
                        className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                          viewingChecklistId === sop.id && editingSopId !== sop.id
                            ? "bg-slate-900 text-white dark:bg-slate-700"
                            : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                        }`}
                        onClick={() => {
                          setViewingChecklistId(viewingChecklistId === sop.id ? null : sop.id);
                        }}
                        title="Lihat butir langkah prosedur checklist SPO"
                      >
                        {viewingChecklistId === sop.id && editingSopId !== sop.id
                          ? "✕ Tutup Langkah"
                          : `Lihat Langkah (${sop.assessment_items?.length ?? 0})`}
                      </button>

                      {/* Admin Controls */}
                      {isAdmin && (
                        <div className="flex items-center gap-1 border-l border-slate-200 pl-2 dark:border-slate-700">
                          {/* Edit SPO Button */}
                          <button
                            className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                              editingSopId === sop.id
                                ? "bg-emerald-600 text-white shadow-sm"
                                : "border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 dark:hover:bg-emerald-950"
                            }`}
                            disabled={busy || editingChecklistBusy}
                            onClick={() => {
                              if (editingSopId === sop.id) {
                                cancelEditing();
                              } else {
                                startEditingSop(sop);
                              }
                            }}
                            title="Edit informasi dokumen dan isi langkah prosedur SPO"
                          >
                            {editingSopId === sop.id ? "✕ Batal Edit" : "✎ Edit Isi SPO"}
                          </button>

                          {/* Toggle Publication Button */}
                          <button
                            className="rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                            onClick={() => void togglePublish(sop)}
                            disabled={busy}
                            title={isPublished ? "Sembunyikan dari perawat" : "Tampilkan ke perawat"}
                          >
                            {isPublished ? "Sembunyikan" : "Tampilkan"}
                          </button>

                          {/* Delete Button */}
                          <button
                            className="rounded-xl px-2.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                            disabled={busy}
                            onClick={() => void deleteSop(sop)}
                            title="Hapus dokumen PDF ini"
                          >
                            Hapus
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Read-only Steps Viewer */}
                  {viewingChecklistId === sop.id && editingSopId !== sop.id && (
                    <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900 dark:text-white">
                            Isi Butir Langkah Prosedur SPO
                          </span>
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            {sop.assessment_items?.length ?? 0} Langkah
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => {
                                setViewingChecklistId(null);
                                startEditingSop(sop);
                              }}
                              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 underline dark:text-emerald-400"
                            >
                              ✎ Edit Isi Langkah
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setViewingChecklistId(null)}
                            className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                      {(!sop.assessment_items || sop.assessment_items.length === 0) ? (
                        <p className="mt-3 text-xs text-slate-500">Belum ada langkah checklist yang tersimpan untuk dokumen ini.</p>
                      ) : (
                        <ol className="mt-3 space-y-2 text-xs">
                          {sop.assessment_items.map((item, idx) => (
                            <li key={item.id} className="flex items-start gap-2.5 rounded-lg border border-slate-100 bg-slate-50/70 p-2.5 dark:border-slate-800 dark:bg-slate-800/50">
                              <span className="pt-0.5 font-bold text-slate-400">#{idx + 1}</span>
                              <span className="flex-1 leading-relaxed text-slate-800 dark:text-slate-200">{item.title}</span>
                              {item.critical && (
                                <span className="shrink-0 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                                  Kritis
                                </span>
                              )}
                            </li>
                          ))}
                        </ol>
                      )}
                    </div>
                  )}

                  {/* Edit SPO Form */}
                  {editingSopId === sop.id && (
                    <div className="mt-4 space-y-4 rounded-xl border border-emerald-300/70 bg-emerald-50/20 p-4 shadow-sm sm:p-5 dark:border-emerald-800/80 dark:bg-slate-900/90">
                      <div className="flex items-center justify-between border-b border-slate-200/80 pb-3 dark:border-slate-700">
                        <div>
                          <h4 className="text-base font-bold text-slate-900 dark:text-white">
                            Edit Informasi &amp; Isi SPO
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Ubah judul, kategori, deskripsi, serta tambah atau sesuaikan butir langkah checklist prosedur SPO.
                          </p>
                        </div>
                        <button
                          type="button"
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold"
                          onClick={cancelEditing}
                          disabled={busy || editingChecklistBusy}
                        >
                          ✕
                        </button>
                      </div>

                      {/* Metadata Fields */}
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            Judul Dokumen SPO / Modul <span className="text-rose-500">*</span>
                            <input
                              className={`${CONTROL} mt-1`}
                              value={editingForm.title}
                              onChange={(e) => setEditingForm({ ...editingForm, title: e.target.value })}
                              placeholder="Judul dokumen..."
                              required
                              disabled={busy || editingChecklistBusy}
                            />
                          </label>
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            Kategori Dokumen <span className="text-rose-500">*</span>
                            <input
                              className={`${CONTROL} mt-1`}
                              value={editingForm.category}
                              onChange={(e) => setEditingForm({ ...editingForm, category: e.target.value })}
                              placeholder="Kategori dokumen..."
                              required
                              disabled={busy || editingChecklistBusy}
                            />
                          </label>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {CATEGORY_PRESETS.map((preset) => (
                              <button
                                key={preset}
                                type="button"
                                disabled={busy || editingChecklistBusy}
                                onClick={() => setEditingForm({ ...editingForm, category: preset })}
                                className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                              >
                                {preset}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="sm:col-span-2">
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            Deskripsi Singkat / Catatan Versi (Opsional)
                            <textarea
                              className={`${CONTROL} mt-1 min-h-16`}
                              value={editingForm.description}
                              onChange={(e) => setEditingForm({ ...editingForm, description: e.target.value })}
                              placeholder="Jelaskan ringkasan prosedur atau catatan pembaruan isi SPO..."
                              disabled={busy || editingChecklistBusy}
                            />
                          </label>
                        </div>
                      </div>

                      {/* Checklist Editor Section */}
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                              Isi Butir Langkah Prosedur SPO ({editingChecklistItems.length} langkah)
                            </h5>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              Anda dapat menambah langkah baru, mengedit uraian langkah, mengatur urutan (▲/▼), menghapus langkah, atau menandai langkah kritis seperti saat pertama kali mengunggah SPO.
                            </p>
                          </div>
                          <button
                            type="button"
                            disabled={busy || editingChecklistBusy}
                            onClick={() => void reExtractExistingSop(sop)}
                            className="rounded-lg border border-sky-300 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700 hover:bg-sky-100 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-300"
                            title="Baca ulang teks dari berkas PDF asli di penyimpanan"
                          >
                            {editingChecklistBusy ? "Mengekstrak…" : "↻ Ekstrak Ulang dari PDF"}
                          </button>
                        </div>

                        {editingChecklistBusy && (
                          <p className="rounded-xl border border-sky-200 bg-sky-50 p-3 text-xs text-sky-900 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-200">
                            Sedang membaca dan mengekstrak langkah dari berkas PDF di browser...
                          </p>
                        )}

                        {assessmentError && (
                          <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
                            {assessmentError}
                          </p>
                        )}

                        <AssessmentChecklistEditor
                          items={editingChecklistItems}
                          onChange={(items) => {
                            setEditingChecklistItems(items);
                            setEditingChecklistReviewed(false);
                          }}
                          reviewed={editingChecklistReviewed}
                          onConfirm={() => setEditingChecklistReviewed(true)}
                          onEdit={() => setEditingChecklistReviewed(false)}
                          disabled={busy || editingChecklistBusy}
                          title="Checklist Langkah Prosedur SOP"
                          description="Periksa dan sesuaikan setiap butir langkah. Anda dapat menambahkan butir baru jika ada isi SPO yang bertambah."
                        />
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-200/80 pt-3 dark:border-slate-700">
                        <button
                          type="button"
                          className={SECONDARY}
                          disabled={busy || editingChecklistBusy}
                          onClick={cancelEditing}
                        >
                          Batal
                        </button>
                        <button
                          type="button"
                          className={BUTTON}
                          disabled={
                            busy ||
                            editingChecklistBusy ||
                            !editingForm.title.trim() ||
                            !editingForm.category.trim() ||
                            !editingChecklistItems.length ||
                            editingChecklistItems.some((item) => !item.title.trim())
                          }
                          onClick={() => void saveEditedSop(sop.id)}
                        >
                          {busy ? "Menyimpan…" : "Simpan Perubahan SPO"}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Inline PDF Viewer Component */}
                  {isInlineOpen && pdfUrls[sop.id] && (
                    <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-900 shadow-inner dark:border-slate-700">
                      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-white">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{sop.title}</span>
                          <span className="text-[11px] text-slate-400">({sop.file_name})</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <a
                            href={pdfUrls[sop.id]}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-400 hover:underline"
                          >
                            Buka Tab Baru ↗
                          </a>
                          <button
                            onClick={() => void handleOpenModalPdf(sop)}
                            className="text-slate-300 hover:text-white"
                          >
                            Layar Penuh ⛶
                          </button>
                          <button
                            onClick={() => setInlinePdfId(null)}
                            className="text-slate-400 hover:text-white"
                          >
                            Tutup ✕
                          </button>
                        </div>
                      </div>
                      <iframe
                        src={pdfUrls[sop.id]}
                        title={`PDF - ${sop.title}`}
                        className="h-[600px] w-full bg-white"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>



      {/* Fullscreen PDF Modal Viewer */}
      {modalPdfUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-3 backdrop-blur-sm sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Tampilan dokumen SPO"
        >
          <section className="flex h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
            <header className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-5 py-3.5 dark:border-slate-800 dark:bg-slate-950">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-xs font-bold text-white">
                  PDF
                </span>
                <h2 className="font-bold text-slate-900 dark:text-white">{modalPdfUrl.title}</h2>
              </div>
              <div className="flex items-center gap-2">
                <a
                  className={SECONDARY}
                  href={modalPdfUrl.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Buka tab baru ↗
                </a>
                <button className={BUTTON} onClick={() => setModalPdfUrl(null)}>
                  Tutup
                </button>
              </div>
            </header>
            <iframe
              className="min-h-0 flex-1 bg-white"
              src={modalPdfUrl.url}
              title={`Dokumen SPO PDF - ${modalPdfUrl.title}`}
              referrerPolicy="no-referrer"
            />
          </section>
        </div>
      )}
    </div>
  );
}
