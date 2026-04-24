import { createContext, useCallback, useContext, useMemo, useState, ReactNode } from "react";

export interface UnlockedItem {
  id: string;
  name: string;
  price: number;
  ts: number;
}

interface WalletContextValue {
  /** Live π balance (mirrors PiWallet UI) */
  balance: number;
  /** Today's net change in π (display only) */
  todayDelta: number;
  /** Items the user has unlocked with Pi */
  unlocked: UnlockedItem[];
  isUnlocked: (id: string) => boolean;
  /** Attempts to deduct `price` and unlock the item. Returns true on success. */
  unlock: (item: { id: string; name: string; price: number }) => {
    ok: boolean;
    reason?: "already-unlocked" | "insufficient";
  };
}

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  // Initial balance matches the dashboard headline (1,247.83 π · +12.4 today).
  const [balance, setBalance] = useState(1247.83);
  const [todayDelta, setTodayDelta] = useState(12.4);
  const [unlocked, setUnlocked] = useState<UnlockedItem[]>([]);

  const isUnlocked = useCallback(
    (id: string) => unlocked.some((u) => u.id === id),
    [unlocked],
  );

  const unlock = useCallback<WalletContextValue["unlock"]>(
    ({ id, name, price }) => {
      if (unlocked.some((u) => u.id === id)) {
        return { ok: false, reason: "already-unlocked" };
      }
      if (balance < price) {
        return { ok: false, reason: "insufficient" };
      }
      setBalance((b) => +(b - price).toFixed(2));
      setTodayDelta((d) => +(d - price).toFixed(2));
      setUnlocked((prev) => [...prev, { id, name, price, ts: Date.now() }]);
      return { ok: true };
    },
    [balance, unlocked],
  );

  const value = useMemo<WalletContextValue>(
    () => ({ balance, todayDelta, unlocked, isUnlocked, unlock }),
    [balance, todayDelta, unlocked, isUnlocked, unlock],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}
