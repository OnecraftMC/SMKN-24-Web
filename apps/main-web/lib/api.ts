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
  type JurusanKey,
  type PengumumanDTO,
  type PengumumanView,
} from "../../../packages/shared/mappers";

export interface ApiResult<T> {
  data: T | null;
  error: string | null;
}

const TIMEOUT_MS = 5000;

function backendBaseUrl(): string | null {
  const value = process.env.BACKEND_URL?.trim();
  if (!value) return null;
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? value.replace(/\/+$/, "") : null;
  } catch {
    return null;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  const baseUrl = backendBaseUrl();
  if (!baseUrl) {
    return { data: null, error: "Backend belum dikonfigurasi. Atur BACKEND_URL." };
  }

  try {
    const response = await fetch(`${baseUrl}/${path.replace(/^\/+/, "")}`, {
      ...init,
      headers: { Accept: "application/json", ...init?.headers },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      next: init?.method ? undefined : { revalidate: 60 },
    });
    const body: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      const message =
        typeof body === "object" && body !== null && "error" in body && typeof body.error === "string"
          ? body.error
          : `Backend merespons HTTP ${response.status}.`;
      return { data: null, error: message };
    }
    return { data: body as T, error: null };
  } catch (error) {
    const message = error instanceof Error && error.name === "TimeoutError"
      ? "Backend tidak merespons dalam 5 detik."
      : "Tidak dapat menghubungi backend. Periksa koneksi dan konfigurasi.";
    return { data: null, error: message };
  }
}

function backendUrl(): string {
  return backendBaseUrl() ?? "http://invalid.local";
}

export async function getBerita(options: { utama?: boolean; limit?: number } = {}): Promise<ApiResult<BeritaView[]>> {
  const query = options.utama ? "?utama=1" : "";
  const result = await request<BeritaDTO[]>(`api/berita/index.php${query}`);
  if (!result.data) return result;
  const data = result.data.map((item) => mapBerita(item, backendUrl()));
  return { data: options.limit ? data.slice(0, options.limit) : data, error: null };
}

export async function getBeritaById(id: number): Promise<ApiResult<BeritaView>> {
  const result = await request<BeritaDTO>(`api/berita/index.php?id=${id}`);
  return result.data
    ? { data: mapBerita(result.data, backendUrl()), error: null }
    : result;
}

export async function getPengumuman(options: { beranda?: boolean } = {}): Promise<ApiResult<PengumumanView[]>> {
  const result = await request<PengumumanDTO[]>(
    `api/pengumuman/index.php${options.beranda ? "?beranda=1" : ""}`,
  );
  return result.data
    ? { data: result.data.map((item) => mapPengumuman(item, backendUrl())), error: null }
    : result;
}

export async function getAgenda(): Promise<ApiResult<AgendaView[]>> {
  const result = await request<AgendaDTO[]>("api/agenda/index.php?beranda=1");
  return result.data ? { data: result.data.map(mapAgenda), error: null } : result;
}

export async function getGuru(): Promise<ApiResult<GuruView[]>> {
  const result = await request<GuruDTO[]>("api/guru/index.php");
  return result.data
    ? { data: result.data.map((item) => mapGuru(item, backendUrl())), error: null }
    : result;
}

export async function getFasilitas(): Promise<ApiResult<FasilitasView[]>> {
  const result = await request<FasilitasDTO[]>("api/fasilitas/index.php");
  return result.data
    ? { data: result.data.map((item) => mapFasilitas(item, backendUrl())), error: null }
    : result;
}

export async function getGaleri(): Promise<ApiResult<GaleriView[]>> {
  const result = await request<GaleriDTO[]>("api/galeri/index.php");
  return result.data
    ? { data: result.data.map((item) => mapGaleri(item, backendUrl())), error: null }
    : result;
}

export async function getJadwal(
  jurusan?: JurusanKey,
): Promise<ApiResult<JadwalDTO | Record<JurusanKey, JadwalDTO>>> {
  const query = jurusan ? `?jurusan=${encodeURIComponent(jurusan)}` : "";
  return request(`api/jadwal/index.php${query}`);
}

export async function postBK(payload: {
  nama: string;
  kelas: string;
  noHp: string;
  keperluan: string;
  pesan: string;
}): Promise<ApiResult<{ message: string }>> {
  return request("api/bk/index.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function postChat(payload: {
  sessionId: string;
  message: string;
}): Promise<ApiResult<{ sessionId: string; reply: string }>> {
  return request("api/chat/index.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function proxyPublicPost(
  endpoint: "bk" | "chat",
  payload: unknown,
): Promise<Response> {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return Response.json({ error: "Format permintaan tidak valid." }, { status: 400 });
  }

  const body = payload as Record<string, unknown>;
  if (endpoint === "bk") {
    const fields = ["nama", "kelas", "keperluan", "pesan"] as const;
    if (fields.some((field) => typeof body[field] !== "string" || !body[field].trim())) {
      return Response.json({ error: "Lengkapi nama, kelas, topik, dan pesan." }, { status: 400 });
    }
    if (["nama", "kelas", "noHp", "keperluan", "pesan"].some(
      (field) => body[field] !== undefined && (typeof body[field] !== "string" || body[field].length > 2000),
    )) {
      return Response.json({ error: "Data formulir melebihi batas yang diizinkan." }, { status: 400 });
    }
  } else if (
    typeof body.message !== "string" ||
    !body.message.trim() ||
    body.message.length > 2000 ||
    (body.sessionId !== undefined &&
      (typeof body.sessionId !== "string" || body.sessionId.length > 64))
  ) {
    return Response.json({ error: "Pesan chatbot tidak valid atau terlalu panjang." }, { status: 400 });
  }

  const result = await request<unknown>(`api/${endpoint}/index.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (result.error) {
    const status = result.error.includes("belum dikonfigurasi") ? 503 : 502;
    return Response.json({ error: result.error }, { status });
  }
  return Response.json(result.data, { status: 200 });
}
