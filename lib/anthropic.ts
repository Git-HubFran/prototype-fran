import Anthropic from "@anthropic-ai/sdk";

export const MODEL = "claude-sonnet-5-5";

// Server-only. The key is read from ANTHROPIC_API_KEY and never sent to the browser.
export class MissingApiKeyError extends Error {
  constructor() {
    super("ANTHROPIC_API_KEY is not set on the server.");
    this.name = "MissingApiKeyError";
  }
}

let client: Anthropic | undefined;

export function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new MissingApiKeyError();
  client ??= new Anthropic({ apiKey });
  return client;
}

// Joins the text blocks of a response. Throws if the model did not finish normally,
// so callers never parse a truncated or refused answer.
export function extractText(message: Anthropic.Message): string {
  if (message.stop_reason === "refusal") {
    throw new ModelRefusalError();
  }
  if (message.stop_reason === "max_tokens") {
    throw new ModelOutputTruncatedError();
  }
  return message.content
    .flatMap((block) => (block.type === "text" ? [block.text] : []))
    .join("");
}

export class ModelRefusalError extends Error {
  constructor() {
    super("The model declined to process this request.");
    this.name = "ModelRefusalError";
  }
}

export class ModelOutputTruncatedError extends Error {
  constructor() {
    super("The model's response was cut off. Try again with a shorter contract or question.");
    this.name = "ModelOutputTruncatedError";
  }
}
