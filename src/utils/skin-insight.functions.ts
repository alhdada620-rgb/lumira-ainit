import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

const InputSchema = z.object({
  hydration: z.number().min(0).max(100),
  smoothness: z.number().min(0).max(100),
  skinTone: z.number().min(0).max(100),
});

export const generateSkinInsight = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
    if (!LOVABLE_API_KEY) {
      return { insight: "AI insights unavailable. Please configure Lovable AI.", error: "missing_key" as const };
    }

    const systemPrompt = `You are Lumira, an AI skincare advisor on a luxury smart mirror.
Give ONE concise, elegant skincare tip (max 2 sentences, ~30 words) personalized to the user's metrics.
Be warm, specific, and actionable. Mention one metric by name. Do not use markdown or emojis.`;

    const userPrompt = `Today's skin metrics (out of 100):
- Hydration: ${data.hydration}
- Smoothness: ${data.smoothness}
- Skin Tone evenness: ${data.skinTone}

Give one personalized tip.`;

    try {
      const res = await fetch(GATEWAY_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
      });

      if (res.status === 429) {
        return { insight: "Rate limit reached. Please try again in a moment.", error: "rate_limit" as const };
      }
      if (res.status === 402) {
        return { insight: "AI credits exhausted. Add funds in Workspace Settings.", error: "payment_required" as const };
      }
      if (!res.ok) {
        const body = await res.text();
        console.error("AI gateway error", res.status, body);
        return { insight: "Unable to generate insight right now.", error: "gateway_error" as const };
      }

      const json = await res.json();
      const insight = json.choices?.[0]?.message?.content?.trim() ?? "No insight generated.";
      return { insight, error: null };
    } catch (e) {
      console.error("Skin insight failed", e);
      return { insight: "Unable to reach the AI service.", error: "network_error" as const };
    }
  });
