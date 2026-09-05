<script lang="ts">
  import { MessageCircle, X, Send } from 'lucide-svelte';
  import { onMount } from 'svelte';

  let isOpen = false;
  let messages: { role: 'user' | 'bot'; text: string }[] = [
    { role: 'bot', text: 'Halo! Saya AI Assistant SMK Negeri 24 Jakarta. Ada yang bisa saya bantu tentang sekolah ini?' },
  ];
  let input = '';

  const quickQuestions = [
    'Program keahlian apa saja?',
    'Bagaimana cara mendaftar?',
    'Apa saja prestasi sekolah?',
    'Dimana lokasi sekolah?',
  ];

  const sendMessage = (text: string = input) => {
    if (!text.trim()) return;
    messages = [...messages, { role: 'user', text }];
    input = '';
    setTimeout(() => {
      const botResponses: Record<string, string> = {
        program: 'SMK Negeri 24 Jakarta memiliki 6 program keahlian: Teknik Komputer & Jaringan, Teknik Otomotif, Akuntansi, Perhotelan, Multimedia, dan Teknik Elektro.',
        daftar: 'Pendaftaran siswa baru (PPDB) dibuka setiap bulan Juni. Anda bisa mendaftar melalui website ini atau datang langsung ke sekolah.',
        prestasi: 'Sekolah kami meraih Juara 1 LKS TKJ Nasional 2025, Akreditasi A, dan berbagai prestasi lainnya.',
        lokasi: 'SMK Negeri 24 Jakarta berlokasi di Jl. Pendidikan No. 24, Jakarta Selatan.',
      };
      let response = 'Terima kasih atas pertanyaannya. Untuk informasi lebih detail, silakan hubungi admin kami atau lihat halaman kontak.';
      for (const [key, value] of Object.entries(botResponses)) {
        if (text.toLowerCase().includes(key)) {
          response = value;
          break;
        }
      }
      messages = [...messages, { role: 'bot', text: response }];
    }, 800);
  };
</script>

<button
  onclick={() => isOpen = !isOpen}
  class="chatbot-toggle w-14 h-14 bg-primary rounded-full shadow-xl shadow-primary/30 flex items-center justify-center hover:bg-secondary transition-colors hover:scale-105"
  aria-label="Open chat"
>
  {#if isOpen}
    <X class="w-7 h-7 text-white" />
  {:else}
    <MessageCircle class="w-7 h-7 text-white" />
  {/if}
</button>

{#if isOpen}
  <div class="chatbot-window">
    <div class="chatbot-header">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
          <MessageCircle class="w-5 h-5 text-white" />
        </div>
        <div>
          <h4 class="font-bold text-sm">AI Assistant SMK 24</h4>
          <span class="text-xs text-white/80">Online</span>
        </div>
      </div>
    </div>
    <div class="chatbot-messages">
      {#each messages as msg}
        <div class="flex {msg.role === 'user' ? 'justify-end' : 'justify-start'}">
          <div class="max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed {msg.role === 'user' ? 'bg-primary text-white rounded-br-md' : 'bg-muted text-foreground rounded-bl-md'}">
            {msg.text}
          </div>
        </div>
      {/each}
    </div>
    <div class="chatbot-input">
      <div class="flex gap-2 mb-2 flex-wrap">
        {#each quickQuestions as q}
          <button onclick={() => sendMessage(q)} class="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors border border-border">{q}</button>
        {/each}
      </div>
      <form onsubmit={(e) => { e.preventDefault(); sendMessage(); }} class="flex gap-2 w-full">
        <input bind:value={input} type="text" placeholder="Ketik pertanyaan..." class="flex-1 rounded-full px-4 py-2.5 text-sm border border-border bg-background focus:outline-none focus:border-primary transition-colors" />
        <button type="submit" class="w-10 h-10 rounded-full bg-primary hover:bg-secondary text-white flex items-center justify-center transition-colors" aria-label="Send">
          <Send class="w-5 h-5" />
        </button>
      </form>
    </div>
  </div>
{/if}
