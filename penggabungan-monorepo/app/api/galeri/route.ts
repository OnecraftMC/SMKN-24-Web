import { proxyPublicGet } from "@/lib/api";
import { corsHeaders, withCors } from "../_lib/cors";

export function OPTIONS() {
	return new Response(null, { status: 204, headers: corsHeaders });
}

export async function GET() {
	return withCors(await proxyPublicGet("galeri"));
}
