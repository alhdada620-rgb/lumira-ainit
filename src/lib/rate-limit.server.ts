// Simple in-memory token-bucket style rate limiter.
// Per-instance only — best-effort abuse mitigation, not a hard guarantee.
// In multi-instance / serverless deployments each isolate has its own buckets;
// for durable cross-instance limits move to a shared store (Redis/KV/DB).
const buckets = new Map<string, { count: number; resetAt: number }>();

// Cap the map size to bound memory in case of high-cardinality keys.
const MAX_BUCKETS = 10_000;
let lastSweep = 0;
const SWEEP_INTERVAL_MS = 60_000;

function sweep(now: number) {
  if (now - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = now;
  for (const [k, v] of buckets) {
    if (v.resetAt < now) buckets.delete(k);
  }
  // Hard cap fallback: if still oversized, drop oldest-reset entries.
  if (buckets.size > MAX_BUCKETS) {
    const entries = [...buckets.entries()].sort((a, b) => a[1].resetAt - b[1].resetAt);
    for (let i = 0; i < entries.length - MAX_BUCKETS; i++) {
      buckets.delete(entries[i][0]);
    }
  }
}

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  sweep(now);
  const b = buckets.get(key);
  if (!b || b.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (b.count >= limit) return false;
  b.count++;
  return true;
}

/**
 * Pick a best-effort client IP from request headers.
 * Hardens XFF parsing:
 *  - prefers `cf-connecting-ip` / `x-real-ip` when present (set by trusted edge)
 *  - parses XFF as a list and picks the first syntactically valid IP
 *  - strips IPv6 zone IDs and surrounding brackets/ports
 *  - rejects obviously invalid tokens
 */
export function getClientIp(headers: Headers): string {
  const direct =
    headers.get("cf-connecting-ip") ||
    headers.get("x-real-ip") ||
    headers.get("true-client-ip");
  if (direct && isValidIp(direct.trim())) return direct.trim();

  const xff = headers.get("x-forwarded-for");
  if (xff) {
    for (const raw of xff.split(",")) {
      const ip = normalizeIp(raw);
      if (ip && isValidIp(ip)) return ip;
    }
  }
  return "unknown";
}

function normalizeIp(raw: string): string {
  let s = raw.trim();
  if (!s) return "";
  // Strip [ipv6]:port or [ipv6]
  if (s.startsWith("[")) {
    const end = s.indexOf("]");
    if (end > 0) s = s.slice(1, end);
  } else if (s.includes(".") && s.includes(":")) {
    // IPv4:port
    s = s.split(":")[0];
  }
  // Strip IPv6 zone id (e.g. fe80::1%eth0)
  const pct = s.indexOf("%");
  if (pct >= 0) s = s.slice(0, pct);
  return s;
}

function isValidIp(s: string): boolean {
  if (!s || s.length > 45) return false;
  // IPv4
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(s)) {
    return s.split(".").every((p) => {
      const n = Number(p);
      return n >= 0 && n <= 255;
    });
  }
  // IPv6 (loose but safe for keying)
  return /^[0-9a-fA-F:]+$/.test(s) && s.includes(":");
}
