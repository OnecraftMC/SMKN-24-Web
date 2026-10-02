import { proxyPublicGet } from "@/lib/api";
import { corsHeaders, withCors } from "../_lib/cors";

// Agenda publik dari backend PHP. `?beranda=1` = hanya yang tampil di beranda.
export function OPTIONS() {
	return new Response(null, { status: 204, headers: corsHeaders });
}

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const params: Record<string, string> = {};
	if (searchParams.get("beranda") === "1") params.beranda = "1";

	return withCors(await proxyPublicGet("agenda", params));
}