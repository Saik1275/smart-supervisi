import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { AssessmentItem } from "../instruments";

export type SopMetadataInput = {
  title: string;
  category: string;
  description: string;
  assessment_items: AssessmentItem[];
  published?: boolean;
};

function validateAssessmentItems(items: AssessmentItem[]): void {
  if (
    !items.length ||
    items.length > 50 ||
    items.some((item) => !item.id.trim() || !item.title.trim()) ||
    new Set(items.map((item) => item.id)).size !== items.length
  ) {
    throw new Error("Checklist SOP harus berisi 1 sampai 50 butir dengan ID unik dan uraian lengkap.");
  }
}

export function isModuleDocument(document: { title: string; category: string }): boolean {
  return `${document.title} ${document.category}`.toLocaleLowerCase("id-ID").includes("modul");
}

export async function uploadSopPdf(
  client: SupabaseClient,
  user: User,
  metadata: SopMetadataInput,
  file: File,
): Promise<void> {
  if (!metadata.title.trim() || !metadata.category.trim()) {
    throw new Error("Judul dan kategori SPO wajib diisi.");
  }
  validateAssessmentItems(metadata.assessment_items);
  if (file.type !== "application/pdf" || !file.name.toLowerCase().endsWith(".pdf")) {
    throw new Error("File harus berformat PDF.");
  }
  if (file.size === 0 || file.size > 3 * 1024 * 1024) {
    throw new Error("Ukuran file harus lebih dari 0 dan maksimum 3 MB.");
  }
  const signature = new Uint8Array(await file.slice(0, 5).arrayBuffer());
  if (new TextDecoder().decode(signature) !== "%PDF-") {
    throw new Error("Isi file tidak memiliki signature PDF yang valid.");
  }

  const storagePath = `${user.id}/${crypto.randomUUID()}.pdf`;
  const { error: uploadError } = await client.storage.from("supervisi-private").upload(storagePath, file, {
    contentType: "application/pdf",
    upsert: false,
  });
  if (uploadError) throw new Error(`Upload PDF gagal: ${uploadError.message}`);

  const { error: metadataError } = await client.from("sop_documents").insert({
    title: metadata.title.trim(),
    category: metadata.category.trim(),
    description: metadata.description.trim(),
    storage_path: storagePath,
    file_name: file.name,
    file_size: file.size,
    assessment_items: metadata.assessment_items,
    created_by: user.id,
    published: metadata.published ?? true,
  });
  if (!metadataError) return;

  const { error: cleanupError } = await client.storage.from("supervisi-private").remove([storagePath]);
  throw new Error(
    `File berhasil diunggah tetapi metadata gagal disimpan: ${metadataError.message}${
      cleanupError ? ` File sementara juga gagal dibersihkan: ${cleanupError.message}` : " File sementara sudah dibersihkan."
    }`,
  );
}

export async function updateSopAssessmentItems(
  client: SupabaseClient,
  id: string,
  assessmentItems: AssessmentItem[],
): Promise<void> {
  validateAssessmentItems(assessmentItems);
  const { error } = await client.from("sop_documents")
    .update({ assessment_items: assessmentItems })
    .eq("id", id);
  if (error) throw new Error(`Checklist SOP gagal disimpan: ${error.message}`);
}

export async function getSopSignedUrl(client: SupabaseClient, storagePath: string): Promise<string> {
  const { data, error } = await client.storage.from("supervisi-private").createSignedUrl(storagePath, 60);
  if (error) throw new Error(`Dokumen SPO tidak dapat dibuka: ${error.message}`);
  return data.signedUrl;
}

export async function toggleSopPublished(
  client: SupabaseClient,
  id: string,
  published: boolean,
): Promise<void> {
  const { error } = await client.from("sop_documents").update({ published }).eq("id", id);
  if (error) throw new Error(`Status publikasi gagal diperbarui: ${error.message}`);
}

export async function deleteSopPdf(client: SupabaseClient, id: string, storagePath: string): Promise<void> {
  const { error: storageError } = await client.storage.from("supervisi-private").remove([storagePath]);
  if (storageError) throw new Error(`File PDF gagal dihapus: ${storageError.message}`);

  const { error: rowError } = await client.from("sop_documents").delete().eq("id", id);
  if (rowError) throw new Error(`File PDF terhapus tetapi metadata gagal dihapus: ${rowError.message}`);
}
