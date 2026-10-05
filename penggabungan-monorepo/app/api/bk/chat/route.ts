import { proxyPublicPost } from "@/lib/api";
import { corsHeaders, withCors } from "../../_lib/cors";

export function OPTIONS() {
	return new Response(null, { status: 204, headers: corsHeaders });
}

/**
 * Counsellor AI Bimbingan Konseling.
 *
 * Berbeda dari `/api/chat` (asisten info sekolah), route ini khusus triase:
 * backend merangkum cerita siswa dan menentukan tingkat kesusahannya.
 */
export async function POST(request: Request) {
	let payload: unknown;
	try {
		payload = await request.json();
	} catch {
		return withCors(Response.json({ error: "Format JSON tidak valid." }, { status: 400 }));
	}

	return withCors(await proxyPublicPost("bk/chat", payload));
}
