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
} from "../../../packages/shared/mappers";
// JurusanKey tinggal di shared/types.ts (enum jadwal di backend), bukan di mappers.
import type { JurusanKey } from "../../../packages/shared/types";

export interface ApiResult<T> {
  data: T | null;
  error: string | null;
  status?: number | null;
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
  const value = backendBaseUrl();
  if (!value) throw new Error("BACKEND_URL tidak tersedia untuk memetakan aset backend.");
  return value;
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

export async function getJadwal(
  jurusan?: JurusanKey,
): Promise<ApiResult<Record<JurusanKey, JadwalDTO>>> {
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

  const baseUrl = backendBaseUrl();
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
