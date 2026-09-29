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

- [ ] `setTimeout` simulasi dihapus
- [ ] Pesan dikirim `POST /api/chat` dengan `{ sessionId, message }`
- [ ] `sessionId` disimpan di `localStorage` (kunci `smkn24-chat-session`)
- [ ] `app/api/chat/route.ts` memakai `proxyPublicPost("chat", ...)`, bukan stub 501
- [ ] Indikator "mengetik" mencerminkan request nyata, bukan timer
- [ ] Error backend ditampilkan di UI, bukan disembunyikan
- [ ] Tombol kirim nonaktif saat request berjalan

## Catatan keamanan

Backend **belum** punya rate limit untuk `/api/chat` (lihat `backend/README.md` §keamanan). Pasang rate limit sebelum rilis publik, atau dokumentasikan risikonya.

## Referensi

`report.md` F12 · `template and promt/promt3.md` B5.1–B5.2
