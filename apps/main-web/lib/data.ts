export const beritaData = [
  {
    id: 1,
    judul: "Tim Perhotelan SMKN 24 Raih Emas Lomba Kompetensi Siswa (LKS) Tingkat DKI Jakarta",
    kategori: "Prestasi Siswa",
    tanggal: "28 Oktober 2024",
    gambar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD56zdMGi-R7klP7dXy_uGqIo48HvcYbleLo-9LxgObyyGJN_sPpq3l9Us_GL5TvNioJQa-bWD1aRUzbzUUHBOxXfOR22H5KAfxg13TOhHucj6brZznxRvrnU_pD48Hz8TuoS2LoX90-uqMBgkWqRVmPpb4NcdQgg8IEmzErVFZ4oldYBCT1U_sYrchk_uxXhaeiNFrxgeYHctWBL8sDt7UFtFRlu-Ilt3oyqYbmCNcau6rMxJ5QVtkwg",
    ringkasan:
      "Peserta didik jurusan Perhotelan berhasil mengungguli kontestan SMK se-DKI Jakarta pada cabang lomba Housekeeping dan Food & Beverage Service.",
  },
  {
    id: 2,
    judul: "PKL Terpadu: Siswa RPL Magang di Perusahaan Pengembang Perangkat Lunak Mitra Industri",
    kategori: "Studi Industri",
    tanggal: "20 Oktober 2024",
    gambar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDw458QSA1sjuTi0dDyTMR-NSHYv6B6OZ3_hAq_49MQnz3-hCJfOZN62qrBJI5VKKPqznYeHkpOMHfe1Ghr3_Ad2fHrTpVvafpbq1ONN2FskBoKmsoYXClHmYCrhzYvfnzmD1j5f5ClF5gDRrT8c7rk-xC8Yfvxv2Pr5KLzzFFR4bEhnFpAD3NJ117rHfPjFe-ZtJlJahwslW3Sx8f0o1_yK01jLQEOmGS8uDDHDu900VCqMxENZr0fA",
    ringkasan:
      "Program Praktik Kerja Lapangan (PKL) semester ini menempatkan siswa RPL di perusahaan mitra sesuai skema link and match dunia usaha & industri.",
  },
];

export const pengumumanData = [
  {
    id: 1,
    judul: "Pengumuman PPDB 2025/2026 – Gelombang 2 Dibuka",
    tanggal: "15 November 2024",
    kategori: "Pendaftaran",
  },
  {
    id: 2,
    judul: "Jadwal Ujian Akhir Semester Ganjil 2024/2025",
    tanggal: "10 November 2024",
    kategori: "Akademik",
  },
  {
    id: 3,
    judul: "Rapat Orang Tua/Wali Murid Kelas XII – Persiapan Ujian",
    tanggal: "5 November 2024",
    kategori: "Kegiatan",
  },
  {
    id: 4,
    judul: "Lomba Kreativitas Siswa Tingkat Sekolah – Pendaftaran Dibuka",
    tanggal: "1 November 2024",
    kategori: "Prestasi",
  },
];

export const agendaData = [
  {
    id: 1,
    judul: "Peringatan Hari Guru Nasional",
    tanggal: "25 November 2024",
    waktu: "07.30 - 12.00 WIB",
    lokasi: "Aula Utama SMKN 24",
  },
  {
    id: 2,
    judul: "Praktik Uji Kompetensi Keahlian (UKK) Periode I",
    tanggal: "2 - 6 Desember 2024",
    waktu: "08.00 - 15.00 WIB",
    lokasi: "Laboratorium Kompetensi",
  },
  {
    id: 3,
    judul: "Pentas Seni & Bazar Karya Siswa",
    tanggal: "12 Desember 2024",
    waktu: "09.00 - 16.00 WIB",
    lokasi: "Halaman Depan Sekolah",
  },
];

