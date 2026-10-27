"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { FormEvent, ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "../../lib/supabase/browser";
import {
  FACTORS,
  FOLLOW_UP_STATUSES,
  ITEMS,
  type AssessmentItem,
} from "../../lib/instruments";
import {
  addDays,
  calculateScore,
  dueDays,
  today,
  type ScoreValue,
  type Scores,
} from "../../lib/scoring";

export type Nurse = { id: string; full_name: string; unit: string; active: boolean };
export type FollowUp = {
  id: string;
  item_id: string | null;
  problem: string;
  cause: string;
  intervention: string;
  pic: string;
  target: string;
  due_date: string | null;
  evaluation: string;
  status: (typeof FOLLOW_UP_STATUSES)[number];
};
export type Supervision = {
  id: string;
  date: string;
  nurse_id: string;
  nurse: string;
  unit: string;
  supervisor: string;
  parent_id: string | null;
  schedule_id?: string | null;
  module_id: string | null;
  module_title?: string | null;
  assessment_items: AssessmentItem[];
  conclusion: { ok?: string; masalah?: string; risiko?: string };
  causes: Record<string, { on: boolean; note: string }>;
  interventions: string[];
  fair: {
    F?: string;
    A?: string;
    I?: string;
    R?: string;
    review?: string;
    signatureMode?: "draw" | "type";
    signatureData?: string;
    signatureName?: string;
  };
  scores: Scores;
  follow_ups: FollowUp[];
};
export type Schedule = { id: string; date: string; unit: string; target: string; note: string; done: boolean };
export type Sop = {
  id: string;
  title: string;
  category: string;
  description: string;
  file_name: string;
  file_size: number;
  updated_on: string;
  storage_path: string;
  assessment_items: AssessmentItem[];
  published?: boolean;
};
export type DashboardData = { supervisions: Supervision[]; schedules: Schedule[]; sops: Sop[] };
export type RtlDraft = {
  item_id: string | null;
  problem: string;
  cause: string;
  intervention: string;
  pic: string;
  target: string;
  due_date: string;
  evaluation: string;
  status: (typeof FOLLOW_UP_STATUSES)[number];
};
export type Draft = {
  date: string;
  nurse_id: string;
  unit: string;
  supervisor: string;
  module_id: string | null;
  assessment_items: AssessmentItem[];
  parent_id: string | null;
  schedule_id: string | null;
  scores: Scores;
  conclusion: { ok: string; masalah: string; risiko: string };
  causes: Record<string, { on: boolean; note: string }>;
  interventions: string[];
  fair: {
    F: string;
    A: string;
    I: string;
    R: string;
    review: string;
    signatureMode?: "draw" | "type";
    signatureData?: string;
    signatureName?: string;
  };
  follow_ups: RtlDraft[];
};
export type FollowUpEntry = { supervision: Supervision; followUp: FollowUp };

type SupervisiContextValue = {
  configured: boolean;
  loading: boolean;
  busy: boolean;
  error: string;
  notice: string;
  setError: (value: string) => void;
  setNotice: (value: string) => void;
  data: DashboardData;
  nurses: Nurse[];
  user: User | null;
  adminName: string;
  isAdmin: boolean;
  currentDate: string;
  draft: Draft | null;
  setDraft: (draft: Draft | null) => void;
  step: number;
  setStep: (step: number) => void;
  allFollowUps: FollowUpEntry[];
  openTasks: FollowUpEntry[];
  overdueTasks: FollowUpEntry[];
  meanScore: number;
  criticalCount: number;
  loginOpen: boolean;
  setLoginOpen: (open: boolean) => void;
  themeDark: boolean;
  toggleTheme: () => void;
  reload: () => Promise<void>;
  signIn: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  signOut: () => Promise<void>;
  startDraft: (base?: Partial<Draft>) => void;
  updateDraft: <K extends keyof Draft>(key: K, value: Draft[K]) => void;
  updateFollowUp: (index: number, key: keyof RtlDraft, value: string | null) => void;
  generateConclusion: () => void;
  generateFair: () => void;
  generateRtl: () => void;
  saveDraft: () => Promise<void>;
  updateFollowUpStatus: (id: string, status: string) => Promise<void>;
  refreshData: () => Promise<void>;
  routerPush: (path: string) => void;
};

