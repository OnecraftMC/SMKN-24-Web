export const corsHeaders: Record<string, string> = {
  // Aplikasi gabungan melayani publik, login, dan dashboard dari ORIGIN YANG SAMA,
  // jadi CORS lintas-origin tidak lagi diperlukan untuk pemakaian normal.
  // Header hanya dikirim bila ADMIN_ORIGIN memang diisi (mis. admin dipisah lagi).
  // Sebelumnya nilai default-nya "*" — wildcard itu sengaja dihapus.
  ...(process.env.ADMIN_ORIGIN
    ? {
        "Access-Control-Allow-Origin": process.env.ADMIN_ORIGIN,
        Vary: "Origin",
      }
    : {}),
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

/**
 * Pasang header CORS ke response apa pun (hasil proxy maupun error buatan route)
 * supaya preflight dan pembacaan response lintas-origin tetap benar bila
 * ADMIN_ORIGIN diisi. Tanpa ADMIN_ORIGIN fungsi ini tidak menambahkan apa pun.
 */
export function withCors(response: Response): Response {
  for (const [key, value] of Object.entries(corsHeaders)) {
    response.headers.set(key, value);
  }
  return response;
}