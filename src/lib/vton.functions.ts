import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const InputSchema = z.object({
  // data URL of the captured user frame (jpeg/png base64)
  userImage: z.string().min(32).max(8_000_000),
  // Plain-language description of the garment to try on
  garmentPrompt: z.string().min(2).max(400),
  // Optional body profile to fine-tune fit
  heightCm: z.number().min(80).max(250).optional(),
  weightKg: z.number().min(20).max(300).optional(),
  gender: z.enum(["male", "female"]).optional(),
});

export const generatePhotorealLook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return { image: null as string | null, error: "AI gateway not configured" };
    }

    const fitNote = [
      data.heightCm ? `${data.heightCm} cm tall` : null,
      data.weightKg ? `${data.weightKg} kg` : null,
      data.gender ? `${data.gender} body type` : null,
    ]
      .filter(Boolean)
      .join(", ");

    const instruction = [
      "Photorealistic virtual try-on edit.",
      "Keep the person's face, skin tone, hair, body proportions and the room/background EXACTLY as in the source photo — do not change identity or scene.",
      `Replace their current upper-body clothing with: ${data.garmentPrompt}.`,
      "Warp and fit the garment naturally to their pose, shoulders, torso and arms. Add realistic fabric folds, seams and shadows that match the existing room lighting and direction.",
      fitNote ? `Tailor the fit for a ${fitNote} silhouette.` : "",
      "Output a single high-resolution photorealistic image. No text, no watermark, no extra people.",
    ]
      .filter(Boolean)
      .join(" ");

    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          modalities: ["image", "text"],
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: instruction },
                { type: "image_url", image_url: { url: data.userImage } },
              ],
            },
          ],
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        console.error("VTON gateway error", res.status, body);
        if (res.status === 429) return { image: null, error: "Rate limited. Try again in a moment." };
        if (res.status === 402) return { image: null, error: "AI credits exhausted." };
        return { image: null, error: `VTON failed (${res.status})` };
      }

      const json = (await res.json()) as {
        choices?: Array<{ message?: { images?: Array<{ image_url?: { url?: string } }> } }>;
      };
      const url = json.choices?.[0]?.message?.images?.[0]?.image_url?.url ?? null;
      if (!url) return { image: null, error: "Model returned no image" };
      return { image: url, error: null };
    } catch (e) {
      console.error("VTON request crashed", e);
      return { image: null, error: "VTON service unavailable" };
    }
  });
