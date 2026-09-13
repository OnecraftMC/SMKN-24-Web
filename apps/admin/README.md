# SMKN24 Admin

Admin Next.js terpisah. Admin tidak mengakses Supabase langsung; semua data melewati API `main-web`.

## Local

```powershell
Copy-Item .env.example .env.local
npm install
npm run dev
```

Set `NEXT_PUBLIC_MAIN_WEB_URL` ke URL `main-web`.
