import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import type { VercelRequest, VercelResponse } from "@vercel/node";

const ALLOWED_ORIGINS = [
  "https://zachshaver.com",
  "http://localhost:5173",
  "http://localhost:4173",
];

function setCorsHeaders(request: VercelRequest, response: VercelResponse) {
  const origin = request.headers.origin ?? "";
  if (ALLOWED_ORIGINS.includes(origin)) {
    response.setHeader("Access-Control-Allow-Origin", origin);
  }
  response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export default function handler(request: VercelRequest, response: VercelResponse) {
  setCorsHeaders(request, response);

  if (request.method === "OPTIONS") {
    response.status(204).end();
    return;
  }

  response.status(200).json({ status: "ok" });
}
