import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { rateLimit, getClientIp } from "./rate-limit.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Validates a Pi Network access token by calling Pi's /v2/me endpoint
 * and returns the verified Pi identity. The validated pi_uid is persisted
 * server-side in `pi_identities` via the service-role client so feature
 * access never depends purely on client React state.
 *
 * This endpoint must be callable BEFORE a Supabase session exists (it is
 * the first step of Pi sign-in), so it cannot require requireSupabaseAuth.
 * Abuse is mitigated by:
 *  - strict token format validation
 *  - per-IP rate limiting
 *  - back-edge verification against Pi's API
 *  - server-only writes to pi_identities (RLS blocks all client access)
 */
export const verifyPiAccessToken = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
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
    const ip = req ? getClientIp(req.headers) : "unknown";

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

    if (!me?.uid || !me?.username) {
      throw new Error("Authentication failed. Please try again.");
    }

    // Persist the server-validated Pi identity. Service-role client bypasses
    // RLS; the table grants no privileges to anon/authenticated, so this row
    // can only ever be written by trusted server code.
    const { error: upsertErr } = await supabaseAdmin
      .from("pi_identities")
      .upsert(
        {
          pi_uid: me.uid,
          pi_username: me.username,
          last_verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "pi_uid" },
      );
    if (upsertErr) {
      console.error("pi_identities upsert failed", upsertErr);
      // Don't leak DB details to the client.
      throw new Error("Authentication failed. Please try again.");
    }

    return { ok: true as const, uid: me.uid, username: me.username };
  });
