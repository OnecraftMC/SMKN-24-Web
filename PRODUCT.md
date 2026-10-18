# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary user: a single school staff operator (single admin account, role field exists on `admin_users` but the operator manages every module). They arrive at `apps/admin` between teaching duties to publish and correct what the public site shows, and to clear the two student inboxes. Secondary audiences reached by their work, never by the dashboard: prospective students and parents reading `apps/main-web`, and students submitting BK messages, aspirations, and chatbot questions.

Operating context: Bahasa Indonesia throughout the UI and backend messages; Indonesian school calendar; the operator works in short bursts, often from a phone or a shared office desktop, while the public site and the admin dashboard run simultaneously.

## Product Purpose

SMKN 24 Jakarta runs one public-facing school website plus the admin dashboard that feeds it. The dashboard exists so one operator can keep the public site accurate without engineering help: publish and unpublish news, announcements, agenda, gallery, facilities, teacher directory, and lesson schedule; and read, progress, and close student messages (Pesan BK) and aspirations. Success means the public site is never stale or wrong, and no student message is missed.

## Positioning

Not a generic CMS: the content is bound to one school's public site and its real modules, and two of the modules — Pesan BK and Aspirasi — are anonymous-to-identity student inboxes that the same operator must triage, not just publish. The public site is the only consumer; there is no second channel, no multi-tenant publishing, no theme market.

## Operating Context

- Two Next.js apps plus a PHP REST backend: `apps/main-web` (public, port 3000), `apps/admin` (dashboard, port 3001), `backend/` (PHP, JWT auth, MySQL via `backend/database.sql`).
- `apps/admin` talks directly to the PHP backend, not to `apps/main-web/app/api/*`, because those routes are static placeholders that do not forward auth.
- One visual token source: `packages/shared/tokens.css`, imported by both apps so admin branding matches the public site. It must never be copied per app.
- Backend endpoints exist today for agenda, aspirasi, auth (login/me), berita, BK, chat history, fasilitas, galeri, guru, jadwal, pengumuman, and file upload. No endpoints or tables exist yet for Pusat Arsip, Pengajuan Prestasi, or account settings.
- Working notes, inspection reports, and GitHub issues live in `laporan/` and `github-issues/` and are part of how this project is run.

## Capabilities and Constraints

- Session: JWT in `localStorage` (key `smkn24-admin-token`), 8-hour expiry, no server-side revoke — logout means deleting the local token. Expiry must degrade to a clean re-login, never a broken screen.
- Every backend failure must stay per-resource and legible; the overview already loads eight resources in parallel and must not collapse into one global error.
- Uploaded images flow through `backend/api/upload.php`; image fields are a first-class part of most content modules.
- Staff-facing vocabulary is Indonesian and domain-specific (Jurusan, Rombel, Kelas, Paket/Kelas Industri, Galeri Kegiatan). Inventing new terms or translating them to English breaks the operator's vocabulary.
- Undecided: Pusat Arsip, Pengajuan Prestasi, and Profil & Sesi have no backend yet, so their real data shapes are unknown. Role-based surfaces beyond the single operator are undecided, not required.
- Secrets (AI keys, `JWT_SECRET`) live only in `backend/.env` and must never reach the app.

## Brand Commitments

- Name and identity are the school's: "SMKN 24 Jakarta", its logo (`apps/admin/public/logo-smkn24.png`, `.assets/smk24.svg`), and the shared token palette are already established and authoritative for both apps.
- The admin dashboard is deliberately branded as *the same institution as the public site*, not as a third-party tool. Visual warmth and craft belong in the public site; the admin surface carries precision and restraint while sharing the palette and type.

## Evidence on Hand

- Real content and data flows exist end to end: `backend/database.sql` (berita, pengumuman, agenda, guru, jadwal, galeri, fasilitas, pesan_bk, aspirasi, chat_sessions, chat_messages, admin_users); `backend/api/*` handlers; `apps/admin/lib/types.ts` DTOs; seven built admin modules.
- No testimonials, no usage analytics, no performance or adoption metrics exist for this product. Future work must not invent them, and no success claim may be presented as measured data.

## Product Principles

1. The public site is the product; the dashboard is a means. Every screen is judged by whether the site that results is correct.
2. Never let a student's message wait invisibly. Inbox state must be visible from anywhere in the dashboard.
3. Failure is per-item, never per-page. A dead endpoint must degrade one card or one form field, not the whole session.
4. One operator, many modules. Consistency across modules is a feature: same list grammar, same editor, same status vocabulary everywhere.
5. Shared truth, one source. Tokens, types, and API contract live once and are consumed by both apps.

## Accessibility & Inclusion

Indonesian-language UI, high-contrast dark-navy primary on light surfaces per the shared tokens, and keyboard-reachable interactive controls. The operator uses this on a phone as well as a desktop, so every task must be completable at 360px width. Targets WCAG 2.2 AA.