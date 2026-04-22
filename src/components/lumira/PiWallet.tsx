import { Wallet, CheckCircle2, Loader2, LogOut, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { GlassPanel } from "./GlassPanel";
import { onVoiceCommand, reportCommandResult, type CommandSource } from "./voice-events";

interface PiUser {
  username: string;
  uid: string;
  balance: number;
}

function makeAddress() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 28; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

export function PiWallet() {
  const [status, setStatus] = useState<"idle" | "connecting" | "connected">("idle");
  const [user, setUser] = useState<PiUser | null>(null);
  const [copied, setCopied] = useState(false);
  const statusRef = useRef(status);
  statusRef.current = status;

  const connect = async (source?: CommandSource) => {
    if (statusRef.current !== "idle") {
      if (source) {
        reportCommandResult({
          command: "connect-pi-wallet", source, status: "error",
          message: statusRef.current === "connected" ? "Wallet already connected" : "Connection in progress",
        });
      }
      return;
    }
    setStatus("connecting");
    // Simulate Pi SDK login flow: request → consent → permissions → success
    await new Promise((r) => setTimeout(r, 1400));
    const newUser = {
      username: "lumira_pioneer",
      uid: makeAddress(),
      balance: +(Math.random() * 250 + 12).toFixed(4),
    };
    setUser(newUser);
    setStatus("connected");
    if (source) {
      reportCommandResult({
        command: "connect-pi-wallet", source, status: "success",
        message: `Authenticated as @${newUser.username}`,
      });
    }
  };

  // Voice / preset command integration
  useEffect(() => {
    return onVoiceCommand((cmd, source) => {
      if (cmd === "connect-pi-wallet") void connect(source);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const disconnect = () => {
    setUser(null);
    setStatus("idle");
  };

  const copyUid = async () => {
    if (!user) return;
    try {
      await navigator.clipboard.writeText(user.uid);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* noop */
    }
  };

  return (
    <GlassPanel title="Pi Wallet · Web3" icon={<Wallet className="h-3.5 w-3.5" />} accent>
      <div className="space-y-4">
        <div className="relative overflow-hidden rounded-xl border border-accent/30 p-4"
          style={{ background: "var(--gradient-aurora)" }}
        >
          <div className="absolute inset-0 hud-grid opacity-30" />
          <div className="relative flex items-center justify-between">
            <div>
              <div className="text-[9px] uppercase tracking-[0.35em] text-foreground/70">π Network</div>
              <div className="mt-1 text-2xl font-light text-foreground text-glow-accent">
                {status === "connected" && user ? `${user.balance.toFixed(4)} π` : "—.—— π"}
              </div>
              <div className="mt-1 text-[10px] text-muted-foreground">
                {status === "connected" && user ? `@${user.username}` : "Not connected"}
              </div>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background/40 ring-1 ring-accent/40 backdrop-blur">
              <span className="text-xl font-light text-accent text-glow-accent">π</span>
            </div>
          </div>

          {status === "connected" && user && (
            <button
              onClick={copyUid}
              className="mt-3 flex w-full items-center justify-between rounded-lg border border-accent/20 bg-background/30 px-3 py-2 text-left text-[10px] font-mono text-muted-foreground transition hover:border-accent/40 hover:text-foreground"
            >
              <span className="truncate">{user.uid}</span>
              <span className="ml-2 inline-flex items-center gap-1 text-accent">
                {copied ? <CheckCircle2 className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copied ? "Copied" : "Copy"}
              </span>
            </button>
          )}
        </div>

        {status !== "connected" ? (
          <button
            onClick={() => connect("tap")}
            disabled={status === "connecting"}
            className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-full border border-accent/50 bg-gradient-to-r from-accent/20 via-primary/20 to-accent/20 px-5 py-3 text-xs uppercase tracking-[0.3em] text-foreground shadow-[var(--glow-accent)] transition hover:shadow-[var(--glow-primary)] disabled:opacity-70"
          >
            <span
              className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-foreground/10 to-transparent transition-transform duration-700 group-hover:translate-x-full"
            />
            {status === "connecting" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Authorizing…
              </>
            ) : (
              <>
                <Wallet className="h-4 w-4" /> Connect Pi Wallet
              </>
            )}
          </button>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" /> Authenticated
            </div>
            <button
              onClick={disconnect}
              className="inline-flex items-center gap-1.5 rounded-full border border-destructive/30 bg-destructive/5 px-3 py-1.5 text-[10px] uppercase tracking-widest text-destructive/80 transition hover:bg-destructive/15"
            >
              <LogOut className="h-3 w-3" /> Disconnect
            </button>
          </div>
        )}

        <p className="text-[10px] leading-relaxed text-muted-foreground">
          Simulated Pi SDK flow — replace with{" "}
          <span className="font-mono text-primary">Pi.authenticate()</span> for live mainnet integration.
        </p>
      </div>
    </GlassPanel>
  );
}
