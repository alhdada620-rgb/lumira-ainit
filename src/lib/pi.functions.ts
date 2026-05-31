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

/**
 * Server-side "back-edge" verification: ask Pi's API for the canonical payment
 * record and confirm it exists and looks plausible before we touch our DB or
 * call /approve or /complete. This is what lets feature access be checked
 * server-side rather than relying on client React state.
 */
async function fetchPiPayment(paymentId: string): Promise<{
  status?: { developer_approved?: boolean; transaction_verified?: boolean; developer_completed?: boolean; cancelled?: boolean };
  transaction?: { txid?: string; verified?: boolean } | null;
  amount?: number;
  user_uid?: string;
} | null> {
  try {
    const body = await piFetch(`/payments/${paymentId}`, { method: "GET" });
    return body as Record<string, unknown> as Awaited<ReturnType<typeof fetchPiPayment>>;
  } catch (e) {
    console.error("fetchPiPayment failed", paymentId, e);
    return null;
  }
}

export const approvePiPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ paymentId: z.string().min(1).max(128).regex(/^[A-Za-z0-9_-]+$/) }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Back-edge check: confirm Pi knows about this payment before we record/approve it.
    const piPayment = await fetchPiPayment(data.paymentId);
    if (!piPayment) {
      throw new Error("Payment not found.");
    }
    if (piPayment.status?.cancelled) {
      throw new Error("Payment was cancelled.");
    }

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
      paymentId: z.string().min(1).max(128).regex(/^[A-Za-z0-9_-]+$/),
      txid: z.string().min(1).max(256).regex(/^[A-Za-z0-9_-]+$/),
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

    // Back-edge check: ask Pi for the canonical record and confirm the txid
    // the client sent matches what Pi reports + the transaction is verified.
    const piPayment = await fetchPiPayment(data.paymentId);
    if (!piPayment) {
      throw new Error("Payment not found.");
    }
    if (piPayment.status?.cancelled) {
      throw new Error("Payment was cancelled.");
    }
    const piTxid = piPayment.transaction?.txid;
    if (!piTxid || piTxid !== data.txid) {
      console.error("txid mismatch", { reported: data.txid, fromPi: piTxid });
      throw new Error("Transaction ID does not match Pi records.");
    }
    if (piPayment.transaction?.verified === false) {
      throw new Error("Transaction not yet verified on Pi network.");
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

/**
 * Server-side entitlement check. Use this from server functions guarding
 * paid features instead of trusting client React state. Returns true only
 * if the authenticated user has at least one completed payment row.
 */
export const hasPiEntitlement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("pi_payments")
      .select("payment_id")
      .eq("user_id", userId)
      .eq("status", "completed")
      .limit(1);
    if (error) {
      console.error("hasPiEntitlement query failed", error);
      return { entitled: false as const };
    }
    return { entitled: (data?.length ?? 0) > 0 };
  });
