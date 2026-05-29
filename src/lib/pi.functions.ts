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
    console.error("Pi API error", path, res.status, text);
    throw new Error("Payment service error. Please try again.");
  }
  return body;
}

export const approvePiPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ paymentId: z.string().min(1).max(128) }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Claim or verify ownership of this payment id (RLS enforces user_id = auth.uid()).
    const { data: existing, error: selErr } = await supabase
      .from("pi_payments")
      .select("user_id")
      .eq("payment_id", data.paymentId)
      .maybeSingle();
    if (selErr) {
      console.error("pi_payments select failed", selErr);
      throw new Error("Payment service error. Please try again.");
    }
    if (existing && existing.user_id !== userId) {
      throw new Error("Forbidden");
    }
    if (!existing) {
      const { error: insErr } = await supabase
        .from("pi_payments")
        .insert({ payment_id: data.paymentId, user_id: userId, status: "created" });
      if (insErr) {
        console.error("pi_payments insert failed", insErr);
        throw new Error("Payment service error. Please try again.");
      }
    }

    await piFetch(`/payments/${data.paymentId}/approve`, { method: "POST" });

    await supabase
      .from("pi_payments")
      .update({ status: "approved", updated_at: new Date().toISOString() })
      .eq("payment_id", data.paymentId);

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
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Verify ownership before completing.
    const { data: existing, error: selErr } = await supabase
      .from("pi_payments")
      .select("user_id")
      .eq("payment_id", data.paymentId)
      .maybeSingle();
    if (selErr) {
      console.error("pi_payments select failed", selErr);
      throw new Error("Payment service error. Please try again.");
    }
    if (!existing || existing.user_id !== userId) {
      throw new Error("Forbidden");
    }

    await piFetch(`/payments/${data.paymentId}/complete`, {
      method: "POST",
      body: JSON.stringify({ txid: data.txid }),
    });

    await supabase
      .from("pi_payments")
      .update({ status: "completed", txid: data.txid, updated_at: new Date().toISOString() })
      .eq("payment_id", data.paymentId);

    return { ok: true as const };
  });
