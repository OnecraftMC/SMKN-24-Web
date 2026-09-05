<script lang="ts">
  const programs = [
    {
      name: 'Teknik Komputer & Jaringan',
      code: 'TKJ',
      description: 'Mempersiapkan siswa menjadi teknisi jaringan dan administrator sistem yang kompeten dengan sertifikasi industri.',
      duration: '3 Tahun',
      icon: '💻',
    },
    {
      name: 'Teknik Otomotif',
      code: 'TO',
      description: 'Membekali siswa dengan keahlian perawatan dan perbaikan kendaraan bermotor serta teknologi otomotif modern.',
      duration: '3 Tahun',
      icon: '🚗',
    },
    {
      name: 'Akuntansi & Keuangan',
      code: 'AK',
      description: 'Mempersiapkan profesional di bidang akuntansi, perpajakan, dan manajemen keuangan dengan standar nasional.',
      duration: '3 Tahun',
      icon: '📊',
    },
    {
      name: 'Perhotelan',
      code: 'PH',
      description: 'Melatih siswa dalam layanan perhotelan, kuliner, dan manajemen hospitality dengan praktik langsung.',
      duration: '3 Tahun',
      icon: '🏨',
    },
    {
      name: 'Multimedia',
      code: 'MM',
      description: 'Mengembangkan kreativitas dalam desain grafis, animasi, produksi video, dan konten digital interaktif.',
      duration: '3 Tahun',
      icon: '🎨',
    },
    {
      name: 'Teknik Elektro',
      code: 'TE',
      description: 'Fokus pada instalasi listrik, kontrol otomatisasi, dan sistem energi terbarukan untuk industri modern.',
      duration: '3 Tahun',
      icon: '⚡',
    },
  ];
</script>

<section id="program" class="section bg-muted/30">
  <div class="container">
    <div class="text-center mb-16">
      <span class="badge badge-primary mb-4">Program Keahlian</span>
      <h2 class="section-title">Program Pendidikan</h2>
      <p class="section-subtitle mx-auto">Program vokasional berkualitas yang disesuaikan dengan kebutuhan industri dan perkembangan teknologi.</p>
    </div>

    <div class="grid-auto-fit">
      {#each programs as program}
        <article class="card group p-6 hover:-translate-y-1 transition-transform duration-300">
          <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-3xl mb-6 shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-shadow">
            {program.icon}
          </div>
          <h3 class="text-xl font-bold font-heading mb-2">{program.name}</h3>
          <span class="badge badge-secondary mb-3">{program.code} · {program.duration}</span>
          <p class="text-muted-foreground text-sm leading-relaxed">{program.description}</p>
        </article>
      {/each}
    </div>
  </div>
</section>