export const agendaBerandaData = [
  { id: 1, day: 12, month: "NOV", badge: "Aktivitas Siswa", title: "Pekan Olahraga & Seni (PORSENI)", desc: "Kompetisi antarkelas, pentas bakat musik nusantara, dan bazaar kewirausahaan siswa.", time: "07.30 - 15.00 WIB" },
  { id: 2, day: 18, month: "NOV", badge: "Komite Sekolah", title: "Pertemuan Orang Tua & Wali", desc: "Sosialisasi progres akademik, evaluasi karakter tengah semester, dan seminar parenting.", time: "08.30 - 11.30 WIB" },
  { id: 3, day: 25, month: "NOV", badge: "Peringatan Akbar", title: "Peringatan Hari Guru Nasional", desc: "Upacara khidmat, persembahan apresiasi siswa, dan penganugerahan Guru Inspiratif 2024.", time: "07.00 - 10.30 WIB" },
];

export const pengumumanBerandaData = [
  { id: 1, badge: "SPMB 2026", status: "Mendesak", judul: "Jadwal Verifikasi & Daftar Ulang Gelombang 1", deskripsi: "Pendaftaran SPMB SMK DKI Jakarta dilakukan online melalui laman resmi spmb.jakarta.go.id pada jalur zonasi, afirmasi, dan prestasi.", linkLabel: "Unduh Juknis PDF", linkHref: "/akademik", icon: "attach_file", actionIcon: "download", variant: "secondary" },
  { id: 2, badge: "Akademik", status: null, judul: "Edaran Pelaksanaan Penilaian Akhir Semester (PAS)", deskripsi: "Pelaksanaan PAS Semester Ganjil TA 2025/2026 dilaksanakan serentak untuk seluruh kompetensi keahlian secara CBT.", linkLabel: "Lihat Kisi-kisi Ujian", linkHref: "/akademik", icon: "schedule", actionIcon: "arrow_forward", variant: "default" },
];

export const JADWAL_DATA = {
  perhotelan: {
    pagi: ['Front Office', 'Housekeeping', 'F&B Service', 'Bahasa Inggris Profesi', 'Tata Graha'],
    siang: ['Praktik Hotel Training', 'Praktik Hotel Training', 'Simulasi Check-in/out', 'Etika Pelayanan Tamu', 'Praktik Tata Hidang']
  },
  boga: {
    pagi: ['Pengolahan Makanan Indonesia', 'Pengolahan Kue & Roti', 'Sanitasi Hygiene', 'Bahasa Inggris Profesi', 'Pengolahan Makanan Kontinental'],
    siang: ['Praktik Dapur Produksi', 'Praktik Dapur Produksi', 'Pengelolaan Usaha Boga', 'Plating & Garnish', 'Praktik Pastry']
  },
  busana: {
    pagi: ['Dasar Pola', 'Desain Busana', 'Tekstil', 'Bahasa Inggris Profesi', 'Menjahit Busana Custom'],
    siang: ['Praktik Menjahit', 'Praktik Menjahit', 'Pembuatan Pola Industri', 'Grading & Finishing', 'Praktik Produksi Garmen']
  },
  pplg: {
    pagi: ['Pemrograman Web', 'Basis Data', 'Pemrograman Berorientasi Objek', 'Bahasa Inggris Profesi', 'Pengembangan Gim'],
    siang: ['Praktik Lab Komputer', 'Praktik Lab Komputer', 'Proyek Aplikasi Mobile', 'Jaringan Dasar', 'Praktik UI/UX']
  },
  pariwisata: {
    pagi: ['Pengetahuan Pariwisata', 'Pemanduan Wisata', 'Ticketing & Reservasi', 'Bahasa Inggris Profesi', 'Geografi Pariwisata'],
    siang: ['Praktik Tur Simulasi', 'Praktik Tur Simulasi', 'Pengelolaan Biro Perjalanan', 'Public Speaking', 'Studi Ekskursi']
  }
};

