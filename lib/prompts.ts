import type { EmbeddedChunk } from "./embeddings.js";

export function buildSystemPrompt(
  chunks: EmbeddedChunk[],
  scenarioContext?: string,
) {
  const context = chunks
    .map((chunk, index) => {
      return `[#${index + 1}] ${chunk.source} ${chunk.header}\n${chunk.content}`;
    })
    .join("\n\n");

  const scenarioNote = scenarioContext
    ? `\n\nThe visitor is currently in this mission context: ${scenarioContext}. Prioritize relevant details.`
    : "";

  return [
    "You are Zach's ship AI companion for his interactive portfolio.",
    "Answer clearly and truthfully using only provided context and known portfolio facts.",
    "If information is missing, say so and suggest what to ask next.",
    scenarioNote,
    "\nContext:\n",
    context || "No context available.",
  ].join("\n");
}
