# SMART-SUPERVISI

Aplikasi App Router untuk supervisi Patient Safety dan pemasangan/perawatan infus. UI menggunakan React, TypeScript, Tailwind CSS, dan Supabase PostgreSQL/Auth/Storage. Data operasional tidak diisi dengan seed atau array demo.

## Rencana migrasi

1. Memindahkan instrumen, perhitungan skor, dan alur tujuh tahap dari HTML sumber ke modul domain TypeScript.
2. Menyimpan supervisi, skor, RTL, jadwal, data perawat, dan metadata SOP di tabel Supabase.
3. Membatasi perubahan data ke administrator terautentikasi melalui RLS dan RPC; pengunjung/perawat tanpa akun hanya membaca ringkasan terpilih.
4. Menyimpan PDF SOP dalam bucket privat, memvalidasi PDF dan batas 3 MB, lalu membuka dokumen melalui signed URL singkat.

## Menjalankan secara lokal

1. Siapkan project Supabase PostgreSQL.
2. Jalankan [`supabase/migrations/202610220001_initial_schema.sql`](./supabase/migrations/202610220001_initial_schema.sql) melalui Supabase SQL Editor.
3. Salin `.env.example` menjadi `.env.local`, lalu isi `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` dari pengaturan API project Supabase. Jangan gunakan service-role key pada aplikasi.
4. Jalankan `npm run dev`.
5. Login Admin aplikasi menggunakan email: `admin@supervisi.com` dan password: `adminsupervisi123`. Perawat tidak perlu login (mode baca publik).

## Fitur yang dimigrasikan

- Dashboard, rekapitulasi dan analisis per item, detail supervisi, tindak lanjut, jadwal, panduan SPO, serta administrasi data perawat.
- Wizard tujuh tahap dengan butir observasi dari checklist SOP yang disimpan saat dokumen diunggah. Admin meninjau dan menyunting hasil ekstraksi lokal di menu SPO; saat supervisi checklist langsung digunakan untuk penilaian skor 0/1/2/N/A, kesimpulan, faktor penyebab, intervensi, FAIR, RTL, serta re-supervisi. PDF hasil scan tanpa lapisan teks perlu dilengkapi manual.
- Tahap FAIR menyediakan tanda tangan digital dengan menggambar atau mengetik nama; tanda tangan tersimpan di hasil supervisi. Setelah penyimpanan, lembar hasil dapat dicetak atau disimpan sebagai PDF melalui dialog cetak browser.
- SOP lama yang belum memiliki checklist dapat disiapkan melalui tombol **Atur checklist** pada dokumen di menu SPO & Modul. Perubahan checklist hanya berlaku untuk supervisi baru; hasil supervisi sebelumnya tetap menyimpan butir yang dipakai saat itu.
- PDF SPO privat dengan signed URL. Ukuran maksimum 3 MB, sesuai HTML sumber.
- Tampilan responsif, tema gelap, pemuatan/kondisi kosong/error, dan aksi yang hanya mengonfirmasi berhasil setelah Supabase membalas sukses.

## Struktur antarmuka

- Setiap menu memakai route App Router sendiri: Beranda `/`, Supervisi `/supervisi`, Tindak Lanjut `/tindak-lanjut`, Rekapitulasi `/rekap`, Jadwal `/jadwal`, Panduan SPO `/sop`, dan Perawat `/perawat`.
- Detail hasil tersedia pada `/detail/[id]`.
- Navigasi/sidebar, header seluler, footer, dan shell autentikasi berada di komponen terpisah pada `components/supervisi/`.
- Status autentikasi, data Supabase, dan draft wizard berada pada provider di root layout agar draft tetap ada saat berpindah route.

## Aturan bisnis yang dipertahankan

- Persentase = skor / (2 × jumlah item bernilai angka) × 100, dibulatkan satu desimal; N/A dikecualikan dari penyebut. Kategori: Baik ≥76, Cukup ≥56, selainnya Kurang.
- Item kritis bernilai 0 menghasilkan “Critical patient safety issue”; selain itu prioritas Tinggi bila kategori Kurang atau ada item kritis bernilai 1, Sedang untuk kategori Cukup, selainnya Rendah.
- Tenggat standar berdasarkan prioritas adalah 3/7/14/30 hari; RTL untuk item kritis bernilai 0 menggunakan 3 hari.
- Hasil re-supervisi tetap menjadi supervisi baru yang terhubung ke supervisi induk. Status RTL induk terkait diperbarui ketika skor pengulangan bernilai angka.

## Catatan audit sumber

- HTML lama menyimpan data, sesi, tema, akun, dan PIN di `localStorage`, menyertakan PIN default `1234`, dan memperbolehkan bypass login dengan PIN tersebut. Mekanisme ini tidak dibawa ke aplikasi.
- Seed supervisi, akun contoh, dan SPO contoh pada HTML lama tidak dimigrasikan agar statistik produksi tidak terisi data demonstrasi.
- Unggah PDF lama hanya menyimpan metadata di `localStorage`; file PDF sebenarnya tidak disimpan dan tombol detail hanya menampilkan alert. Migrasi ini menyimpan PDF sungguhan di Storage.
- Tidak ditemukan pengunggahan atau relasi bukti penilaian pada kode sumber HTML. Karena itu aplikasi ini tidak mengarang alur bukti yang tidak ada pada sumber.
- Kelola User pada sumber hanya membuat akun lokal berbasis PIN. Akun administrator sekarang dikelola di Supabase Auth, sedangkan halaman Perawat mengelola direktori perawat (bukan kredensial login).

## Keamanan dan batasan operasional

- Semua tabel operasional dibatasi RLS untuk administrator; pengguna anonim hanya dapat memanggil `get_public_overview()` untuk memperoleh kolom ringkasan yang ditujukan bagi perawat.
- Bucket `supervisi-private` tidak publik. Kebijakan Storage hanya mengizinkan administrator mengubah file; file terbit dapat dibaca melalui signed URL berdurasi 60 detik.
- RLS tidak menyediakan akses tulis untuk role anon. Akun Auth tanpa entri aktif pada `admin_profiles` tetap berperilaku sebagai pengunjung baca-saja.
- Profil admin pertama harus dibuat dari Dashboard/SQL Editor seperti langkah di atas. Pembuatan akun Auth lain tidak dilakukan melalui browser.

## Pemeriksaan

Jalankan `npm run lint` dan `npm run build`. Pengujian terhadap project Supabase nyata memerlukan URL, anon key, migrasi yang telah dijalankan, dan setidaknya satu profil administrator yang dikonfigurasi pemilik project.
