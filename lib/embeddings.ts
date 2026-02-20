import OpenAI from "openai";
import type { DocumentChunk } from "./documents.js";

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export type EmbeddedChunk = DocumentChunk & {
  embedding: number[];
};

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

export async function initializeEmbeddings(chunks: DocumentChunk[]) {
  if (initialized) {
    return;
  }

  if (!chunks.length) {
    initialized = true;
    return;
  }

  const response = await getOpenAI().embeddings.create({
    model: "text-embedding-3-small",
    input: chunks.map((chunk) => chunk.content),
  });

  embeddedStore = chunks.map((chunk, index) => ({
    ...chunk,
    embedding: response.data[index]?.embedding ?? [],
  }));

  initialized = true;
}

export async function embedQuery(query: string) {
  const response = await getOpenAI().embeddings.create({
    model: "text-embedding-3-small",
    input: query,
  });

  return response.data[0]?.embedding ?? [];
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
