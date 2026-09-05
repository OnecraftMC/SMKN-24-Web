<script lang="ts">
  import { Menu, X, GraduationCap } from '@lucide/svelte';
  import { onMount } from 'svelte';

  let isOpen = false;
  let scrolled = false;

  const navLinks = [
    { label: 'Beranda', href: '#beranda' },
    { label: 'Program', href: '#program' },
    { label: 'Fasilitas', href: '#fasilitas' },
    { label: 'Prestasi', href: '#prestasi' },
    { label: 'Kontak', href: '#kontak' },
  ];

  onMount(() => {
    const handleScroll = () => {
      scrolled = window.scrollY > 20;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  });
</script>

<header
  class={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-xl shadow-sm' : 'bg-transparent'}`}
>
  <nav class="container mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
    <a href="#beranda" class="flex items-center gap-3 group">
      <div class="w-10 h-10 sm:w-12 sm:h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:shadow-primary/30 transition-shadow">
        <GraduationCap class="w-6 h-6 sm:w-7 sm:h-7 text-white" />
      </div>
      <div class="hidden sm:block">
        <h1 class="text-base sm:text-lg font-bold font-heading text-foreground leading-tight">SMK Negeri 24</h1>
        <span class="text-[10px] sm:text-xs text-muted-foreground tracking-wide uppercase">Jakarta</span>
      </div>
    </a>

    <div class="hidden md:flex items-center gap-1">
      {#each navLinks as link}
        <a
          href={link.href}
          class="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          {link.label}
        </a>
      {/each}
      <a href="#beranda" class="btn btn-primary ml-2 text-sm">PPDB 2026</a>
    </div>

    <button
      onclick={() => isOpen = !isOpen}
      class="md:hidden p-2 rounded-xl hover:bg-muted transition-colors"
      aria-label="Toggle menu"
    >
      {#if isOpen}
        <X class="w-6 h-6 text-foreground" />
      {:else}
        <Menu class="w-6 h-6 text-foreground" />
      {/if}
    </button>
  </nav>

  <!-- Mobile Menu -->
  {#if isOpen}
    <div class="md:hidden absolute top-full left-0 right-0 bg-white/95 backdrop-blur-xl border-b border-border shadow-xl animate-fade-in">
      <div class="container mx-auto px-4 py-4 flex flex-col gap-1">
        {#each navLinks as link}
          <a
            href={link.href}
            onclick={() => isOpen = false}
            class="px-4 py-3 rounded-xl text-base font-medium text-foreground hover:bg-muted transition-colors"
          >
            {link.label}
          </a>
        {/each}
        <a href="#beranda" onclick={() => isOpen = false} class="btn btn-primary mt-2 text-center">PPDB 2026</a>
      </div>
    </div>
  {/if}
</header>

