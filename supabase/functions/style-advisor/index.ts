// Lumira AI Style Advisor — body-aware outfit tips via Lovable AI Gateway
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface AdvisorPayload {
  outfit?: { brand?: string; name?: string; category?: string; fabric?: string };
  profile?: { gender?: string; height?: number; weight?: number; skinTone?: string };
  language?: "en" | "ar";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { outfit, profile, language = "en" } = (await req.json()) as AdvisorPayload;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const isAr = language === "ar";
    const sys = isAr
      ? "أنت مستشار أزياء راقٍ. قدّم 3 نصائح موجزة (سطر واحد لكل نصيحة) عن ملاءمة القطعة لقياسات المستخدم، وتنسيق اللون مع لون البشرة، وفرصة التصفيف. نبرة فاخرة وعملية. لا تستخدم رموز تعداد."
      : "You are a luxury personal stylist. Reply with EXACTLY 3 short, single-line tips covering: (1) fit & body proportion, (2) color harmony with skin tone, (3) styling pairing idea. Tone: confident, premium, practical. No bullet symbols.";

    const user = isAr
      ? `الزي: ${outfit?.brand ?? "—"} · ${outfit?.name ?? "—"} (${outfit?.category ?? "—"} / ${outfit?.fabric ?? "قماش"})\nالبروفايل: ${profile?.gender}, ${profile?.height}سم, ${profile?.weight}كجم, لون البشرة ${profile?.skinTone}.`
      : `Outfit: ${outfit?.brand ?? "—"} · ${outfit?.name ?? "—"} (${outfit?.category ?? "—"} / ${outfit?.fabric ?? "fabric"})\nProfile: ${profile?.gender}, ${profile?.height}cm, ${profile?.weight}kg, skin tone ${profile?.skinTone}.`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: sys },
          { role: "user", content: user },
        ],
      }),
    });

    if (!resp.ok) {
      if (resp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please retry shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (resp.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await resp.text();
      console.error("AI gateway error", resp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const text: string = data.choices?.[0]?.message?.content ?? "";
    const tips = text
      .split("\n")
      .map((l) => l.replace(/^[\-•\d\.\)\s]+/, "").trim())
      .filter(Boolean)
      .slice(0, 3);

    return new Response(JSON.stringify({ tips }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("style-advisor error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
