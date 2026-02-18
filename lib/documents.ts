import { readFile } from "node:fs/promises";
import path from "node:path";

export type DatasetDocument = {
  source: string;
  content: string;
};

export type DocumentChunk = {
  source: string;
  header: string;
  content: string;
};

const DATASET_FILES = [
  "resume.md",
  "personal.md",
  "projectRecords.md",
  "workRecords.md",
  "rawRiskfuel.md",
];

function resolveDatasetPath(filename: string) {
  return path.join(process.cwd(), "dataset", filename);
}

export async function readDatasetDocuments() {
  const documents = await Promise.all(
    DATASET_FILES.map(async (filename) => {
      const filePath = resolveDatasetPath(filename);
      const content = await readFile(filePath, "utf8");

      return {
        source: filename,
        content,
      } satisfies DatasetDocument;
    }),
  );

  return documents;
}

export function chunkMarkdown(document: DatasetDocument, maxChunkSize = 900) {
  const normalized = document.content.replace(/\r\n/g, "\n");
  const sections = normalized.split(/\n(?=##?\s)/g);

  const chunks: DocumentChunk[] = [];

  for (const section of sections) {
    const trimmed = section.trim();
    if (!trimmed) {
      continue;
    }

    const headerMatch = trimmed.match(/^(#+\s+.+)$/m);
    const header = headerMatch?.[1] ?? "General";

    if (trimmed.length <= maxChunkSize) {
      chunks.push({
        source: document.source,
        header,
        content: trimmed,
      });
      continue;
    }

    let cursor = 0;
    while (cursor < trimmed.length) {
      const slice = trimmed.slice(cursor, cursor + maxChunkSize);
      chunks.push({
        source: document.source,
        header,
        content: slice,
      });
      cursor += maxChunkSize;
    }
  }

  return chunks;
}

export async function loadAndChunkDocuments() {
  const documents = await readDatasetDocuments();
  return documents.flatMap((document) => chunkMarkdown(document));
}
