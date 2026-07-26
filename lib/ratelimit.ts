/**
 * Best-effort per-IP token bucket. In-memory, so on serverless it is per-instance and
 * resets on cold start — this is stated honestly in the README rather than presented as
 * real abuse protection. It exists to stop one browser tab hammering the free Gemma tier.
 */
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 5;

const buckets = new Map<string, number[]>();

export function rateLimit(ip: string): { ok: boolean; retryAfterSec: number } {
  const now = Date.now();
  const hits = (buckets.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (hits.length >= MAX_REQUESTS) {
    const retryAfterSec = Math.ceil((WINDOW_MS - (now - hits[0])) / 1000);
    buckets.set(ip, hits);
    return { ok: false, retryAfterSec };
  }
  hits.push(now);
  buckets.set(ip, hits);
  if (buckets.size > 500) {
    for (const [k, v] of buckets) if (v.every((t) => now - t >= WINDOW_MS)) buckets.delete(k);
  }
  return { ok: true, retryAfterSec: 0 };
}

export function clientIp(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'local'
  );
}
