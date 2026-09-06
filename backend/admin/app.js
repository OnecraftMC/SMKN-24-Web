// app.js — Logika Admin Panel SMK Negeri 24 Jakarta
// Vanilla JS, tanpa framework. Semua data diambil dari backend (server.js) via fetch().

// ---------------------------------------------------------------------------
// KONFIGURASI MODUL: setiap objek mendeskripsikan satu bagian yang bisa
// dikelola (jadwal, foto, teks, guru, berita). "fields" dipakai untuk
// membangun form tambah/edit secara otomatis.
// ---------------------------------------------------------------------------
const MODULES = {
  jadwal: {
    label: 'Jadwal Pelajaran',
    subtitle: 'Atur jadwal per jurusan, hari, dan sesi — tampil di tab Akademik website.',
    endpoint: '/api/jadwal',
    listQuery: '',
    idKey: 'id',
    upload: false,
    columns: [
      { key: 'jurusan', label: 'Jurusan', render: (r) => JURUSAN_LABEL[r.jurusan] || r.jurusan },
      { key: 'hari', label: 'Hari' },
      { key: 'jam', label: 'Jam', render: (r) => `${r.jam_mulai} - ${r.jam_selesai}` },
      { key: 'mapel', label: 'Mata Pelajaran' },
      { key: 'ruang', label: 'Ruang' },
    ],
    fields: [
      { name: 'jurusan', label: 'Jurusan', type: 'select', required: true,
        options: [['perhotelan','Perhotelan'],['boga','Kuliner (Tata Boga)'],['busana','Tata Busana'],['rpl','Rekayasa Perangkat Lunak'],['pariwisata','Usaha Layanan Pariwisata']] },
      { name: 'hari', label: 'Hari', type: 'select', required: true,
        options: [['Senin','Senin'],['Selasa','Selasa'],['Rabu','Rabu'],['Kamis','Kamis'],['Jumat','Jumat']] },
      { name: 'sesi', label: 'Sesi', type: 'select', required: true,
        options: [['pagi','Pagi'],['siang','Siang']] },
      { name: 'jam_mulai', label: 'Jam Mulai', type: 'text', placeholder: '07.45', required: true, half: true },
      { name: 'jam_selesai', label: 'Jam Selesai', type: 'text', placeholder: '09.15', required: true, half: true },
      { name: 'mapel', label: 'Mata Pelajaran', type: 'text', required: true },
      { name: 'ruang', label: 'Ruang', type: 'text', placeholder: 'Lab RPL 1' },
      { name: 'keterangan', label: 'Keterangan (mis. nama guru pengampu)', type: 'textarea' },
      { name: 'urutan', label: 'Urutan Tampil', type: 'number', placeholder: '0' },
    ],
  },

  galeri: {
    label: 'Galeri Foto',
    subtitle: 'Kelola foto dokumentasi & caption yang tampil di tab Kabar & Galeri.',
    endpoint: '/api/galeri',
    listQuery: '?semua=1',
    idKey: 'id',
    upload: true,
    columns: [
      { key: 'foto', label: 'Foto', render: (r) => thumbImg(r.foto) },
      { key: 'judul', label: 'Judul' },
      { key: 'keterangan', label: 'Keterangan' },
      { key: 'kategori', label: 'Kategori', render: (r) => `<span class="px-2 py-0.5 rounded-full bg-surface-container text-[11px] font-bold">${r.kategori}</span>` },
      { key: 'published', label: 'Status', render: (r) => statusBadge(r.published) },
    ],
    fields: [
      { name: 'judul', label: 'Judul Foto', type: 'text', required: true },
      { name: 'keterangan', label: 'Keterangan / Caption', type: 'textarea', placeholder: 'Deskripsi singkat foto ini...' },
      { name: 'kategori', label: 'Kategori', type: 'select', required: true,
        options: [['ekskul','Ekskul'],['praktik','Praktik Kejuruan'],['pkl','PKL & Industri'],['jurusan','Jurusan'],['kegiatan','Kegiatan Umum']] },
      { name: 'tanggal', label: 'Tanggal', type: 'date' },
      { name: 'foto', label: 'Upload Foto (JPG/PNG/WEBP, maks 5MB)', type: 'file' },
      { name: 'foto_url', label: 'atau tempel URL foto (opsional, dipakai bila tidak upload file)', type: 'text', placeholder: 'https://...' },
      { name: 'urutan', label: 'Urutan Tampil', type: 'number', placeholder: '0' },
      { name: 'published', label: 'Tampilkan di website', type: 'checkbox' },
    ],
  },

  berita: {
    label: 'Berita / Kabar',
    subtitle: 'Kelola berita & prestasi yang tampil di headline tab Kabar.',
    endpoint: '/api/berita',
    listQuery: '?semua=1',
    idKey: 'id',
    upload: true,
    columns: [
      { key: 'foto', label: 'Foto', render: (r) => thumbImg(r.foto) },
      { key: 'judul', label: 'Judul' },
      { key: 'tanggal', label: 'Tanggal' },
      { key: 'is_headline', label: 'Headline', render: (r) => (r.is_headline ? '<span class="text-secondary font-bold text-xs">★ Headline</span>' : '') },
      { key: 'published', label: 'Status', render: (r) => statusBadge(r.published) },
    ],
    fields: [
      { name: 'judul', label: 'Judul Berita', type: 'text', required: true },
      { name: 'ringkasan', label: 'Ringkasan Singkat', type: 'textarea' },
      { name: 'isi', label: 'Isi Berita Lengkap', type: 'textarea', rows: 5 },
      { name: 'tanggal', label: 'Tanggal', type: 'date' },
      { name: 'foto', label: 'Upload Foto (JPG/PNG/WEBP, maks 5MB)', type: 'file' },
      { name: 'foto_url', label: 'atau tempel URL foto (opsional)', type: 'text', placeholder: 'https://...' },
      { name: 'is_headline', label: 'Jadikan headline utama', type: 'checkbox' },
      { name: 'published', label: 'Tampilkan di website', type: 'checkbox' },
    ],
  },

  guru: {
    label: 'Data Guru',
    subtitle: 'Kelola profil guru yang tampil di halaman Profil Sekolah.',
    endpoint: '/api/guru',
    listQuery: '?semua=1',
    idKey: 'id',
    upload: true,
    columns: [
      { key: 'foto', label: 'Foto', render: (r) => thumbImg(r.foto) },
      { key: 'nama', label: 'Nama' },
      { key: 'jabatan', label: 'Jabatan' },
      { key: 'mapel', label: 'Mata Pelajaran' },
      { key: 'published', label: 'Status', render: (r) => statusBadge(r.published) },
    ],
    fields: [
      { name: 'nama', label: 'Nama Lengkap & Gelar', type: 'text', required: true },
      { name: 'jabatan', label: 'Jabatan', type: 'text', placeholder: 'Guru / Wali Kelas / Kaprog RPL' },
      { name: 'mapel', label: 'Mata Pelajaran Diampu', type: 'text' },
      { name: 'keterangan', label: 'Keterangan Tambahan', type: 'textarea' },
      { name: 'foto', label: 'Upload Foto', type: 'file' },
      { name: 'foto_url', label: 'atau tempel URL foto (opsional)', type: 'text' },
      { name: 'urutan', label: 'Urutan Tampil', type: 'number', placeholder: '0' },
      { name: 'published', label: 'Tampilkan di website', type: 'checkbox' },
    ],
  },

  konten: {
    label: 'Teks & Konten Website',
    subtitle: 'Ubah kalimat-kalimat yang tampil di website tanpa perlu mengedit kode.',
    endpoint: '/api/konten',
    listQuery: '',
    idKey: 'section_key',
    upload: false,
    columns: [
      { key: 'label', label: 'Nama Field' },
      { key: 'grup', label: 'Grup' },
      { key: 'isi', label: 'Isi Saat Ini', render: (r) => `<span class="line-clamp-2 text-xs">${escapeHtml((r.isi || '').slice(0, 90))}${(r.isi||'').length>90?'…':''}</span>` },
    ],
    fields: [
      { name: 'section_key', label: 'Kode Field (unik, tanpa spasi)', type: 'text', required: true, placeholder: 'contoh: hero_headline', keyField: true },
      { name: 'label', label: 'Nama Field (tampil di admin panel)', type: 'text', required: true },
      { name: 'grup', label: 'Grup', type: 'select',
        options: [['beranda','Beranda'],['profil','Profil Sekolah'],['akademik','Akademik'],['kabar','Kabar & Galeri'],['kontak','Kontak'],['umum','Umum / Lainnya']] },
      { name: 'tipe', label: 'Tipe Isi', type: 'select', options: [['text','Teks Singkat (satu baris)'],['textarea','Teks Panjang (paragraf)']] },
      { name: 'isi', label: 'Isi Teks', type: 'dynamic-textinput' }, // tipe input mengikuti field "tipe"
      { name: 'keterangan', label: 'Catatan (dipakai di mana teks ini)', type: 'text' },
    ],
  },
};

