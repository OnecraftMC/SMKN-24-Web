<script lang="ts">
  import Trophy from 'lucide-svelte';
  import Star from 'lucide-svelte';
  import Medal from 'lucide-svelte';

  const achievements = [
    { title: 'Juara 1 Lomba Kompetensi Siswa Nasional TKJ', level: 'Nasional', year: 2025, category: 'Akademik' },
    { title: 'Sertifikasi ISO 9001:2015', level: 'Internasional', year: 2024, category: 'Institusi' },
    { title: 'Finalis Kompetisi Desain Grafis Provinsi', level: 'Provinsi', year: 2025, category: 'Non-Akademik' },
    { title: 'Juara 2 Lomba Robotik SMK Se-Jabodetabek', level: 'Regional', year: 2025, category: 'Akademik' },
    { title: 'Akreditasi A dari BAN-SM', level: 'Nasional', year: 2024, category: 'Institusi' },
    { title: 'Juara 1 Lomba Karya Tulis Ilmiah', level: 'Nasional', year: 2023, category: 'Non-Akademik' },
  ];
</script>

<section id="prestasi" class="section bg-gradient-to-b from-muted/30 to-background">
  <div class="container">
    <div class="text-center mb-16">
      <span class="badge badge-primary mb-4">Prestasi</span>
      <h2 class="section-title">Prestasi & Kegiatan</h2>
      <p class="section-subtitle mx-auto">Rekam jejak prestasi sekolah dalam berbagai bidang akademik dan non-akademik.</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each achievements as ach}
        <article class="card p-6 group hover:-translate-y-1 transition-all duration-300">
          <div class="flex items-start justify-between mb-4">
            <span class="badge badge-primary">{ach.category}</span>
            <span class="text-xs text-muted-foreground">{ach.year}</span>
          </div>
          <h3 class="text-lg font-bold font-heading mb-2 leading-snug">{ach.title}</h3>
          <div class="flex items-center gap-2 text-sm text-muted-foreground">
            <Trophy class="w-4 h-4 text-secondary" />
            <span class="font-medium">{ach.level}</span>
          </div>
        </article>
      {/each}
    </div>
  </div>
</section>
