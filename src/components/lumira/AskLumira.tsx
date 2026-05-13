import { useState, type FormEvent } from "react";
import { Sparkles, Send } from "lucide-react";
import { useOutfit } from "./outfit-context";
import { useT } from "./i18n";

export function AskLumira() {
  const { lang } = useT();
  const isAr = lang === "ar";
  const { applyPrompt, prompt, reset } = useOutfit();
  const [value, setValue] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    applyPrompt(value.trim());
    setValue("");
  }

  return (
    <form
      onSubmit={submit}
      className="glass-panel relative flex items-center gap-2 rounded-full border border-accent/30 px-3 py-2 shadow-[var(--glow-soft)] backdrop-blur-xl"
    >
      <Sparkles className="h-4 w-4 shrink-0 text-accent" />
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={isAr
          ? "اطلب من لوميرا أي إطلالة... (مثال: فستان أحمر أنيق)"
          : "Ask Lumira anything… (e.g. elegant red dress)"}
        className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
      />
      {prompt && (
        <button
          type="button"
          onClick={reset}
          className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          {isAr ? "مسح" : "Clear"}
        </button>
      )}
      <button
        type="submit"
        className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-white shadow-[var(--glow-primary)] transition active:scale-95"
        aria-label="apply"
      >
        <Send className="h-3.5 w-3.5" />
      </button>
    </form>
  );
}
