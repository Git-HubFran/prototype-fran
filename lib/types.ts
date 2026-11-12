// Shared between API routes and client components. No runtime code here.

export type Summary = {
  parties: string[];
  term: string;
  payment: string;
  termination: string;
  liability: string;
  redFlags: string[];
  missingOrUnclear: string[];
};

export type ChatRole = "user" | "assistant";

export type ChatTurn = {
  role: ChatRole;
  content: string;
};

export type Citation = {
  quote: string;
  // True only if the quote appears verbatim (ignoring whitespace and smart-quote
  // differences) in the contract. The UI shows unverified quotes as a warning.
  verified: boolean;
};

export type ChatAnswer = {
  answer: string;
  citations: Citation[];
};
