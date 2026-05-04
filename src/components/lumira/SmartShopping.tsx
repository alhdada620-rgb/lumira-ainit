import { ShoppingCart, ExternalLink, Ruler } from "lucide-react";
import { useMemo } from "react";
import { GlassPanel } from "./GlassPanel";
import { useProfile } from "./profile-context";
import { useT } from "./i18n";
import amazonLogo from "@/assets/amazon-logo.png";

const AMAZON_TAG = "lumiraai-20";

type BodyType = "slim" | "regular" | "athletic" | "curvy" | "plus";

function computeSize(heightCm: number, weightKg: number, gender: "male" | "female") {
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);

  // Apparel size (roughly aligned with international S/M/L)
  let topSize: string;
  if (bmi < 18.5) topSize = "XS";
  else if (bmi < 22) topSize = "S";
  else if (bmi < 26) topSize = "M";
  else if (bmi < 30) topSize = "L";
  else if (bmi < 34) topSize = "XL";
  else topSize = "XXL";

  // Trouser waist (very rough estimate, in inches)
  const waist = Math.round(24 + (bmi - 18) * 1.6);
  const bottomSize = `${Math.max(26, Math.min(46, waist))}"`;

  let body: BodyType = "regular";
  if (bmi < 19) body = "slim";
  else if (bmi < 23 && gender === "male") body = "athletic";
  else if (bmi < 26) body = "regular";
  else if (bmi < 30) body = "curvy";
  else body = "plus";

  return { bmi, topSize, bottomSize, body };
}

interface Reco {
  id: string;
  name: { en: string; ar: string };
  brand: string;
  category: { en: string; ar: string };
  query: string;
  price: string; // display only
  gradient: string;
  forGender: "male" | "female" | "any";
  forBody?: BodyType[];
}

const RECOS: Reco[] = [
  { id: "r1", name: { en: "Slim-Fit Cotton Tee", ar: "تيشيرت قطني سليم" }, brand: "Amazon Essentials",
    category: { en: "Top", ar: "علوي" }, query: "amazon essentials slim fit cotton t-shirt men",
    price: "$14.90", gradient: "linear-gradient(135deg, oklch(0.55 0.1 230), oklch(0.4 0.08 240))",
    forGender: "male", forBody: ["slim", "athletic", "regular"] },
  { id: "r2", name: { en: "Tailored Chino Pants", ar: "بنطلون تشينو مفصل" }, brand: "Levi's",
    category: { en: "Bottom", ar: "سفلي" }, query: "levis tailored chino pants men",
    price: "$48.00", gradient: "linear-gradient(135deg, oklch(0.5 0.06 60), oklch(0.35 0.05 50))",
    forGender: "male", forBody: ["athletic", "regular", "curvy"] },
  { id: "r3", name: { en: "Comfort Stretch Polo", ar: "بولو مريح مرن" }, brand: "Calvin Klein",
    category: { en: "Top", ar: "علوي" }, query: "calvin klein stretch polo shirt",
    price: "$39.50", gradient: "linear-gradient(135deg, oklch(0.4 0.05 260), oklch(0.25 0.04 260))",
    forGender: "male", forBody: ["regular", "curvy", "plus"] },
  { id: "r4", name: { en: "Flowy Midi Dress", ar: "فستان ميدي انسيابي" }, brand: "Amazon Essentials",
    category: { en: "Dress", ar: "فستان" }, query: "amazon essentials midi dress women",
    price: "$32.00", gradient: "linear-gradient(135deg, oklch(0.6 0.15 350), oklch(0.45 0.13 320))",
    forGender: "female", forBody: ["slim", "regular", "curvy"] },
  { id: "r5", name: { en: "High-Rise Skinny Jeans", ar: "جينز ضيق برفعة عالية" }, brand: "Levi's",
    category: { en: "Bottom", ar: "سفلي" }, query: "levis 721 high rise skinny jeans women",
    price: "$59.50", gradient: "linear-gradient(135deg, oklch(0.4 0.07 240), oklch(0.25 0.05 250))",
    forGender: "female", forBody: ["slim", "athletic", "regular"] },
  { id: "r6", name: { en: "Plus-Size Wrap Blouse", ar: "بلوزة لف مقاسات كبيرة" }, brand: "Daily Ritual",
    category: { en: "Top", ar: "علوي" }, query: "daily ritual plus size wrap blouse",
    price: "$36.00", gradient: "linear-gradient(135deg, oklch(0.55 0.12 20), oklch(0.4 0.1 15))",
    forGender: "female", forBody: ["curvy", "plus"] },
  { id: "r7", name: { en: "Performance Athletic Hoodie", ar: "هودي رياضي عالي الأداء" }, brand: "Under Armour",
    category: { en: "Top", ar: "علوي" }, query: "under armour performance hoodie",
    price: "$54.99", gradient: "linear-gradient(135deg, oklch(0.3 0.04 260), oklch(0.45 0.06 250))",
    forGender: "any", forBody: ["athletic", "regular"] },
  { id: "r8", name: { en: "Relaxed-Fit Linen Shirt", ar: "قميص كتان واسع" }, brand: "Amazon Essentials",
    category: { en: "Top", ar: "علوي" }, query: "amazon essentials linen shirt relaxed fit",
    price: "$28.00", gradient: "linear-gradient(135deg, oklch(0.78 0.05 80), oklch(0.6 0.06 70))",
    forGender: "any", forBody: ["regular", "curvy", "plus"] },
];

