import type { VercelRequest, VercelResponse } from "@vercel/node";

export const ALLOWED_ORIGINS = [
  "https://zachshaver.com",
  "https://www.zachshaver.com",
  "http://localhost:5173",
];

export function setCorsHeaders(
  request: VercelRequest,
  response: VercelResponse,
) {
  const origin = request.headers.origin ?? "";
  if (ALLOWED_ORIGINS.includes(origin)) {
    response.setHeader("Access-Control-Allow-Origin", origin);
  }
  response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
}
