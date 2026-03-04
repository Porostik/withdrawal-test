import type { Currency } from "@/shared/lib/currency";
import { DEFAULT_BALANCES } from "@/shared/lib/currency";
import { getRedis } from "@/shared/redis";

export type User = {
  userId: string;
  login: string;
  balances: Record<Currency, string>;
  createdAt: number;
};

const KEY_LOGIN = (login: string) => `user:login:${login}`;
const KEY_ID = (userId: string) => `user:id:${userId}`;

function parseNum(s: string): number {
  const n = parseFloat(String(s).trim());
  return Number.isNaN(n) ? 0 : n;
}

function parseUser(raw: string | null): User | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as User;
    return (
      data &&
      typeof data.userId === "string" &&
      typeof data.login === "string" &&
      data.balances &&
      typeof data.balances === "object"
        ? data
        : null
    );
  } catch {
    return null;
  }
}

export async function getOrCreateUser(login: string): Promise<User> {
  const redis = await getRedis();
  const existing = await redis.get(KEY_LOGIN(login));
  const user = parseUser(existing);
  if (user) return user;

  const userId = crypto.randomUUID();
  const newUser: User = {
    userId,
    login,
    balances: { ...DEFAULT_BALANCES },
    createdAt: Date.now(),
  };
  const json = JSON.stringify(newUser);
  await redis.set(KEY_LOGIN(login), json);
  await redis.set(KEY_ID(userId), json);
  return newUser;
}

export async function getUserById(userId: string): Promise<User | null> {
  const redis = await getRedis();
  const raw = await redis.get(KEY_ID(userId));
  return parseUser(raw);
}

export async function getBalance(
  userId: string,
  currency: Currency,
): Promise<number> {
  const user = await getUserById(userId);
  if (!user) return 0;
  return parseNum(user.balances[currency]);
}

export async function debit(
  userId: string,
  currency: Currency,
  amount: number,
): Promise<
  | { ok: true; newBalances: Record<Currency, string> }
  | { ok: false; reason: "insufficient" }
> {
  if (amount <= 0) return { ok: false, reason: "insufficient" };
  const user = await getUserById(userId);
  if (!user) return { ok: false, reason: "insufficient" };
  const current = parseNum(user.balances[currency]);
  const next = current - amount;
  if (next < 0) return { ok: false, reason: "insufficient" };
  const newBalances = { ...user.balances, [currency]: String(next) };
  const updated: User = { ...user, balances: newBalances };
  const redis = await getRedis();
  const json = JSON.stringify(updated);
  await redis.set(KEY_ID(userId), json);
  await redis.set(KEY_LOGIN(user.login), json);
  return { ok: true, newBalances };
}
