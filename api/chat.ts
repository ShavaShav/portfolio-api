import OpenAI from "openai";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { retrievePromptContext } from "../lib/rag.js";

type ChatBody = {
  message?: string;
  sessionId?: string;
  scenarioContext?: string;
};

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function setCorsHeaders(response: VercelResponse) {
  response.setHeader("Access-Control-Allow-Origin", "https://zachshaver.com");
  response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  setCorsHeaders(response);

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

  if (!process.env.OPENAI_API_KEY) {
    response.status(500).json({ error: "OPENAI_API_KEY is not configured" });
    return;
  }

  try {
    const systemPrompt = await retrievePromptContext(message, scenarioContext);

    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
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
