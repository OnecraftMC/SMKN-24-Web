import { proxyPublicMultipartPost } from "@/lib/api";
import { corsHeaders, withCors } from "../_lib/cors";

export const runtime = "nodejs";

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 11 * 1024 * 1024) {
    return withCors(Response.json({ error: "Ukuran pengajuan maksimal 11 MB." }, { status: 413 }));
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return withCors(Response.json({ error: "Format pengajuan tidak valid." }, { status: 400 }));
  }

  return withCors(await proxyPublicMultipartPost("prestasi", formData));
}
