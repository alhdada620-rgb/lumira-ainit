// Lumira AI photo subject isolation — uses Nano-Banana to remove background.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { isSafeImageUrl } from "./url-guard.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
    );
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { imageUrl } = (await req.json()) as { imageUrl: string };
    const badUrl = () => new Response(JSON.stringify({ error: "Invalid imageUrl" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
    if (!imageUrl || typeof imageUrl !== "string") return badUrl();
    // Allow https URLs (<=2048 chars) or data:image/* URIs (<=8MB)
    if (imageUrl.startsWith("data:")) {
      if (!/^data:image\/(png|jpeg|jpg|webp|gif);base64,/i.test(imageUrl)) return badUrl();
      if (imageUrl.length > 8 * 1024 * 1024) return badUrl();
    } else {
      if (imageUrl.length > 2048) return badUrl();
      let parsed: URL;
      try { parsed = new URL(imageUrl); } catch { return badUrl(); }
      if (parsed.protocol !== "https:") return badUrl();
      const host = parsed.hostname.toLowerCase();
      // Strip brackets from IPv6 literal hosts (URL.hostname keeps them)
      const bareHost = host.startsWith("[") && host.endsWith("]")
        ? host.slice(1, -1)
        : host;
      const isIPv6Private =
        bareHost === "::1" || bareHost === "::" ||
        /^fe[89ab][0-9a-f]?:/i.test(bareHost) || // fe80::/10 link-local
        /^f[cd][0-9a-f]{2}:/i.test(bareHost) ||  // fc00::/7 unique-local
        /^::ffff:(127|10|169\.254|192\.168|172\.(1[6-9]|2\d|3[01]))\./i.test(bareHost); // IPv4-mapped
      if (
        host === "localhost" || host === "0.0.0.0" ||
        /^127\./.test(host) || /^10\./.test(host) ||
        /^192\.168\./.test(host) || /^169\.254\./.test(host) ||
        /^172\.(1[6-9]|2\d|3[0-1])\./.test(host) ||
        host.endsWith(".local") || host.endsWith(".internal") ||
        isIPv6Private
      ) return badUrl();
    }
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text:
                  "Isolate the person in this photo. Remove the entire background and replace it with full transparency. Keep the subject's body, clothing, hair and edges crisp. Output a high-quality transparent PNG of just the person, centered.",
              },
              { type: "image_url", image_url: { url: imageUrl } },
            ],
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!resp.ok) {
      if (resp.status === 429 || resp.status === 402) {
        return new Response(
          JSON.stringify({ error: resp.status === 429 ? "Rate limited" : "AI credits exhausted" }),
          { status: resp.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const t = await resp.text();
      console.error("AI gateway error", resp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const out: string | undefined = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!out) {
      return new Response(JSON.stringify({ error: "No image returned" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ imageUrl: out }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("photo-isolate error:", e);
    return new Response(JSON.stringify({ error: "Service unavailable" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
