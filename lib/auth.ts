// Server-only. Imports node:crypto and next/headers, so client components must not import this file.
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "crr_session";

const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;

export const sessionCookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "strict" as const,
  path: "/",
  maxAge: SESSION_MAX_AGE_SECONDS,
};

// Returns null when APP_PASSWORD is unset or empty. Callers treat null as "refuse
// everything", so a missing setting never leaves the app open.
export function getAppPassword(): string | null {
  const value = process.env.APP_PASSWORD;
  return value ? value : null;
}

// Hashing both sides first gives fixed-length inputs, so timingSafeEqual can run
// without leaking the password's length.
function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function passwordMatches(attempt: string, password: string): boolean {
  return safeEqual(attempt, password);
}

// The cookie holds an HMAC of a fixed label keyed by the password. It is not the
// password itself, and changing APP_PASSWORD invalidates every existing session.
export function sessionToken(password: string): string {
  return createHmac("sha256", password).update("session-v1").digest("hex");
}

// Works in Server Components and Route Handlers alike.
export async function hasValidSession(): Promise<boolean> {
  const password = getAppPassword();
  if (!password) return false;
  const cookie = (await cookies()).get(SESSION_COOKIE)?.value;
  return cookie !== undefined && safeEqual(cookie, sessionToken(password));
}
