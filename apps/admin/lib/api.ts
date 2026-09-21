/**
 * Klien API terpusat dashboard admin.
 *
 * Semua request ke backend PHP lewat sini — jangan menulis `fetch` mentah di
 * komponen. Tanggung jawab file ini:
 *  - menyusun URL dari NEXT_PUBLIC_API_URL,
 *  - menyisipkan header Authorization: Bearer <token> secara otomatis,
 *  - menerjemahkan respons error backend `{ "error": "..." }` menjadi ApiError,
 *  - membedakan kegagalan jaringan (status 0) dari kegagalan HTTP.
 */

export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost/backend"
).replace(/\/+$/, "");

export const TOKEN_STORAGE_KEY = "smkn24-admin-token";

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/** Status 0 berarti request tidak pernah sampai ke server (jaringan/CORS/URL salah). */
export function isNetworkError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 0;
}

export function isUnauthorized(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401;
}

/** Aman dipanggil di server: mengembalikan null bila tidak ada `window`. */
export function getStoredToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function storeToken(token: string): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearStoredToken(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
}

export type ApiRequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  /** Objek akan di-JSON.stringify; abaikan untuk request tanpa body. */
  body?: unknown;
  /** Bila diisi, token ini dipakai. Bila di-omit, token dari localStorage dipakai. */
  token?: string | null;
  signal?: AbortSignal;
};

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { method = "GET", body, signal } = options;
  const token = options.token === undefined ? getStoredToken() : options.token;

  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
      cache: "no-store",
    });
  } catch {
    throw new ApiError(
      `Tidak dapat menghubungi server di ${API_BASE_URL}. Periksa koneksi, URL backend, dan CORS.`,
      0,
    );
  }

  const rawBody = await response.text();
  let parsed: unknown = null;
  if (rawBody) {
    try {
      parsed = JSON.parse(rawBody);
    } catch {
      // Backend mengirim HTML (mis. PHP fatal error) — ditangani di bawah.
      parsed = null;
    }
  }

  if (!response.ok) {
    throw new ApiError(readErrorMessage(parsed, response.status), response.status);
  }

  if (parsed === null) {
    throw new ApiError(
      "Respons server tidak berformat JSON. Periksa log backend.",
      response.status,
    );
  }

  return parsed as T;
}

function readErrorMessage(parsed: unknown, status: number): string {
  if (
    typeof parsed === "object" &&
    parsed !== null &&
    "error" in parsed &&
    typeof (parsed as { error: unknown }).error === "string"
  ) {
    return (parsed as { error: string }).error;
  }

  if (status === 401) {
    return "Sesi tidak valid atau sudah kedaluwarsa. Silakan login kembali.";
  }

  return `Permintaan gagal (HTTP ${status}).`;
}
