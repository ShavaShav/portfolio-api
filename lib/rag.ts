import { initializeEmbeddings, searchRelevantChunks } from "./embeddings.js";
import { buildSystemPrompt, type CompanionContext } from "./prompts.js";

let warmPromise: Promise<void> | null = null;

async function warmStore() {
  if (!warmPromise) {
    warmPromise = initializeEmbeddings();
  }

  await warmPromise;
}

export async function retrievePromptContext(
  message: string,
  companionContext?: CompanionContext,
) {
  await warmStore();

  const chunks = await searchRelevantChunks(message, 6);
  return buildSystemPrompt(chunks, companionContext);
}
