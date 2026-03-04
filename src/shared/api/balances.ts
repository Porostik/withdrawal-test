import { requestJSON } from "./http";
import type { Currency } from "@/shared/lib/currency";

const base = typeof window !== "undefined" ? "" : process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function getBalances(): Promise<Record<Currency, string>> {
  const data = await requestJSON<{ balances: Record<Currency, string> }>(
    `${base}/api/v1/balances`,
    { method: "GET" }
  );
  return data.balances;
}
