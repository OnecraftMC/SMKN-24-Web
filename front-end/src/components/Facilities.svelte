<script lang="ts">
  import { MapPin, Wrench, Wifi, Book } from '@lucide/svelte';

  const facilities = [
    { name: 'Laboratorium Komputer', description: 'Fasilitas PC modern dengan spesifikasi terbaru untuk praktik TKJ dan multimedia', icon: '🖥️' },
    { name: 'Bengkel Otomotif', description: 'Ruang praktik lengkap dengan peralatan standar industry otomotif', icon: '🔧' },
    { name: 'Ruang Server', description: 'Infrastruktur jaringan dan server untuk keperluan administrasi dan praktik', icon: '📡' },
    { name: 'Perpustakaan', description: 'Area belajar dengan koleksi buku dan akses internet berkecepatan tinggi', icon: '📚' },
    { name: 'Ruang Kelas SMART', description: 'Kelas dengan proyektor interaktif dan WiFi untuk pembelajaran modern', icon: '🖥️' },
    { name: 'Lapangan Olahraga', description: 'Fasilitas olahraga untuk kegiatan ekstrakurikuler dan kesehatan', icon: '⚽' },
    { name: 'Ruang Praktik Kuliner', description: 'Dapur industri untuk praktik perhotelan dan kuliner', icon: '🍳' },
    { name: 'Ruang Audio Visual', description: 'Studio untuk produksi multimedia dan podcast', icon: '🎬' },
  ];
</script>

<section id="fasilitas" class="section">
  <div class="container">
    <div class="text-center mb-16">
      <span class="badge badge-secondary mb-4">Fasilitas</span>
      <h2 class="section-title">Fasilitas Unggulan</h2>
      <p class="section-subtitle mx-auto">Sarana dan prasarana lengkap untuk mendukung proses belajar mengajar dan pengembangan diri.</p>
    </div>

    <div class="grid-auto-fit">
      {#each facilities as item}
        <article class="card p-6 group hover:-translate-y-1 transition-all duration-300">
          <div class="text-4xl mb-4 group-hover:scale-110 transition-transform">{item.icon}</div>
          <h3 class="text-lg font-bold mb-2">{item.name}</h3>
          <p class="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
        </article>
      {/each}
    </div>
  </div>
</section>


