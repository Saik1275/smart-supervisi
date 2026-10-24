import type { AssessmentItem } from "../instruments";

function stableItemId(title: string): string {
  let hash = 2166136261;
  for (const character of title.toLocaleLowerCase("id-ID")) {
    hash ^= character.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 16777619);
  }
  return `sop_${(hash >>> 0).toString(36)}`;
}

function getProcedureLines(text: string): string[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((line) => line.length >= 12 && line.length <= 400);
  const numbered = lines
    .map((line) => line.match(/^(?:(?:langkah|tahap)\s+)?\d+(?:\.\d+)*[.)]?\s+(.+)$/i)?.[1] ??
      line.match(/^[-•▪●]\s+(.+)$/)?.[1])
    .filter((line): line is string => Boolean(line));

  if (numbered.length > 0) return numbered;
  const action = /\b(lakukan|siapkan|periksa|pastikan|verifikasi|identifikasi|gunakan|pasang|lepaskan|bersihkan|cuci|ukur|catat|dokumentasikan|jelaskan|observasi|buang|tutup|atur|nilai|konfirmasi|informasikan|evaluasi|monitor|posisikan|ambil|berikan|hubungkan|cek)\b/i;
  return lines.filter((line) => action.test(line));
}

export async function extractSopProcedureItems(url: string): Promise<AssessmentItem[]> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();

  const loadingTask = pdfjs.getDocument({ url });
  const pdf = await loadingTask.promise;
  if (pdf.numPages > 100) {
    await loadingTask.destroy();
    throw new Error("Ekstraksi otomatis dibatasi hingga 100 halaman per SOP.");
  }
  const lines: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const rows = new Map<number, Array<{ x: number; text: string }>>();

    for (const item of content.items) {
      if (!("str" in item) || !item.str.trim()) continue;
      const x = item.transform[4];
      const y = Math.round(item.transform[5] / 3) * 3;
      const row = rows.get(y) ?? [];
      row.push({ x, text: item.str });
      rows.set(y, row);
    }

    const pageLines = [...rows.entries()]
      .sort(([a], [b]) => b - a)
      .map(([, row]) => row.sort((a, b) => a.x - b.x).map((item) => item.text).join(" "));
    lines.push(...pageLines);
  }

  const uniqueLines = [...new Set(getProcedureLines(lines.join("\n"))
    .map((line) => line.replace(/^\s*(?:(?:langkah|tahap)\s+)?\d+(?:\.\d+)*[.)]?\s*/i, "").trim())
    .filter((line) => line.length >= 12))].slice(0, 50);

  const usedIds = new Set<string>();
  return uniqueLines.map((title) => {
    const baseId = stableItemId(title);
    let id = baseId;
    let suffix = 2;
    while (usedIds.has(id)) {
      id = `${baseId}_${suffix}`;
      suffix += 1;
    }
    usedIds.add(id);
    return {
      id,
      title,
      description: "Nilai pelaksanaan langkah ini sesuai urutan dan ketentuan dalam SOP yang dipilih.",
    };
  });
}
