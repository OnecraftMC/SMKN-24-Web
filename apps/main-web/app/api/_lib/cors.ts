export const corsHeaders = {
  "Access-Control-Allow-Origin": process.env.ADMIN_ORIGIN || "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

/**
 * Pasang header CORS ke response apa pun (hasil proxy maupun error buatan
 * route) supaya preflight dan pembacaan response lintas-origin tidak rusak —
 * konsisten dengan route statis berita/agenda/pengumuman (issue 06).
 */
export function withCors(response: Response): Response {
  for (const [key, value] of Object.entries(corsHeaders)) {
    response.headers.set(key, value);
  }
  return response;
}