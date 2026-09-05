# Product Requirements Document (PRD)
## Website Profil SMK Negeri 24 Jakarta

**Versi**: 1.0
**Tanggal**: September 2026
**Status**: Disetujui untuk Implementasi

---

## 1. Executive Summary

### Problem Statement
Calon siswa, orang tua, alumni, dan masyarakat umum kesulitan mengakses informasi terbaru dan lengkap tentang SMK Negeri 24 Jakarta. Saluran informasi yang ada saat ini (brosur, pengumuman langsung, atau media sosial) memiliki keterbatasan dalam hal jangkauan, aksesibilitas 24/7, dan kemampuan menjawab pertanyaan spesifik pengguna.

### Proposed Solution
Membangun website profil sekolah yang informatif, responsif, interaktif, dan mudah digunakan pada perangkat desktop maupun mobile. Website akan mengintegrasikan AI chatbot berbasis OpenAI API yang mampu menjawab pertanyaan pengguna berdasarkan konten website secara real-time 24/7. Website juga akan memiliki admin dashboard untuk memungkinkan staf sekolah memperbarui konten secara mandiri.

### Success Criteria
- **KPI 1**: Mencapai 5.000-20.000 kunjungan per bulan dalam 6 bulan pertama setelah peluncuran
- **KPI 2**: Mengurangi rata-rata waktu pencarian informasi menjadi < 2 menit (sebelumnya ~5-10 menit melalui metode konvensional)
- **KPI 3**: AI Chatbot mencapai akurasi respons >= 90% berdasarkan 100+ test cases
- **KPI 4**: 85% pengguna melaporkan kepuasan >= 4 dari 5 pada survei post-launch
- **KPI 5**: Page load time < 3 detik pada koneksi 3G (Lighthouse Performance score >= 80)

---

## 2. User Experience & Functionality

### User Personas

| Persona | Demografi | Kebutuhan Utama | Tingkat Kemampuan Teknis |
|---------|-----------|-----------------|--------------------------|
| **Calon Siswa** | Usia 14-16 tahun, siswa SLTP | Informasi program kejuruan, prosedur pendaftaran, biaya | Menengah (mobile-first) |
| **Orang Tua Siswa** | Usia 35-55 tahun | Kualitas pendidikan, prestasi, fasilitas, biaya | Menengah (campuran desktop/mobile) |
| **Alumni** | Usia 18-40 tahun | Berita alumni, kegiatan reuni, lowongan kerja | Tinggi (desktop utama) |
| **Masyarakat Umum** | Usia 18-60 tahun | Kontak, lokasi, informasi kolaborasi | Bervariasi |
| **Staf Sekolah (Admin)** | Usia 25-60 tahun | Kemudahan memperbarui konten tanpa coding | Rendah-Menengah |

### User Stories

**US-1**: Sebagai calon siswa, saya ingin melihat daftar program keahlian/jurusan yang tersedia dengan deskripsi singkat sehingga saya bisa menentukan pilihan yang sesuai dengan minat saya.

**US-2**: Sebagai orang tua, saya ingin melihat informasi prestasi akademik dan non-akademik sekolah sehingga saya bisa menilai kualitas pendidikan.

**US-3**: Sebagai pengunjung, saya ingin bertanya kepada chatbot AI tentang informasi sekolah kapan saja sehingga saya tidak perlu menunggu jam operasional sekolah.

**US-4**: Sebagai admin sekolah, saya ingin login ke dashboard dan memperbarui berita, jadwal, dan informasi sekolah sehingga website selalu menampilkan data terkini.

**US-5**: Sebagai pengunjung, saya ingin melihat lokasi sekolah di peta dan menghubungi sekolah melalui form kontak sehingga saya bisa berkunjung atau bertanya.

**US-6**: Sebagai pengunjung mobile, saya ingin website tampil optimal di smartphone saya sehingga saya bisa membaca informasi dengan nyaman.

### Acceptance Criteria

**US-1 (Program Keahlian)**
- [ ] Halaman khusus menampilkan minimal 4-6 program keahlian dengan ikon, nama, dan deskripsi
- [ ] Setiap program keahlian dapat diklik untuk melihat detail lengkap (mata pelajaran, prospek karir, durasi)
- [ ] Halaman dapat diakses dari menu utama dan dari landing page

**US-2 (Prestasi)**
- [ ] Halaman galeri prestasi menampilkan daftar prestasi terbaru dengan tanggal, kategori, dan tingkat
- [ ] Filter berdasarkan tahun dan kategori
- [ ] Gambar/foto bukti prestasi dapat ditampilkan

