import { createServerFn } from "@tanstack/react-start";
import { setCookie } from "@tanstack/react-start/server";
import { z } from "zod";

/**
 * Validates a Pi Network access token by calling Pi's /v2/me endpoint,
 * then establishes a lightweight session cookie. No Pi API key required.
 */
export const verifyPiAccessToken = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ accessToken: z.string().min(1) }).parse(data))
  .handler(async ({ data }) => {
    const res = await fetch("https://api.minepi.com/v2/me", {
      headers: { Authorization: `Bearer ${data.accessToken}` },
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("Pi /v2/me validation failed", res.status, text || res.statusText);
      throw new Error("Authentication failed. Please try again.");
    }

    const me = (await res.json()) as { uid: string; username: string };

    // Establish a simple session cookie scoped to this app.
    setCookie("pi_session", JSON.stringify({ uid: me.uid, username: me.username }), {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return { ok: true as const, uid: me.uid, username: me.username };
  });
