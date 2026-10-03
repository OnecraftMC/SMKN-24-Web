import "server-only";
import {
  mapAgenda,
  mapBerita,
  mapFasilitas,
  mapGaleri,
  mapGuru,
  mapPengumuman,
  type AgendaDTO,
  type AgendaView,
  type BeritaDTO,
  type BeritaView,
  type FasilitasDTO,
  type FasilitasView,
  type GaleriDTO,
  type GaleriView,
  type GuruDTO,
  type GuruView,
  type JadwalDTO,
  type PengumumanDTO,
  type PengumumanView,
} from "@/lib/shared/mappers";
// JurusanKey tinggal di shared/types.ts (enum jadwal di backend), bukan di mappers.
import type { JurusanKey } from "@/lib/shared/types";

export interface ApiResult<T> {
  data: T | null;
  error: string | null;
  status?: number | null;
}

const TIMEOUT_MS = 5000;

// Port yang menandakan BACKEND_URL diisi dengan host database, bukan URL HTTP
// backend — kesalahan konfigurasi nyata yang pernah terjadi (lihat
// `perbaikan error dan bug.md` E.1: NEXT_PUBLIC_API_URL = host:3306).
const PORT_DATABASE = new Set([3306, 5432]);

function backendBaseUrl(): { url: string | null; error: string | null } {
  const value = process.env.BACKEND_URL?.trim();
  if (!value) return { url: null, error: null };
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return {
      url: null,
      error: "BACKEND_URL bukan URL yang valid. Contoh nilai: http://localhost:8000",
    };
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { url: null, error: "BACKEND_URL harus diawali http:// atau https://." };
  }
  if (url.port && PORT_DATABASE.has(Number(url.port))) {
    return {
      url: null,
      error: `BACKEND_URL memakai port ${url.port} — itu port database, bukan URL backend. Isi origin HTTP backend (mis. http://localhost/backend).`,
    };
  }
  return { url: value.replace(/\/+$/, ""), error: null };
}

async function request<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  const { url: baseUrl, error: configError } = backendBaseUrl();
  if (configError) {
    return { data: null, error: configError, status: null };
  }
  if (!baseUrl) {
    return { data: null, error: "Backend belum dikonfigurasi. Atur BACKEND_URL.", status: null };
  }

  try {
    const response = await fetch(`${baseUrl}/${path.replace(/^\/+/, "")}`, {
      ...init,
      headers: { Accept: "application/json", ...init?.headers },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      next: init?.method ? undefined : { revalidate: 60 },
    });
    let body: unknown = null;
    try {
      body = await response.json();
    } catch {
      if (response.ok) {
        return {
          data: null,
          error: "Backend mengirim respons JSON yang tidak valid.",
          status: response.status,
        };
      }
    }
    if (!response.ok) {
      const message =
        typeof body === "object" && body !== null && "error" in body && typeof body.error === "string"
          ? body.error
          : `Backend merespons HTTP ${response.status}.`;
      return { data: null, error: message, status: response.status };
    }
    return { data: body as T, error: null, status: response.status };
  } catch (error) {
    const message = error instanceof Error && error.name === "TimeoutError"
      ? "Backend tidak merespons dalam 5 detik."
      : "Tidak dapat menghubungi backend. Periksa koneksi dan konfigurasi.";
    return { data: null, error: message, status: null };
  }
}