export function SmartShopping() {
  const { lang } = useT();
  const isAr = lang === "ar";
  const { height, weight, gender } = useProfile();

  const fit = useMemo(() => computeSize(height, weight, gender), [height, weight, gender]);

  const recommendations = useMemo(() => {
    return RECOS.filter(
      (r) =>
        (r.forGender === "any" || r.forGender === gender) &&
        (!r.forBody || r.forBody.includes(fit.body)),
    ).slice(0, 6);
  }, [fit.body, gender]);

  const amazonUrl = (q: string) => {
    const sized = `${q} size ${fit.topSize.toLowerCase()}`;
    return `https://www.amazon.com/s?k=${encodeURIComponent(sized)}&tag=${AMAZON_TAG}`;
  };

  const bodyLabel: Record<BodyType, { en: string; ar: string }> = {
    slim: { en: "Slim", ar: "نحيف" },
    regular: { en: "Regular", ar: "عادي" },
    athletic: { en: "Athletic", ar: "رياضي" },
    curvy: { en: "Curvy", ar: "ممتلئ" },
    plus: { en: "Plus", ar: "كبير" },
  };

  return (
    <GlassPanel
      title={isAr ? "تسوّق ذكي · Amazon" : "Smart Shopping · Amazon"}
      icon={<ShoppingCart className="h-3.5 w-3.5" />}
      accent
    >
      <div className="space-y-3">
        {/* Profile-based fit summary */}
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-primary/25 bg-card/30 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-foreground/85">
          <Ruler className="h-3 w-3 text-accent" />
          <span>{isAr ? "مقاسك الموصى به" : "Your fit"}:</span>
          <span className="rounded-full border border-accent/50 bg-accent/10 px-2 py-0.5 text-accent">
            {isAr ? "علوي" : "Top"} {fit.topSize}
          </span>
          <span className="rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-primary">
            {isAr ? "خصر" : "Waist"} {fit.bottomSize}
          </span>
          <span className="rounded-full border border-foreground/30 bg-background/40 px-2 py-0.5 text-foreground/85">
            {bodyLabel[fit.body][isAr ? "ar" : "en"]}
          </span>
          <span className="ms-auto text-muted-foreground">
            BMI {fit.bmi.toFixed(1)}
          </span>
        </div>

        {/* Recommendations grid */}
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {recommendations.map((r) => (
            <article
              key={r.id}
              className="group overflow-hidden rounded-lg border border-primary/25 bg-card/30 backdrop-blur transition hover:border-accent/50 hover:shadow-[var(--glow-soft)]"
            >
              <div className="relative h-20" style={{ background: r.gradient }}>
                <div className="absolute inset-0 hud-grid opacity-25" />
                <span className="absolute end-1.5 top-1.5 rounded-full border border-foreground/20 bg-background/60 px-1.5 py-0.5 text-[8px] uppercase tracking-widest text-foreground/85 backdrop-blur">
                  {r.category[isAr ? "ar" : "en"]}
                </span>
                <span className="absolute start-1.5 bottom-1.5 rounded-full border border-accent/50 bg-background/60 px-1.5 py-0.5 text-[8px] uppercase tracking-widest text-accent backdrop-blur">
                  {fit.topSize}
                </span>
              </div>
              <div className="space-y-1 p-2">
                <p className="truncate text-[11px] text-foreground">{r.name[isAr ? "ar" : "en"]}</p>
                <div className="flex items-center justify-between text-[9px] text-muted-foreground">
                  <span className="truncate">{r.brand}</span>
                  <span className="text-primary">{r.price}</span>
                </div>
                <a
                  href={amazonUrl(r.query)}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className="mt-1 inline-flex w-full items-center justify-center gap-1 rounded-md border border-[oklch(0.7_0.18_70)]/60 bg-gradient-to-r from-[oklch(0.45_0.12_60)]/50 to-[oklch(0.6_0.16_55)]/40 px-2 py-1 text-[9px] uppercase tracking-widest text-[oklch(0.92_0.1_85)] transition hover:shadow-[var(--glow-accent)]"
                >
                  <img src={amazonLogo} alt="" className="h-2.5 w-auto" loading="lazy" />
                  {isAr ? "اشترِ على أمازون" : "Buy on Amazon"}
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
              </div>
            </article>
          ))}
        </div>

        <p className="text-center text-[9px] text-muted-foreground">
          {isAr
            ? "روابط الشراكة تدعم Lumira دون أي تكلفة إضافية عليك."
            : "Affiliate links support Lumira at no extra cost to you."}
        </p>
      </div>
    </GlassPanel>
  );
}