const EMPTY_DATA: DashboardData = { supervisions: [], schedules: [], sops: [] };
const Context = createContext<SupervisiContextValue | null>(null);

function normalizePublicOverview(value: DashboardData | null): DashboardData {
  return {
    supervisions: Array.isArray(value?.supervisions)
      ? value.supervisions.map((row) => ({
          ...row,
          module_id: row.module_id ?? null,
          assessment_items: Array.isArray(row.assessment_items) ? row.assessment_items : [],
          scores: row.scores ?? {},
          follow_ups: row.follow_ups ?? [],
        }))
      : [],
    schedules: Array.isArray(value?.schedules) ? value.schedules : [],
    sops: Array.isArray(value?.sops)
      ? value.sops.map((sop) => ({
          ...sop,
          assessment_items: Array.isArray(sop.assessment_items) ? sop.assessment_items : [],
        }))
      : [],
  };
}

function emptyDraft(userName = ""): Draft {
  return {
    date: today(),
    nurse_id: "",
    unit: "",
    supervisor: userName,
    module_id: null,
    assessment_items: [],
    parent_id: null,
    schedule_id: null,
    scores: {},
    conclusion: { ok: "", masalah: "", risiko: "" },
    causes: Object.fromEntries(FACTORS.map((factor) => [factor, { on: false, note: "" }])),
    interventions: [],
    fair: { F: "", A: "", I: "", R: "", review: "", signatureMode: "draw", signatureData: "", signatureName: userName },
    follow_ups: [],
  };
}

export const APP_ADMIN_EMAIL = "admin@supervisi.com";
export const APP_ADMIN_PASSWORD = "adminsupervisi123";
export const APP_ADMIN_USER_ID = "c052d698-1389-4253-9317-64588c8756f6";
const ADMIN_STORAGE_KEY = "smartsupervisi.admin_session";

function createAppAdminUser(): User {
  return {
    id: APP_ADMIN_USER_ID,
    app_metadata: { provider: "custom" },
    user_metadata: { full_name: "Administrator" },
    aud: "authenticated",
    created_at: "2026-01-01T00:00:00Z",
    email: APP_ADMIN_EMAIL,
    phone: "",
    role: "authenticated",
    updated_at: "2026-01-01T00:00:00Z",
  };
}

