<#
  Buat issue GitHub dari berkas .md di folder ini (judul = baris pertama "# ...").
  Memerlukan GitHub CLI (gh) yang sudah terautentikasi:  gh auth login

  .\buat-issue.ps1 -DryRun   # pratinjau, tidak membuat apa pun
  .\buat-issue.ps1           # buat semua issue
#>
param(
  [switch]$DryRun,
  [string]$Repo = 'OnecraftMC/SMKN-24-Web'
)

$ErrorActionPreference = 'Stop'
$files = Get-ChildItem -Path $PSScriptRoot -Filter '*.md' | Where-Object { $_.Name -ne 'README.md' } | Sort-Object Name

# Dry run hanya butuh PowerShell, jadi gh tidak wajib ada.
if (-not $DryRun -and -not (Get-Command gh -ErrorAction SilentlyContinue)) {
  Write-Host "gh CLI tidak ditemukan. Pasang dengan:  winget install --id GitHub.cli" -ForegroundColor Red
  Write-Host "Atau salin isi tiap berkas secara manual ke https://github.com/OnecraftMC/SMKN-24-Web/issues/new" -ForegroundColor Yellow
  exit 1
}

foreach ($file in $files) {
  $raw    = Get-Content $file.FullName -Raw
  # Judul = baris pertama yang diawali "# "
  $title  = ([regex]::Match($raw, '(?m)^#\s+(.+)$')).Groups[1].Value.Trim()
  # Buang baris judul, sisanya adalah body
  $body   = [regex]::Replace($raw, '(?m)^#\s+.+?$\r?\n', '').Trim()

  if (-not $title) { Write-Host "Lewati $($file.Name): judul tidak ditemukan" -ForegroundColor Yellow; continue }

  if ($DryRun) {
    Write-Host "--- $($file.Name)" -ForegroundColor Cyan
    Write-Host "    judul: $title"
    Write-Host "    body : $($body.Length) karakter"
    continue
  }

  $bodyFile = [System.IO.Path]::GetTempFileName()
  # PENTING: UTF-8 tanpa BOM. Set-Content -Encoding utf8 pada Windows PowerShell 5.1
  # menulis BOM dan merusak karakter non-ASCII (em-dash -> mojibake) saat body
  # dikirim lewat --body-file. Tulis lewat .NET API agar deterministik.
  [System.IO.File]::WriteAllText($bodyFile, $body, (New-Object System.Text.UTF8Encoding $false))
  $url = gh issue create --repo $Repo --title $title --body-file $bodyFile
  Remove-Item $bodyFile -Force
  Write-Host "OK  $($file.Name) -> $url" -ForegroundColor Green
}

if ($DryRun) {
  Write-Host "`nDry run selesai. Jalankan tanpa -DryRun untuk membuat issue." -ForegroundColor Cyan
} else {
  Write-Host "`nSelesai. Lihat: https://github.com/$Repo/issues" -ForegroundColor Cyan
}
