/**
 * Precomputes embeddings for all dataset documents and writes them to
 * dataset/embeddings.json. Run this whenever the dataset changes:
 *
 *   npm run precompute
 *
 * At runtime, the API loads this file instead of calling an embeddings API,
 * so no embeddings key is needed in production.
 *
 * Supports two embedding providers, selected automatically based on EMBEDDINGS_BASE_URL:
 *
 *   HuggingFace feature-extraction (free, recommended):
 *     EMBEDDINGS_BASE_URL=https://router.huggingface.co/hf-inference/models
 *     EMBEDDINGS_API_KEY=hf_...
 *     EMBEDDINGS_MODEL=BAAI/bge-small-en-v1.5
 *
 *   OpenAI-compatible (OpenAI, etc.):
 *     EMBEDDINGS_BASE_URL=https://api.openai.com/v1   <- or omit entirely
 *     EMBEDDINGS_API_KEY=sk-...
 *     EMBEDDINGS_MODEL=text-embedding-3-small
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { writeFile } from "node:fs/promises";
import path from "node:path";
import OpenAI from "openai";
import { loadAndChunkDocuments } from "../lib/documents.js";

const baseURL =
  process.env.EMBEDDINGS_BASE_URL ??
  "https://router.huggingface.co/hf-inference/models";
const apiKey = process.env.EMBEDDINGS_API_KEY ?? process.env.OPENAI_API_KEY;
const model = process.env.EMBEDDINGS_MODEL ?? "BAAI/bge-small-en-v1.5";
const outputPath = path.join(process.cwd(), "dataset", "embeddings.json");

if (!apiKey) {
  console.error(
    "Error: EMBEDDINGS_API_KEY (or OPENAI_API_KEY) must be set in .env.local",
  );
  process.exit(1);
}

console.log(`Loading dataset documents...`);
const chunks = await loadAndChunkDocuments();
console.log(`Loaded ${chunks.length} chunks.`);
console.log(`Embedding with model "${model}" via ${baseURL} ...`);

// HuggingFace's feature-extraction endpoint uses a completely different
// request/response shape from the OpenAI embeddings API.
// Base URL pattern: https://router.huggingface.co/hf-inference/models
const isHuggingFace = baseURL.includes("huggingface.co");

let embeddings: number[][];

if (isHuggingFace) {
  // HF feature-extraction: POST <baseURL>/<model>
  // Body:     { inputs: string[] }
  // Response: number[][]  (one embedding vector per input string)
  const url = `${baseURL}/${model}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      inputs: chunks.map((c) => c.content),
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`HuggingFace API error ${res.status}: ${text}`);
    process.exit(1);
  }

  embeddings = (await res.json()) as number[][];
} else {
  // OpenAI-compatible path (OpenAI, etc.)
  const client = new OpenAI({ baseURL, apiKey });
  const response = await client.embeddings.create({
    model,
    input: chunks.map((c) => c.content),
  });
  embeddings = response.data.map((d) => d.embedding);
}

if (embeddings.length !== chunks.length) {
  console.error(
    `Mismatch: got ${embeddings.length} embeddings for ${chunks.length} chunks`,
  );
  process.exit(1);
}

const embedded = chunks.map((chunk, index) => ({
  ...chunk,
  embedding: embeddings[index] ?? [],
}));

await writeFile(outputPath, JSON.stringify(embedded, null, 2), "utf8");
console.log(`Wrote ${embedded.length} embedded chunks to ${outputPath}`);
