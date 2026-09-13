"use client";

import { useState } from "react";
import Image from "next/image";

const guruData = [
  {
    id: 1,
    name: "Dra. Isfariani Marlena, M.Pd.",
    title: "Kepala Sekolah",
    desc: "Kepala SMK Negeri 24 Jakarta",
    category: "pimpinan",
    image: "https://lh3.googleusercontent.com/aida/AEtjO1V7fOmuqOfpPxJzw-RitYoxnGDsfbS6rHQT61iy91xqfUGMsFKO6wmqdWEf3_OkPSu0U52AWC-yh4WCNDzBXmKmQAFiVQNAbzzv3cBsZQrl4Km7s2ohKXiuvA68yL-PuSMccRmyZDCi-QIXR7Zqnd9kSlLqYarekoUtKwOZcjhLVEOkf2GxE6yjNxkWejtvlIwoOOH0X3KVJIl5QP0GqViq7are0tzpaV8BHfDLi5IKRobcIOwxNkRInoqV",
  },
  {
    id: 2,
    name: "Eva Yulianti, M.Pd.",
    title: "Wakil Kepala Sekolah Bidang Humas & Kemitraan",
    desc: "Penghubung Kerja Sama Dunia Usaha & Industri (DUDI)",
    category: "pimpinan",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCOeCD_0rcfYi5s2MdzNv87RbdOse9QWnB1acbH03h2p5X1HoUvUjOaG806Vd3nPvvrWDKNJzL5nfalaTEAe5BBjLHmByR7ZHmIkkl_-6GbntgUSA72qsG2iF8cF2lXvVgAPYbrAqkhEppOUxoMYOKvvdKxl7j_PDp2aojgw-tOY-rbCfDX0KOlUEpjXl8yeSOvcf5LRKuCzSoSaCeq0kvMvF0YSJzh_JDkt2NNKubIP5Bq9xqffdCD4A",
  },
  {
    id: 3,
    name: "Bambang Wicaksono, S.T.",
    title: "Kepala Program Keahlian RPL",
    desc: "Praktisi Pengembangan Perangkat Lunak & Pembina Tim LKS RPL",
    category: "keahlian",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCV-sZ-ADV1-x7lNExXvIgBlP1fDUOyMBmM5-v90oWQKTSv0YnTQmZ_ncKnYwwgb4Zu50CATu3QLV7EFZLb-n67cY3Yv9bwlVb93FyEDXjd99GkXgJy-E0KxypqgrPsK0S0DawaWrw5JFUOkz04H09kEOe6jJzk3cpoU3Fl7w3udlQRX0djdHLkVbHOLgbQrqkPpwpcB4xnPQ-RmA_Fz-H-8_jjxfah9tuUs4TEx3jd9A3T8Nzn6QvAig",
  },
  {
    id: 4,
    name: "Farida Rahman, M.Psi.",
    title: "Kepala Bimbingan Konseling & Karir (BK)",
    desc: "Konselor Penyaluran Kerja & Penempatan Alumni",
    category: "bk",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAZx8j1_sQSq27K9YssVGqxMQERQge3Nv_nKxq7wOhwL5R63Tsd2sS7ifVcs6PpeeeIWk-kiMORDyEWEatUWfBYbLPwy0KDp9iADGX52guvfpB5d4WSfQDYTWOsZhhuTfI_8pxCuhsIBXpNmXGtbPMXaCA5iNBD9Ahzl-vhvwcn_8ejyKZ9FnE1MpywxfVrH7OLtX6uVE2elpGtsUg9Qyc1-pJQbRe0NV7-YhoK6RBfCLZwPgMLykIfUw",
  },
];

export default function DewanGuru() {
  const [filter, setFilter] = useState("semua");

const filteredGuru = filter === "semua" ? guruData : guruData.filter((g) => g.category === filter.toLowerCase());

  return (
    <div className="w-full py-space-3xl bg-surface-container-low px-margin-mobile md:px-margin-tablet lg:px-margin-desktop">
      <div className="max-w-container-max mx-auto space-y-space-xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-sm">
          <div>
            <span className="font-label-md text-label-md uppercase tracking-wider text-secondary font-bold">Pendidik Berdedikasi</span>
            <h2 className="font-headline-lg text-headline-lg text-primary font-bold tracking-tight">Direktori Guru &amp; Manajemen</h2>
          </div>
          <div className="flex items-center gap-2">
            <button className={`px-3.5 py-1.5 rounded-lg ${filter === "semua" ? "bg-primary text-surface font-bold" : "bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container"} font-label-sm text-label-sm`} onClick={() => setFilter("semua")}>Semua</button>
<button className={`px-3.5 py-1.5 rounded-lg ${filter === "Pimpinan" ? "bg-primary text-surface font-bold" : "bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container"} font-label-sm text-label-sm`} onClick={() => setFilter("Pimpinan")}>Pimpinan</button>
            <button className={`px-3.5 py-1.5 rounded-lg ${filter === "Keahlian" ? "bg-primary text-surface font-bold" : "bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container"} font-label-sm text-label-sm`} onClick={() => setFilter("Keahlian")}>Program Keahlian</button>
            <button className={`px-3.5 py-1.5 rounded-lg ${filter === "Pembimbing" ? "bg-primary text-surface font-bold" : "bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container"} font-label-sm text-label-sm`} onClick={() => setFilter("Pembimbing")}>Pembimbing</button>
            <button className={`px-3.5 py-1.5 rounded-lg ${filter === "TU" ? "bg-primary text-surface font-bold" : "bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container"} font-label-sm text-label-sm`} onClick={() => setFilter("TU")}>Tata Usaha</button>
            <button className={`px-3.5 py-1.5 rounded-lg ${filter === "BK" ? "bg-primary text-surface font-bold" : "bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container"} font-label-sm text-label-sm`} onClick={() => setFilter("BK")}>BK &amp; Karir</button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter-md">
          {filteredGuru.map((guru) => (
            <div key={guru.id} className="bg-surface-container-lowest rounded-2xl overflow-hidden p-space-md border border-surface-container shadow-sm text-center space-y-3">
<Image src={guru.image} alt={guru.name} width={112} height={112} className="w-28 h-28 mx-auto rounded-full object-cover ring-4 ring-primary/10" />
              <div>
                <h4 className="font-title-md font-bold text-primary">{guru.name}</h4>
                <p className="text-xs font-semibold text-secondary">{guru.title}</p>
                <p className="text-xs text-on-surface-variant mt-1">{guru.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
