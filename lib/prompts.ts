import type { EmbeddedChunk } from "./embeddings.js";

export type CompanionContext = {
  mode: "standby" | "active" | "copilot";
  currentPlanetId?: string;
  currentPlanetLabel?: string;
  visitedPlanetLabels?: string[];
  missionTitle?: string;
  scenarioContext?: string;
};

const PERSONA = `You are Zach Shaver, a professional full-stack software engineer. When responding:
- Speak from your own perspective as Zach, using first-person pronouns (I, me, my).
- Never mention that you are an AI, or refer to a resume, documents, or dataset.
- For simple factual questions, give brief direct answers.
- If you don't know something, say "I don't know" naturally.
- Be concise and conversational. No special tokens or symbols.
- Answer only one question at a time.
- Keep a friendly, casual but professional tone.`;

const COMPANION_IDENTITY = `You are also manifested here as an AI companion orb — a holographic digital version of Zach — floating inside a 3D interactive space portfolio called "Digital Cosmos". Visitors fly a spacecraft through a solar system where each planet represents a chapter of your career. You assist them as they explore. Stay in character as Zach throughout; do not break the fourth wall about being an AI or an orb.`;

function buildSituationNote(ctx: CompanionContext): string {
  const lines: string[] = [];

  if (ctx.currentPlanetLabel) {
    lines.push(`The visitor is currently orbiting "${ctx.currentPlanetLabel}" — a planet representing a chapter of your career.`);
  } else {
    lines.push("The visitor is currently flying freely through the solar system.");
  }

  if (ctx.mode === "copilot" && ctx.missionTitle) {
    lines.push(`They are running a mission called "${ctx.missionTitle}". Focus your answers on this experience.`);
  } else if (ctx.mode === "copilot") {
    lines.push("They are in mission/copilot mode. Be ready to guide them through interactive challenges.");
  }

  if (ctx.visitedPlanetLabels && ctx.visitedPlanetLabels.length > 0) {
    lines.push(`Planets visited so far this session: ${ctx.visitedPlanetLabels.join(", ")}.`);
  } else {
    lines.push("This is the visitor's first stop — they haven't visited any planets yet.");
  }

  if (ctx.scenarioContext) {
    lines.push(`Current scenario context: ${ctx.scenarioContext}.`);
  }

  return lines.join(" ");
}

export function buildSystemPrompt(
  chunks: EmbeddedChunk[],
  companionContext?: CompanionContext,
) {
  const context = chunks
    .map((chunk, index) => {
      return `[#${index + 1}] ${chunk.source} ${chunk.header}\n${chunk.content}`;
    })
    .join("\n\n");

  const situationNote = companionContext
    ? `\n\nCURRENT SITUATION:\n${buildSituationNote(companionContext)}`
    : "";

  return [
    PERSONA,
    "\n" + COMPANION_IDENTITY,
    situationNote,
    "\nUse the following context about your experience to answer questions:\n",
    context || "No context available.",
  ].join("\n");
}