export const guruData = [
  {
    id: 1,
    nama: "Dra. Isfariani Marlena, M.Pd.",
    jabatan: "Kepala Sekolah",
    deskripsi: "Kepala SMK Negeri 24 Jakarta",
    kategori: "Pimpinan",
    gambar: "https://lh3.googleusercontent.com/aida/AEtjO1V7fOmuqOfpPxJzw-RitYoxnGDsfbS6rHQT61iy91xqfUGMsFKO6wmqdWEf3_OkPSu0U52AWC-yh4WCNDzBXmKmQAFiVQNAbzzv3cBsZQrl4Km7s2ohKXiuvA68yL-PuSMccRmyZDCi-QIXR7Zqnd9kSlLqYarekoUtKwOZcjhLVEOkf2GxE6yjNxkWejtvlIwoOOH0X3KVJIl5QP0GqViq7are0tzpaV8BHfDLi5IKRobcIOwxNkRInoqV",
  },
  {
    id: 2,
    nama: "Eva Yulianti, M.Pd.",
    jabatan: "Wakil Kepala Sekolah Bidang Humas & Kemitraan",
    deskripsi: "Penghubung Kerja Sama Dunia Usaha & Industri (DUDI)",
    kategori: "Pimpinan",
    gambar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCOeCD_0rcfYi5s2MdzNv87RbdOse9QWnB1acbH03h2p5X1HoUvUjOaG806Vd3nPvvrWDKNJzL5nfalaTEAe5BBjLHmByR7ZHmIkkl_-6GbntgUSA72qsG2iF8cF2lXvVgAPYbrAqkhEppOUxoMYOKvvdKxl7j_PDp2aojgw-tOY-rbCfDX0KOlUEpjXl8yeSOvcf5LRKuCzSoSaCeq0kvMvF0YSJzh_JDkt2NNKubIP5Bq9xqffdCD4A",
  },
  {
    id: 3,
    nama: "Bambang Wicaksono, S.T.",
    jabatan: "Kepala Program Keahlian RPL",
    deskripsi: "Praktisi Pengembangan Perangkat Lunak & Pembina Tim LKS RPL",
    kategori: "Keahlian",
    gambar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCV-sZ-ADV1-x7lNExXvIgBlP1fDUOyMBmM5-v90oWQKTSv0YnTQmZ_ncKnYwwgb4Zu50CATu3QLV7EFZLb-n67cY3Yv9bwlVb93FyEDXjd99GkXgJy-E0KxypqgrPsK0S0DawaWrw5JFUOkz04H09kEOe6jJzk3cpoU3Fl7w3udlQRX0djdHLkVbHOLgbQrqkPpwpcB4xnPQ-RmA_Fz-H-8_jjxfah9tuUs4TEx3jd9A3T8Nzn6QvAig",
  },
  {
    id: 4,
    nama: "Farida Rahman, M.Psi.",
    jabatan: "Kepala Bimbingan Konseling & Karir (BK)",
    deskripsi: "Konselor Penyaluran Kerja & Penempatan Alumni",
    kategori: "BK",
    gambar: "https://lh3.googleusercontent.com/aida-public/AB6AXuAZx8j1_sQSq27K9YssVGqxMQERQge3Nv_nKxq7wOhwL5R63Tsd2sS7ifVcs6PpeeeIWk-kiMORDyEWEatUWfBYbLPwy0KDp9iADGX52guvfpB5d4WSfQDYTWOsZhhuTfI_8pxCuhsIBXpNmXGtbPMXaCA5iNBD9Ahzl-vhvwcn_8ejyKZ9FnE1MpywxfVrH7OLtX6uVE2elpGtsUg9Qyc1-pJQbRe0NV7-YhoK6RBfCLZwPgMLykIfUw",
  },
];

