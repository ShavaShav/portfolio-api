import { readFile } from "node:fs/promises";
import path from "node:path";
import type { DocumentChunk } from "./documents.js";

export type EmbeddedChunk = DocumentChunk & {
  embedding: number[];
};

const EMBEDDINGS_PATH = path.join(
  process.cwd(),
  "dataset",
  "embeddings.json",
);

let embeddedStore: EmbeddedChunk[] = [];
let initialized = false;

export function cosineSimilarity(left: number[], right: number[]) {
  let dotProduct = 0;
  let leftNorm = 0;
  let rightNorm = 0;

  for (let index = 0; index < left.length; index += 1) {
    const a = left[index] ?? 0;
    const b = right[index] ?? 0;
    dotProduct += a * b;
    leftNorm += a * a;
    rightNorm += b * b;
  }

  const denominator = Math.sqrt(leftNorm) * Math.sqrt(rightNorm);
  if (!denominator) {
    return 0;
  }

  return dotProduct / denominator;
}

export async function initializeEmbeddings() {
  if (initialized) {
    return;
  }

  const raw = await readFile(EMBEDDINGS_PATH, "utf8");
  embeddedStore = JSON.parse(raw) as EmbeddedChunk[];
  initialized = true;
}

/**
 * Embeds a single query string at runtime, using the same provider that was
 * used during precompute so the vectors are comparable.
 *
 * Configure via env vars (same as the precompute script):
 *   EMBEDDINGS_BASE_URL  — HuggingFace: https://router.huggingface.co
 *                          OpenAI:       https://api.openai.com/v1 (or omit)
 *   EMBEDDINGS_API_KEY   — your token / key
 *   EMBEDDINGS_MODEL     — must match what was used during precompute
 */
async function embedQuery(query: string): Promise<number[]> {
  const baseURL =
    process.env.EMBEDDINGS_BASE_URL ??
    "https://router.huggingface.co/hf-inference/models";
  const apiKey =
    process.env.EMBEDDINGS_API_KEY ?? process.env.OPENAI_API_KEY ?? "";
  const model = process.env.EMBEDDINGS_MODEL ?? "BAAI/bge-small-en-v1.5";

  const isHuggingFace = baseURL.includes("huggingface.co");

  if (isHuggingFace) {
    // HF feature-extraction: POST <baseURL>/<model>
    // Body:     { inputs: string }        ← single string at runtime
    // Response: number[][]               ← HF always wraps in outer array
    const res = await fetch(`${baseURL}/${model}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ inputs: query }),
    });

    if (!res.ok) {
      throw new Error(
        `HuggingFace embeddings error: ${res.status} ${res.statusText}`,
      );
    }

    // HF wraps even a single input in an outer array: number[][]
    // Take the first (and only) row.
    const raw = (await res.json()) as number[][];
    return raw[0] ?? [];
  }

  // OpenAI-compatible path
  const res = await fetch(`${baseURL}/embeddings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, input: query }),
  });

  if (!res.ok) {
    throw new Error(`Embeddings API error: ${res.status} ${res.statusText}`);
  }

  const json = (await res.json()) as { data: { embedding: number[] }[] };
  return json.data[0]?.embedding ?? [];
}

export async function searchRelevantChunks(query: string, topK = 6) {
  if (!initialized || embeddedStore.length === 0) {
    return [] as EmbeddedChunk[];
  }

  const queryEmbedding = await embedQuery(query);

  return embeddedStore
    .map((chunk) => ({
      chunk,
      score: cosineSimilarity(queryEmbedding, chunk.embedding),
    }))
    .sort((left, right) => right.score - left.score)
    .slice(0, topK)
    .map((entry) => entry.chunk);
}
