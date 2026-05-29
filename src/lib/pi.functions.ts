import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const PI_API_BASE = "https://api.minepi.com/v2";

async function piFetch(path: string, init: RequestInit = {}): Promise<Record<string, unknown>> {
  const apiKey = process.env.PI_NETWORK_API_KEY || process.env.PI_API_KEY;
  if (!apiKey) throw new Error("Payment service is not configured.");
  const res = await fetch(`${PI_API_BASE}${path}`, {
    ...init,
    headers: {
      ...(init.headers || {}),
      Authorization: `Key ${apiKey}`,
      "Content-Type": "application/json",
    },
  });
  const text = await res.text();
  let body: Record<string, unknown> = {};
  try { body = text ? JSON.parse(text) : {}; } catch { body = { raw: text }; }
  if (!res.ok) {
    // Log raw details server-side only; surface a generic message to the client.
    console.error("Pi API error", path, res.status, text);
    throw new Error("Payment service error. Please try again.");
  }
  return body;
}

export const approvePiPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ paymentId: z.string().min(1).max(128) }).parse(data))
  .handler(async ({ data }) => {
    await piFetch(`/payments/${data.paymentId}/approve`, { method: "POST" });
    return { ok: true as const };
  });

export const completePiPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z.object({
      paymentId: z.string().min(1).max(128),
      txid: z.string().min(1).max(256),
    }).parse(data),
  )
  .handler(async ({ data }) => {
    await piFetch(`/payments/${data.paymentId}/complete`, {
      method: "POST",
      body: JSON.stringify({ txid: data.txid }),
    });
    return { ok: true as const };
  });
