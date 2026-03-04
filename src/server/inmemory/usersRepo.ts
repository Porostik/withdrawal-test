import type { Currency } from "@/shared/lib/currency";
import { DEFAULT_BALANCES } from "@/shared/lib/currency";

export type User = {
  userId: string;
  login: string;
  balances: Record<Currency, string>;
  createdAt: number;
};

const usersByLogin = new Map<string, User>();

function parseNum(s: string): number {
  const n = parseFloat(String(s).trim());
  return Number.isNaN(n) ? 0 : n;
}

export function getOrCreateUser(login: string): User {
  const existing = usersByLogin.get(login);
  if (existing) return existing;
  const userId = crypto.randomUUID();
  const user: User = {
    userId,
    login,
    balances: { ...DEFAULT_BALANCES },
    createdAt: Date.now(),
  };
  usersByLogin.set(login, user);
  return user;
}

export function getUserById(userId: string): User | null {
  for (const u of usersByLogin.values()) {
    if (u.userId === userId) return u;
  }
  return null;
}

export function getBalance(userId: string, currency: Currency): number {
  const user = getUserById(userId);
  if (!user) return 0;
  return parseNum(user.balances[currency]);
}

export function debit(
  userId: string,
  currency: Currency,
  amount: number,
):
  | { ok: true; newBalances: Record<Currency, string> }
  | { ok: false; reason: "insufficient" } {
  if (amount <= 0) return { ok: false, reason: "insufficient" };
  const user = getUserById(userId);
  if (!user) return { ok: false, reason: "insufficient" };
  const current = parseNum(user.balances[currency]);
  const next = current - amount;
  if (next < 0) return { ok: false, reason: "insufficient" };
  const newBalances = { ...user.balances, [currency]: String(next) };
  user.balances = newBalances;
  return { ok: true, newBalances };
}
