import { proxyPublicGraduationCheck } from "@/lib/api";
import { corsHeaders, withCors } from "../_lib/cors";

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return withCors(Response.json({ error: "Body JSON tidak valid." }, { status: 400 }));
  }
  const nisn = typeof body === "object" && body !== null && "nisn" in body
    && typeof body.nisn === "string" ? body.nisn : "";
  if (!/^\d{10}$/.test(nisn)) {
    return withCors(Response.json({ error: "NISN harus terdiri dari 10 digit." }, { status: 400 }));
  }
  return withCors(await proxyPublicGraduationCheck(nisn));
}
