"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock3, Loader2, Minus, Plus, ShoppingBag, Utensils, X } from "lucide-react";

const API = (process.env.NEXT_PUBLIC_API_URL ?? "/backend").replace(/\/+$/, "");
const DELIVERY_FEE = 4000;
type MenuItem = { id: number; standId: number; name: string; description: string | null; category: "food" | "drink"; price: number; imageUrl: string | null };
type Stand = { id: number; slug: string; name: string; description: string; imageUrl: string | null; menu: MenuItem[] };
type CartRow = { item: MenuItem; quantity: number };
type OrderStatus = { orderNo: string; standName: string; buyerName: string; buyerClass: string; fulfillment: string; items: { item_name: string; unit_price: number; quantity: number; line_total: number }[]; subtotal: number; deliveryFee: number; total: number; status: string; paymentStatus: string; paidAt: string | null; createdAt: string };

function money(value: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API}${path}`, { ...init, cache: "no-store", headers: { Accept: "application/json", ...(init?.body ? { "Content-Type": "application/json" } : {}), ...init?.headers } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error ?? "Permintaan belum berhasil.");
  return data as T;
}

function paymentLabel(status: string) {
  if (status === "paid") return "Lunas";
  if (status === "failed") return "Pembayaran gagal";
  if (status === "expired") return "Pembayaran kedaluwarsa";
  return "Menunggu pembayaran";
}

export default function KantinStorefront({ embedded = false }: { embedded?: boolean }) {
  const [stands, setStands] = useState<Stand[]>([]);
  const [selectedStand, setSelectedStand] = useState<Stand | null>(null);
  const [cart, setCart] = useState<Record<number, CartRow>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [buyerName, setBuyerName] = useState("");
  const [buyerClass, setBuyerClass] = useState("");
  const [fulfillment, setFulfillment] = useState<"pickup" | "delivery">("pickup");
  const [orderNo, setOrderNo] = useState<string | null>(null);
  const [order, setOrder] = useState<OrderStatus | null>(null);
  const [savedPaymentUrl, setSavedPaymentUrl] = useState<string | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [mobileCartOpen, setMobileCartOpen] = useState(false);

  useEffect(() => {
    let active = true;
    request<{ stands: Stand[] }>("/api/kantin/catalog.php").then((data) => {
      if (!active) return;
      setStands(data.stands ?? []);
    }).catch((err: unknown) => active && setError(err instanceof Error ? err.message : "Menu belum dapat dimuat."))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const rows = useMemo(() => Object.values(cart), [cart]);
  const subtotal = useMemo(() => rows.reduce((sum, row) => sum + row.item.price * row.quantity, 0), [rows]);
  const deliveryFee = fulfillment === "delivery" && rows.length ? DELIVERY_FEE : 0;
  const total = subtotal + deliveryFee;
  const quantity = rows.reduce((sum, row) => sum + row.quantity, 0);

  const updateQuantity = useCallback((item: MenuItem, delta: number) => {
    setCart((current) => {
      const next = { ...current };
      const currentQuantity = next[item.id]?.quantity ?? 0;
      const nextQuantity = Math.min(20, currentQuantity + delta);
      if (nextQuantity <= 0) delete next[item.id];
      else next[item.id] = { item, quantity: nextQuantity };
      return next;
    });
  }, []);

  const loadOrder = useCallback(async (number: string) => {
    const token = window.localStorage.getItem(`canteen-order-token:${number}`);
    if (!token) {
      setOrderError("Riwayat pesanan ini tidak tersedia di browser ini. Pesanan tetap akan diproses bila pembayaran berhasil.");
      return;
    }
    try {
      const result = await request<OrderStatus>(`/api/kantin/orders.php?order=${encodeURIComponent(number)}`, { headers: { Authorization: `Bearer ${token}` } });
      setOrder(result);
      const paymentUrl = window.localStorage.getItem(`canteen-payment-url:${number}`);
      setSavedPaymentUrl(result.paymentStatus === "pending" ? paymentUrl : null);
      if (result.paymentStatus !== "pending") window.localStorage.removeItem(`canteen-payment-url:${number}`);
      setOrderError(null);
    } catch (err) {
      setOrderError(err instanceof Error ? err.message : "Status pesanan belum dapat dimuat.");
    }
  }, []);

  useEffect(() => {
    const queryOrder = new URLSearchParams(window.location.search).get("order");
    if (!queryOrder) return;
    const initialTimer = window.setTimeout(() => {
      setSavedPaymentUrl(window.localStorage.getItem(`canteen-payment-url:${queryOrder}`));
      setOrderNo(queryOrder);
      void loadOrder(queryOrder);
    }, 0);
    const pollingTimer = window.setInterval(() => void loadOrder(queryOrder), 5000);
    return () => { window.clearTimeout(initialTimer); window.clearInterval(pollingTimer); };
  }, [loadOrder]);

  async function checkout(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedStand || rows.length === 0) return;
    setSubmitting(true);
    setCheckoutError(null);
    try {
      const result = await request<{ orderNo: string; buyerToken: string; redirectUrl: string }>("/api/kantin/orders.php", {
        method: "POST",
        body: JSON.stringify({ standId: selectedStand.id, buyerName, buyerClass, fulfillment, items: rows.map((row) => ({ id: row.item.id, quantity: row.quantity })) }),
      });
      window.localStorage.setItem(`canteen-order-token:${result.orderNo}`, result.buyerToken);
      window.localStorage.setItem(`canteen-payment-url:${result.orderNo}`, result.redirectUrl);
      window.location.assign(result.redirectUrl);
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : "Checkout belum berhasil. Coba lagi.");
      setSubmitting(false);
    }
  }

  const cartPanel = (
    <section className="rounded-3xl border border-surface-container bg-surface-container-lowest p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-title-lg text-title-lg font-bold text-primary"><ShoppingBag className="h-5 w-5" /> Keranjang</h2>
        <span className="rounded-full bg-secondary-container px-2.5 py-1 font-label-sm text-label-sm font-bold text-on-secondary-container">{quantity} item</span>
      </div>
      {rows.length === 0 ? <p className="rounded-2xl bg-surface-container-low p-4 font-body-sm text-body-sm text-on-surface-variant">Pilih menu untuk mulai memesan.</p> : <div className="max-h-64 space-y-3 overflow-y-auto pr-1">
        {rows.map(({ item, quantity: count }) => <div key={item.id} className="flex items-center justify-between gap-3 border-b border-surface-container pb-3">
          <div className="min-w-0"><p className="truncate font-label-md text-label-md font-bold text-primary">{item.name}</p><p className="font-body-sm text-body-sm text-on-surface-variant">{money(item.price)} × {count}</p></div>
          <div className="flex items-center gap-2"><button type="button" onClick={() => updateQuantity(item, -1)} aria-label={`Kurangi ${item.name}`} className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container text-primary hover:bg-secondary-container"><Minus className="h-4 w-4" /></button><span className="w-4 text-center font-label-md font-bold">{count}</span><button type="button" onClick={() => updateQuantity(item, 1)} aria-label={`Tambah ${item.name}`} className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-surface hover:bg-primary-container"><Plus className="h-4 w-4" /></button></div>
        </div>)}
      </div>}
      <div className="mt-4 space-y-2 border-t border-surface-container pt-4 font-body-sm text-body-sm">
        <div className="flex justify-between text-on-surface-variant"><span>Subtotal</span><span>{money(subtotal)}</span></div>
        <div className="flex justify-between text-on-surface-variant"><span>Biaya antar</span><span>{deliveryFee ? money(deliveryFee) : "—"}</span></div>
        <div className="flex justify-between pt-2 font-title-md text-title-md font-bold text-primary"><span>Total</span><span>{money(total)}</span></div>
      </div>
      <button type="button" disabled={rows.length === 0} onClick={() => { setMobileCartOpen(false); setCheckoutOpen(true); }} className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 font-label-md text-label-md font-bold text-surface transition hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-45">Lanjut checkout <ArrowRight className="h-4 w-4" /></button>
    </section>
  );

  return <div className="min-h-[80vh] bg-surface-container-low/50 pb-24 lg:pb-12">
    {!embedded && <section className="bg-primary px-margin-mobile py-12 text-surface md:px-margin-tablet lg:px-margin-desktop lg:py-16">
      <div className="mx-auto grid max-w-container-max items-center gap-8 md:grid-cols-[1.2fr_.8fr]">
        <div><Link href="/fasilitas" className="mb-5 inline-flex items-center gap-2 font-label-sm text-label-sm font-bold text-primary-fixed hover:text-surface"><ArrowLeft className="h-4 w-4" /> Fasilitas sekolah</Link><p className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 font-label-sm text-label-sm font-bold text-secondary-fixed"><Utensils className="h-4 w-4" /> Layanan kantin</p><h1 className="max-w-2xl font-headline-lg text-headline-lg font-bold tracking-tight text-surface md:text-5xl">Makan enak, pesan dari kelas.</h1><p className="mt-4 max-w-xl font-body-md text-body-md text-primary-fixed">Pilih menu, tentukan cara menerima pesanan, lalu bayar dengan GoPay atau QRIS.</p></div>
        <div className="relative hidden h-52 overflow-hidden rounded-3xl border border-white/15 shadow-2xl md:block"><Image src="/images/kantin-sekolah.svg" alt="Kantin SMKN 24 Jakarta" fill sizes="40vw" className="object-cover" /></div>
      </div>
    </section>}

    <div className="mx-auto grid max-w-container-max gap-8 px-margin-mobile py-8 md:px-margin-tablet lg:grid-cols-[minmax(0,1fr)_340px] lg:px-margin-desktop lg:py-10">
      <main className="min-w-0 space-y-8">
        {orderNo && <section className="rounded-3xl border border-secondary/30 bg-secondary-container p-5 md:p-6" aria-live="polite"><div className="flex items-start gap-3"><CheckCircle2 className="mt-1 h-6 w-6 shrink-0 text-primary" /><div className="min-w-0 flex-1"><p className="font-label-sm text-label-sm font-bold uppercase tracking-wide text-on-secondary-container">Pelacakan pesanan</p><h2 className="mt-1 font-title-lg text-title-lg font-bold text-primary">{order ? `Pesanan ${order.orderNo}` : `Pesanan ${orderNo}`}</h2>{order ? <><p className="mt-2 font-body-sm text-body-sm text-on-surface-variant">{paymentLabel(order.paymentStatus)} · {order.status === "received" ? "Sudah diteruskan ke penjual" : order.status === "preparing" ? "Sedang disiapkan" : order.status === "ready" ? "Siap diterima" : order.status === "completed" ? "Selesai" : order.status === "cancelled" ? "Dibatalkan" : "Menunggu konfirmasi pembayaran dari penyedia"}</p>{order.paymentStatus === "paid" && <div className="mt-4 rounded-2xl bg-white/70 p-4"><p className="font-label-md text-label-md font-bold text-primary">{order.standName} · {order.fulfillment === "delivery" ? "Diantar" : "Ambil sendiri"}</p><p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">{order.items.map((item) => `${item.quantity}× ${item.item_name}`).join(" · ")}</p><p className="mt-2 font-label-md text-label-md font-bold text-primary">Total {money(order.total)}</p></div>}{order.paymentStatus === "pending" && savedPaymentUrl && <a href={savedPaymentUrl} className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-4 font-label-sm text-label-sm font-bold text-surface">Lanjutkan pembayaran</a>}</> : orderError ? <p className="mt-2 font-body-sm text-body-sm text-on-surface-variant">{orderError}</p> : <p className="mt-2 flex items-center gap-2 font-body-sm text-body-sm text-on-surface-variant"><Loader2 className="h-4 w-4 animate-spin" /> Memuat status pembayaran…</p>}</div><button type="button" onClick={() => { window.history.replaceState({}, "", embedded ? "/fasilitas" : "/kantin"); setOrderNo(null); setOrder(null); }} className="rounded-full p-2 text-primary hover:bg-white/60" aria-label="Tutup status pesanan"><X className="h-5 w-5" /></button></div></section>}

        {!selectedStand ? <section><div className="mb-5"><p className="font-label-sm text-label-sm font-bold uppercase tracking-wider text-secondary">Pilih stand</p><h2 className="mt-1 font-headline-md text-headline-md font-bold text-primary">Stand kantin</h2><p className="mt-2 font-body-sm text-body-sm text-on-surface-variant">Ketuk kartu stand untuk membuka daftar menu makanan dan minuman.</p></div>{loading ? <div className="flex items-center gap-2 rounded-2xl bg-white p-5 text-on-surface-variant"><Loader2 className="h-5 w-5 animate-spin" /> Memuat stand…</div> : error ? <p role="alert" className="rounded-2xl border border-error/30 bg-white p-5 text-error">{error}</p> : stands.length === 0 ? <p className="rounded-2xl border border-surface-container bg-white p-5 text-on-surface-variant">Stand kantin belum tersedia.</p> : <div className="grid gap-5 sm:grid-cols-2">{stands.map((stand) => <button type="button" key={stand.id} onClick={() => { setSelectedStand(stand); setCart({}); }} className="group overflow-hidden rounded-3xl border border-surface-container bg-white text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:border-secondary/50 hover:shadow-lg active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-primary motion-reduce:transform-none motion-reduce:transition-none"><div className="relative h-48 overflow-hidden bg-primary-container"><Image src={stand.imageUrl?.startsWith("/") && !stand.imageUrl.startsWith("//") ? stand.imageUrl : "/images/kantin-sekolah.svg"} alt={`Area ${stand.name}`} fill sizes="(max-width:640px) 100vw, 40vw" className="object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transform-none motion-reduce:transition-none" /></div><div className="p-5"><div className="flex items-center justify-between gap-3"><h3 className="font-title-lg text-title-lg font-bold text-primary">{stand.name}</h3><ArrowRight className="h-5 w-5 shrink-0 text-secondary transition-transform group-hover:translate-x-1" /></div><p className="mt-2 font-body-sm text-body-sm text-on-surface-variant">{stand.description || "Lihat pilihan makanan dan minuman dari stand ini."}</p><p className="mt-4 font-label-sm text-label-sm font-bold text-secondary">{stand.menu.length} menu tersedia</p></div></button>)}</div>}</section> : <section>
          <button type="button" onClick={() => { setSelectedStand(null); setCart({}); }} className="mb-5 inline-flex items-center gap-2 font-label-sm text-label-sm font-bold text-primary hover:text-secondary"><ArrowLeft className="h-4 w-4" /> Semua stand</button>
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="font-label-sm text-label-sm font-bold uppercase tracking-wider text-secondary">Menu kantin</p><h2 className="mt-1 font-headline-md text-headline-md font-bold text-primary">{selectedStand.name}</h2></div><span className="rounded-full bg-secondary-container px-3 py-1 font-label-sm text-label-sm font-bold text-on-secondary-container">{selectedStand.menu.length} pilihan</span></div>
          {(["food", "drink"] as const).map((category) => <div key={category} className="mb-8"><h3 className="mb-3 font-title-md text-title-md font-bold text-primary">{category === "food" ? "Makanan" : "Minuman"}</h3><div className="grid gap-3 sm:grid-cols-2">{selectedStand.menu.filter((item) => item.category === category).map((item) => <article key={item.id} className="group flex min-h-28 items-center gap-4 rounded-2xl border border-surface-container bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-secondary/50 hover:shadow-md motion-reduce:transform-none motion-reduce:transition-none"><div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-secondary-container text-primary transition-transform duration-300 group-hover:rotate-3 group-hover:scale-105 motion-reduce:transition-none"><span className="material-symbols-outlined text-[28px]">{category === "food" ? "lunch_dining" : "local_cafe"}</span></div><div className="min-w-0 flex-1"><h4 className="truncate font-label-md text-label-md font-bold text-primary">{item.name}</h4><p className="mt-0.5 line-clamp-1 font-body-sm text-body-sm text-on-surface-variant">{item.description || (category === "food" ? "Makanan siap dinikmati." : "Minuman segar.")}</p><p className="mt-1 font-label-md text-label-md font-bold text-secondary">{money(item.price)}</p></div><button type="button" onClick={() => updateQuantity(item, 1)} aria-label={`Tambah ${item.name} ke keranjang`} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-surface transition duration-200 hover:scale-110 hover:bg-primary-container active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary motion-reduce:transform-none motion-reduce:transition-none"><Plus className="h-5 w-5" /></button></article>)}</div></div>)}
          <div className="flex items-start gap-2 rounded-2xl border border-surface-container bg-white p-4 text-on-surface-variant"><Clock3 className="mt-0.5 h-4 w-4 shrink-0" /><p className="font-body-sm text-body-sm">Menu dan harga contoh dapat disesuaikan oleh admin sebelum digunakan.</p></div>
        </section>}
      </main>
      <aside className="hidden lg:block">{cartPanel}</aside>
    </div>

    {quantity > 0 && <button type="button" onClick={() => setMobileCartOpen(true)} className="fixed inset-x-4 bottom-4 z-30 flex min-h-14 items-center justify-between rounded-2xl bg-primary px-5 text-surface shadow-xl lg:hidden"><span className="flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15"><ShoppingBag className="h-4 w-4" /></span><span className="text-left"><span className="block font-label-md text-label-md font-bold">Keranjang · {quantity} item</span><span className="block font-body-sm text-body-sm text-primary-fixed">{money(subtotal)}</span></span></span><ArrowRight className="h-5 w-5" /></button>}

    {mobileCartOpen && <div className="fixed inset-0 z-[70] flex items-end bg-primary/45 p-3 lg:hidden" onClick={() => setMobileCartOpen(false)}><div className="max-h-[85vh] w-full overflow-y-auto rounded-3xl bg-surface p-3" onClick={(event) => event.stopPropagation()}><div className="mb-2 flex justify-end"><button type="button" aria-label="Tutup keranjang" onClick={() => setMobileCartOpen(false)} className="rounded-full p-2 text-primary"><X className="h-5 w-5" /></button></div>{cartPanel}</div></div>}

    {checkoutOpen && <div className="fixed inset-0 z-[80] flex items-end justify-center bg-primary/55 p-0 sm:items-center sm:p-4" onClick={() => !submitting && setCheckoutOpen(false)}><section role="dialog" aria-modal="true" aria-labelledby="checkout-title" className="max-h-[94vh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-surface p-5 shadow-2xl sm:rounded-3xl sm:p-7" onClick={(event) => event.stopPropagation()}><div className="mb-5 flex items-start justify-between"><div><p className="font-label-sm text-label-sm font-bold uppercase tracking-wider text-secondary">Selesaikan pesanan</p><h2 id="checkout-title" className="mt-1 font-headline-sm text-headline-sm font-bold text-primary">Data pembeli & pengiriman</h2></div><button type="button" disabled={submitting} onClick={() => setCheckoutOpen(false)} aria-label="Tutup checkout" className="rounded-full p-2 text-primary hover:bg-surface-container"><X className="h-5 w-5" /></button></div><form onSubmit={checkout} className="space-y-4"><label className="block"><span className="mb-1.5 block font-label-sm text-label-sm font-bold text-on-surface">Nama lengkap</span><input required maxLength={120} autoComplete="name" value={buyerName} onChange={(event) => setBuyerName(event.target.value)} className="min-h-12 w-full rounded-xl border border-surface-container-high bg-white px-4 font-body-md outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" placeholder="Nama siswa atau guru" /></label><label className="block"><span className="mb-1.5 block font-label-sm text-label-sm font-bold text-on-surface">Kelas</span><input required maxLength={60} value={buyerClass} onChange={(event) => setBuyerClass(event.target.value)} className="min-h-12 w-full rounded-xl border border-surface-container-high bg-white px-4 font-body-md outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" placeholder="Contoh: XI RPL 1 / Guru" /></label><fieldset><legend className="mb-2 font-label-sm text-label-sm font-bold text-on-surface">Cara menerima pesanan</legend><div className="grid grid-cols-2 gap-2"><label className={`cursor-pointer rounded-xl border p-3 ${fulfillment === "pickup" ? "border-primary bg-secondary-container" : "border-surface-container bg-white"}`}><input type="radio" name="fulfillment" value="pickup" checked={fulfillment === "pickup"} onChange={() => setFulfillment("pickup")} className="sr-only" /><span className="block font-label-md text-label-md font-bold text-primary">Ambil sendiri</span><span className="mt-1 block font-body-sm text-body-sm text-on-surface-variant">Tanpa biaya antar</span></label><label className={`cursor-pointer rounded-xl border p-3 ${fulfillment === "delivery" ? "border-primary bg-secondary-container" : "border-surface-container bg-white"}`}><input type="radio" name="fulfillment" value="delivery" checked={fulfillment === "delivery"} onChange={() => setFulfillment("delivery")} className="sr-only" /><span className="block font-label-md text-label-md font-bold text-primary">Diantar</span><span className="mt-1 block font-body-sm text-body-sm text-on-surface-variant">Tambah {money(DELIVERY_FEE)}</span></label></div></fieldset><div className="rounded-2xl bg-surface-container-low p-4"><div className="flex justify-between font-body-sm text-body-sm text-on-surface-variant"><span>{quantity} item · subtotal</span><span>{money(subtotal)}</span></div><div className="mt-2 flex justify-between font-body-sm text-body-sm text-on-surface-variant"><span>Biaya antar</span><span>{deliveryFee ? money(deliveryFee) : "—"}</span></div><div className="mt-3 flex justify-between border-t border-surface-container pt-3 font-title-md text-title-md font-bold text-primary"><span>Total dibayar</span><span>{money(total)}</span></div></div><p className="text-center font-body-sm text-body-sm text-on-surface-variant">Pembayaran aman melalui GoPay atau QRIS. Pesanan diteruskan setelah pembayaran dikonfirmasi.</p>{checkoutError && <p role="alert" className="rounded-xl bg-error-container p-3 font-body-sm text-body-sm text-error">{checkoutError}</p>}<button type="submit" disabled={submitting || rows.length === 0} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 font-label-md text-label-md font-bold text-surface hover:bg-primary-container disabled:opacity-60">{submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Menyiapkan pembayaran…</> : <>Bayar {money(total)} <ArrowRight className="h-4 w-4" /></>}</button></form></section></div>}
  </div>;
}
