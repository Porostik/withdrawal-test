import type { Currency } from "@/shared/lib/currency";
import { getRedis } from "@/shared/redis";

export type Withdrawal = {
  id: string;
  status: "pending" | "success";
  amount: string;
  destination: string;
  currency: Currency;
  created_at: string;
};

type WithdrawalRecord = Withdrawal & { userId: string };

const PENDING_TO_SUCCESS_MS = 2000;

const KEY_WITHDRAWAL = (id: string) => `withdrawal:${id}`;
const KEY_IDEMPOTENCY = (userId: string, key: string) =>
  `idempotency:${userId}:${key}`;
const KEY_USER_WITHDRAWALS = (userId: string) => `user:withdrawals:${userId}`;

function parseRecord(raw: string | null): WithdrawalRecord | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as WithdrawalRecord;
    return data?.id && data?.userId ? data : null;
  } catch {
    return null;
  }
}

function maybePromoteStatus(w: WithdrawalRecord): WithdrawalRecord {
  if (w.status !== "pending") return w;
  const createdMs = new Date(w.created_at).getTime();
  if (Date.now() - createdMs > PENDING_TO_SUCCESS_MS) {
    return { ...w, status: "success" as const };
  }
  return w;
}

export type CreateResult =
  | { type: "ok"; data: Withdrawal }
  | { type: "conflict" }
  | { type: "bad_request"; message: string };

export type GetResult =
  | { type: "ok"; data: Withdrawal }
  | { type: "not_found" };

export async function hasIdempotencyConflict(
  userId: string,
  idempotencyKey: string,
): Promise<boolean> {
  const redis = await getRedis();
  const existingId = await redis.get(KEY_IDEMPOTENCY(userId, idempotencyKey));
  if (!existingId) return false;
  const raw = await redis.get(KEY_WITHDRAWAL(existingId));
  const existing = parseRecord(raw);
  return Boolean(existing && existing.userId === userId);
}

export async function createWithdrawal(
  amount: string,
  destination: string,
  currency: Currency,
  idempotencyKey: string,
  userId: string,
): Promise<CreateResult> {
  const redis = await getRedis();
  const existingId = await redis.get(KEY_IDEMPOTENCY(userId, idempotencyKey));
  if (existingId) {
    const raw = await redis.get(KEY_WITHDRAWAL(existingId));
    const existing = parseRecord(raw);
    if (existing && existing.userId === userId) return { type: "conflict" };
  }

  const id = crypto.randomUUID();
  const created_at = new Date().toISOString();
  const withdrawal: WithdrawalRecord = {
    id,
    status: "pending",
    amount,
    destination,
    currency,
    created_at,
    userId,
  };
  const json = JSON.stringify(withdrawal);
  await redis.set(KEY_WITHDRAWAL(id), json);
  await redis.set(KEY_IDEMPOTENCY(userId, idempotencyKey), id);
  await redis.sAdd(KEY_USER_WITHDRAWALS(userId), id);

  const { userId: _uid, ...data } = withdrawal;
  void _uid;
  return { type: "ok", data };
}

export async function getWithdrawal(
  id: string,
  userId: string,
): Promise<GetResult> {
  const redis = await getRedis();
  const raw = await redis.get(KEY_WITHDRAWAL(id));
  const record = parseRecord(raw);
  if (!record || record.userId !== userId) return { type: "not_found" };

  const updated = maybePromoteStatus(record);
  if (updated.status !== record.status) {
    await redis.set(KEY_WITHDRAWAL(id), JSON.stringify(updated));
  }
  const { userId: _uid2, ...data } = updated;
  void _uid2;
  return { type: "ok", data };
}

export async function listWithdrawalsByUser(
  userId: string,
): Promise<Withdrawal[]> {
  const redis = await getRedis();
  const ids = await redis.sMembers(KEY_USER_WITHDRAWALS(userId));
  if (ids.length === 0) return [];

  const records: WithdrawalRecord[] = [];
  for (const id of ids) {
    const raw = await redis.get(KEY_WITHDRAWAL(id));
    const record = parseRecord(raw);
    if (record && record.userId === userId) {
      records.push(maybePromoteStatus(record));
    }
  }
  for (const w of records) {
    const raw = await redis.get(KEY_WITHDRAWAL(w.id));
    const current = parseRecord(raw);
    if (current && current.status !== w.status) {
      await redis.set(KEY_WITHDRAWAL(w.id), JSON.stringify(w));
    }
  }
  records.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
  return records.map((w) => ({
    id: w.id,
    status: w.status,
    amount: w.amount,
    destination: w.destination,
    currency: w.currency,
    created_at: w.created_at,
  }));
}