export const fasilitasData = [
  {
    id: 1,
    judul: "Hotel Training",
    deskripsi: "Laboratorium perhotelan dan housekeeping dilengkapi kamar simulasi dan peralatan standar industri.",
    gambar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDpUo-3b_9Q5b0cWYpN6Vj3J5J0LJhXQfWYpN6Vj3J5J0LJhXQfWYpN6Vj3J5J0LJhXQ",
  },
  {
    id: 2,
    judul: "Lab Komputer RPL",
    deskripsi: "Laboratorium komputer dengan spesifikasi tinggi untuk pengembangan perangkat lunak dan jaringan.",
    gambar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCV-sZ-ADV1-x7lNExXvIgBlP1fDUOyMBmM5-v90oWQKTSv0YnTQmZ_ncKnYwwgb4Zu50CATu3QLV7EFZLb-n67cY3Yv9bwlVb93FyEDXjd99GkXgJy-E0KxypqgrPsK0S0DawaWrw5JFUOkz04H09kEOe6jJzk3cpoU3Fl7w3udlQRX0djdHLkVbHOLgbQrqkPpwpcB4xnPQ-RmA_Fz-H-8_jjxfah9tuUs4TEx3jd9A3T8Nzn6QvAig",
  },
  {
    id: 3,
    judul: "Dapur Produksi Boga",
    deskripsi: "Dapur profesional untuk praktik kuliner dengan standar higienis dan peralatan modern.",
    gambar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDw458QSA1sjuTi0dDyTMR-NSHYv6B6OZ3_hAq_49MQnz3-hCJfOZN62qrBJI5VKKPqznYeHkpOMHfe1Ghr3_Ad2fHrTpVvafpbq1ONN2FskBoKmsoYXClHmYCrhzYvfnzmD1j5f5ClF5gDRrT8c7rk-xC8Yfvxv2Pr5KLzzFFR4bEhnFpAD3NJ117rHfPjFe-ZtJlJahwslW3Sx8f0o1_yK01jLQEOmGS8uDDHDu900VCqMxENZr0fA",
  },
];

export const beritaUtama = {
  judul: "Tim Perhotelan SMKN 24 Raih Emas Lomba Kompetensi Siswa (LKS) Tingkat DKI Jakarta",
  kategori: "Headline Prestasi",
  tanggal: "28 Oktober 2024",
  gambar: "https://lh3.googleusercontent.com/aida-public/AB6AXuD56zdMGi-R7klP7dXy_uGqIo48HvcYbleLo-9LxgObyyGJN_sPpq3l9Us_GL5TvNioJQa-bWD1aRUzbzUUHBOxXfOR22H5KAfxg13TOhHucj6brZznxRvrnU_pD48Hz8TuoS2LoX90-uqMBgkWqRVmPpb4NcdQgg8IEmzErVFZ4oldYBCT1U_sYrchk_uxXhaeiNFrxgeYHctWBL8sDt7UFtFRlu-Ilt3oyqYbmCNcau6rMxJ5QVtkwg",
  ringkasan: "Tim riset fisika dan komputasi kami mencatatkan sejarah baru dengan memenangkan medali emas dalam kompetisi bergengsi tingkat nasional di Balikpapan.",
};

export const galeriData = [
  {
    id: 1,
    judul: "Upacara Hari Kebangkitan Nasional",
    kategori: "Kegiatan",
    gambar: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAUDBAQEAwUEBAQFBQUGBwwIBwcHBw8LCwkMEQ8SEhEPERETFhwXExQaFRERGCEYGh0dHx8fExciJCIeJBweHx7/2wBDAQUFBQcGBw4ICA4eFBEUHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh7/wAARCAKaA+gDASIAAhEBAxEB/8QAHQAAAQUBAQEBAAAAAAAAAAAABQIDBAYHAQAICf/EAEwQAAIBAwMCBAQCBwYFAwICCwECAwAEEQUSIQYxEyJBUQcUYXEygRUjQlKRobEIJDNicsEWJTQ10UPh8ReT/8QAIBAAAgMBAQEBAQEAAAAAAAAAAAECAxEEBQYHEAAICAwEAAgMBAAM=",
  },
];