import { initializeEmbeddings, searchRelevantChunks } from "./embeddings.js";
import { loadAndChunkDocuments } from "./documents.js";
import { buildSystemPrompt } from "./prompts.js";

let warmPromise: Promise<void> | null = null;

async function warmStore() {
  if (!warmPromise) {
    warmPromise = (async () => {
      const chunks = await loadAndChunkDocuments();
      await initializeEmbeddings(chunks);
    })();
  }

  await warmPromise;
}

export async function retrievePromptContext(
  message: string,
  scenarioContext?: string,
) {
  await warmStore();

  const chunks = await searchRelevantChunks(message, 6);
  return buildSystemPrompt(chunks, scenarioContext);
}
