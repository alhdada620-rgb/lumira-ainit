import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { verifyPiAccessToken } from "@/lib/pi-auth.functions";

interface PiAuthUser {
  uid: string;
  username: string;
}

type PiAuthStatus = "idle" | "initializing" | "authenticating" | "verifying" | "authenticated" | "error";

interface PiAuthCtx {
  user: PiAuthUser | null;
  status: PiAuthStatus;
  error: string | null;
  isDemo: boolean;
  signIn: () => Promise<void>;
}

const DEMO_USER: PiAuthUser = { uid: "demo-pioneer", username: "Pioneer Demo" };

interface PiAuthResult {
  user: { uid: string; username: string };
  accessToken: string;
}

interface PiSDK {
  init(opts: { version: "2.0"; sandbox?: boolean }): unknown;
  authenticate(
    scopes: string[],
    onIncompletePaymentFound: (p: { identifier: string; transaction?: { txid: string } }) => void,
  ): Promise<PiAuthResult>;
}

const Ctx = createContext<PiAuthCtx | null>(null);

function waitForPi(timeoutMs = 8000): Promise<PiSDK> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Pi SDK only available in the browser"));
      return;
    }
    if (window.Pi) {
      resolve(window.Pi);
      return;
    }
    const start = Date.now();
    const id = window.setInterval(() => {
      if (window.Pi) {
        window.clearInterval(id);
        resolve(window.Pi);
      } else if (Date.now() - start > timeoutMs) {
        window.clearInterval(id);
        reject(new Error("Pi SDK did not load. Open inside the Pi Browser."));
      }
    }, 200);
  });
}

export function PiAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PiAuthUser | null>(null);
  const [status, setStatus] = useState<PiAuthStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const inFlight = useRef(false);
  const settled = useRef(false);

  const enterDemo = useCallback((reason: string) => {
    if (settled.current) return;
    settled.current = true;
    console.warn("[Pi] entering demo mode:", reason);
    setUser(DEMO_USER);
    setIsDemo(true);
    setStatus("authenticated");
  }, []);

  const signIn = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setError(null);
    try {
      setStatus("initializing");
      const Pi = await waitForPi(4000);

      const sandbox = (import.meta.env.VITE_PI_SANDBOX ?? "true") !== "false";
      await Promise.resolve(Pi.init({ version: "2.0", sandbox }));

      setStatus("authenticating");
      const auth = await Pi.authenticate(["username"], () => { /* no-op */ });

      setStatus("verifying");
      const result = await verifyPiAccessToken({ data: { accessToken: auth.accessToken } });

      if (settled.current) return;
      settled.current = true;
      setUser({ uid: result.uid, username: result.username });
      setIsDemo(false);
      setStatus("authenticated");
    } catch (e) {
      setError((e as Error).message);
      enterDemo((e as Error).message);
    } finally {
      inFlight.current = false;
    }
  }, [enterDemo]);

  // IMPORTANT: do NOT auto-trigger Pi.authenticate on mount — each call
  // consumes Pi Network credit. Enter demo immediately; the user explicitly
  // clicks "Sign in with Pi" (PiSignInButton) to spend credit intentionally.
  useEffect(() => {
    const t = window.setTimeout(() => enterDemo("no-auto-auth"), 300);
    return () => window.clearTimeout(t);
  }, [enterDemo]);


  const value = useMemo<PiAuthCtx>(
    () => ({ user, status, error, isDemo, signIn }),
    [user, status, error, isDemo, signIn],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePiAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("usePiAuth must be used within PiAuthProvider");
  return ctx;
}
