import { ITEMS, type AssessmentItem } from "./instruments";

export type ScoreValue = 0 | 1 | 2 | "na";
export type Scores = Partial<Record<string, ScoreValue>>;

export type ScoreResult = {
  total: number;
  count: number;
  max: number;
  percentage: number;
  category: "Baik" | "Cukup" | "Kurang";
  priority: string;
  findings: AssessmentItem[];
  missing: AssessmentItem[];
  criticalZero: boolean;
  criticalOne: boolean;
};

export function calculateScore(scores: Scores, items: AssessmentItem[] = ITEMS): ScoreResult {
  let total = 0;
  let count = 0;
  let criticalZero = false;
  let criticalOne = false;
  const findings: AssessmentItem[] = [];
  const missing: AssessmentItem[] = [];

  for (const item of items) {
    const score = scores[item.id];
    if (score === undefined) {
      missing.push(item);
      continue;
    }
    if (score === "na") continue;
    count += 1;
    total += score;
    if (score < 2) findings.push(item);
    if (item.critical && score === 0) criticalZero = true;
    if (item.critical && score === 1) criticalOne = true;
  }

  const percentage = count ? Math.round((total / (2 * count)) * 1000) / 10 : 0;
  const category = percentage >= 76 ? "Baik" : percentage >= 56 ? "Cukup" : "Kurang";
  const priority = criticalZero
    ? "Critical patient safety issue"
    : category === "Kurang" || criticalOne
      ? "Tinggi"
      : category === "Cukup"
        ? "Sedang"
        : "Rendah";

  return {
    total,
    count,
    max: count * 2,
    percentage,
    category,
    priority,
    findings,
    missing,
    criticalZero,
    criticalOne,
  };
}

export function dueDays(priority: string): number {
  return priority.startsWith("Critical") ? 3 : priority === "Tinggi" ? 7 : priority === "Sedang" ? 14 : 30;
}

export function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function today(): string {
  const date = new Date();
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

export function formatDate(date?: string | null): string {
  if (!date) return "-";
  return new Date(`${date.slice(0, 10)}T00:00:00`).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
