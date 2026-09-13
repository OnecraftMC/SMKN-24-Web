"use client";

import { useEffect, useState } from "react";
import type { Agenda, Berita, Pengumuman } from "@shared/types";
import { createContent, getContent, type ContentKind } from "@/lib/api";

type Section = ContentKind | "ringkasan";

type FormState = {
  judul: string;
  kategori: string;
  tanggal: string;
  ringkasan: string;
  isi: string;
  waktu: string;
  lokasi: string;
};

const emptyForm: FormState = { judul: "", kategori: "", tanggal: "", ringkasan: "", isi: "", waktu: "", lokasi: "" };

export default function AdminPage() {
  const [section, setSection] = useState<Section>("ringkasan");
  const [berita, setBerita] = useState<Berita[]>([]);
  const [pengumuman, setPengumuman] = useState<Pengumuman[]>([]);
  const [agenda, setAgenda] = useState<Agenda[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const [news, announcements, events] = await Promise.all([
          getContent<Berita>("berita"),
          getContent<Pengumuman>("pengumuman"),
          getContent<Agenda>("agenda"),
        ]);
        setBerita(news);
        setPengumuman(announcements);
        setAgenda(events);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Gagal memuat data.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const title = section === "ringkasan" ? "Ringkasan" : section[0].toUpperCase() + section.slice(1);

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (section === "ringkasan") return;
    setLoading(true);
    setError("");
    setNotice("");
    try {
      await createContent(section, form);
      setNotice(`${title} berhasil disimpan.`);
      setForm(emptyForm);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Gagal menyimpan data.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <p className="brand">SMKN24 / ADMIN</p>
        <nav className="nav" aria-label="Navigasi admin">
          {(["ringkasan", "berita", "pengumuman", "agenda"] as Section[]).map((item) => (
            <button key={item} className={section === item ? "active" : ""} onClick={() => setSection(item)}>
              {item[0].toUpperCase() + item.slice(1)}
            </button>
          ))}
        </nav>
      </aside>
      <main className="main">
        <header className="top">
          <div><span className="eyebrow">Konten sekolah</span><h1>{title}</h1><p className="muted">Kelola data yang tampil di main website.</p></div>
          <span className="badge">API main-web</span>
        </header>
        {error && <div className="error" role="alert">{error}</div>}
        {notice && <div className="badge" role="status">{notice}</div>}
        {section === "ringkasan" ? <Summary berita={berita} pengumuman={pengumuman} agenda={agenda} /> : <ContentSection kind={section} data={section === "berita" ? berita : section === "pengumuman" ? pengumuman : agenda} form={form} updateField={updateField} save={save} loading={loading} />}
      </main>
    </div>
  );
}

function Summary({ berita, pengumuman, agenda }: { berita: Berita[]; pengumuman: Pengumuman[]; agenda: Agenda[] }) {
  return <section className="stats"><div className="card stat"><span className="muted">Berita</span><strong>{berita.length}</strong></div><div className="card stat"><span className="muted">Pengumuman</span><strong>{pengumuman.length}</strong></div><div className="card stat"><span className="muted">Agenda</span><strong>{agenda.length}</strong></div></section>;
}

function ContentSection({ kind, data, form, updateField, save, loading }: { kind: ContentKind; data: Array<Berita | Pengumuman | Agenda>; form: FormState; updateField: (field: keyof FormState, value: string) => void; save: (event: React.FormEvent<HTMLFormElement>) => void; loading: boolean }) {
  return <section><div className="card"><div className="toolbar"><div><h2>Data {kind}</h2><p className="muted">Data dibaca dari API main-web.</p></div></div><div className="table-wrap"><table><thead><tr><th>Judul</th><th>Kategori/Lokasi</th><th>Tanggal</th></tr></thead><tbody>{data.map((item) => <tr key={item.id}><td>{item.judul}</td><td>{"kategori" in item ? item.kategori : item.lokasi}</td><td>{item.tanggal}</td></tr>)}</tbody></table></div></div><form className="card" onSubmit={save} style={{ marginTop: 16 }}><h2>Tambah {kind}</h2><div className="form-grid"><Field label="Judul" value={form.judul} onChange={(value) => updateField("judul", value)} required /><Field label="Kategori" value={form.kategori} onChange={(value) => updateField("kategori", value)} /><Field label="Tanggal" type="date" value={form.tanggal} onChange={(value) => updateField("tanggal", value)} required />{kind === "agenda" && <><Field label="Waktu" value={form.waktu} onChange={(value) => updateField("waktu", value)} /><Field label="Lokasi" value={form.lokasi} onChange={(value) => updateField("lokasi", value)} /></>}{kind === "berita" && <Field label="Ringkasan" value={form.ringkasan} onChange={(value) => updateField("ringkasan", value)} required />}{kind === "pengumuman" && <Field label="Isi" value={form.isi} onChange={(value) => updateField("isi", value)} required />}<div className="field full actions"><button className="btn primary" disabled={loading} type="submit">{loading ? "Menyimpan..." : "Simpan"}</button></div></div></form></section>;
}

function Field({ label, value, onChange, type = "text", required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) {
  return <div className="field"><label>{label}</label><input type={type} value={value} onChange={(event) => onChange(event.target.value)} required={required} /></div>;
}