**US-3 (AI Chatbot)**
- [ ] Widget chat tersedia di pojok kanan bawah pada setiap halaman
- [ ] Chatbot merespons dalam < 2 detik untuk 95% query
- [ ] Chatbot dapat menjawab pertanyaan tentang: profil sekolah, program, fasilitas, prestasi, kontak, lokasi, jadwal PPDB
- [ ] Riwayat percakapan disimpan selama sesi browser
- [ ] Tombol feedback (👍/👎) pada setiap respons

**US-4 (Admin Dashboard)**
- [ ] Login dengan username/password (terenkripsi)
- [ ] CRUD untuk: Berita, Pengumuman, Jadwal, Program Keahlian, Prestasi, Galeri
- [ ] Preview sebelum publish
- [ ] Status draft/published

**US-5 (Kontak & Lokasi)**
- [ ] Embed Google Maps dengan lokasi SMK Negeri 24 Jakarta
- [ ] Form kontak dengan field: nama, email, subjek, pesan
- [ ] Validasi input dan feedback setelah submit
- [ ] Menampilkan nomor telepon, email, dan alamat

**US-6 (Responsivitas)**
- [ ] Layout adaptif untuk breakpoint: mobile (≤640px), tablet (641-1024px), desktop (>1024px)
- [ ] Touch target minimal 44x44 px pada mobile
- [ ] Hamburger menu pada mobile

### Non-Goals
- ❌ Sistem E-Learning atau LMS (Learning Management System)
- ❌ Sistem pembayaran SPP online
- ❌ Sistem absensi siswa/guru
- ❌ Aplikasi mobile native (iOS/Android)
- ❌ Forum diskusi komunitas
- ❌ Integrasi dengan Dapodik atau sistem pendidikan nasional lainnya
- ❌ Multi-bahasa (hanya Bahasa Indonesia)
- ❌ Sistem akademik (rapor, nilai online)

---

## 3. AI System Requirements

### Tool Requirements

| Komponen | Tools/API | Fungsi |
|----------|-----------|--------|
| LLM | OpenAI API (`gpt-3.5-turbo` atau lebih baru) | Generate respons chatbot dalam Bahasa Indonesia |
| Embedding | OpenAI Embeddings API (`text-embedding-3-small`) | Vektorisasi konten sekolah untuk retrieval |
| Vector Store | SQLite dengan ekstensi `sqlite-vss` atau implementasi manual | Penyimpanan & pencarian embedding |
| Content Indexer | Custom script (Bun) | Scraping & indexing konten website ke vector store |
| Rate Limiter | ElysiaJS plugin | Pembatasan jumlah request per user/IP |
| Moderation | OpenAI Moderation API | Filter konten tidak pantas pada input/output |

### Evaluation Strategy

**Offline Evaluation (Pre-launch)**:
1. Buat 100+ test cases yang mencakup semua jenis pertanyaan (profil, program, fasilitas, prestasi, kontak, lokasi)
2. Ukur akurasi dengan metrik:
   - **Precision**: % respons yang mengandung informasi benar
   - **Relevance**: % respons yang menjawab pertanyaan (manual review)
   - **Factual Accuracy**: % respons tanpa halusinasi (diverifikasi terhadap basis data)
3. Target: >= 90% pada ketiga metrik

**Online Evaluation (Post-launch)**:
1. **Feedback Collection**: Tombol 👍/👎 pada setiap respons chatbot
2. **Analytics**: Track pertanyaan yang paling sering, tingkat kepuasan, dan topik yang sulit dijawab
3. **Periodic Review**: Tim sekolah me-review 50 respons acak per minggu
4. **A/B Testing**: Bandingkan model/parameter berbeda untuk optimasi

**Continuous Improvement**:
- Knowledge base diperbarui setiap kali admin memperbarui konten website (auto-reindex)
- Review bulanan untuk menambah/memperbaiki jawaban template
- Retraining prompt engineering berdasarkan feedback pengguna

---

## 4. Technical Specifications

### Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                            │
│  ┌─────────────────────────┐    ┌─────────────────────────────┐  │
│  │  Public Website (Svelte)│    │  Admin Dashboard (Svelte)   │  │
│  │  - Landing Page         │    │  - Login Page               │  │
│  │  - Program Keahlian     │    │  - Content Management       │  │
│  │  - Prestasi             │    │  - Preview & Publish        │  │
│  │  - Fasilitas            │    └─────────────────────────────┘  │
│  │  - Kontak               │                │                    │
│  │  - AI Chatbot Widget    │                │                    │
│  └────────────┬────────────┘                │                    │
└───────────────┼─────────────────────────────┼────────────────────┘
                │ HTTPS (REST API)           │
                ▼                            ▼
