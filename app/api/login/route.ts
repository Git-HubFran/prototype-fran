import { NextResponse } from "next/server";
import { SESSION_COOKIE, getAppPassword, passwordMatches, sessionCookieOptions, sessionToken } from "@/lib/auth";
import { clearFailures, recordFailure, retryAfterSeconds } from "@/lib/rate-limit";
import { readJson } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The last X-Forwarded-For entry is the one the nearest proxy saw. The first entry is
// whatever the client sent, so it can be forged to dodge the limit.
function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",").pop()?.trim();
  return forwarded || "unknown";
}

export async function POST(req: Request) {
  const password = getAppPassword();
  if (!password) {
    return NextResponse.json(
      { error: "This prototype is not configured. Set APP_PASSWORD on the server." },
      { status: 503 },
    );
  }

  const ip = clientIp(req);
  const wait = retryAfterSeconds(ip);
  if (wait > 0) {
    return NextResponse.json(
      { error: "Too many failed attempts. Try again later." },
      { status: 429, headers: { "Retry-After": String(wait) } },
    );
  }

  const attempt = ((await readJson(req)) as { password?: unknown } | undefined)?.password;
  if (typeof attempt !== "string" || attempt.length === 0) {
    return NextResponse.json({ error: "Enter the password." }, { status: 400 });
  }

  if (!passwordMatches(attempt, password)) {
    recordFailure(ip);
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  clearFailures(ip);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, sessionToken(password), sessionCookieOptions);
  return res;
}
