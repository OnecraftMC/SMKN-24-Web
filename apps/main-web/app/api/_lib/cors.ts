export const corsHeaders = {
  "Access-Control-Allow-Origin": process.env.ADMIN_ORIGIN || "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};