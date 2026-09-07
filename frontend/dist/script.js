const JADWAL_DATA = {
    perhotelan: {
      pagi: ['Front Office', 'Housekeeping', 'F&amp;B Service', 'Bahasa Inggris Profesi', 'Tata Graha'],
      siang: ['Praktik Hotel Training', 'Praktik Hotel Training', 'Simulasi Check-in/out', 'Etika Pelayanan Tamu', 'Praktik Tata Hidang']
    },
    boga: {
      pagi: ['Pengolahan Makanan Indonesia', 'Pengolahan Kue &amp; Roti', 'Sanitasi Hygiene', 'Bahasa Inggris Profesi', 'Pengolahan Makanan Kontinental'],
      siang: ['Praktik Dapur Produksi', 'Praktik Dapur Produksi', 'Pengelolaan Usaha Boga', 'Plating &amp; Garnish', 'Praktik Pastry']
    },
    busana: {
      pagi: ['Dasar Pola', 'Desain Busana', 'Tekstil', 'Bahasa Inggris Profesi', 'Menjahit Busana Custom'],
      siang: ['Praktik Menjahit', 'Praktik Menjahit', 'Pembuatan Pola Industri', 'Grading &amp; Finishing', 'Praktik Produksi Garmen']
    },
    pplg: {
      pagi: ['Pemrograman Web', 'Basis Data', 'Pemrograman Berorientasi Objek', 'Bahasa Inggris Profesi', 'Pengembangan Gim'],
      siang: ['Praktik Lab Komputer', 'Praktik Lab Komputer', 'Proyek Aplikasi Mobile', 'Jaringan Dasar', 'Praktik UI/UX']
    },
    pariwisata: {
      pagi: ['Pengetahuan Pariwisata', 'Pemanduan Wisata', 'Ticketing &amp; Reservasi', 'Bahasa Inggris Profesi', 'Geografi Pariwisata'],
      siang: ['Praktik Tur Simulasi', 'Praktik Tur Simulasi', 'Pengelolaan Biro Perjalanan', 'Public Speaking', 'Studi Ekskursi']
    }
  };

  function renderJadwal(jurusan) {
    const data = JADWAL_DATA[jurusan] || JADWAL_DATA.perhotelan;
    const pagiCells = document.querySelectorAll('#jadwal-row-pagi .jadwal-cell');
    const siangCells = document.querySelectorAll('#jadwal-row-siang .jadwal-cell');
    pagiCells.forEach((cell, i) => {
      cell.innerHTML = `<span class="font-bold text-primary">${data.pagi[i]}</span>`;
    });
    siangCells.forEach((cell, i) => {
      cell.innerHTML = `<span class="font-bold text-primary">${data.siang[i]}</span><br/><span class="text-xs text-on-surface-variant">Praktik Kejuruan</span>`;
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    const select = document.getElementById('jurusan-select');
    renderJadwal(select ? select.value : 'perhotelan');
  });

  function filterGaleri(cat, btn) {
    document.querySelectorAll('.galeri-filter-btn').forEach(b => {
      b.className = 'galeri-filter-btn px-3 py-1.5 rounded-lg bg-surface-container-lowest text-on-surface-variant text-xs font-semibold hover:bg-surface-container';
    });
    btn.className = 'galeri-filter-btn px-3 py-1.5 rounded-lg bg-primary text-surface text-xs font-bold';
    document.querySelectorAll('.galeri-card').forEach(card => {
      const cats = (card.getAttribute('data-cat') || '').split(' ');
      card.classList.toggle('hidden', cat !== 'semua' && !cats.includes(cat));
    });
  }

  function filterGuru(cat, btn) {
    document.querySelectorAll('.guru-filter-btn').forEach(b => {
      b.className = 'guru-filter-btn px-3.5 py-1.5 rounded-lg bg-surface-container-lowest text-on-surface-variant font-label-sm text-label-sm hover:bg-surface-container';
    });
    btn.className = 'guru-filter-btn px-3.5 py-1.5 rounded-lg bg-primary text-surface font-label-sm text-label-sm font-bold';
    document.querySelectorAll('.guru-card').forEach(card => {
      card.classList.toggle('hidden', cat !== 'semua' && card.getAttribute('data-cat') !== cat);
    });
  }

  function unduhDokumen(judul) {
    const isi = `SMK NEGERI 24 JAKARTA\nJl. Bambu Hitam No. 3, Bambu Apus, Cipayung, Jakarta Timur 13890\n\n${judul}\n\nDokumen resmi versi lengkap tersedia di Tata Usaha sekolah atau dapat diminta melalui email humassmkn24jakarta@gmail.com / telepon (021) 844-1976.`;
    const blob = new Blob([isi], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = judul.replace(/\s+/g, '_') + '.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function switchTab(tabId, targetElementId) {
    // 1. Hide all tab content sections
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => {
      tab.classList.add('hidden');
    });

    // 2. Show requested tab
    const activeSection = document.getElementById('page-' + tabId);
    if (activeSection) {
      activeSection.classList.remove('hidden');
    }

    // 3. Update Navbar active states
    const navButtons = document.querySelectorAll('.nav-tab-btn');
    navButtons.forEach(btn => {
      const target = btn.getAttribute('data-target');
      if (target === tabId || (targetElementId && target === targetElementId)) {
        btn.className = 'nav-tab-btn px-4 py-2 rounded-lg font-label-md text-label-md transition-all font-bold bg-surface-container text-primary shadow-sm border-b-2 border-primary';
      } else {
        btn.className = 'nav-tab-btn px-4 py-2 rounded-lg font-label-md text-label-md transition-all text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface';
      }
    });

    // 4. Scroll smooth to top or specific anchor
    if (targetElementId) {
      setTimeout(() => {
        const el = document.getElementById(targetElementId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 50);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function toggleMobileMenu() {
    const panel = document.getElementById('mobile-nav-panel');
    panel.classList.toggle('hidden');
  }

  function toggleChatbot() {
    const windowEl = document.getElementById('chatbot-window');
    windowEl.classList.toggle('hidden');
  }

  function clearChat() {
    const container = document.getElementById('chat-messages');
    container.innerHTML = `
      <div class="flex items-start gap-2.5">
        <div class="w-7 h-7 rounded-full bg-primary text-secondary-container flex items-center justify-center flex-shrink-0 text-sm mt-0.5 shadow-sm">
          <span class="material-symbols-outlined text-[16px]">smart_toy</span>
        </div>
        <div class="max-w-[82%] space-y-1">
          <div class="p-3 rounded-2xl rounded-tl-none bg-surface-container-lowest border border-surface-container shadow-sm text-body-sm text-[13px] text-on-surface leading-relaxed">
            <p>Percakapan diatur ulang. Ada hal lain seputar PPDB atau kurikulum yang ingin Anda tanyakan?</p>
          </div>
          <span class="text-[10px] text-outline pl-1">Baru saja</span>
        </div>
      </div>
    `;
  }

  function handleChatSubmit(e) {
    e.preventDefault();
    const input = document.getElementById('chat-input-text');
    const msg = input.value.trim();
    if (!msg) return;
    sendMessage(msg);
    input.value = '';
  }

  function sendQuickMessage(text) {
    const chatWin = document.getElementById('chatbot-window');
    if (chatWin.classList.contains('hidden')) {
      chatWin.classList.remove('hidden');
    }
    sendMessage(text);
  }

  function sendMessage(text) {
    const container = document.getElementById('chat-messages');

    // User Message Bubble
    const userBubble = document.createElement('div');
    userBubble.className = 'flex items-start justify-end gap-2.5';
    userBubble.innerHTML = `
      <div class="max-w-[80%] space-y-1 flex flex-col items-end">
        <div class="p-3 rounded-2xl rounded-tr-none bg-primary text-surface text-body-sm text-[13px] leading-relaxed shadow-sm">
          <p>${text}</p>
        </div>
        <span class="text-[10px] text-outline pr-1">Baru saja</span>
      </div>
      <div class="w-7 h-7 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center flex-shrink-0 text-xs mt-0.5 font-bold shadow-sm">
        <span class="material-symbols-outlined text-[16px]">person</span>
      </div>
    `;
    container.appendChild(userBubble);
    container.scrollTop = container.scrollHeight;

    // Simulated Bot Response
    setTimeout(() => {
      const botBubble = document.createElement('div');
      botBubble.className = 'flex items-start gap-2.5';
      let reply = "Terima kasih atas pertanyaannya! Tim kami siap membantu. Silakan jelajahi menu terkait atau hubungi Tata Usaha di (021) 844-1976 / humassmkn24jakarta@gmail.com.";

      const lower = text.toLowerCase();
      if (lower.includes('ppdb') || lower.includes('daftar')) {
        reply = "Pendaftaran PPDB SMK Negeri di DKI Jakarta dilakukan online melalui ppdb.jakarta.go.id (jalur zonasi, afirmasi, prestasi akademik/non-akademik). SMKN 24 Jakarta membuka 5 program keahlian: Perhotelan, Kuliner, Tata Busana, RPL, dan Usaha Layanan Pariwisata. Klik tombol 'PPDB Online' di menu atas untuk tautan resminya!";
      } else if (lower.includes('jadwal') || lower.includes('jam')) {
        reply = "Jadwal harian sekolah dimulai pukul 07.00 - 15.00 WIB. Anda dapat mengecek matriks mata pelajaran lengkap pada tab menu 'Akademik & Jadwal'.";
      } else if (lower.includes('fasilitas')) {
        reply = "Kampus SMKN 24 Jakarta seluas 34.397 m² dilengkapi hotel training, dapur produksi, laboratorium komputer, ruang busana, dan perpustakaan digital. Kunjungi menu 'Profil Sekolah' untuk melihat foto fasilitas!";
      } else if (lower.includes('jurusan') || lower.includes('program keahlian') || lower.includes('kompetensi keahlian')) {
        reply = "SMKN 24 Jakarta memiliki 5 program keahlian terakreditasi A: Perhotelan, Kuliner (Tata Boga), Tata Busana, Rekayasa Perangkat Lunak (RPL), dan Usaha Layanan Pariwisata. Detail masing-masing bisa dilihat di tab 'Beranda' bagian Program Keahlian.";
      } else if (lower.includes('alamat') || lower.includes('lokasi')) {
        reply = "SMKN 24 Jakarta beralamat di Jl. Bambu Hitam No. 3, Bambu Apus, Kec. Cipayung, Jakarta Timur 13890. Klik 'Lokasi Sekolah' di menu atas untuk melihat peta dan rute.";
      } else if (lower.includes('kepala sekolah')) {
        reply = "Kepala Sekolah SMKN 24 Jakarta saat ini adalah Dra. Isfariani Marlena, M.Pd. Profil lengkap beliau ada di tab 'Profil Sekolah'.";
      }

      botBubble.innerHTML = `
        <div class="w-7 h-7 rounded-full bg-primary text-secondary-container flex items-center justify-center flex-shrink-0 text-sm mt-0.5 shadow-sm">
          <span class="material-symbols-outlined text-[16px]">smart_toy</span>
        </div>
        <div class="max-w-[85%] space-y-2">
          <div class="p-3 rounded-2xl rounded-tl-none bg-surface-container-lowest border border-surface-container shadow-sm text-body-sm text-[13px] text-on-surface leading-relaxed">
            <p>${reply}</p>
          </div>
          <span class="text-[10px] text-outline pl-1">Baru saja</span>
        </div>
      `;
      container.appendChild(botBubble);
      container.scrollTop = container.scrollHeight;
    }, 450);
  }