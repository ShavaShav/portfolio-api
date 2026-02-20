import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFile(fileName: string): boolean {
  const envPath = resolve(import.meta.dirname, fileName);
  if (!existsSync(envPath)) return false;

  const envFile = readFileSync(envPath, "utf-8");
  for (const line of envFile.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;

    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    if (key) process.env[key] = value;
  }

  return true;
}

const loadedDotEnv = loadEnvFile(".env");
const loadedDotEnvLocal = loadEnvFile(".env.local");

if (loadedDotEnv) console.log("[dev] Loaded .env");
if (loadedDotEnvLocal) console.log("[dev] Loaded .env.local");
if (!loadedDotEnv && !loadedDotEnvLocal) {
  console.warn("[dev] No .env or .env.local found; OPENAI_API_KEY must be set in environment");
}

const key = process.env.OPENAI_API_KEY;
if (key) {
  console.log(`[dev] OPENAI_API_KEY loaded (${key.slice(0, 7)}...${key.slice(-4)})`);
} else {
  console.warn("[dev] WARNING: OPENAI_API_KEY is not set in .env or .env.local");
}

// Import handlers
const { default: chatHandler } = await import("./api/chat.js");
const { default: healthHandler } = await import("./api/health.js");

type Handler = (req: IncomingMessage & { body?: unknown }, res: ServerResponse & { status: (code: number) => ServerResponse & { json: (data: unknown) => void; end: () => void }; json: (data: unknown) => void }) => void | Promise<void>;

function parseBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString();
      try {
        resolve(JSON.parse(raw));
      } catch {
        resolve({});
      }
    });
    req.on("error", () => resolve({}));
  });
}

function shimResponse(res: ServerResponse) {
  const shimmed = res as ServerResponse & {
    status: (code: number) => typeof shimmed;
    json: (data: unknown) => void;
  };

  shimmed.status = (code: number) => {
    res.statusCode = code;
    return shimmed;
  };

  shimmed.json = (data: unknown) => {
    if (!res.headersSent) {
      res.setHeader("Content-Type", "application/json");
    }
    res.end(JSON.stringify(data));
  };

  return shimmed;
}

const PORT = parseInt(process.env.PORT ?? "3000", 10);

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
  const pathname = url.pathname;

  // Parse body for POST requests
  if (req.method === "POST") {
    (req as IncomingMessage & { body: unknown }).body = await parseBody(req);
  }

  const shimmedRes = shimResponse(res);

  try {
    if (pathname === "/api/health") {
      await (healthHandler as Handler)(req as Parameters<Handler>[0], shimmedRes as Parameters<Handler>[1]);
    } else if (pathname === "/api/chat") {
      await (chatHandler as Handler)(req as Parameters<Handler>[0], shimmedRes as Parameters<Handler>[1]);
    } else {
      res.statusCode = 404;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Not found" }));
    }
  } catch (err) {
    console.error("[dev] Handler error:", err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Internal server error" }));
    }
  }
});

server.listen(PORT, () => {
  console.log(`[dev] API running on http://localhost:${PORT}`);
  console.log(`[dev] Health: http://localhost:${PORT}/api/health`);
  console.log(`[dev] Chat:   POST http://localhost:${PORT}/api/chat`);
});
