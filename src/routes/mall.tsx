import { createFileRoute, Link } from "@tanstack/react-router";
import { ShoppingBag, ArrowLeft, ExternalLink } from "lucide-react";
import { GlassPanel } from "@/components/lumira/GlassPanel";
import { PiPayWallet } from "@/components/lumira/PiPayWallet";
import { LanguageProvider, useT } from "@/components/lumira/i18n";
import { WalletProvider } from "@/components/lumira/wallet-context";
import { ProfileProvider } from "@/components/lumira/profile-context";
import amazonLogo from "@/assets/amazon-logo.png";
import bgImg from "@/assets/lumira-bg.jpg";

import imgHmTee from "@/assets/garments/hm-tee.png";
import imgHmDenim from "@/assets/garments/hm-denim.png";
import imgNikeHoodie from "@/assets/garments/nike-hoodie.png";
import imgNikeJoggers from "@/assets/garments/nike-joggers.png";
import imgZaraBlazer from "@/assets/garments/zara-blazer.png";
import imgZaraSlip from "@/assets/garments/zara-slip.png";
import imgAdidasJacket from "@/assets/garments/adidas-jacket.png";
import imgNamshiKaftan from "@/assets/garments/namshi-kaftan.png";

const AMAZON_TAG = "lumiraai-20";
const amazonUrl = (q: string) =>
  `https://www.amazon.com/s?k=${encodeURIComponent(q)}&tag=${AMAZON_TAG}`;

interface Item { id: string; name: string; brand: string; price: number; image: string; query: string }

const ITEMS: Item[] = [
  { id: "m-1", name: "Oversized Cotton Tee", brand: "H&M", price: 14.99, image: imgHmTee, query: "h&m oversized cotton tee" },
  { id: "m-2", name: "Relaxed Denim Jacket", brand: "H&M", price: 49.99, image: imgHmDenim, query: "h&m relaxed denim jacket" },
  { id: "m-3", name: "Tech Fleece Hoodie", brand: "Nike", price: 89.99, image: imgNikeHoodie, query: "nike tech fleece hoodie" },
  { id: "m-4", name: "Tech Pack Joggers", brand: "Nike", price: 79.99, image: imgNikeJoggers, query: "nike tech pack joggers" },
  { id: "m-5", name: "Tailored Wool Blazer", brand: "Zara", price: 129.0, image: imgZaraBlazer, query: "zara tailored wool blazer" },
  { id: "m-6", name: "Satin Slip Dress", brand: "Zara", price: 69.0, image: imgZaraSlip, query: "zara satin slip dress" },
  { id: "m-7", name: "Originals Track Jacket", brand: "Adidas", price: 84.0, image: imgAdidasJacket, query: "adidas originals track jacket" },
  { id: "m-8", name: "Royal Velvet Kaftan", brand: "Namshi", price: 119.0, image: imgNamshiKaftan, query: "namshi velvet kaftan" },
];

export const Route = createFileRoute("/mall")({
  component: MallShell,
  ssr: false,
  head: () => ({
    meta: [
      { title: "Lumira Mall — Shop with Amazon & Pi" },
      { name: "description", content: "Browse curated fashion from H&M, Nike, Zara, Adidas and Namshi. Buy on Amazon or pay seamlessly with Pi Network." },
    ],
  }),
});

function MallShell() {
  return (
    <LanguageProvider>
      <WalletProvider>
        <ProfileProvider>
          <MallPage />
        </ProfileProvider>
      </WalletProvider>
    </LanguageProvider>
  );
}

function MallPage() {
  const { lang } = useT();
  const isAr = lang === "ar";

  return (
    <>
      <div
        className="fixed inset-0 -z-10 bg-cover bg-center"
        style={{ backgroundImage: `url(${bgImg})`, filter: "blur(8px) brightness(0.55)" }}
        aria-hidden
      />
      <div
        className="fixed inset-0 -z-10"
        style={{ background: "radial-gradient(ellipse at center, oklch(0.15 0.03 230 / 0.55) 0%, oklch(0.08 0.02 235 / 0.85) 100%)" }}
        aria-hidden
      />

      <main className="relative z-10 min-h-screen px-4 py-6 md:px-8 md:py-8">
        <header className="mb-6 flex items-center justify-between gap-3">
          <Link
            to="/"
            className="flex items-center gap-2 rounded-full border border-primary/40 bg-card/40 px-4 py-2 text-xs uppercase tracking-[0.3em] text-primary backdrop-blur transition hover:shadow-[var(--glow-soft)]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {isAr ? "المرآة" : "Mirror"}
          </Link>
          <h1 className="flex items-center gap-2 text-lg font-light tracking-[0.4em] text-foreground text-glow md:text-xl">
            <ShoppingBag className="h-5 w-5 text-primary" />
            {isAr ? "متجر لوميرا" : "LUMIRA · MALL"}
          </h1>
          <div className="w-[100px]" />
        </header>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <div className="order-2 lg:order-1 lg:col-span-9">
            <GlassPanel title={isAr ? "كتالوج التسوق" : "Shopping Catalog"} icon={<ShoppingBag className="h-3.5 w-3.5" />}>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                {ITEMS.map((it) => (
                  <article
                    key={it.id}
                    className="group relative overflow-hidden rounded-xl border border-primary/20 bg-background/40 p-3 backdrop-blur-xl transition hover:border-primary/60 hover:shadow-[var(--glow-soft)] animate-fade-in"
                  >
                    <div className="relative aspect-square overflow-hidden rounded-lg bg-gradient-to-br from-card/60 to-background/40">
                      <img src={it.image} alt={it.name} loading="lazy" className="absolute inset-0 h-full w-full object-contain p-3 transition-transform duration-500 group-hover:scale-105" />
                    </div>
                    <div className="mt-3 space-y-1">
                      <p className="text-[9px] uppercase tracking-[0.3em] text-accent text-glow-accent">{it.brand}</p>
                      <p className="text-xs font-medium text-foreground line-clamp-1">{it.name}</p>
                      <p className="text-[11px] tabular-nums text-muted-foreground">${it.price.toFixed(2)}</p>
                    </div>
                    <a
                      href={amazonUrl(it.query)}
                      target="_blank"
                      rel="noopener noreferrer sponsored"
                      className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-primary/50 bg-background/60 px-3 py-2 text-[10px] uppercase tracking-[0.25em] text-primary transition hover:border-primary hover:shadow-[var(--glow-primary)]"
                    >
                      <img src={amazonLogo} alt="Amazon" className="h-3" />
                      {isAr ? "اشترِ" : "Buy"}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </article>
                ))}
              </div>
            </GlassPanel>
          </div>

          <div className="order-1 space-y-5 lg:order-2 lg:col-span-3">
            <PiPayWallet />
          </div>
        </div>
      </main>
    </>
  );
}
