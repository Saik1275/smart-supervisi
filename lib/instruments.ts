export type AssessmentItem = {
  id: string;
  title: string;
  description: string;
  critical?: boolean;
};

export type InstrumentItem = AssessmentItem & {
  group: "inti" | "iv";
  guidance: [string, string, string];
};

export const CORE_ITEMS: InstrumentItem[] = [
  { id: "c1", group: "inti", title: "Identifikasi pasien", description: "Perawat memastikan identitas pasien menggunakan minimal dua identitas sesuai SPO.", critical: true, guidance: ["Perawat tidak melakukan identifikasi pasien.", "Perawat melakukan identifikasi tetapi hanya memakai satu identitas atau verifikasi tidak lengkap.", "Perawat memakai minimal dua identitas dan mencocokkannya dengan sumber identifikasi pasien sesuai SPO."] },
  { id: "c2", group: "inti", title: "Komunikasi sebelum tindakan", description: "Perawat memperkenalkan diri, menjelaskan tujuan dan prosedur, serta memberi kesempatan pasien bertanya.", guidance: ["Tidak ada komunikasi sebelum tindakan.", "Sebagian komponen dilakukan (misalnya hanya menjelaskan prosedur, tanpa memperkenalkan diri atau memberi kesempatan bertanya).", "Ketiga komponen dilakukan: memperkenalkan diri, menjelaskan tujuan dan prosedur, memberi kesempatan bertanya."] },
  { id: "c3", group: "inti", title: "Keselamatan tindakan", description: "Perawat memastikan terapi, alat, lokasi, dan prosedur sesuai dengan kebutuhan pasien.", critical: true, guidance: ["Perawat tidak memeriksa kesesuaian terapi, alat, lokasi, dan prosedur.", "Pemeriksaan dilakukan sebagian atau tidak sistematis.", "Terapi, alat, lokasi, dan prosedur diperiksa lengkap dan sesuai kebutuhan pasien sebelum tindakan."] },
  { id: "c4", group: "inti", title: "Pencegahan infeksi", description: "Perawat melakukan hand hygiene, memakai APD sesuai indikasi, dan menerapkan prinsip aseptik.", guidance: ["Tidak melakukan hand hygiene dan tidak memakai APD.", "Sebagian dilakukan, atau momen hand hygiene tidak lengkap.", "Hand hygiene pada momen yang tepat, APD sesuai indikasi, dan prinsip aseptik terjaga."] },
  { id: "c5", group: "inti", title: "Kepatuhan SPO", description: "Perawat melaksanakan seluruh tahapan tindakan sesuai SPO yang berlaku.", guidance: ["Tahapan tindakan tidak mengikuti SPO.", "Sebagian besar tahapan sesuai SPO, ada tahapan terlewat atau terbalik.", "Seluruh tahapan dilaksanakan berurutan sesuai SPO."] },
  { id: "c6", group: "inti", title: "Monitoring", description: "Perawat memantau respons pasien dan kemungkinan komplikasi setelah tindakan.", guidance: ["Tidak ada pemantauan setelah tindakan.", "Pemantauan dilakukan tetapi tidak mencakup semua tanda respons atau komplikasi.", "Respons pasien dan tanda komplikasi dipantau lengkap sesuai SPO."] },
  { id: "c7", group: "inti", title: "Edukasi", description: "Perawat menjelaskan hal yang perlu diperhatikan pasien setelah tindakan.", guidance: ["Tidak ada edukasi pascatindakan.", "Edukasi diberikan tetapi belum lengkap atau tidak dipastikan dipahami pasien.", "Edukasi lengkap dan pasien atau keluarga mampu menyebutkan kembali hal pokok."] },
  { id: "c8", group: "inti", title: "Dokumentasi", description: "Perawat mendokumentasikan tindakan dan respons pasien secara lengkap dan tepat waktu.", guidance: ["Tindakan tidak didokumentasikan.", "Dokumentasi ada tetapi tidak lengkap atau terlambat.", "Dokumentasi lengkap dan tepat waktu."] },
];

