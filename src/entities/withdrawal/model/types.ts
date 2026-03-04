import type { Currency } from "@/shared/lib/currency";

export type WithdrawalStatus = "pending" | "success";

export interface Withdrawal {
  id: string;
  status: WithdrawalStatus;
  amount: string;
  destination: string;
  currency: Currency;
  created_at: string; // ISO
}
