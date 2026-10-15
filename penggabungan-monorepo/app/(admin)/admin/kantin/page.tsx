"use client";

import { useCallback, useEffect, useState } from "react";
import { KeyRound, Loader2, Plus, RefreshCw, Store, Utensils } from "lucide-react";
import { apiRequest } from "@/lib/admin/api";

type Stand = { id: number; slug: string; name: string; description: string | null; image_url: string | null; is_active: number; seller_count: number; menu_count: number };
type Seller = { id: number; standId: number; standName: string; username: string; fullName: string; isActive: number; mustChangePassword: number; lastLoginAt: string | null };
type Menu = { id: number; standId: number; standName: string; name: string; description: string | null; category: "food" | "drink"; price: number; imageUrl: string | null; isAvailable: number; sortOrder: number };
type Resource<T> = { [key: string]: T[] };
type Tab = "stands" | "sellers" | "menu";

function field() { return `block min-h-11 w-full rounded-xl border border-surface-container-high bg-white px-3 font-body-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10`; }
function button() { return "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 font-label-sm text-label-sm font-bold text-surface transition hover:bg-primary-container disabled:opacity-60"; }
function money(value: number) { return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value); }

export default function CanteenAdminPage() {
  const [tab, setTab] = useState<Tab>("stands");
  const [stands, setStands] = useState<Stand[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [menu, setMenu] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);
  const [standForm, setStandForm] = useState({ name: "", description: "", imageUrl: "/images/kantin-sekolah.svg" });
  const [sellerForm, setSellerForm] = useState({ standId: "", username: "", fullName: "" });
  const [menuForm, setMenuForm] = useState({ id: 0, standId: "", name: "", description: "", category: "food" as "food" | "drink", price: "", imageUrl: "", isAvailable: true, sortOrder: "0" });

  const reload = useCallback(async () => {
    setLoading(true); setError(null);
    const results = await Promise.allSettled([
      apiRequest<Resource<Stand>>("/api/kantin/admin.php?resource=stands"),
      apiRequest<Resource<Seller>>("/api/kantin/admin.php?resource=sellers"),
      apiRequest<Resource<Menu>>("/api/kantin/admin.php?resource=menu"),
    ]);
    const failed = results.find((result) => result.status === "rejected");
    if (failed?.status === "rejected") setError(failed.reason instanceof Error ? failed.reason.message : "Data belum dapat dimuat.");
    if (results[0].status === "fulfilled") setStands(results[0].value.stands ?? []);
    if (results[1].status === "fulfilled") setSellers(results[1].value.sellers ?? []);
    if (results[2].status === "fulfilled") setMenu(results[2].value.menu ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void reload(), 0);
    return () => window.clearTimeout(timer);
  }, [reload]);

  async function mutate<T>(path: string, method: "POST" | "PUT", body: unknown): Promise<T | null> {
    setSaving(true); setError(null); setNotice(null); setTemporaryPassword(null);
    try {
      const result = await apiRequest<T>(path, { method, body });
      await reload();
      return result;
    } catch (err) { setError(err instanceof Error ? err.message : "Perubahan belum tersimpan."); return null; }
    finally { setSaving(false); }
  }

  async function createStand(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = await mutate<{ created: boolean }>("/api/kantin/admin.php", "POST", { action: "create_stand", ...standForm, isActive: true });
    if (result) { setStandForm({ name: "", description: "", imageUrl: "/images/kantin-sekolah.svg" }); setNotice("Stand baru berhasil dibuat."); }
  }

  async function createSeller(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = await mutate<{ temporaryPassword: string }>("/api/kantin/admin.php", "POST", { action: "create_seller", ...sellerForm, standId: Number(sellerForm.standId) });
    if (result) { setTemporaryPassword(result.temporaryPassword); setNotice("Akun berhasil dibuat. Salin kata sandi sementara untuk diberikan kepada penjual."); setSellerForm({ standId: sellerForm.standId, username: "", fullName: "" }); }
  }

  async function resetPassword(seller: Seller) {
    const result = await mutate<{ temporaryPassword: string }>("/api/kantin/admin.php", "POST", { action: "reset_password", sellerId: seller.id });
    if (result) { setTemporaryPassword(result.temporaryPassword); setNotice(`Kata sandi sementara baru untuk ${seller.username}.`); }
  }

  async function saveMenu(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = { action: menuForm.id ? "update_menu" : "create_menu", ...menuForm, id: menuForm.id || undefined, standId: Number(menuForm.standId), price: Number(menuForm.price), sortOrder: Number(menuForm.sortOrder) };
    const result = await mutate<{ created?: boolean; updated?: boolean }>("/api/kantin/admin.php", menuForm.id ? "PUT" : "POST", body);
    if (result) { setMenuForm({ id: 0, standId: menuForm.standId, name: "", description: "", category: "food", price: "", imageUrl: "", isAvailable: true, sortOrder: "0" }); setNotice("Menu berhasil disimpan."); }
  }

  async function toggleStand(stand: Stand) {
    const result = await mutate("/api/kantin/admin.php", "PUT", { action: "update_stand", id: stand.id, name: stand.name, description: stand.description ?? "", imageUrl: stand.image_url ?? "", isActive: !stand.is_active });
    if (result) setNotice(`${stand.name} ${stand.is_active ? "dinonaktifkan" : "diaktifkan"}.`);
  }

  async function toggleMenu(item: Menu) {
    const result = await mutate("/api/kantin/admin.php", "PUT", { action: "update_menu", ...item, isAvailable: !item.isAvailable });
    if (result) setNotice(`${item.name} ${item.isAvailable ? "disembunyikan" : "ditampilkan"}.`);
  }

  function editMenu(item: Menu) {
    setTab("menu"); setMenuForm({ id: item.id, standId: String(item.standId), name: item.name, description: item.description ?? "", category: item.category, price: String(item.price), imageUrl: item.imageUrl ?? "", isAvailable: Boolean(item.isAvailable), sortOrder: String(item.sortOrder) });
  }

  const tabs: { id: Tab; label: string; count: number; icon: typeof Store }[] = [
    { id: "stands", label: "Stand", count: stands.length, icon: Store },
    { id: "sellers", label: "Akun penjual", count: sellers.length, icon: KeyRound },
    { id: "menu", label: "Menu", count: menu.length, icon: Utensils },
  ];

  return <div className="mx-auto max-w-6xl space-y-6"><header className="flex flex-wrap items-end justify-between gap-4"><div><p className="font-label-sm text-label-sm font-bold uppercase tracking-wider text-secondary">Operasional</p><h1 className="mt-1 font-headline-md text-headline-md font-bold text-primary">Manajemen kantin</h1><p className="mt-2 max-w-2xl font-body-sm text-body-sm text-on-surface-variant">Kelola stand, akun penjual, dan menu. Pesanan berbayar dikelola melalui aplikasi penjual.</p></div><button type="button" onClick={() => void reload()} className="inline-flex h-10 items-center gap-2 rounded-xl border border-surface-container bg-white px-3 font-label-sm font-bold text-primary"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Muat ulang</button></header>
    {error && <p role="alert" className="rounded-xl border border-error/20 bg-error-container p-3 font-body-sm text-body-sm text-error">{error}</p>}
    {notice && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 font-body-sm text-body-sm text-emerald-900">{notice}</p>}
    {temporaryPassword && <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-secondary/30 bg-secondary-container p-4"><div><p className="font-label-sm text-label-sm font-bold text-primary">Kata sandi sementara · tampil sekali</p><code className="mt-1 block select-all font-mono text-lg font-bold text-primary">{temporaryPassword}</code></div><button type="button" onClick={() => void navigator.clipboard?.writeText(temporaryPassword)} className="rounded-lg bg-primary px-3 py-2 font-label-sm font-bold text-surface">Salin</button></div>}
    <nav className="flex gap-2 overflow-x-auto rounded-2xl border border-surface-container bg-white p-2" aria-label="Manajemen kantin">{tabs.map(({ id, label, count, icon: Icon }) => <button key={id} type="button" onClick={() => setTab(id)} aria-current={tab === id ? "page" : undefined} className={`flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-4 font-label-sm text-label-sm font-bold transition ${tab === id ? "bg-primary text-surface" : "text-on-surface-variant hover:bg-surface-container-low"}`}><Icon className="h-4 w-4" />{label}<span className={`rounded-full px-2 py-0.5 text-xs ${tab === id ? "bg-white/15" : "bg-surface-container"}`}>{count}</span></button>)}</nav>

    {loading ? <div className="flex items-center justify-center gap-2 rounded-2xl border border-surface-container bg-white p-10 text-on-surface-variant"><Loader2 className="h-5 w-5 animate-spin" /> Memuat data…</div> : <>
      {tab === "stands" && <div className="grid gap-5 xl:grid-cols-[.9fr_1.1fr]"><section className="rounded-2xl border border-surface-container bg-white p-5"><h2 className="flex items-center gap-2 font-title-md text-title-md font-bold text-primary"><Plus className="h-5 w-5" /> Buat stand</h2><form onSubmit={createStand} className="mt-4 space-y-3"><label className="block"><span className="mb-1 block font-label-sm font-bold">Nama stand</span><input required maxLength={120} value={standForm.name} onChange={(event) => setStandForm({ ...standForm, name: event.target.value })} className={field()} placeholder="Contoh: Stand Bu Rina" /></label><label className="block"><span className="mb-1 block font-label-sm font-bold">Deskripsi</span><textarea rows={3} value={standForm.description} onChange={(event) => setStandForm({ ...standForm, description: event.target.value })} className={`${field()} py-3`} /></label><label className="block"><span className="mb-1 block font-label-sm font-bold">Path gambar (opsional)</span><input value={standForm.imageUrl} onChange={(event) => setStandForm({ ...standForm, imageUrl: event.target.value })} className={field()} placeholder="/images/kantin-sekolah.svg" /></label><button disabled={saving} className={button()}><Plus className="h-4 w-4" /> Buat stand</button></form></section><section className="space-y-3">{stands.map((stand) => <article key={stand.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-surface-container bg-white p-4"><div className="min-w-0"><div className="flex items-center gap-2"><h3 className="truncate font-title-md text-title-md font-bold text-primary">{stand.name}</h3><span className={`rounded-full px-2 py-0.5 font-label-sm text-label-sm font-bold ${stand.is_active ? "bg-emerald-100 text-emerald-800" : "bg-surface-container text-on-surface-variant"}`}>{stand.is_active ? "Aktif" : "Nonaktif"}</span></div><p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">/{stand.slug} · {stand.seller_count} penjual · {stand.menu_count} menu</p></div><button type="button" disabled={saving} onClick={() => void toggleStand(stand)} className="rounded-lg border border-surface-container px-3 py-2 font-label-sm font-bold text-primary">{stand.is_active ? "Nonaktifkan" : "Aktifkan"}</button></article>)}{stands.length === 0 && <p className="rounded-2xl border border-dashed border-surface-container p-8 text-center text-on-surface-variant">Belum ada stand.</p>}</section></div>}

      {tab === "sellers" && <div className="grid gap-5 xl:grid-cols-[.9fr_1.1fr]"><section className="rounded-2xl border border-surface-container bg-white p-5"><h2 className="flex items-center gap-2 font-title-md text-title-md font-bold text-primary"><KeyRound className="h-5 w-5" /> Tambah akun penjual</h2>{stands.filter((stand) => stand.is_active).length === 0 ? <p className="mt-4 rounded-xl bg-surface-container-low p-3 font-body-sm text-body-sm">Buat atau aktifkan stand terlebih dahulu.</p> : <form onSubmit={createSeller} className="mt-4 space-y-3"><label className="block"><span className="mb-1 block font-label-sm font-bold">Stand</span><select required value={sellerForm.standId} onChange={(event) => setSellerForm({ ...sellerForm, standId: event.target.value })} className={field()}><option value="">Pilih stand</option>{stands.filter((stand) => stand.is_active).map((stand) => <option key={stand.id} value={stand.id}>{stand.name}</option>)}</select></label><label className="block"><span className="mb-1 block font-label-sm font-bold">Nama lengkap penjual</span><input required maxLength={120} value={sellerForm.fullName} onChange={(event) => setSellerForm({ ...sellerForm, fullName: event.target.value })} className={field()} /></label><label className="block"><span className="mb-1 block font-label-sm font-bold">Username</span><input required minLength={3} maxLength={60} pattern="[a-zA-Z0-9._-]+" value={sellerForm.username} onChange={(event) => setSellerForm({ ...sellerForm, username: event.target.value })} className={field()} placeholder="kang.asep" /></label><p className="font-body-sm text-body-sm text-on-surface-variant">Sistem membuat kata sandi sementara acak. Penjual wajib menggantinya saat login pertama.</p><button disabled={saving} className={button()}><Plus className="h-4 w-4" /> Buat akun penjual</button></form>}</section><section className="space-y-3">{sellers.map((seller) => <article key={seller.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-surface-container bg-white p-4"><div><h3 className="font-title-sm text-title-sm font-bold text-primary">{seller.fullName}</h3><p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">{seller.username} · {seller.standName}</p><p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">{seller.mustChangePassword ? "Menunggu ganti kata sandi" : seller.lastLoginAt ? `Login ${new Date(seller.lastLoginAt).toLocaleDateString("id-ID")}` : "Belum pernah login"}</p></div><button type="button" disabled={saving} onClick={() => void resetPassword(seller)} className="inline-flex items-center gap-2 rounded-lg border border-surface-container px-3 py-2 font-label-sm font-bold text-primary"><KeyRound className="h-4 w-4" /> Reset password</button></article>)}{sellers.length === 0 && <p className="rounded-2xl border border-dashed border-surface-container p-8 text-center text-on-surface-variant">Belum ada akun penjual.</p>}</section></div>}

      {tab === "menu" && <div className="grid gap-5 xl:grid-cols-[.9fr_1.1fr]"><section className="rounded-2xl border border-surface-container bg-white p-5"><h2 className="flex items-center gap-2 font-title-md text-title-md font-bold text-primary"><Utensils className="h-5 w-5" /> {menuForm.id ? "Edit menu" : "Tambah menu"}</h2>{stands.length === 0 ? <p className="mt-4 rounded-xl bg-surface-container-low p-3">Buat stand terlebih dahulu.</p> : <form onSubmit={saveMenu} className="mt-4 space-y-3"><label className="block"><span className="mb-1 block font-label-sm font-bold">Stand</span><select required value={menuForm.standId} onChange={(event) => setMenuForm({ ...menuForm, standId: event.target.value })} className={field()}><option value="">Pilih stand</option>{stands.map((stand) => <option key={stand.id} value={stand.id}>{stand.name}</option>)}</select></label><label className="block"><span className="mb-1 block font-label-sm font-bold">Nama menu</span><input required maxLength={140} value={menuForm.name} onChange={(event) => setMenuForm({ ...menuForm, name: event.target.value })} className={field()} /></label><label className="block"><span className="mb-1 block font-label-sm font-bold">Deskripsi</span><textarea rows={2} value={menuForm.description} onChange={(event) => setMenuForm({ ...menuForm, description: event.target.value })} className={`${field()} py-3`} /></label><div className="grid grid-cols-2 gap-3"><label className="block"><span className="mb-1 block font-label-sm font-bold">Kategori</span><select value={menuForm.category} onChange={(event) => setMenuForm({ ...menuForm, category: event.target.value as "food" | "drink" })} className={field()}><option value="food">Makanan</option><option value="drink">Minuman</option></select></label><label className="block"><span className="mb-1 block font-label-sm font-bold">Harga (Rp)</span><input required type="number" min={1000} max={1000000} value={menuForm.price} onChange={(event) => setMenuForm({ ...menuForm, price: event.target.value })} className={field()} /></label></div><label className="block"><span className="mb-1 block font-label-sm font-bold">Path gambar (opsional)</span><input value={menuForm.imageUrl} onChange={(event) => setMenuForm({ ...menuForm, imageUrl: event.target.value })} className={field()} placeholder="/images/menu.jpg" /></label><label className="flex items-center gap-2 font-label-sm font-bold"><input type="checkbox" checked={menuForm.isAvailable} onChange={(event) => setMenuForm({ ...menuForm, isAvailable: event.target.checked })} /> Tersedia untuk pembeli</label><div className="flex gap-2"><button disabled={saving} className={button()}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}{menuForm.id ? "Simpan perubahan" : "Tambah menu"}</button>{menuForm.id > 0 && <button type="button" onClick={() => setMenuForm({ id: 0, standId: "", name: "", description: "", category: "food", price: "", imageUrl: "", isAvailable: true, sortOrder: "0" })} className="rounded-xl border border-surface-container px-4 font-label-sm font-bold">Batal edit</button>}</div></form>}</section><section className="space-y-3">{menu.map((item) => <article key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-surface-container bg-white p-4"><div className="min-w-0"><div className="flex items-center gap-2"><h3 className="truncate font-title-sm text-title-sm font-bold text-primary">{item.name}</h3><span className="rounded-full bg-secondary-container px-2 py-0.5 font-label-sm font-bold text-on-secondary-container">{item.category === "food" ? "Makanan" : "Minuman"}</span></div><p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">{item.standName} · {money(Number(item.price))} · {item.isAvailable ? "Tersedia" : "Disembunyikan"}</p></div><div className="flex gap-2"><button type="button" onClick={() => editMenu(item)} className="rounded-lg border border-surface-container px-3 py-2 font-label-sm font-bold text-primary">Edit</button><button type="button" disabled={saving} onClick={() => void toggleMenu(item)} className="rounded-lg border border-surface-container px-3 py-2 font-label-sm font-bold text-primary">{item.isAvailable ? "Sembunyikan" : "Tampilkan"}</button></div></article>)}{menu.length === 0 && <p className="rounded-2xl border border-dashed border-surface-container p-8 text-center text-on-surface-variant">Belum ada menu.</p>}</section></div>}
    </>}
    </div>;
}
