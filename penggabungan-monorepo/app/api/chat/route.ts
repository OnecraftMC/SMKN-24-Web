import { proxyPublicPost } from "@/lib/api";
import { corsHeaders, withCors } from "../_lib/cors";

export function OPTIONS() {
	return new Response(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: Request) {
	let payload: unknown;
	try {
		payload = await request.json();
	} catch {
		return withCors(Response.json({ error: "Format JSON tidak valid." }, { status: 400 }));
	}

	return withCors(await proxyPublicPost("chat", payload));
}
