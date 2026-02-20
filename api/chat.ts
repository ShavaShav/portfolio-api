import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import OpenAI from "openai";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { retrievePromptContext } from "../lib/rag.js";

type ChatBody = {
  message?: string;
  sessionId?: string;
  scenarioContext?: string;
};

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

/**
 * Resolves the AI provider configuration from environment variables.
 *
 * To use OpenRouter (recommended free option):
 *   AI_BASE_URL=https://openrouter.ai/api/v1
 *   AI_API_KEY=<your openrouter key>
 *   AI_MODEL=google/gemma-3-27b-it:free   (or any free model on openrouter.ai/models?q=:free)
 *
 * To use HuggingFace inference:
 *   AI_BASE_URL=https://router.huggingface.co/v1
 *   AI_API_KEY=<your HF token>
 *   AI_MODEL=meta-llama/Llama-3.3-70B-Instruct
 *
 * To keep OpenAI (original):
 *   AI_API_KEY=<your openai key>   (or OPENAI_API_KEY)
 *   AI_MODEL=gpt-4o-mini           (or omit to use default)
 */
function getAIClient() {
  const baseURL = process.env.AI_BASE_URL; // undefined = OpenAI default
  const apiKey =
    process.env.AI_API_KEY ?? process.env.OPENAI_API_KEY ?? "";
  const model = process.env.AI_MODEL ?? "gpt-4o-mini";

  const client = new OpenAI({ apiKey, ...(baseURL ? { baseURL } : {}) });
  return { client, model };
}

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  setCorsHeaders(request, response);

  if (request.method === "OPTIONS") {
    response.status(204).end();
    return;
  }

  if (request.method !== "POST") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { message, sessionId, scenarioContext } = request.body as ChatBody;

  if (!message) {
    response.status(400).json({ error: "Missing message" });
    return;
  }

  const apiKey = process.env.AI_API_KEY ?? process.env.OPENAI_API_KEY;
  if (!apiKey) {
    response
      .status(500)
      .json({ error: "AI_API_KEY (or OPENAI_API_KEY) is not configured" });
    return;
  }

  const { client, model } = getAIClient();

  try {
    const systemPrompt = await retrievePromptContext(message, scenarioContext);

    const stream = await client.chat.completions.create({
      model,
      stream: true,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: `sessionId=${sessionId ?? "unknown"}\n${message}`,
        },
      ],
    });

    response.setHeader("Content-Type", "text/plain; charset=utf-8");
    response.setHeader("Cache-Control", "no-cache, no-transform");

    for await (const part of stream) {
      const token = part.choices[0]?.delta?.content;
      if (token) {
        response.write(token);
      }
    }

    response.end();
  } catch (error) {
    console.error("chat_error", error);
    response.status(500).json({ error: "Failed to generate response" });
  }
}
