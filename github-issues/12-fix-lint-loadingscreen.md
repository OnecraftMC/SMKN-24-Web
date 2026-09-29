# fix(lint): `LoadingScreenProvider` memanggil `setState` sinkron di dalam effect

## Masalah

Satu-satunya **error** (bukan warning) di `npx eslint app components lib` berasal dari komponen splash. Error ini sengaja dibiarkan pada ronde sebelumnya karena berasal dari branch lain, tapi membuat `npm run lint` tidak hijau.

## Bukti

```
components/ui/LoadingScreenProvider.tsx:23:7
  23 |       setIsLoading(true);
      |       ^^^^^^^^^^^^ Avoid calling setState() directly within an effect
  react-hooks/set-state-in-effect
```

- `apps/main-web/components/ui/LoadingScreenProvider.tsx:14-30` — effect membaca `sessionStorage` lalu memanggil `setIsLoading(true)`
- Statistik saat ini: **1 error, 5 warning** di `apps/main-web`

## Kenapa tidak langsung diperbaiki

Perilaku ini disengaja: mencegah kilatan konten (F01 di `report.md`). Menghapus `setState` dari effect tanpa menggantinya dengan mekanisme lain akan mengembalikan kilatan tersebut.

Catatan positif: F01 **sudah diperbaiki** — hasil prerender `index.html` sudah memuat `<main>` dan `<h1>` (diverifikasi 27 Sep 2026), sehingga konten sudah tersedia di HTML untuk crawler.

## Acceptance criteria

- [ ] Solusi yang dipilih **tidak** murderingkan anti-flash
- [ ] `setState` sinkron di dalam effect hilang
- [ ] Perilaku `prefers-reduced-motion` tetap dihormati
- [ ] `sessionStorage` tetap mencegah splash berulang
- [ ] Verifikasi: `npx eslint app components lib` → 0 error

## Opsi pendekatan (pilih satu)

1. Turunkan `isLoading` ke state yang diinisialisasi secara aman (mis. `useSyncExternalStore`) sehingga keputusan "tampilkan splash" terjadi di render, bukan di effect.
2. Terapkan `// eslint-disable-next-line react-hooks/set-state-in-effect` **dengan komentar** yang menjelaskan bahwa kilatan adalah yang dihindari — ini trade-off yang dapat diterima, asalkan alasannya tertulis.

## Referensi

`report.md` F01, F22 · `implementasi.md` §5.1