export function SupervisiProvider({ children }: { children: ReactNode }) {
  const supabase = getSupabaseBrowserClient();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [adminName, setAdminName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(Boolean(supabase));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [data, setData] = useState<DashboardData>(EMPTY_DATA);
  const [nurses, setNurses] = useState<Nurse[]>([]);
  const [themeDark, setThemeDark] = useState(false);
  const [currentDate, setCurrentDate] = useState("");
  const [loginOpen, setLoginOpen] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [step, setStep] = useState(0);

  const load = useCallback(async (forcedAdmin?: boolean) => {
    if (!supabase) return;
    setLoading(true);
    setError("");

    let activeAdmin = forcedAdmin;
    if (activeAdmin === undefined) {
      try {
        const raw = window.localStorage.getItem(ADMIN_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          activeAdmin = parsed?.email?.toLowerCase() === APP_ADMIN_EMAIL.toLowerCase();
        }
      } catch {
        activeAdmin = false;
      }
    }

    const adminStatus = Boolean(activeAdmin);
    setIsAdmin(adminStatus);
    setAdminName(adminStatus ? "Administrator" : "");
    if (adminStatus) {
      setUser(createAppAdminUser());
    } else {
      setUser(null);
    }

    if (!adminStatus) {
      const { data: publicData, error: publicError } = await supabase.rpc("get_public_overview");
      if (publicError) {
        setError(`Data tidak dapat dimuat: ${publicError.message}`);
        setData(EMPTY_DATA);
      } else {
        const result = publicData as DashboardData;
        setData(normalizePublicOverview(result));
      }
      setNurses([]);
      setLoading(false);
      return;
    }

    const [supervisionsResult, nursesResult, schedulesResult, sopsResult] = await Promise.all([
      supabase.from("supervisions").select("*").order("supervision_date", { ascending: false }),
      supabase.from("nurses").select("id,full_name,unit,active").order("full_name"),
      supabase.from("schedules").select("*").order("scheduled_for"),
      supabase.from("sop_documents").select("*").order("updated_on", { ascending: false }),
    ]);
    const failed = [supervisionsResult, nursesResult, schedulesResult, sopsResult].find((result) => result.error);
    if (failed?.error) {
      const { data: publicData } = await supabase.rpc("get_public_overview");
      if (publicData) {
        const result = publicData as DashboardData;
        setData(normalizePublicOverview(result));
      }
      setError(`Catatan: Akses data administrator memerlukan migrasi SQL 202610220001_initial_schema.sql dijalankan di Supabase SQL Editor (${failed.error.message}).`);
      setNurses([]);
      setLoading(false);
      return;
    }

    const supervisionIds = (supervisionsResult.data ?? []).map((row) => row.id);
    const [scoresResult, followUpsResult] = supervisionIds.length
      ? await Promise.all([
          supabase.from("supervision_scores").select("*").in("supervision_id", supervisionIds),
          supabase.from("follow_ups").select("*").in("supervision_id", supervisionIds).order("due_date"),
        ])
      : [{ data: [], error: null }, { data: [], error: null }];
    const detailError = scoresResult.error || followUpsResult.error;
    if (detailError) {
      setError(`Rincian penilaian tidak dapat dimuat: ${detailError.message}`);
      setData(EMPTY_DATA);
      setLoading(false);
      return;
    }

    const nurseRows = nursesResult.data ?? [];
    const scoresBySupervision = new Map<string, Scores>();
    for (const row of scoresResult.data ?? []) {
      const scores = scoresBySupervision.get(row.supervision_id) ?? {};
      scores[row.item_id] = row.score === null ? "na" : row.score as ScoreValue;
      scoresBySupervision.set(row.supervision_id, scores);
    }
    const followUpsBySupervision = new Map<string, FollowUp[]>();
    for (const row of followUpsResult.data ?? []) {
      const followUps = followUpsBySupervision.get(row.supervision_id) ?? [];
      followUps.push({
        id: row.id,
        item_id: row.item_id,
        problem: row.problem,
        cause: row.cause,
        intervention: row.intervention,
        pic: row.pic,
        target: row.target,
        due_date: row.due_date,
        evaluation: row.evaluation,
        status: row.status,
      });
      followUpsBySupervision.set(row.supervision_id, followUps);
    }
    const rows: Supervision[] = (supervisionsResult.data ?? []).map((row) => ({
      id: row.id,
      date: row.supervision_date,
      nurse_id: row.nurse_id,
      nurse: nurseRows.find((nurse) => nurse.id === row.nurse_id)?.full_name ?? "Perawat",
      unit: row.unit,
      supervisor: row.supervisor,
      parent_id: row.parent_id,
      schedule_id: row.schedule_id,
      module_id: row.module_id ?? null,
      module_title: sopsResult.data?.find((sop) => sop.id === row.module_id)?.title ?? null,
      conclusion: row.conclusion ?? {},
      causes: row.causes ?? {},
      interventions: row.interventions ?? [],
      fair: row.fair ?? {},
      scores: row.assessment_scores && Object.keys(row.assessment_scores).length
        ? row.assessment_scores as Scores
        : scoresBySupervision.get(row.id) ?? {},
      assessment_items: Array.isArray(row.assessment_items) ? row.assessment_items as AssessmentItem[] : [],
      follow_ups: followUpsBySupervision.get(row.id) ?? [],
    }));

    setNurses(nurseRows);
    setData({
      supervisions: rows,
      schedules: (schedulesResult.data ?? []).map((row) => ({
        id: row.id,
        date: row.scheduled_for,
        unit: row.unit,
        target: row.target,
        note: row.note,
        done: Boolean(row.done_at),
      })),
      sops: (sopsResult.data ?? []).map((row) => ({
        id: row.id,
        title: row.title,
        category: row.category,
        description: row.description,
        file_name: row.file_name,
        file_size: row.file_size,
        updated_on: row.updated_on,
        storage_path: row.storage_path,
        assessment_items: Array.isArray(row.assessment_items) ? row.assessment_items as AssessmentItem[] : [],
        published: row.published !== false,
      })),
    });
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    if (!supabase) return;
    let active = true;

    Promise.resolve().then(() => {
      if (!active) return;
      void load();
    });

    const timer = window.setTimeout(() => {
      if (!active) return;
      setCurrentDate(today());
      let savedTheme: string | null = null;
      try {
        savedTheme = window.localStorage.getItem("smartsupervisi.theme");
      } catch {
        setError("Preferensi tema tidak dapat dibaca dari penyimpanan browser.");
      }
      const dark = savedTheme ? savedTheme === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
      setThemeDark(dark);
      document.documentElement.classList.toggle("dark", dark);
    }, 0);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [supabase, load]);

  const allFollowUps = useMemo(
    () => data.supervisions.flatMap((supervision) => supervision.follow_ups.map((followUp) => ({ supervision, followUp }))),
    [data.supervisions],
  );
  const openTasks = allFollowUps.filter(({ followUp }) => followUp.status !== "Masalah selesai");
  const overdueTasks = currentDate
    ? openTasks.filter(({ followUp }) => Boolean(followUp.due_date && followUp.due_date < currentDate))
    : [];
  const meanScore = data.supervisions.length
    ? Math.round(data.supervisions.reduce((total, row) => total + calculateScore(row.scores, row.assessment_items.length ? row.assessment_items : ITEMS).percentage, 0) / data.supervisions.length * 10) / 10
    : 0;
  const criticalCount = data.supervisions.filter((row) => calculateScore(row.scores, row.assessment_items.length ? row.assessment_items : ITEMS).criticalZero).length;

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim().toLowerCase();
    const password = String(form.get("password") ?? "");

    if (email === APP_ADMIN_EMAIL.toLowerCase() && password === APP_ADMIN_PASSWORD) {
      try {
        window.localStorage.setItem(
          ADMIN_STORAGE_KEY,
          JSON.stringify({ email: APP_ADMIN_EMAIL, timestamp: Date.now() })
        );
      } catch {
        // ignore
      }
      setIsAdmin(true);
      setUser(createAppAdminUser());
      setAdminName("Administrator");
      setLoginOpen(false);
      setNotice("Login administrator berhasil.");
      setBusy(false);
      await load(true);
    } else {
      setBusy(false);
      setError("Email atau password administrator salah. Periksa kembali kredensial Anda.");
    }
  }

  async function signOut() {
    setBusy(true);
    try {
      window.localStorage.removeItem(ADMIN_STORAGE_KEY);
    } catch {
      // ignore
    }
    setIsAdmin(false);
    setUser(null);
    setAdminName("");
    setNotice("Anda telah keluar.");
    setDraft(null);
    setBusy(false);
    await load(false);
    router.push("/");
  }

  function startDraft(base?: Partial<Draft>) {
    if (!isAdmin) return;
    setDraft({ ...emptyDraft(adminName || user?.email || ""), ...base });
    setStep(0);
    setError("");
    router.push("/supervisi");
  }

  function updateDraft<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => current ? { ...current, [key]: value } : current);
  }

  function updateFollowUp(index: number, key: keyof RtlDraft, value: string | null) {
    setDraft((current) => {
      if (!current) return current;
      const followUps = [...current.follow_ups];
      followUps[index] = { ...followUps[index], [key]: value };
      return { ...current, follow_ups: followUps };
    });
  }

  function generateConclusion() {
    if (!draft) return;
    const score = calculateScore(draft.scores, draft.assessment_items);
    const compliant = draft.assessment_items.filter((item) => draft.scores[item.id] === 2).map((item) => item.title);
    updateDraft("conclusion", {
      ok: compliant.length ? `${compliant.join(", ")} sudah sesuai standar SPO.` : "Belum ada item yang sepenuhnya sesuai standar.",
      masalah: score.findings.length ? `${score.findings.map((item) => `${item.title} (skor ${draft.scores[item.id]})`).join("; ")}.` : "Tidak ada masalah ditemukan.",
      risiko: score.findings.length ? `Risiko keselamatan pasien terkait ${score.findings.map((item) => item.title.toLocaleLowerCase("id-ID")).join(", ")}.` : "Risiko rendah.",
    });
  }

  function generateFair() {
    if (!draft) return;
    const score = calculateScore(draft.scores, draft.assessment_items);
    const causeText = FACTORS.filter((factor) => draft.causes[factor]?.on)
      .map((factor) => `${factor}${draft.causes[factor].note ? `: ${draft.causes[factor].note}` : ""}`).join("; ");
    const findingText = score.findings.map((item) => `${item.title.toLocaleLowerCase("id-ID")} (skor ${draft.scores[item.id]})`).join("; ");
    const days = dueDays(score.priority);
    updateDraft("fair", {
      F: score.findings.length ? `Saat observasi tindakan ditemukan: ${findingText}.` : "Seluruh tahapan tindakan sesuai SPO.",
      A: score.findings.length ? `Temuan meningkatkan risiko keselamatan pasien (prioritas: ${score.priority}).${causeText ? ` Kontribusi faktor: ${causeText}.` : ""}` : "Praktik klinis aman.",
      I: draft.interventions.length ? `Perbaikan disepakati: ${draft.interventions.join(", ")}.` : "Pertahankan standar pelayanan.",
      R: score.findings.length ? `Evaluasi ulang oleh supervisor dalam ${days} hari.` : "Supervisi rutin berikutnya sesuai jadwal.",
      review: score.findings.length ? addDays(draft.date, days) : "",
    });
  }

  function generateRtl() {
    if (!draft) return;
    const score = calculateScore(draft.scores, draft.assessment_items);
    const cause = FACTORS.filter((factor) => draft.causes[factor]?.on)
      .map((factor) => draft.causes[factor].note || factor).join("; ");
    const existing = new Set(draft.follow_ups.map((row) => row.item_id).filter(Boolean));
    const generated: RtlDraft[] = score.findings.filter((item) => !existing.has(item.id)).map((item) => ({
      item_id: item.id,
      problem: `${item.title} belum sesuai SPO (skor ${draft.scores[item.id]})`,
      cause,
      intervention: draft.interventions.join(", "),
      pic: "Karu",
      target: item.critical ? "100%" : ">=90%",
      due_date: addDays(draft.date, item.critical && draft.scores[item.id] === 0 ? 3 : dueDays(score.priority)),
      evaluation: "Supervisi ulang",
      status: "Belum ditindaklanjuti",
    }));
    updateDraft("follow_ups", [...draft.follow_ups, ...generated]);
    if (!generated.length) setNotice("Tidak ada RTL baru yang perlu dibuat.");
  }

  async function saveDraft() {
    if (!supabase || !draft) return;
    const score = calculateScore(draft.scores, draft.assessment_items);
    if (!draft.nurse_id || !draft.unit.trim() || !draft.supervisor.trim() || !draft.date || !draft.module_id) {
      setError("Tanggal, unit, nama supervisor, perawat, dan modul wajib dipilih.");
      setStep(0);
      return;
    }
    if (!draft.assessment_items.length) {
      setError("SOP yang dipilih belum memiliki checklist yang disetujui.");
      setStep(1);
      return;
    }
    if (
      !draft.fair.signatureName?.trim() ||
      (draft.fair.signatureMode === "type" ? false : !draft.fair.signatureData)
    ) {
      setError("Isi nama penanda tangan dan gambar atau ketik tanda tangan pada tahap FAIR Feedback.");
      setStep(5);
      return;
    }
    if (score.missing.length) {
      setError(`${score.missing.length} item observasi belum dinilai.`);
      setStep(1);
      return;
    }
    setBusy(true);
    setError("");
    const { data: supervisionId, error: saveError } = await supabase.rpc("save_supervision", {
      p_supervision: {
        date: draft.date,
        nurse_id: draft.nurse_id,
        unit: draft.unit.trim(),
        supervisor: draft.supervisor.trim(),
        module_id: draft.module_id,
        assessment_items: draft.assessment_items,
        parent_id: draft.parent_id,
        schedule_id: draft.schedule_id,
        conclusion: draft.conclusion,
        causes: draft.causes,
        interventions: draft.interventions,
        fair: draft.fair,
      },
      p_scores: draft.scores,
      p_follow_ups: draft.follow_ups,
      p_assessment_items: draft.assessment_items,
    });
    setBusy(false);
    if (saveError) {
      setError(`Supervisi gagal disimpan: ${saveError.message}`);
      return;
    }
    if (!supervisionId) {
      setError("Supervisi tersimpan tetapi ID hasil tidak diterima. Muat ulang rekap untuk membuka lembar supervisi.");
      return;
    }
    setDraft(null);
    setStep(0);
    await load();
    setNotice("Supervisi berhasil disimpan. Anda dapat mencetak atau menyimpan hasilnya sebagai PDF.");
    router.push(`/detail/${supervisionId}`);
  }

  async function updateFollowUpStatus(id: string, status: string) {
    if (!supabase || !isAdmin) return;
    setBusy(true);
    const { error: updateError } = await supabase.from("follow_ups").update({ status }).eq("id", id);
    setBusy(false);
    if (updateError) setError(`Status tindak lanjut gagal diperbarui: ${updateError.message}`);
    else {
      await load();
      setNotice("Status tindak lanjut berhasil diperbarui.");
    }
  }

  function toggleTheme() {
    const dark = !themeDark;
    setThemeDark(dark);
    document.documentElement.classList.toggle("dark", dark);
    try {
      window.localStorage.setItem("smartsupervisi.theme", dark ? "dark" : "light");
    } catch {
      setError("Tema berubah, tetapi preferensi tidak dapat disimpan di browser ini.");
    }
  }

  const value: SupervisiContextValue = {
    configured: Boolean(supabase),
    loading,
    busy,
    error,
    notice,
    setError,
    setNotice,
    data,
    nurses,
    user,
    adminName,
    isAdmin,
    currentDate,
    draft,
    setDraft,
    step,
    setStep,
    allFollowUps,
    openTasks,
    overdueTasks,
    meanScore,
    criticalCount,
    loginOpen,
    setLoginOpen,
    themeDark,
    toggleTheme,
    reload: () => load(),
    signIn,
    signOut,
    startDraft,
    updateDraft,
    updateFollowUp,
    generateConclusion,
    generateFair,
    generateRtl,
    saveDraft,
    updateFollowUpStatus,
    refreshData: () => load(),
    routerPush: (path) => router.push(path),
  };

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useSupervisi() {
  const context = useContext(Context);
  if (!context) throw new Error("useSupervisi harus digunakan di dalam SupervisiProvider.");
  return context;
}
