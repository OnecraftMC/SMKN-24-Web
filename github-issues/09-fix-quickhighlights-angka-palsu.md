# fix(konten): `QuickHighlights` menampilkan angka statistik yang belum terverifikasi

## Masalah

Angka di kartu sorotan beranda tidak memiliki sumber data. Semua angka bersifat hardcoded di komponen, tidak berasal dari backend maupun dari data resmi mana pun.

## Bukti

`apps/main-web/components/beranda/QuickHighlights.tsx`:

- baris 5 — `value: "1.000+"`, label "Siswa Aktif"
- baris 11 — `value: "52 Guru"`, deskripsi "100% Tersertifikasi Profesional"
- baris 23 — `value: "100+"`, label "Prestasi", deskripsi "Juara Tingkat Provinsi & Nasional"

Komponen ini **tidak** mengimpor `lib/api` maupun `lib/data` — nilainya literal di dalam file.

## Dampak

- Untuk situs sekolah, klaim "100% Tersertifikasi" dan "1.000+ siswa" adalah pernyataan yang dapat diperiksa publik. Kalau angkanya tidak benar, kredibilitas seluruh situs rusak.
- Angka "1.420 Pembaca" yang sebelumnya ada di `FeaturedNews` sudah dihapus pada PR 27 Sep 2026; pola yang sama perlu diterapkan di sini.

## Acceptance criteria

- [ ] Angka harus dihapus, atau diberi sumber yang jelas. Bila sekolah tidak punya angka resmi, tampilkan klaim yang **tidak** butuh verifikasi (mis. "5 Kompetensi Keahlian", "Akreditasi A", "PKL dengan mitra industri")
- [ ] Bila angka dipertahankan, sumbernya harus satu-satuan (backend atau data resmi) — bukan literal di komponen
- [ ] Jangan menambahkan metrik baru tanpa sumber
- [ ] `QuickHighlights` berubah jadi server component yang menerima props, atau memakai data statis yang **bertimestamp** sehingga tidak dianggap data terkini

## Verifikasi

Bandingkan tiap angka dengan sumber resmi sekolah. Bila tidak ada sumber tertulis, hapus.

## Referensi

`report.md` F17 · `pemindahan konteks main-web.md` §5 P2
