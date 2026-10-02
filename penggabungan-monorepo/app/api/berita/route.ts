import { proxyPublicGet } from "@/lib/api";
import { corsHeaders, withCors } from "../_lib/cors";

// Data berita publik dari backend PHP (sebelumnya data contoh dari lib/data.ts).
export function OPTIONS() {
	return new Response(null, { status: 204, headers: corsHeaders });
}

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const params: Record<string, string> = {};
	const kategori = searchParams.get("kategori");
	if (kategori) params.kategori = kategori;

	return withCors(await proxyPublicGet("berita", params));
}