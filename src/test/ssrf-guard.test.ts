import { describe, it, expect } from "vitest";
import { isSafeImageUrl } from "../../supabase/functions/photo-isolate/url-guard";

describe("isSafeImageUrl — SSRF blocklist", () => {
  describe("allows safe public hosts", () => {
    it.each([
      "https://example.com/photo.jpg",
      "https://cdn.example.com/path/to/image.png?x=1",
      "https://images.unsplash.com/photo-123.webp",
      "https://storage.googleapis.com/bucket/key.jpg",
      "https://8.8.8.8/img.png",            // public IPv4
      "https://[2001:db8::1]/img.png",      // public IPv6 (documentation range)
    ])("allows %s", (url) => {
      expect(isSafeImageUrl(url)).toBe(true);
    });

    it("allows small data:image/* URIs", () => {
      expect(isSafeImageUrl("data:image/png;base64,iVBORw0KGgo=")).toBe(true);
      expect(isSafeImageUrl("data:image/jpeg;base64,/9j/4AAQSk=")).toBe(true);
    });
  });

  describe("blocks IPv4 private / loopback / link-local", () => {
    it.each([
      "https://localhost/x",
      "https://127.0.0.1/x",
      "https://127.5.6.7/x",
      "https://10.0.0.1/x",
      "https://192.168.1.1/x",
      "https://169.254.169.254/x",   // AWS/GCP metadata
      "https://172.16.0.1/x",
      "https://172.31.255.255/x",
      "https://0.0.0.0/x",
      "https://service.internal/x",
      "https://node.local/x",
    ])("blocks %s", (url) => {
      expect(isSafeImageUrl(url)).toBe(false);
    });
  });

  describe("blocks IPv6 loopback / link-local / unique-local", () => {
    it.each([
      "https://[::1]/x",                       // loopback
      "https://[::]/x",                        // unspecified
      "https://[fe80::1]/x",                   // link-local
      "https://[fe80::abcd:1234]/x",
      "https://[fc00::1]/x",                   // unique-local
      "https://[fd12:3456:789a::1]/x",         // unique-local
    ])("blocks %s", (url) => {
      expect(isSafeImageUrl(url)).toBe(false);
    });
  });

  describe("blocks IPv4-mapped IPv6 private ranges", () => {
    it.each([
      "https://[::ffff:127.0.0.1]/x",
      "https://[::ffff:10.0.0.1]/x",
      "https://[::ffff:192.168.1.1]/x",
      "https://[::ffff:169.254.169.254]/x",
      "https://[::ffff:172.16.0.1]/x",
    ])("blocks %s", (url) => {
      expect(isSafeImageUrl(url)).toBe(false);
    });
  });

  describe("blocks malformed / non-https / oversized inputs", () => {
    it("blocks empty / non-string", () => {
      expect(isSafeImageUrl("")).toBe(false);
      expect(isSafeImageUrl(undefined)).toBe(false);
      expect(isSafeImageUrl(null)).toBe(false);
      expect(isSafeImageUrl(123)).toBe(false);
    });
    it("blocks non-https schemes", () => {
      expect(isSafeImageUrl("http://example.com/x.jpg")).toBe(false);
      expect(isSafeImageUrl("ftp://example.com/x.jpg")).toBe(false);
      expect(isSafeImageUrl("file:///etc/passwd")).toBe(false);
    });
    it("blocks malformed URLs", () => {
      expect(isSafeImageUrl("not a url")).toBe(false);
      expect(isSafeImageUrl("https://")).toBe(false);
    });
    it("blocks oversized https URLs (>2048 chars)", () => {
      const long = "https://example.com/" + "a".repeat(2100);
      expect(isSafeImageUrl(long)).toBe(false);
    });
    it("blocks non-image data URIs and oversized data URIs", () => {
      expect(isSafeImageUrl("data:text/html;base64,PHNjcmlwdD4=")).toBe(false);
      const huge = "data:image/png;base64," + "A".repeat(8 * 1024 * 1024 + 10);
      expect(isSafeImageUrl(huge)).toBe(false);
    });
  });
});