export const IV_ITEMS: InstrumentItem[] = [
  { id: "iv1", group: "iv", title: "Persiapan alat", description: "Menyiapkan alat dan bahan lengkap: cairan, set infus, kanula intravena, torniket, antiseptik, plester atau penutup steril, bengkok, sarung tangan, safety box.", guidance: ["Alat dan bahan tidak disiapkan sebelum tindakan.", "Alat disiapkan tetapi ada yang kurang sehingga tindakan terhenti.", "Seluruh alat dan bahan lengkap, dekat, dan siap pakai."] },
  { id: "iv2", group: "iv", title: "Verifikasi terapi", description: "Memeriksa instruksi terapi cairan (jenis, volume, kecepatan), label, tanggal kedaluwarsa, dan kondisi kemasan cairan sebelum dipasang.", critical: true, guidance: ["Tidak memeriksa instruksi dan cairan.", "Memeriksa sebagian (misalnya jenis cairan saja).", "Memeriksa instruksi, label, kedaluwarsa, dan kemasan cairan secara lengkap."] },
  { id: "iv3", group: "iv", title: "Hand hygiene dan APD", description: "Melakukan hand hygiene sebelum kontak pasien dan memakai sarung tangan bersih.", critical: true, guidance: ["Tidak melakukan hand hygiene.", "Hand hygiene tidak sesuai 6 langkah atau durasi kurang, atau sarung tangan terlambat dipakai.", "Hand hygiene 6 langkah dengan durasi sesuai, lalu memakai sarung tangan bersih."] },
  { id: "iv4", group: "iv", title: "Pemilihan vena", description: "Memilih lokasi vena yang sesuai dan menghindari area lesi, memar, infiltrasi, atau sisi dengan gangguan aliran.", guidance: ["Lokasi dipilih tanpa menilai vena.", "Vena dinilai tetapi tidak mempertimbangkan sisi atau kondisi kulit.", "Vena dinilai (palpasi, kondisi kulit, sisi) dan lokasi sesuai kondisi pasien."] },
  { id: "iv5", group: "iv", title: "Pemasangan torniket", description: "Memasang torniket di atas lokasi tusukan dengan tekanan cukup dan melepasnya segera setelah akses vena berhasil.", guidance: ["Torniket tidak dipasang atau dibiarkan terlalu lama.", "Torniket dipasang tetapi posisi atau tekanan kurang tepat.", "Torniket dipasang tepat dan dilepas segera setelah akses berhasil."] },
  { id: "iv6", group: "iv", title: "Desinfeksi kulit", description: "Melakukan desinfeksi kulit dengan antiseptik sesuai SPO dan menunggu kering sebelum penusukan.", critical: true, guidance: ["Tidak melakukan desinfeksi.", "Desinfeksi dilakukan tetapi gerakan, area, atau waktu tunggu kering tidak sesuai.", "Desinfeksi sesuai SPO, area memadai, dan dibiarkan kering sebelum penusukan."] },
  { id: "iv7", group: "iv", title: "Insersi kanula", description: "Menusuk dengan teknik aseptik, sudut sesuai, tanpa menyentuh area bersih, dan memastikan kanula masuk vena (flashback).", guidance: ["Teknik insersi tidak aseptik atau tidak aman.", "Insersi berhasil tetapi ada kontaminasi ringan atau sudut kurang tepat.", "Insersi aseptik, sudut tepat, flashback terkonfirmasi."] },
  { id: "iv8", group: "iv", title: "Fiksasi dan penutup", description: "Memfiksasi kanula dan menutup lokasi dengan penutup steril sehingga lokasi tusukan mudah diobservasi.", guidance: ["Kanula tidak difiksasi.", "Fiksasi ada tetapi longgar atau lokasi tidak dapat dilihat.", "Fiksasi kuat, penutup steril, lokasi tetap dapat diobservasi."] },
  { id: "iv9", group: "iv", title: "Pelabelan", description: "Memberi label tanggal, jam, ukuran kanula, dan inisial perawat pada lokasi pemasangan.", guidance: ["Tidak ada label.", "Label ada tetapi tidak lengkap.", "Label lengkap: tanggal, jam, ukuran kanula, inisial perawat."] },
  { id: "iv10", group: "iv", title: "Pengaturan tetesan", description: "Mengatur kecepatan tetesan sesuai instruksi dan memastikan cairan mengalir lancar tanpa nyeri, bengkak, atau kebocoran.", guidance: ["Tetesan tidak diatur sesuai instruksi.", "Tetesan diatur tetapi aliran atau kenyamanan pasien tidak dicek.", "Tetesan sesuai instruksi dan kelancaran serta kenyamanan pasien dicek."] },
  { id: "iv11", group: "iv", title: "Pembuangan limbah", description: "Membuang benda tajam ke safety box dan limbah lain sesuai kategori, tanpa menutup kembali jarum.", guidance: ["Benda tajam dibuang sembarangan.", "Sebagian limbah dipilah benar, ada yang salah kategori atau jarum ditutup kembali.", "Semua limbah dipilah benar dan benda tajam masuk safety box langsung."] },
  { id: "iv12", group: "iv", title: "Hand hygiene akhir", description: "Melakukan hand hygiene setelah tindakan dan merapikan pasien serta lingkungan.", guidance: ["Tidak melakukan hand hygiene setelah tindakan.", "Hand hygiene dilakukan tetapi tidak lengkap, atau pasien tidak dirapikan.", "Hand hygiene lengkap, pasien nyaman, lingkungan rapi."] },
];

export const ITEMS = [...CORE_ITEMS, ...IV_ITEMS];
export const FACTORS = ["Man", "Method", "Material", "Environment", "Management", "System"] as const;
export const FACTOR_DESCRIPTIONS: Record<(typeof FACTORS)[number], string> = {
  Man: "Pengetahuan, keterampilan, sikap, kepatuhan, pengalaman, atau beban individu.",
  Method: "SPO tidak jelas, prosedur terlalu panjang, atau alur pelayanan belum efektif.",
  Material: "Ketersediaan alat, formulir, APD, dan bahan.",
  Environment: "Beban kerja, jumlah pasien, kondisi ruangan, atau situasi pelayanan.",
  Management: "Supervisi, koordinasi, pembagian tugas, monitoring, dukungan manajerial.",
  System: "SIMRS, dokumentasi elektronik, teknologi, atau sistem pelayanan yang menghambat.",
};
export const INTERVENTIONS = ["Coaching individual", "Bedside teaching", "Mentoring", "Demonstrasi ulang", "Role play", "Refreshment SPO", "Safety briefing", "Peer review", "Audit dan feedback", "Reminder visual", "Re-assessment kompetensi", "Perbaikan sarana", "Perbaikan workflow", "Revisi SPO", "Koordinasi lintas profesi"];
export const FOLLOW_UP_STATUSES = ["Belum ditindaklanjuti", "Sedang ditindaklanjuti", "Sudah dilaksanakan", "Sudah dievaluasi", "Masalah selesai", "Membutuhkan intervensi lanjutan"] as const;
