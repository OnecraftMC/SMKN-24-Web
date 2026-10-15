"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, Check, ClipboardList, LogOut, Loader2, LockKeyhole, RefreshCw, Store } from "lucide-react";

const API = (process.env.NEXT_PUBLIC_API_URL ?? "/backend").replace(/\/+$/, "");
const TOKEN_KEY = "smkn24-canteen-seller-token";
const USER_KEY = "smkn24-canteen-seller-user";
const CHANGE_PASSWORD_KEY = "smkn24-canteen-seller-change-password";
type Seller = { id: number; username: string; fullName: string; standId: number; standName: string };
type Order = { id: number; order_no: string; buyer_name: string; buyer_class: string; fulfillment: "delivery" | "pickup"; subtotal: number; deliveryFee: number; total: number; status: "received" | "preparing" | "ready"; payment_status: "paid"; paid_at: string | null; items: { name: string; unitPrice: number; quantity: number; lineTotal: number }[] };

function money(value: number) { return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value); }
async function api<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  const response = await fetch(`${API}${path}`, { ...init, cache: "no-store", headers: { Accept: "application/json", ...(init.body ? { "Content-Type": "application/json" } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...init.headers } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error ?? "Permintaan tidak berhasil.");
  return data as T;
}

export default function SellerPortal() {
  const [token, setToken] = useState<string | null>(null);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loginBusy, setLoginBusy] = useState(false);
  const [busyOrder, setBusyOrder] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const logout = useCallback(() => {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
    window.localStorage.removeItem(CHANGE_PASSWORD_KEY);
    setToken(null); setSeller(null); setOrders([]); setMustChangePassword(false);
  }, []);

  const loadOrders = useCallback(async (accessToken: string, showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const data = await api<{ orders: Order[] }>("/api/kantin/seller/orders.php", {}, accessToken);
      setOrders(data.orders ?? []); setLastUpdated(new Date()); setError(null);
    } catch (err) {
      if (err instanceof Error && /sesi|kedaluwarsa|tidak aktif|ganti kata sandi sementara/i.test(err.message)) logout();
      else setError(err instanceof Error ? err.message : "Pesanan belum dapat dimuat.");
    } finally { if (showLoading) setLoading(false); }
  }, [logout]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const storedToken = window.localStorage.getItem(TOKEN_KEY);
      const storedUser = window.localStorage.getItem(USER_KEY);
      if (!storedToken) return;
      setToken(storedToken);
      const passwordChangeRequired = window.localStorage.getItem(CHANGE_PASSWORD_KEY) === "1";
      setMustChangePassword(passwordChangeRequired);
      if (storedUser) { try { setSeller(JSON.parse(storedUser) as Seller); } catch { window.localStorage.removeItem(USER_KEY); } }
      if (!passwordChangeRequired) void loadOrders(storedToken, true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadOrders]);

  useEffect(() => {
    if (!token || mustChangePassword) return;
    const timer = window.setInterval(() => void loadOrders(token), 5000);
    return () => window.clearInterval(timer);
  }, [loadOrders, mustChangePassword, token]);

  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoginBusy(true); setError(null);
    try {
      const data = await api<{ token: string; user: Seller; mustChangePassword: boolean }>("/api/kantin/seller/auth.php", { method: "POST", body: JSON.stringify({ action: "login", username, password }) });
      window.localStorage.setItem(TOKEN_KEY, data.token); window.localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      window.localStorage.setItem(CHANGE_PASSWORD_KEY, data.mustChangePassword ? "1" : "0");
      setToken(data.token); setSeller(data.user); setMustChangePassword(data.mustChangePassword); setPassword("");
      if (!data.mustChangePassword) await loadOrders(data.token, true);
    } catch (err) { setError(err instanceof Error ? err.message : "Tidak dapat masuk."); }
    finally { setLoginBusy(false); }
  }

  async function changePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!token) return;
    setLoginBusy(true); setError(null);
    try {
      await api("/api/kantin/seller/auth.php", { method: "POST", body: JSON.stringify({ action: "change_password", currentPassword, newPassword }) }, token);
      window.localStorage.removeItem(CHANGE_PASSWORD_KEY);
      setCurrentPassword(""); setNewPassword(""); setMustChangePassword(false); await loadOrders(token, true);
    } catch (err) { setError(err instanceof Error ? err.message : "Kata sandi belum dapat diperbarui."); }
    finally { setLoginBusy(false); }
  }

  async function advanceOrder(order: Order) {
    const nextStatus = order.status === "received" ? "preparing" : order.status === "preparing" ? "ready" : "completed";
    setBusyOrder(order.order_no); setError(null);
    try {
      await api("/api/kantin/seller/orders.php", { method: "PUT", body: JSON.stringify({ orderNo: order.order_no, fromStatus: order.status, status: nextStatus }) }, token ?? undefined);
      await loadOrders(token ?? "");
    } catch (err) { setError(err instanceof Error ? err.message : "Status pesanan belum dapat diperbarui."); }
    finally { setBusyOrder(null); }
  }

  if (!token || !seller) return <main className="flex min-h-screen items-center justify-center px-4 py-10"><div className="w-full max-w-md rounded-3xl border border-surface-container bg-surface p-6 shadow-xl sm:p-8"><Link href="/kantin" className="inline-flex items-center gap-2 font-label-sm text-label-sm font-bold text-primary"><ArrowRight className="h-4 w-4 rotate-180" /> Kantin pembeli</Link><div className="mt-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-surface"><Store className="h-7 w-7" /></div><p className="mt-5 font-label-sm text-label-sm font-bold uppercase tracking-wider text-secondary">Aplikasi penjual</p><h1 className="mt-1 font-headline-sm text-headline-sm font-bold text-primary">Masuk ke pesanan kantin</h1><p className="mt-2 font-body-sm text-body-sm text-on-surface-variant">Gunakan akun yang dibuat oleh administrator kantin.</p><form onSubmit={login} className="mt-6 space-y-4"><label className="block"><span className="mb-1.5 block font-label-sm text-label-sm font-bold">Nama pengguna</span><input required autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} className="min-h-12 w-full rounded-xl border border-surface-container-high bg-white px-4 outline-none focus:border-primary" /></label><label className="block"><span className="mb-1.5 block font-label-sm text-label-sm font-bold">Kata sandi</span><input required type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="min-h-12 w-full rounded-xl border border-surface-container-high bg-white px-4 outline-none focus:border-primary" /></label>{error && <p role="alert" className="rounded-xl bg-error-container p-3 font-body-sm text-body-sm text-error">{error}</p>}<button disabled={loginBusy} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 font-label-md font-bold text-surface hover:bg-primary-container disabled:opacity-60">{loginBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <LockKeyhole className="h-4 w-4" />} Masuk</button></form></div></main>;

  if (mustChangePassword) return <main className="flex min-h-screen items-center justify-center px-4 py-10"><div className="w-full max-w-md rounded-3xl border border-surface-container bg-surface p-6 shadow-xl sm:p-8"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary-container text-primary"><LockKeyhole className="h-7 w-7" /></div><h1 className="mt-5 font-headline-sm text-headline-sm font-bold text-primary">Buat kata sandi baru</h1><p className="mt-2 font-body-sm text-body-sm text-on-surface-variant">Kata sandi sementara harus diganti sebelum pesanan dapat diakses.</p><form onSubmit={changePassword} className="mt-6 space-y-4"><label className="block"><span className="mb-1.5 block font-label-sm font-bold">Kata sandi sementara</span><input required type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className="min-h-12 w-full rounded-xl border border-surface-container-high bg-white px-4" /></label><label className="block"><span className="mb-1.5 block font-label-sm font-bold">Kata sandi baru (minimal 10 karakter)</span><input required minLength={10} maxLength={128} type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="min-h-12 w-full rounded-xl border border-surface-container-high bg-white px-4" /></label>{error && <p role="alert" className="rounded-xl bg-error-container p-3 text-sm text-error">{error}</p>}<button disabled={loginBusy} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary font-label-md font-bold text-surface">{loginBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Simpan kata sandi</button><button type="button" onClick={logout} className="w-full py-2 font-label-sm font-bold text-on-surface-variant">Keluar</button></form></div></main>;

  return <main className="mx-auto min-h-screen max-w-5xl px-4 py-5 sm:px-6 sm:py-8"><header className="mb-6 flex items-center justify-between gap-4 rounded-3xl bg-primary p-5 text-surface shadow-lg sm:p-7"><div className="min-w-0"><p className="font-label-sm text-label-sm font-bold uppercase tracking-wider text-primary-fixed">Panel penjual</p><h1 className="mt-1 truncate font-headline-sm text-headline-sm font-bold">{seller.standName}</h1><p className="mt-1 truncate font-body-sm text-body-sm text-primary-fixed">Halo, {seller.fullName}</p></div><button type="button" onClick={logout} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-surface hover:bg-white/20" title="Keluar" aria-label="Keluar"><LogOut className="h-5 w-5" /></button></header>
    <section className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><h2 className="flex items-center gap-2 font-title-lg text-title-lg font-bold text-primary"><ClipboardList className="h-5 w-5" /> Pesanan dibayar</h2><p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">Hanya pesanan yang sudah lunas tampil di sini.</p></div><div className="flex items-center gap-3"><span className="font-body-sm text-body-sm text-on-surface-variant">{lastUpdated ? `Diperbarui ${lastUpdated.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}` : "Memuat…"}</span><button type="button" onClick={() => void loadOrders(token, true)} aria-label="Segarkan pesanan" className="flex h-10 w-10 items-center justify-center rounded-xl border border-surface-container bg-surface text-primary hover:bg-white"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /></button></div></section>
    {error && <p role="alert" className="mb-4 rounded-xl border border-error/20 bg-error-container p-3 font-body-sm text-body-sm text-error">{error}</p>}
    {loading && orders.length === 0 ? <div className="flex items-center justify-center gap-2 rounded-2xl bg-surface p-10 text-on-surface-variant"><Loader2 className="h-5 w-5 animate-spin" /> Memuat pesanan…</div> : orders.length === 0 ? <div className="rounded-3xl border border-dashed border-surface-container-high bg-surface p-10 text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary-container text-primary"><ClipboardList className="h-7 w-7" /></div><h3 className="mt-4 font-title-md text-title-md font-bold text-primary">Belum ada pesanan masuk</h3><p className="mt-2 font-body-sm text-body-sm text-on-surface-variant">Pesanan berbayar baru akan muncul otomatis di halaman ini.</p></div> : <div className="grid gap-4 md:grid-cols-2">{orders.map((order) => <article key={order.order_no} className="overflow-hidden rounded-3xl border border-surface-container bg-surface shadow-sm"><div className="flex items-start justify-between gap-3 border-b border-surface-container p-4 sm:p-5"><div><p className="font-label-sm text-label-sm font-bold text-secondary">{order.order_no}</p><h3 className="mt-1 font-title-md text-title-md font-bold text-primary">{order.buyer_name}</h3><p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">{order.buyer_class} · {order.fulfillment === "delivery" ? "Diantar" : "Ambil sendiri"}</p></div><span className="shrink-0 rounded-full bg-emerald-100 px-3 py-1 font-label-sm text-label-sm font-bold text-emerald-800">Lunas</span></div><div className="space-y-2 p-4 sm:p-5">{order.items.map((item, index) => <div key={`${item.name}-${index}`} className="flex justify-between gap-3 font-body-sm text-body-sm"><span className="text-on-surface-variant">{item.quantity}× {item.name}</span><span className="shrink-0 font-label-sm font-bold text-primary">{money(item.lineTotal)}</span></div>)}<div className="flex justify-between border-t border-surface-container pt-3 font-label-md text-label-md font-bold text-primary"><span>Total{order.deliveryFee ? " termasuk antar" : ""}</span><span>{money(order.total)}</span></div><p className="pt-1 font-body-sm text-body-sm text-on-surface-variant">{order.paid_at ? new Date(`${order.paid_at.replace(" ", "T")}+07:00`).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "Baru saja"}</p><button type="button" disabled={busyOrder === order.order_no} onClick={() => void advanceOrder(order)} className="mt-2 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 font-label-md text-label-md font-bold text-surface hover:bg-primary-container disabled:opacity-60">{busyOrder === order.order_no ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}{order.status === "received" ? "Terima & mulai proses" : order.status === "preparing" ? "Tandai siap" : "Tandai selesai"}</button></div></article>)}</div>}
    <footer className="mt-8 text-center font-body-sm text-body-sm text-on-surface-variant">Daftar pesanan diperbarui otomatis setiap 5 detik · <Link href="/kantin" className="font-bold text-primary">Buka kantin pembeli</Link></footer>
    </main>;
}
