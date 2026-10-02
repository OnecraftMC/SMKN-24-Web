import { proxyPublicGet } from "@/lib/api";
import { corsHeaders, withCors } from "../_lib/cors";

// Jadwal pembelajaran publik dari backend PHP (matriks per jurusan).
export function OPTIONS() {
	return new Response(null, { status: 204, headers: corsHeaders });
}

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const params: Record<string, string> = {};
	const jurusan = searchParams.get("jurusan");
	if (jurusan) params.jurusan = jurusan;

	return withCors(await proxyPublicGet("jadwal", params));
}