import { requestJSON } from "./http";
import type { Withdrawal } from "@/entities/withdrawal/model/types";
import type { Currency } from "@/shared/lib/currency";

const base = typeof window !== "undefined" ? "" : process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function createWithdrawal(
  payload: { amount: string; destination: string; currency: Currency },
  idempotencyKey: string
): Promise<Withdrawal> {
  return requestJSON<Withdrawal>(`${base}/api/v1/withdrawals`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify(payload),
  });
}

export async function getWithdrawal(id: string): Promise<Withdrawal> {
  return requestJSON<Withdrawal>(`${base}/api/v1/withdrawals/${encodeURIComponent(id)}`, {
    method: "GET",
  });
}

export async function listWithdrawals(): Promise<Withdrawal[]> {
  return requestJSON<Withdrawal[]>(`${base}/api/v1/withdrawals`, {
    method: "GET",
  });
}
