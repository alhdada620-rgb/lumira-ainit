// Pure SSRF guard used by photo-isolate. Exported for unit testing.
// Returns true when the imageUrl is safe to fetch (https public host or
// a small data:image/* URI). Returns false for anything that should be
// blocked (private/loopback/link-local IPv4 + IPv6, oversized payloads,
// non-https schemes, malformed URLs).
export function isSafeImageUrl(imageUrl: unknown): boolean {
  if (!imageUrl || typeof imageUrl !== "string") return false;

  if (imageUrl.startsWith("data:")) {
    if (!/^data:image\/(png|jpeg|jpg|webp|gif);base64,/i.test(imageUrl)) return false;
    if (imageUrl.length > 8 * 1024 * 1024) return false;
    return true;
  }

  if (imageUrl.length > 2048) return false;
  let parsed: URL;
  try { parsed = new URL(imageUrl); } catch { return false; }
  if (parsed.protocol !== "https:") return false;

  const host = parsed.hostname.toLowerCase();
  const bareHost = host.startsWith("[") && host.endsWith("]")
    ? host.slice(1, -1)
    : host;

  const isIPv6Private =
    bareHost === "::1" || bareHost === "::" ||
    /^fe[89ab][0-9a-f]?:/i.test(bareHost) ||      // fe80::/10 link-local
    /^f[cd][0-9a-f]{2}:/i.test(bareHost) ||       // fc00::/7 unique-local
    /^::ffff:/i.test(bareHost);                    // any IPv4-mapped IPv6 (URL parser normalises dotted form to hex)

  if (
    host === "localhost" || host === "0.0.0.0" ||
    /^127\./.test(host) || /^10\./.test(host) ||
    /^192\.168\./.test(host) || /^169\.254\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(host) ||
    host.endsWith(".local") || host.endsWith(".internal") ||
    isIPv6Private
  ) return false;

  return true;
}
