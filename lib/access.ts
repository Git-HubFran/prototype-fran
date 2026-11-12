// Server-only. Decides who may call the AI routes. Checking access has no side effects;
// quota is only used up after the request body has been validated.
import { getAppPassword, hasValidSession } from "./auth";
import { DEMO_CONTRACT } from "./demo-contract";
import { reserveDemoRequest } from "./demo-limit";
import { clientIp } from "./http";

export type AccessMode = "session" | "demo";

// "session" for a logged-in user. "demo" when there is no session, APP_PASSWORD is set,
// and the contract matches the sample exactly. Otherwise null, which means 401.
export async function accessMode(body: unknown): Promise<AccessMode | null> {
  if (await hasValidSession()) return "session";
  if (getAppPassword() === null) return null;
  const contract = (body as { contract?: unknown } | undefined)?.contract;
  return contract === DEMO_CONTRACT ? "demo" : null;
}

// Counts one demo request. Returns the message to show when a limit blocks it, or null.
export function demoQuotaBlock(req: Request): string | null {
  return reserveDemoRequest(clientIp(req));
}