function backendUrl(): string {
  const { url, error } = backendBaseUrl();
  if (error) throw new Error(error);
  if (!url) throw new Error("BACKEND_URL tidak tersedia untuk memetakan aset backend.");
  return url;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function getBerita(options: { utama?: boolean; limit?: number } = {}): Promise<ApiResult<BeritaView[]>> {
  const query = options.utama ? "?utama=1" : "";
  const result = await request<BeritaDTO[]>(`api/berita/index.php${query}`);
  if (!result.data) return { data: null, error: result.error };
  const data = result.data.map((item) => mapBerita(item, backendUrl()));
  return { data: options.limit ? data.slice(0, options.limit) : data, error: null };
}

export async function getBeritaById(id: number): Promise<ApiResult<BeritaView>> {
  const result = await request<BeritaDTO>(`api/berita/index.php?id=${id}`);
  return result.data
    ? { data: mapBerita(result.data, backendUrl()), error: null, status: result.status }
    : { data: null, error: result.error, status: result.status };
}

export async function getPengumuman(options: { beranda?: boolean } = {}): Promise<ApiResult<PengumumanView[]>> {
  const result = await request<PengumumanDTO[]>(
    `api/pengumuman/index.php${options.beranda ? "?beranda=1" : ""}`,
  );
  return result.data
    ? { data: result.data.map((item) => mapPengumuman(item, backendUrl())), error: null }
    : { data: null, error: result.error };
}

export async function getAgenda(): Promise<ApiResult<AgendaView[]>> {
  const result = await request<AgendaDTO[]>("api/agenda/index.php?beranda=1");
  return result.data
    ? { data: result.data.map(mapAgenda), error: null }
    : { data: null, error: result.error };
}

export async function getGuru(): Promise<ApiResult<GuruView[]>> {
  const result = await request<GuruDTO[]>("api/guru/index.php");
  return result.data
    ? { data: result.data.map((item) => mapGuru(item, backendUrl())), error: null }
    : { data: null, error: result.error };
}

export async function getFasilitas(): Promise<ApiResult<FasilitasView[]>> {
  const result = await request<FasilitasDTO[]>("api/fasilitas/index.php");
  return result.data
    ? { data: result.data.map((item) => mapFasilitas(item, backendUrl())), error: null }
    : { data: null, error: result.error };
}

export async function getGaleri(): Promise<ApiResult<GaleriView[]>> {
  const result = await request<GaleriDTO[]>("api/galeri/index.php");
  return result.data
    ? { data: result.data.map((item) => mapGaleri(item, backendUrl())), error: null }
    : { data: null, error: result.error };
}

/**
 * Matriks jadwal publik.
 *
 * Bentuk respons backend BERBEDA tergantung filter, jadi tipenya ikut berbeda:
 *  - tanpa filter → `{ perhotelan: {pagi,siang}, boga: …, … }` (Record 5 jurusan)
 *  - `?jurusan=X` → `{ pagi: string[]; siang: string[] }` (objek tunggal, bukan Record)
 *
 * Overload di bawah memberi tipe yang benar ke pemanggil tanpa cast manual.
 */
export async function getJadwal(): Promise<ApiResult<Record<JurusanKey, JadwalDTO>>>;
export async function getJadwal(jurusan: JurusanKey): Promise<ApiResult<JadwalDTO>>;
export async function getJadwal(
  jurusan?: JurusanKey,
): Promise<ApiResult<Record<JurusanKey, JadwalDTO> | JadwalDTO>> {
  const query = jurusan ? `?jurusan=${encodeURIComponent(jurusan)}` : "";
  return request(`api/jadwal/index.php${query}`);
}

/**
 * POST publik (BK & chatbot) TIDAK lewat helper di file ini.
 *
 * FormBK.tsx dan ChatbotWidget.tsx memanggil route Next.js (`/api/bk`,
 * `/api/chat`) langsung dari browser; route tersebut memakai
 * `proxyPublicPost()` di bawah untuk meneruskan ke PHP. Jadi tidak ada helper
 * `postBK`/`postChat` yang mengarahkan browser langsung ke backend — jangan
 * ditambahkannya kembali, karena itu melewati normalisasi & validasi proxy.
 */

export async function proxyPublicPost(
  endpoint: "bk" | "chat",
  payload: unknown,
): Promise<Response> {
  if (!isRecord(payload)) {
    return Response.json({ error: "Format permintaan tidak valid." }, { status: 400 });
  }

  const body = payload;
  let requestBody: Record<string, string>;
  if (endpoint === "bk") {
    const { nama, kelas, noHp, keperluan, pesan } = body;
    if (
      typeof nama !== "string" || !nama.trim() ||
      typeof kelas !== "string" || !kelas.trim() ||
      typeof keperluan !== "string" || !keperluan.trim() ||
      typeof pesan !== "string" || !pesan.trim()
    ) {
      return Response.json({ error: "Lengkapi nama, kelas, topik, dan pesan." }, { status: 400 });
    }
    if (
      nama.length > 2000 ||
      kelas.length > 2000 ||
      keperluan.length > 2000 ||
      pesan.length > 2000 ||
      (noHp !== undefined && (typeof noHp !== "string" || noHp.length > 40))
    ) {
      return Response.json({ error: "Data formulir melebihi batas yang diizinkan." }, { status: 400 });
    }
    requestBody = {
      nama: nama.trim(),
      kelas: kelas.trim(),
      keperluan: keperluan.trim(),
      pesan: pesan.trim(),
      ...(typeof noHp === "string" ? { noHp: noHp.trim() } : {}),
    };
  } else {
    const { message, sessionId } = body;
    if (
      typeof message !== "string" ||
      !message.trim() ||
      message.length > 2000 ||
      (sessionId !== undefined && (typeof sessionId !== "string" || sessionId.length > 64))
    ) {
      return Response.json({ error: "Pesan chatbot tidak valid atau terlalu panjang." }, { status: 400 });
    }
    requestBody = {
      message: message.trim(),
      ...(typeof sessionId === "string" ? { sessionId } : {}),
    };
  }

  const { url: baseUrl, error: configError } = backendBaseUrl();
  if (configError) {
    return Response.json({ error: configError }, { status: 503 });
  }
  if (!baseUrl) {
    return Response.json({ error: "Backend belum dikonfigurasi. Atur BACKEND_URL." }, { status: 503 });
  }

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/api/${endpoint}/index.php`, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      return Response.json({ error: "Backend tidak merespons dalam 5 detik." }, { status: 504 });
    }
    return Response.json(
      { error: "Tidak dapat menghubungi backend. Periksa koneksi dan konfigurasi." },
      { status: 502 },
    );
  }

  return new Response(response.body, {
    status: response.status,
    headers: {
      "Content-Type": response.headers.get("Content-Type") ?? "application/json",
    },
  });
}
/**
 * Proxy GET same-origin ke backend PHP untuk route baca publik
 * (`/api/berita`, `/api/pengumuman`, `/api/agenda`, `/api/jadwal`).
 *
 * Sebelumnya keempat route ini menyajikan data contoh dari `lib/data.ts` seolah
 * data server. Sekarang route-nya meneruskan permintaan ke backend PHP nyata dan
 * mempertahankan status HTTP + body apa adanya.
 *
 * `params` hanya berisi kunci yang sengaja diizinkan pemanggil — tidak ada
 * passthrough query mentah, supaya parameter sensitif (mis. `?id=` berita draft)
 * tidak ikut terekspos lewat proxy publik.
 */
export async function proxyPublicGet(
  endpoint: "berita" | "pengumuman" | "agenda" | "jadwal",
  params: Record<string, string> = {},
): Promise<Response> {
  const { url: baseUrl, error: configError } = backendBaseUrl();
  if (configError) {
    return Response.json({ error: configError }, { status: 503 });
  }
  if (!baseUrl) {
    return Response.json({ error: "Backend belum dikonfigurasi. Atur BACKEND_URL." }, { status: 503 });
  }

  const query = new URLSearchParams(params).toString();
  const suffix = query ? `?${query}` : "";

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/api/${endpoint}/index.php${suffix}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      next: { revalidate: 60 },
    });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      return Response.json({ error: "Backend tidak merespons dalam 5 detik." }, { status: 504 });
    }
    return Response.json(
      { error: "Tidak dapat menghubungi backend. Periksa koneksi dan konfigurasi." },
      { status: 502 },
    );
  }

  return new Response(response.body, {
    status: response.status,
    headers: {
      "Content-Type": response.headers.get("Content-Type") ?? "application/json",
    },
  });
}