const JURUSAN_LABEL = {
  perhotelan: 'Perhotelan', boga: 'Kuliner (Tata Boga)', busana: 'Tata Busana',
  rpl: 'Rekayasa Perangkat Lunak', pariwisata: 'Usaha Layanan Pariwisata',
};

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { key: 'jadwal', label: 'Jadwal Pelajaran', icon: 'calendar_month' },
  { key: 'galeri', label: 'Galeri Foto', icon: 'photo_library' },
  { key: 'berita', label: 'Berita / Kabar', icon: 'newspaper' },
  { key: 'konten', label: 'Teks & Konten', icon: 'text_fields' },
  { key: 'guru', label: 'Data Guru', icon: 'group' },
  { key: 'pengaturan', label: 'Pengaturan Akun', icon: 'settings' },
];

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------
function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}
function thumbImg(foto) {
  if (!foto) return '<div class="w-12 h-12 rounded-lg bg-surface-container-low flex items-center justify-center text-outline"><span class="material-symbols-outlined text-[18px]">image</span></div>';
  const src = foto.startsWith('http') ? foto : `${API_BASE}/uploads/${foto}`;
  return `<img src="${src}" class="w-12 h-12 rounded-lg object-cover border border-surface-container" />`;
}
function statusBadge(published) {
  return published
    ? '<span class="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[11px] font-bold">Tampil</span>'
    : '<span class="px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-[11px] font-bold">Draf</span>';
}
function toast(message, type = 'success') {
  const el = document.getElementById('toast');
  el.textContent = message;
  el.className = `fixed top-4 right-4 z-[100] px-4 py-3 rounded-xl shadow-lg text-sm font-semibold text-white ${type === 'success' ? 'bg-primary' : 'bg-error'}`;
  el.classList.remove('hidden');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.add('hidden'), 3000);
}