┌──────────────────────────────────────────────────────────────────┐
│                      BACKEND (Bun + ElysiaJS)                     │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌─────────┐ │
│  │ Content API  │ │ Auth API     │ │ Chat API     │ │Media API │ │
│  │ (Public)     │ │ (JWT)        │ │ (OpenAI)     │ │(Embed)   │ │
│  └──────┬───────┘ └──────┬───────┘ └──────┬───────┘ └────┬─────┘ │
│         │                │                │              │       │
│         └────────────────┴────────────────┴──────────────┘       │
│                                  │                                │
│                          ┌───────▼────────┐                       │
│                          │  DrizzleORM    │                       │
│                          └───────┬────────┘                       │
└──────────────────────────────────┼────────────────────────────────┘
                                   │
        ┌──────────────────────────┼──────────────────────────┐
        ▼                          ▼                          ▼
┌──────────────┐         ┌──────────────────┐         ┌──────────────┐
│  Database    │         │  Vector Store    │         │  OpenAI API  │
│  (SQLite/    │         │  (SQLite-vss)    │         │  (External)  │
│   PostgreSQL)│         │  Embeddings      │         │              │
└──────────────┘         └──────────────────┘         └──────────────┘
```

### Tech Stack (Confirmed)

| Layer | Technology | Alasan |
|-------|-----------|--------|
| **Frontend** | Svelte 4 + TypeScript + Vite | Ringan, cepat, mudah dipelajari, output kecil |
| **Styling** | Tailwind CSS + shadcn-svelte | Konsistensi desain, cepat develop, accessible |
| **Backend Runtime** | Bun | Performa tinggi, TypeScript native, built-in test |
| **Backend Framework** | ElysiaJS | TypeScript-first, ringan, cepat, ergonomic |
| **ORM** | DrizzleORM | Type-safe, ringan, SQL-like, integrasi baik dengan Bun |
| **Database** | SQLite (dev) → PostgreSQL (prod) | Mudah development, scalable untuk production |
| **Vector Store** | SQLite dengan `sqlite-vss` atau `pgvector` | Sederhana, cukup untuk skala SMK |
| **AI** | OpenAI API | Kemampuan Bahasa Indonesia baik, mudah integrasi |
| **Auth** | JWT (jose library) | Stateless, aman, standar industri |
| **Validation** | Zod | TypeScript-first, populer, terintegrasi dengan Elysia |
| **Deployment** | TBD (Vercel/Railway/Fly.io/self-hosted) | TBD sesuai preferensi sekolah |

### Integration Points

1. **Frontend ↔ Backend**: REST API dengan JSON, CORS configured
2. **Backend ↔ Database**: DrizzleORM dengan prepared statements
3. **Backend ↔ OpenAI**: HTTPS dengan API key dari environment variable
4. **Backend ↔ Vector Store**: Query SQL dengan k-nearest neighbor
5. **Media Sosial**: Embed Instagram/Facebook/YouTube via iframe/oEmbed
6. **Email (Kontak Form)**: SMTP via Nodemailer (opsional, bisa pakai Formspree)

### Security & Privacy

| Aspek | Implementasi |
|-------|--------------|
| **Transport Security** | TLS 1.3, HSTS, redirect HTTP→HTTPS |
| **Authentication** | bcrypt untuk password, JWT dengan expiry 24h, refresh token |
| **Authorization** | Role-based (admin, editor, viewer) |
| **Input Validation** | Zod schema di semua endpoint |
| **XSS Protection** | Sanitize HTML, Content Security Policy (CSP) header |
| **SQL Injection** | DrizzleORM prepared statements (aman by default) |
| **CSRF** | SameSite cookies, CSRF token untuk form |
| **Rate Limiting** | 100 req/menit per IP, 10 req/menit untuk chat |
| **CORS** | Whitelist domain sekolah |
| **Logging** | Structured logging dengan Bunyan, tidak log PII |
| **Backup** | Daily automated backup database, retention 30 hari |
| **Environment** | Secret management via env vars, tidak commit ke git |
| **Compliance** | UU PDP (Pelindungan Data Pribadi) Indonesia |

### Performance Requirements
- **Lighthouse Score**: Performance >= 80, Accessibility >= 90, SEO >= 90
- **First Contentful Paint**: < 1.5s pada 3G
- **Time to Interactive**: < 3s pada 3G
- **API Response Time**: p95 < 200ms untuk endpoint publik
- **Chatbot Response Time**: p95 < 3s (termasuk OpenAI API call)
- **Uptime**: 99.5% (allow 3.6 jam downtime/bulan)

---

## 5. Risks & Roadmap

### Phased Rollout

| Phase | Timeline | Scope | Deliverables |
|-------|----------|-------|--------------|
| **MVP** | Minggu 1 | Landing page + Profil Sekolah | Halaman utama, tentang sekolah, struktur organisasi |
| **v1.0** | Minggu 2 | Konten Lengkap + Media Sosial | Program, fasilitas, prestasi, kontak, embed medsos |
| **v1.1** | Minggu 3 | AI Chatbot | Chat widget, integrasi OpenAI, vector store, knowledge base |
| **v1.2** | Minggu 4 | Admin Dashboard + Polish | Auth, CRUD content, testing, optimasi, deployment |
| **v2.0** | Bulan 2-3 | Enhancements | Analytics dashboard, advanced search, multi-bahasa (opsional), PWA |

### Technical Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Deadline < 1 bulan sangat ketat** | High | High | Scope MVP diprioritaskan, fitur avanzed di-defer ke v2.0 |
| **Anggaran < 5 juta IDR terbatas** | High | Medium | Gunakan free tier OpenAI, hosting murah, fokus pada essential features |
| **Biaya OpenAI API bisa membengkak** | Medium | High | Rate limiting agresif, caching untuk Q&A umum, monitoring biaya harian |
| **Latency OpenAI API** | Medium | Medium | Streaming response, fallback ke jawaban template jika API down |
| **Hallucination AI Chatbot** | Medium | High | Retrieval-augmented generation (RAG) dari knowledge base, temperature rendah |
| **OpenAI API downtime** | Low | High | Fallback ke FAQ statis, retry mechanism dengan exponential backoff |
| **Keamanan website** | Medium | High | Implementasi dari awal (bukan afterthought), security review berkala |
| **Adopsi admin dashboard rendah** | Medium | Medium | Training staf, UI intuitif, dokumentasi lengkap |
| **Konten tidak ter-update** | High | Medium | Reminder otomatis, audit berkala, contoh konten tersedia |
| **Traffic spike (PPDB season)** | Medium | Medium | CDN, caching, auto-scaling jika di cloud |

### Budget Estimation (Under 5 juta IDR)

| Item | Estimated Cost (IDR) |
|------|---------------------|
| Domain (.sch.id) | 200.000/tahun |
| Hosting (VPS/Railway/Fly.io) | 500.000-1.500.000/tahun |
| OpenAI API (estimated 10k chat/bulan) | 1.500.000-3.000.000/bulan |
| SSL Certificate | 0 (Let's Encrypt) |
| Development Tools | 0 (open source) |
| **Total Year 1** | **~ 20-40 juta IDR** |

> ⚠️ **Catatan**: Anggaran 5 juta IDR kemungkinan tidak akan cukup untuk 1 tahun operasional dengan AI chatbot. Rekomendasi: cari sponsorship, gunakan model AI yang lebih murah, atau implementasi dengan budget terbatas (chatbot gratis alternatif seperti Llama 3 lokal).

### Success Metrics Tracking

- **Week 1**: Lighthouse audit, smoke test semua endpoint
- **Month 1**: User survey (target 100 responden), analytics setup
- **Month 3**: Mid-term review, adjust berdasarkan data
- **Month 6**: Final evaluation terhadap 5 KPI utama

---

## 6. Appendix

### Glossary
- **PRD**: Product Requirements Document
- **MVP**: Minimum Viable Product
- **API**: Application Programming Interface
- **ORM**: Object-Relational Mapping
- **JWT**: JSON Web Token
- **RAG**: Retrieval-Augmented Generation
- **PWA**: Progressive Web App

### References
- SMK Negeri 24 Jakarta official info (TBD - perlu dikonfirmasi)
- Tailwind CSS Documentation
- Svelte 4 Documentation
- ElysiaJS Documentation
- DrizzleORM Documentation
- OpenAI API Documentation
- UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi

### Approval

| Role | Nama | Tanggal | Status |
|------|------|---------|--------|
| Product Owner | TBD | TBD | Pending |
| Tech Lead | TBD | TBD | Pending |
| Stakeholder (Sekolah) | TBD | TBD | Pending |
