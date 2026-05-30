import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { rateLimit } from "./rate-limit.server";

/**
 * Validates a Pi Network access token by calling Pi's /v2/me endpoint
 * and returns the verified Pi identity.
 *
 * This endpoint must be callable BEFORE a Supabase session exists (it is
 * the first step of Pi sign-in), so it cannot require requireSupabaseAuth.
 * Abuse is mitigated by:
 *  - strict token format validation
 *  - per-IP rate limiting
 */
export const verifyPiAccessToken = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        // Pi access tokens are opaque; constrain to a safe printable range.
        accessToken: z
          .string()
          .min(16)
          .max(2048)
          .regex(/^[A-Za-z0-9._\-]+$/),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const req = getRequest();
    const ip =
      req?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req?.headers.get("x-real-ip") ||
      "unknown";

    // 10 verification attempts per IP per minute.
    if (!rateLimit(`pi-verify:${ip}`, 10, 60_000)) {
      throw new Error("Too many requests. Please try again shortly.");
    }

    const res = await fetch("https://api.minepi.com/v2/me", {
      headers: { Authorization: `Bearer ${data.accessToken}` },
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("Pi /v2/me validation failed", res.status, text || res.statusText);
      throw new Error("Authentication failed. Please try again.");
    }

    const me = (await res.json()) as { uid: string; username: string };
    return { ok: true as const, uid: me.uid, username: me.username };
  });
