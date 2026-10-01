# feat(chat): ganti simulasi `setTimeout` dengan backend chat yang sudah matang

## Masalah

`ChatbotWidget` menjawab dengan balasan template setelah timer 1 detik. Endpoint chat di backend justru sudah lengkap dan belum dipakai.

## Bukti

- `apps/main-web/components/chatbot/ChatbotWidget.tsx:21` — `setTimeout(...)` lalu balas statis
- `apps/main-web/lib/api.ts:156-165` — `postChat(payload)` tersedia, tidak ada pemanggil
- `apps/main-web/lib/api.ts:167-197` — `proxyPublicPost("chat", payload)` tersedia, tidak ada pemanggil
- `apps/main-web/app/api/chat/route.ts` — masih stub `501`
- `backend/api/chat/index.php` — sudah mendukung konteks sekolah (pengumuman + agenda terbaru) dan kontinuitas 10 pesan terakhir

## Dampak

Widget chatbot menampilkan Iterator yang tidak benar — jawaban apa pun yang diberikan adalah fiksi. Ini temuan F12 di `report.md`.

## Acceptance criteria

- [x] `setTimeout` simulasi dihapus
- [x] Pesan dikirim `POST /api/chat` dengan `{ sessionId, message }`
- [x] `sessionId` disimpan di `localStorage` (kunci `smkn24-chat-session`)
- [x] `app/api/chat/route.ts` memakai `proxyPublicPost("chat", ...)`, bukan stub 501
- [x] Indikator "mengetik" mencerminkan request nyata, bukan timer
- [x] Error backend ditampilkan di UI, bukan disembunyikan
- [x] Tombol kirim nonaktif saat request berjalan

> Status 1 Okt 2026: terverifikasi. `POST /api/chat` lewat prod server main-web →
> **200** dengan `{ sessionId, reply }`; sesi + 2 pesan tersimpan di
> `chat_sessions`/`chat_messages` (dibersihkan setelah uji).
> **Catatan risiko tetap terbuka:** balasan yang diterima saat uji adalah
> *fallback* backend ("asisten AI sedang tidak dapat diakses") karena provider AI
> tidak merespons, jadi HTTP 200 tidak menjamin jawaban AI asli — kontrak backend
> belum memisahkan kedua kondisi ini. Rate limit `/api/chat` **belum ada**.

## Catatan keamanan

Backend **belum** punya rate limit untuk `/api/chat` (lihat `backend/README.md` §keamanan). Pasang rate limit sebelum rilis publik, atau dokumentasikan risikonya.

## Referensi

`report.md` F12 · `template and promt/promt3.md` B5.1–B5.2
