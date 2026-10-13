import { proxyPublicGet } from "@/lib/api";
import { corsHeaders, withCors } from "../_lib/cors";

// Jadwal pembelajaran publik dari backend PHP (matriks per jurusan).
export function OPTIONS() {
	return new Response(null, { status: 204, headers: corsHeaders });
}

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const params: Record<string, string> = {};
	const classId = searchParams.get("kelas_id");
	if (classId) params.kelas_id = classId;

	return withCors(await proxyPublicGet("jadwal", params));
}