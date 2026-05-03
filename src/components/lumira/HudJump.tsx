import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Sparkles } from "lucide-react";
import { useT } from "./i18n";

interface ModuleEntry {
  id: string;
  label: string;
  labelAr: string;
  hint: string;
  hintAr: string;
}

const MODULES: ModuleEntry[] = [
  { id: "mod-skin",     label: "AI Skin",          labelAr: "بشرة AI",        hint: "Skin analysis",       hintAr: "تحليل البشرة" },
  { id: "mod-vitals",   label: "Vital Tracker",    labelAr: "متعقّب الحيوية",  hint: "Voice & vitals",      hintAr: "الصوت والحيوية" },
  { id: "mod-tryon",    label: "Virtual Try-On",   labelAr: "تجربة افتراضية",  hint: "Fashion stage",       hintAr: "خشبة الموضة" },
  { id: "mod-daily",    label: "Daily Dashboard",  labelAr: "اللوحة اليومية",  hint: "Time & weather",      hintAr: "الوقت والطقس" },
  { id: "mod-wallet",   label: "Pi Wallet",        labelAr: "محفظة Pi",        hint: "Pay with Pi",         hintAr: "ادفع بـ Pi" },
  { id: "mod-profile",  label: "Profile Data",     labelAr: "بيانات الملف",    hint: "Body & preferences",  hintAr: "الجسد والتفضيلات" },
];

function highlight(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  el.classList.add("hud-jump-flash");
  window.setTimeout(() => el.classList.remove("hud-jump-flash"), 1600);
}

export function HudJump() {
  const { lang } = useT();
  const isAr = lang === "ar";
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Open with Cmd/Ctrl+K or "/"
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (!typing && e.key === "/")) {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open]);

  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 30); }, [open]);

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return MODULES;
    return MODULES.filter((m) =>
      [m.label, m.labelAr, m.hint, m.hintAr].some((s) => s.toLowerCase().includes(needle)),
    );
  }, [q]);

  useEffect(() => { setActive(0); }, [q, open]);

  const jump = (id: string) => {
    setOpen(false);
    setQ("");
    setTimeout(() => highlight(id), 50);
  };

  return (
    <>
      {/* Trigger */}
      <button
        onClick={() => setOpen(true)}
        title={isAr ? "بحث الوحدات (Ctrl+K)" : "Jump to module (Ctrl+K)"}
        className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-card/40 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-primary backdrop-blur transition hover:border-primary hover:shadow-[var(--glow-soft)]"
      >
        <Search className="h-3 w-3" />
        {isAr ? "بحث" : "Jump"}
        <kbd className="rounded border border-primary/40 px-1 text-[8px] opacity-70">⌘K</kbd>
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-start justify-center bg-background/70 px-4 pt-24 backdrop-blur-md animate-fade-in"
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md overflow-hidden rounded-2xl border border-primary/40 bg-card/80 shadow-[var(--glow-primary)]"
          >
            <div className="flex items-center gap-2 border-b border-primary/20 px-4 py-3">
              <Sparkles className="h-4 w-4 text-accent" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={isAr ? "ابحث عن وحدة…" : "Search HUD modules…"}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => Math.min(results.length - 1, i + 1)); }
                  else if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => Math.max(0, i - 1)); }
                  else if (e.key === "Enter" && results[active]) { e.preventDefault(); jump(results[active].id); }
                }}
                className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
              <kbd className="rounded border border-primary/40 px-1 text-[9px] text-muted-foreground">ESC</kbd>
            </div>
            <ul className="max-h-72 overflow-y-auto py-1">
              {results.length === 0 && (
                <li className="px-4 py-6 text-center text-xs text-muted-foreground">
                  {isAr ? "لا توجد نتائج" : "No matches"}
                </li>
              )}
              {results.map((m, i) => (
                <li key={m.id}>
                  <button
                    onMouseEnter={() => setActive(i)}
                    onClick={() => jump(m.id)}
                    className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-start transition ${
                      i === active ? "bg-accent/15 text-accent" : "text-foreground hover:bg-primary/10"
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="text-xs font-medium tracking-wide">
                        {isAr ? m.labelAr : m.label}
                      </span>
                      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                        {isAr ? m.hintAr : m.hint}
                      </span>
                    </div>
                    <span className="text-[9px] uppercase tracking-widest opacity-60">↵</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
