<script lang="ts">
  import { MapPin, Mail, Phone, Clock } from '@lucide/svelte';
  import { onMount } from 'svelte';

  let formData = { name: '', email: '', subject: '', message: '' };
  let formStatus: 'idle' | 'sending' | 'success' | 'error' = 'idle';

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    formStatus = 'sending';
    try {
      await new Promise((r) => setTimeout(r, 1000));
      formStatus = 'success';
      formData = { name: '', email: '', subject: '', message: '' };
      setTimeout(() => (formStatus = 'idle'), 4000);
    } catch {
      formStatus = 'error';
    }
  };
</script>

<section id="kontak" class="section bg-muted/30">
  <div class="container">
    <div class="grid lg:grid-cols-2 gap-12 lg:gap-16">
      <div>
        <span class="badge badge-secondary mb-4">Kontak</span>
        <h2 class="section-title mb-6">Hubungi Sekolah</h2>
        <p class="section-subtitle mb-8">Kami siap membantu menjawab pertanyaan Anda tentang SMK Negeri 24 Jakarta.</p>

        <div class="space-y-6">
          <a href="/" class="flex items-center gap-4 p-4 rounded-2xl bg-white border border-border hover:border-primary/30 hover:shadow-md transition-all group">
            <div class="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
              <MapPin class="w-6 h-6 text-primary" />
            </div>
            <div>
              <h4 class="font-bold text-sm">Alamat Sekolah</h4>
              <p class="text-sm text-muted-foreground">Jl. Pendidikan No. 24, Jakarta Selatan, 12870</p>
            </div>
          </a>

          <a href="/" class="flex items-center gap-4 p-4 rounded-2xl bg-white border border-border hover:border-primary/30 hover:shadow-md transition-all group">
            <div class="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
              <Mail class="w-6 h-6 text-primary" />
            </div>
            <div>
              <h4 class="font-bold text-sm">Email</h4>
              <p class="text-sm text-muted-foreground">info@smkn24jakarta.sch.id</p>
            </div>
          </a>

          <a href="/" class="flex items-center gap-4 p-4 rounded-2xl bg-white border border-border hover:border-primary/30 hover:shadow-md transition-all group">
            <div class="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
              <Phone class="w-6 h-6 text-primary" />
            </div>
            <div>
              <h4 class="font-bold text-sm">Telepon</h4>
              <p class="text-sm text-muted-foreground">(021) 1234-5678</p>
            </div>
          </a>

          <div class="flex items-center gap-4 p-4 rounded-2xl bg-white border border-border">
            <div class="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Clock class="w-6 h-6 text-primary" />
            </div>
            <div>
              <h4 class="font-bold text-sm">Jam Operasional</h4>
              <p class="text-sm text-muted-foreground">Senin - Jumat, 07:00 - 16:00 WIB</p>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-3xl p-8 border border-border shadow-xl shadow-black/5">
        <h3 class="text-xl font-bold font-heading mb-6">Kirim Pesan</h3>
        <form onsubmit={handleSubmit} class="space-y-4">
          <div class="grid sm:grid-cols-2 gap-4">
            <div>
              <label for="name" class="label">Nama Lengkap</label>
              <input id="name" type="text" bind:value={formData.name} class="input" placeholder="Nama Anda" required />
            </div>
            <div>
              <label for="email" class="label">Email</label>
              <input id="email" type="email" bind:value={formData.email} class="input" placeholder="email@anda.com" required />
            </div>
          </div>
          <div>
            <label for="subject" class="label">Subjek</label>
            <input id="subject" type="text" bind:value={formData.subject} class="input" placeholder="Tentang apa pesan ini?" required />
          </div>
          <div>
            <label for="message" class="label">Pesan</label>
            <textarea id="message" bind:value={formData.message} rows={4} class="input resize-none" placeholder="Tulis pesan Anda..." required></textarea>
          </div>
          <button type="submit" class="btn btn-primary w-full" disabled={formStatus === 'sending'}>
            {#if formStatus === 'sending'}
              Mengirim...
            {:else if formStatus === 'success'}
              Terkirim! ✅
            {:else}
              Kirim Pesan
            {/if}
          </button>
        </form>
      </div>
    </div>
  </div>
</section>



