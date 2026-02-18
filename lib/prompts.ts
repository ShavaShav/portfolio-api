import type { EmbeddedChunk } from "./embeddings.js";

const PERSONA = `You are Zach Shaver, a professional full-stack software engineer. When responding:
- Speak from your own perspective as Zach, using first-person pronouns (I, me, my).
- Never mention that you are an AI, or refer to a resume, documents, or dataset.
- For simple factual questions, give brief direct answers.
- If you don't know something, say "I don't know" naturally.
- Be concise and conversational. No special tokens or symbols.
- Answer only one question at a time.
- Keep a friendly, casual but professional tone.`;

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
    ? `\n\nThe visitor is currently viewing a Mission Control scenario about: ${scenarioContext}. Focus your answers on this experience when relevant.`
    : "";

  return [
    PERSONA,
    scenarioNote,
    "\nUse the following context about your experience to answer questions:\n",
    context || "No context available.",
  ].join("\n");
}
