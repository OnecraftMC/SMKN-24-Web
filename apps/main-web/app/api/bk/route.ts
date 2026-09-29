import { proxyPublicPost } from "@/lib/api";

export async function POST(request: Request) {
	let payload: unknown;
	try {
		payload = await request.json();
	} catch {
		return Response.json({ error: "Format JSON tidak valid." }, { status: 400 });
	}

	return proxyPublicPost("bk", payload);
}
