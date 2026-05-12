import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
  title?: string;
  icon?: ReactNode;
  accent?: boolean;
}

export function GlassPanel({ children, className, title, icon, accent }: GlassPanelProps) {
  return (
    <div className={cn("glass-panel glass-panel-hover relative overflow-hidden p-6 sm:p-7", className)}>
      {/* subtle ambient glow */}
      <span aria-hidden className="pointer-events-none absolute -top-16 -left-16 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
      <span aria-hidden className="pointer-events-none absolute -bottom-16 -right-16 h-40 w-40 rounded-full bg-accent/10 blur-3xl" />

      {title && (
        <div className="mb-4 flex items-center justify-between border-b border-primary/15 pb-3">
          <div className="flex items-center gap-2">
            {icon && <span className="text-primary">{icon}</span>}
            <h3 className="text-xs font-medium uppercase tracking-[0.25em] text-muted-foreground">
              {title}
            </h3>
          </div>
          <span className={cn(
            "h-2 w-2 rounded-full animate-pulse-glow",
            accent ? "bg-accent shadow-[0_0_12px_var(--accent)]" : "bg-primary shadow-[0_0_12px_var(--primary)]"
          )} />
        </div>
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
