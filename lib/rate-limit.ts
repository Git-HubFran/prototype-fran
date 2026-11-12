// Failed-login limiter, keyed by client IP. It lives in this server's memory, so it
// resets on restart and is not shared across instances. That makes it a brake on
// casual guessing, not a hard guarantee; use a shared store if the app runs on several.
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;
const SWEEP_THRESHOLD = 10_000;

const failures = new Map<string, number[]>();

// Failure timestamps still inside the window. Drops the entry when none remain.
function recentFailures(ip: string, now: number): number[] {
  const kept = (failures.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (kept.length > 0) {
    failures.set(ip, kept);
  } else {
    failures.delete(ip);
  }
  return kept;
}

// Seconds until this IP may try again, or 0 if it may try now.
export function retryAfterSeconds(ip: string, now = Date.now()): number {
  const kept = recentFailures(ip, now);
  if (kept.length < MAX_FAILURES) return 0;
  return Math.ceil((kept[0] + WINDOW_MS - now) / 1000);
}

export function recordFailure(ip: string, now = Date.now()): void {
  if (failures.size >= SWEEP_THRESHOLD) {
    for (const key of [...failures.keys()]) recentFailures(key, now);
  }
  failures.set(ip, [...recentFailures(ip, now), now]);
}

export function clearFailures(ip: string): void {
  failures.delete(ip);
}
