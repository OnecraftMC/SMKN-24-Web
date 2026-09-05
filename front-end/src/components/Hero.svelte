<script lang="ts">
  import ArrowRight from 'lucide-svelte';
  import Sparkles from 'lucide-svelte';
  import BookOpen from 'lucide-svelte';
  import Users from 'lucide-svelte';
  import Award from 'lucide-svelte';
</script>

<section id="beranda" class="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5">
  <!-- Background decorative elements -->
  <div class="absolute top-20 right-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
  <div class="absolute bottom-10 left-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />

  <div class="container mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 relative z-10">
    <div class="max-w-4xl">
      <div class="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 mb-6 animate-fade-in">
        <Sparkles class="w-4 h-4 text-primary" />
        <span class="text-sm font-medium text-primary">Website Resmi Sekolah</span>
      </div>

      <h1 class="text-5xl sm:text-6xl lg:text-8xl font-heading font-bold tracking-tight leading-[1.05] mb-6 animate-slide-up">
        <span class="text-foreground">SMK Negeri 24</span>
        <br />
        <span class="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent">Jakarta</span>
      </h1>

      <p class="text-xl sm:text-2xl text-muted-foreground leading-relaxed max-w-2xl mb-10 animate-slide-up" style="animation-delay: 0.1s">
        Menyiapkan generasi unggul yang berkompeten, berkarakter, dan siap bersaing di dunia industri melalui pendidikan vokasional berkualitas.
      </p>

      <div class="flex flex-wrap gap-4 animate-slide-up" style="animation-delay: 0.2s">
        <a href="#program" class="btn btn-primary text-base shadow-lg shadow-primary/25">
          Jelajahi Program <ArrowRight class="w-5 h-5" />
        </a>
        <a href="#kontak" class="btn btn-outline text-base">
          Hubungi Sekolah
        </a>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-16 pt-8 border-t border-border animate-slide-up" style="animation-delay: 0.3s">
        <div>
          <div class="text-3xl sm:text-4xl font-heading font-bold text-primary">40+</div>
          <div class="text-sm text-muted-foreground mt-1">Tahun Berdiri</div>
        </div>
        <div>
          <div class="text-3xl sm:text-4xl font-heading font-bold text-secondary">6</div>
          <div class="text-sm text-muted-foreground mt-1">Program Keahlian</div>
        </div>
        <div>
          <div class="text-3xl sm:text-4xl font-heading font-bold text-accent">2.500+</div>
          <div class="text-sm text-muted-foreground mt-1">Siswa Aktif</div>
        </div>
        <div>
          <div class="text-3xl sm:text-4xl font-heading font-bold text-foreground">150+</div>
          <div class="text-sm text-muted-foreground mt-1">Guru & Staf</div>
        </div>
      </div>
    </div>
  </div>
</section>
