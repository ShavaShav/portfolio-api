import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { setCorsHeaders } from "../lib/cors.js";

export default function handler(request: VercelRequest, response: VercelResponse) {
  setCorsHeaders(request, response);

  if (request.method === "OPTIONS") {
    response.status(204).end();
    return;
  }

  response.status(200).json({ status: "ok" });
}