// ---------------------------------------------------------------------------
// APP
// ---------------------------------------------------------------------------
const App = {
  token: null,
  admin: null,
  currentView: 'dashboard',
  editing: null, // { module, record } saat modal form dibuka untuk edit

  async init() {
    this.token = localStorage.getItem('smkn24_admin_token');
    if (this.token) {
      const ok = await this.fetchMe();
      if (ok) return this.showApp();
    }
    this.showLogin();
  },

  showLogin() {
    document.getElementById('login-screen').classList.remove('hidden');
    document.getElementById('app-screen').classList.add('hidden');
    document.getElementById('login-form').addEventListener('submit', (e) => this.handleLogin(e));
  },

  async handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    const errEl = document.getElementById('login-error');
    const btn = document.getElementById('login-submit');
    errEl.classList.add('hidden');
    btn.disabled = true;
    btn.textContent = 'Memproses...';

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login gagal.');

      this.token = data.token;
      this.admin = data.admin;
      localStorage.setItem('smkn24_admin_token', this.token);
      this.showApp();
    } catch (err) {
      errEl.textContent = err.message;
      errEl.classList.remove('hidden');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<span>Masuk</span><span class="material-symbols-outlined text-[18px]">login</span>';
    }
  },

  async fetchMe() {
    try {
      const res = await this.api('/api/auth/me');
      if (!res.ok) return false;
      const data = await res.json();
      this.admin = data.admin;
      return true;
    } catch {
      return false;
    }
  },

  logout() {
    localStorage.removeItem('smkn24_admin_token');
    this.token = null;
    this.admin = null;
    location.reload();
  },

  showApp() {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('app-screen').classList.remove('hidden');
    document.getElementById('admin-name').textContent = this.admin?.nama || this.admin?.username || '';
    this.renderNav();
    this.navigate('dashboard');
  },

  renderNav() {
    const build = (mobile) => NAV_ITEMS.map((item) => `
      <button data-nav="${item.key}" onclick="App.navigate('${item.key}')"
        class="nav-item flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${mobile ? 'text-white/90 hover:bg-white/10' : 'text-white/80 hover:bg-white/10'}">
        <span class="material-symbols-outlined text-[20px]">${item.icon}</span>
        <span>${item.label}</span>
      </button>`).join('');
    document.getElementById('sidebar-nav').innerHTML = build(false);
    document.getElementById('sidebar-nav-mobile').innerHTML = build(true);
  },

  navigate(view) {
    this.currentView = view;
    document.querySelectorAll('[data-nav]').forEach((el) => {
      el.classList.toggle('active', el.dataset.nav === view);
    });
    document.getElementById('mobile-nav').classList.add('hidden');

    const meta = NAV_ITEMS.find((n) => n.key === view);
    document.getElementById('page-title').textContent = meta?.label || '';
    document.getElementById('page-subtitle').textContent = MODULES[view]?.subtitle || '';

    if (view === 'dashboard') return this.renderDashboard();
    if (view === 'pengaturan') return this.renderPengaturan();
    if (MODULES[view]) return this.renderCrudView(view);
  },

  // Wrapper fetch yang otomatis menyertakan token admin
  async api(path, options = {}) {
    const headers = options.headers || {};
    if (!(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';
    headers['Authorization'] = `Bearer ${this.token}`;
    return fetch(`${API_BASE}${path}`, { ...options, headers });
  },

  // -------------------------------------------------------------------------
  // DASHBOARD
  // -------------------------------------------------------------------------
  async renderDashboard() {
    const root = document.getElementById('view-root');
    root.innerHTML = `<div class="grid grid-cols-2 lg:grid-cols-4 gap-4" id="dash-cards"></div>
      <div class="mt-6 bg-white border border-surface-container rounded-2xl p-5">
        <h3 class="font-bold text-primary mb-2">Selamat datang di Admin Panel</h3>
        <p class="text-sm text-on-surface-variant leading-relaxed">
          Gunakan menu di samping untuk mengatur <b>Jadwal Pelajaran</b>, <b>Galeri Foto</b>, <b>Berita/Kabar</b>,
          <b>Teks & Konten</b> website, dan <b>Data Guru</b>. Setiap perubahan yang disimpan di sini akan langsung
          tersedia lewat API untuk ditampilkan di website utama SMK Negeri 24 Jakarta.
        </p>
      </div>`;

    const cards = [
      { key: 'jadwal', icon: 'calendar_month', label: 'Jadwal Pelajaran' },
      { key: 'galeri', icon: 'photo_library', label: 'Foto Galeri' },
      { key: 'berita', icon: 'newspaper', label: 'Berita/Kabar' },
      { key: 'guru', icon: 'group', label: 'Data Guru' },
    ];
    const cardsEl = document.getElementById('dash-cards');
    cardsEl.innerHTML = cards.map((c) => `
      <button onclick="App.navigate('${c.key}')" class="bg-white border border-surface-container rounded-2xl p-4 text-left hover:shadow-md transition-shadow">
        <span class="material-symbols-outlined text-primary text-[26px]">${c.icon}</span>
        <p id="dash-count-${c.key}" class="text-2xl font-bold text-primary mt-2">…</p>
        <p class="text-xs text-on-surface-variant font-semibold">${c.label}</p>
      </button>`).join('');

    for (const c of cards) {
      const mod = MODULES[c.key];
      try {
        const res = await this.api(`${mod.endpoint}${mod.listQuery}`);
        const data = await res.json();
        document.getElementById(`dash-count-${c.key}`).textContent = Array.isArray(data) ? data.length : '-';
      } catch {
        document.getElementById(`dash-count-${c.key}`).textContent = '-';
      }
    }
  },

  // -------------------------------------------------------------------------
  // CRUD GENERIK (dipakai oleh: jadwal, galeri, berita, guru, konten)
  // -------------------------------------------------------------------------
  async renderCrudView(key) {
    const mod = MODULES[key];
    const root = document.getElementById('view-root');
    root.innerHTML = `
      <div class="flex items-center justify-between mb-4 gap-3">
        <div class="lg:hidden">
          <h2 class="font-bold text-primary">${mod.label}</h2>
          <p class="text-xs text-on-surface-variant">${mod.subtitle}</p>
        </div>
        <div class="hidden lg:block"></div>
        <button onclick="App.openForm('${key}')" class="ml-auto px-4 py-2 rounded-xl bg-secondary-container text-on-secondary-container font-bold text-sm flex items-center gap-1.5 hover:opacity-90">
          <span class="material-symbols-outlined text-[18px]">add</span> Tambah
        </button>
      </div>
      <div class="bg-white border border-surface-container rounded-2xl overflow-x-auto">
        <table class="w-full text-left text-sm min-w-[640px]">
          <thead class="bg-surface-container-low text-on-surface-variant text-xs uppercase font-bold">
            <tr>${mod.columns.map((c) => `<th class="py-3 px-4">${c.label}</th>`).join('')}<th class="py-3 px-4 text-right">Aksi</th></tr>
          </thead>
          <tbody id="crud-tbody" class="divide-y divide-surface-container"></tbody>
        </table>
      </div>
      <p id="crud-empty" class="hidden text-center text-sm text-on-surface-variant py-10">Belum ada data. Klik "Tambah" untuk membuat data baru.</p>
    `;
    await this.loadCrudData(key);
  },

  async loadCrudData(key) {
    const mod = MODULES[key];
    const tbody = document.getElementById('crud-tbody');
    tbody.innerHTML = `<tr><td colspan="10" class="py-8 text-center text-sm text-on-surface-variant">Memuat data...</td></tr>`;
    try {
      const res = await this.api(`${mod.endpoint}${mod.listQuery}`);
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) {
        tbody.innerHTML = '';
        document.getElementById('crud-empty').classList.remove('hidden');
        return;
      }
      document.getElementById('crud-empty').classList.add('hidden');
      tbody.innerHTML = data.map((row) => `
        <tr class="hover:bg-surface-container-low/60">
          ${mod.columns.map((c) => `<td class="py-3 px-4 align-top">${c.render ? c.render(row) : escapeHtml(row[c.key])}</td>`).join('')}
          <td class="py-3 px-4 text-right whitespace-nowrap">
            <button onclick='App.openForm("${key}", ${JSON.stringify(row).replace(/'/g, "&#39;")})' class="p-1.5 rounded-lg hover:bg-surface-container text-primary" title="Edit">
              <span class="material-symbols-outlined text-[18px]">edit</span>
            </button>
            <button onclick='App.deleteRecord("${key}", "${row[mod.idKey]}")' class="p-1.5 rounded-lg hover:bg-error-container text-error" title="Hapus">
              <span class="material-symbols-outlined text-[18px]">delete</span>
            </button>
          </td>
        </tr>`).join('');
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="10" class="py-8 text-center text-sm text-error">Gagal memuat data: ${err.message}</td></tr>`;
    }
  },

  openForm(key, record = null) {
    const mod = MODULES[key];
    this.editing = { module: key, record };
    document.getElementById('modal-title').textContent = record ? `Edit ${mod.label}` : `Tambah ${mod.label}`;

    const form = document.getElementById('modal-form');
    form.innerHTML = mod.fields.map((f) => this.renderField(f, record)).join('') + `
      <div class="flex gap-2 pt-2">
        <button type="button" onclick="App.closeModal()" class="flex-1 py-2.5 rounded-xl border border-surface-container font-bold text-sm text-on-surface-variant hover:bg-surface-container-low">Batal</button>
        <button type="submit" class="flex-1 py-2.5 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-container">Simpan</button>
      </div>`;

    // Field khusus konten: tipe input isi mengikuti pilihan "tipe" (text/textarea)
    if (key === 'konten') {
      const tipeSelect = form.querySelector('[name="tipe"]');
      const syncIsiField = () => {
        const wrap = form.querySelector('[data-dynamic-wrap]');
        const val = record?.isi ?? '';
        wrap.innerHTML = tipeSelect.value === 'textarea'
          ? `<textarea name="isi" rows="4" class="w-full text-sm rounded-xl border border-surface-container bg-surface-container-low px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-secondary-container">${escapeHtml(val)}</textarea>`
          : `<input name="isi" type="text" value="${escapeHtml(val)}" class="w-full text-sm rounded-xl border border-surface-container bg-surface-container-low px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-secondary-container" />`;
      };
      tipeSelect.addEventListener('change', syncIsiField);
      syncIsiField();
      // Saat edit, kode field tidak boleh diubah (jadi identitas record)
      if (record) {
        const keyInput = form.querySelector('[name="section_key"]');
        keyInput.readOnly = true;
        keyInput.classList.add('opacity-60', 'cursor-not-allowed');
      }
    }

    form.onsubmit = (e) => this.submitForm(e, key, record);
    document.getElementById('modal').classList.remove('hidden');
  },

  renderField(f, record) {
    const value = record ? record[f.name] : '';
    const widthClass = f.half ? 'w-1/2 inline-block align-top' : 'w-full';
    const wrapOpen = f.half ? '' : '<div>';
    const wrapClose = f.half ? '' : '</div>';

    if (f.type === 'select') {
      return `<div class="${f.half ? 'inline-block w-1/2 pr-1 align-top' : ''}">
        <label class="block text-xs font-bold text-primary mb-1">${f.label}${f.required ? ' *' : ''}</label>
        <select name="${f.name}" ${f.required ? 'required' : ''} class="w-full text-sm rounded-xl border border-surface-container bg-surface-container-low px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-secondary-container">
          ${f.options.map(([v, l]) => `<option value="${v}" ${value === v ? 'selected' : ''}>${l}</option>`).join('')}
        </select></div>`;
    }
    if (f.type === 'textarea') {
      return `<div><label class="block text-xs font-bold text-primary mb-1">${f.label}${f.required ? ' *' : ''}</label>
        <textarea name="${f.name}" rows="${f.rows || 3}" placeholder="${f.placeholder || ''}" ${f.required ? 'required' : ''}
          class="w-full text-sm rounded-xl border border-surface-container bg-surface-container-low px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-secondary-container">${escapeHtml(value)}</textarea></div>`;
    }
    if (f.type === 'checkbox') {
      const checked = record ? (value === 1 || value === true) : true;
      return `<label class="flex items-center gap-2 text-sm font-semibold text-primary">
        <input type="checkbox" name="${f.name}" ${checked ? 'checked' : ''} class="w-4 h-4 rounded accent-secondary-container" />
        ${f.label}</label>`;
    }
    if (f.type === 'file') {
      const current = record?.foto ? `<p class="text-[11px] text-on-surface-variant mt-1">File saat ini: ${escapeHtml(record.foto)}</p>` : '';
      return `<div><label class="block text-xs font-bold text-primary mb-1">${f.label}</label>
        <input type="file" name="${f.name}" accept="image/*" class="w-full text-sm rounded-xl border border-surface-container bg-surface-container-low px-3 py-2.5 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-secondary-container file:text-on-secondary-container file:font-bold file:text-xs" />
        ${current}</div>`;
    }
    if (f.type === 'dynamic-textinput') {
      return `<div><label class="block text-xs font-bold text-primary mb-1">${f.label}</label><div data-dynamic-wrap></div></div>`;
    }
    // default: text / number / date
    const inputAttrs = f.keyField && record ? 'readonly' : '';
    if (f.half) {
      return `<div class="inline-block w-1/2 pr-1 align-top">
        <label class="block text-xs font-bold text-primary mb-1">${f.label}${f.required ? ' *' : ''}</label>
        <input name="${f.name}" type="${f.type}" value="${escapeHtml(value)}" placeholder="${f.placeholder || ''}" ${f.required ? 'required' : ''} ${inputAttrs}
          class="w-full text-sm rounded-xl border border-surface-container bg-surface-container-low px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-secondary-container" /></div>`;
    }
    return `<div><label class="block text-xs font-bold text-primary mb-1">${f.label}${f.required ? ' *' : ''}</label>
      <input name="${f.name}" type="${f.type}" value="${escapeHtml(value)}" placeholder="${f.placeholder || ''}" ${f.required ? 'required' : ''} ${inputAttrs}
        class="w-full text-sm rounded-xl border border-surface-container bg-surface-container-low px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-secondary-container" /></div>`;
  },

  closeModal() {
    document.getElementById('modal').classList.add('hidden');
    this.editing = null;
  },

  async submitForm(e, key, record) {
    e.preventDefault();
    const mod = MODULES[key];
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Menyimpan...';

    try {
      let body;
      const isEdit = !!record;
      const idOrKey = isEdit ? record[mod.idKey] : null;
      const url = isEdit ? `${mod.endpoint}/${idOrKey}` : mod.endpoint;
      const method = isEdit ? 'PUT' : 'POST';

      if (mod.upload) {
        body = new FormData(form);
        // checkbox tidak terkirim FormData jika unchecked -> set eksplisit
        mod.fields.filter((f) => f.type === 'checkbox').forEach((f) => {
          if (!form.querySelector(`[name="${f.name}"]`).checked) body.set(f.name, '0');
        });
      } else {
        const fd = new FormData(form);
        const obj = {};
        mod.fields.forEach((f) => {
          if (f.type === 'checkbox') {
            obj[f.name] = form.querySelector(`[name="${f.name}"]`).checked ? 1 : 0;
          } else {
            obj[f.name] = fd.get(f.name) ?? '';
          }
        });
        body = JSON.stringify(obj);
      }

      const res = await this.api(url, { method, body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan data.');

      toast(isEdit ? 'Data berhasil diperbarui.' : 'Data berhasil ditambahkan.');
      this.closeModal();
      await this.loadCrudData(key);
      if (this.currentView === 'dashboard') this.renderDashboard();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Simpan';
    }
  },

  async deleteRecord(key, idOrKey) {
    const mod = MODULES[key];
    if (!confirm('Yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan.')) return;
    try {
      const res = await this.api(`${mod.endpoint}/${idOrKey}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menghapus data.');
      toast('Data berhasil dihapus.');
      await this.loadCrudData(key);
    } catch (err) {
      toast(err.message, 'error');
    }
  },

  // -------------------------------------------------------------------------
  // PENGATURAN AKUN (ganti password)
  // -------------------------------------------------------------------------
  renderPengaturan() {
    const root = document.getElementById('view-root');
    root.innerHTML = `
      <div class="max-w-md bg-white border border-surface-container rounded-2xl p-6">
        <h3 class="font-bold text-primary mb-1">Ganti Password</h3>
        <p class="text-xs text-on-surface-variant mb-4">Login sebagai <b>${escapeHtml(this.admin?.username || '')}</b></p>
        <form id="password-form" class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-primary mb-1">Password Lama</label>
            <input name="password_lama" type="password" required class="w-full text-sm rounded-xl border border-surface-container bg-surface-container-low px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-secondary-container" />
          </div>
          <div>
            <label class="block text-xs font-bold text-primary mb-1">Password Baru (min. 6 karakter)</label>
            <input name="password_baru" type="password" required minlength="6" class="w-full text-sm rounded-xl border border-surface-container bg-surface-container-low px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-secondary-container" />
          </div>
          <button type="submit" class="w-full py-2.5 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-container">Simpan Password Baru</button>
        </form>
      </div>`;

    document.getElementById('password-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      try {
        const res = await this.api('/api/auth/change-password', {
          method: 'POST',
          body: JSON.stringify({ password_lama: fd.get('password_lama'), password_baru: fd.get('password_baru') }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Gagal mengganti password.');
        toast('Password berhasil diganti.');
        e.target.reset();
      } catch (err) {
        toast(err.message, 'error');
      }
    });
  },
};

App.init();
