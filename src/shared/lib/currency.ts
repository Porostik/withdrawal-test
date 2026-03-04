export const CURRENCIES = ["ETH", "USDT", "USDC"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const DEFAULT_BALANCES: Record<Currency, string> = {
  ETH: "10",
  USDT: "100",
  USDC: "100",
};
