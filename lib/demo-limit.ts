// Demo quota, kept in this server's memory. It resets on restart and is not shared
// across instances, so it caps spend on a single server. It does not survive a restart.
const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
export const DEMO_DAILY_LIMIT = 50;
export const DEMO_IP_HOURLY_LIMIT = 5;
const SWEEP_THRESHOLD = 10_000;

export const DEMO_DAILY_MESSAGE = "Demo limit reached, try again tomorrow.";
export const DEMO_IP_MESSAGE = "Demo limit reached for this network, try again in an hour.";

let dayTimes: number[] = [];
const ipTimes = new Map<string, number[]>();

function prune(times: number[], windowMs: number, now: number): number[] {
  return times.filter((t) => now - t < windowMs);
}

// Records one demo request if both limits allow it. Returns the message to show when a
// limit blocks it, or null when the request is allowed. A blocked request is not counted.
export function reserveDemoRequest(ip: string, now = Date.now()): string | null {
  dayTimes = prune(dayTimes, DAY_MS, now);
  if (dayTimes.length >= DEMO_DAILY_LIMIT) return DEMO_DAILY_MESSAGE;

  const ipKept = prune(ipTimes.get(ip) ?? [], HOUR_MS, now);
  if (ipKept.length >= DEMO_IP_HOURLY_LIMIT) {
    ipTimes.set(ip, ipKept);
    return DEMO_IP_MESSAGE;
  }

  if (ipTimes.size >= SWEEP_THRESHOLD) {
    for (const [key, times] of ipTimes) {
      if (prune(times, HOUR_MS, now).length === 0) ipTimes.delete(key);
    }
  }
  dayTimes.push(now);
  ipKept.push(now);
  ipTimes.set(ip, ipKept);
  return null;
}
