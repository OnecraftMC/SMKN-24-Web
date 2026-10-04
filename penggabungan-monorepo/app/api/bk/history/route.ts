import { backendBaseUrl } from "@/lib/api";
import { corsHeaders, withCors } from "../../_lib/cors";

export function OPTIONS() {
	return new Response(null, { status: 204, headers: corsHeaders });
}

/**
 * Riwayat chat Bimbingan Konseling milik satu perangkat siswa.
 *
 * `deviceId` dikirim browser dari localStorage — bukan IP. Endpoint backend
 * memvalidasi formatnya (UUID v4) dan hanya mengembalikan baris milik devices
 * tersebut, sehingga tidak bisa dipakai membaca history siswa lain.
 */
export async function GET(request: Request) {
	const requestUrl = new URL(request.url);
	const deviceId = requestUrl.searchParams.get("deviceId") ?? "";

	if (!/^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[\da-f]{4}-[\da-f]{12}$/i.test(deviceId)) {
		return withCors(
			Response.json({ error: "deviceId tidak valid." }, { status: 400 }),
		);
	}

	const { url: baseUrl, error: configError } = backendBaseUrl();
	if (configError) {
		return withCors(Response.json({ error: configError }, { status: 503 }));
	}
	if (!baseUrl) {
		return withCors(
			Response.json(
				{ error: "Backend belum dikonfigurasi. Atur BACKEND_URL." },
				{ status: 503 },
			),
		);
	}

	try {
		const upstream = await fetch(
			`${baseUrl}/api/bk/history/index.php?deviceId=${encodeURIComponent(deviceId)}`,
			{
				method: "GET",
				headers: { Accept: "application/json" },
				cache: "no-store",
				signal: AbortSignal.timeout(10000),
			},
		);

		const body = await upstream.text();
		return withCors(
			new Response(body, {
				status: upstream.status,
				headers: { "Content-Type": "application/json; charset=utf-8" },
			}),
		);
	} catch {
		return withCors(
			Response.json(
				{ error: "Tidak dapat menghubungi server." },
				{ status: 503 },
			),
		);
	}
}
