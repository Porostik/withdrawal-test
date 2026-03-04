import { create } from "zustand";
import type { Currency } from "@/shared/lib/currency";

type BalanceStatus = "idle" | "loading" | "success" | "error";

interface BalanceState {
  status: BalanceStatus;
  balances?: Record<Currency, string>;
}

interface BalanceActions {
  fetchBalances: () => Promise<void>;
}

const base =
  typeof window !== "undefined"
    ? ""
    : process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const useBalanceStore = create<BalanceState & BalanceActions>(
  (set) => ({
    status: "idle",
    balances: undefined,

    fetchBalances: async () => {
      set({ status: "loading" });
      try {
        const res = await fetch(`${base}/api/v1/balances`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        set({
          status: "success",
          balances: data.balances,
        });
      } catch {
        set({ status: "error" });
      }
    },
  })
);
