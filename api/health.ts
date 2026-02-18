import type { VercelRequest, VercelResponse } from "@vercel/node";

function setCorsHeaders(response: VercelResponse) {
  response.setHeader("Access-Control-Allow-Origin", "https://zachshaver.com");
  response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export default function handler(request: VercelRequest, response: VercelResponse) {
  setCorsHeaders(response);

  if (request.method === "OPTIONS") {
    response.status(204).end();
    return;
  }

  response.status(200).json({ status: "ok" });
}
