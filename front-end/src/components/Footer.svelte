<script lang="ts">
  import GraduationCap from 'lucide-svelte/icons/graduation-cap';
</script>

<footer class="bg-foreground text-white py-12">
  <div class="container">
    <div class="flex flex-col md:flex-row items-center justify-between gap-6">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
          <GraduationCap class="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 class="font-heading font-bold text-base">SMK Negeri 24</h3>
          <span class="text-xs text-white/60">Jakarta</span>
        </div>
      </div>
      <p class="text-sm text-white/60 text-center md:text-right">
        Website resmi SMK Negeri 24 Jakarta. Dibuat dengan dedikasi untuk pendidikan berkualitas.
      </p>
    </div>
    <div class="border-t border-white/10 mt-8 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/40">
      <span>© 2026 SMK Negeri 24 Jakarta. Seluruh hak cipta dilindungi.</span>
      <div class="flex gap-6">
        <a href="#" class="hover:text-white transition-colors">Kebijakan Privasi</a>
        <a href="#" class="hover:text-white transition-colors">Syarat & Ketentuan</a>
      </div>
    </div>
  </div>
</footer>
