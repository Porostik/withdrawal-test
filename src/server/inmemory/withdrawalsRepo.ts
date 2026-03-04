import type { Currency } from "@/shared/lib/currency";

export type Withdrawal = {
  id: string;
  status: "pending" | "success";
  amount: string;
  destination: string;
  currency: Currency;
  created_at: string;
};

type WithdrawalRecord = Withdrawal & { userId: string };

const withdrawals = new Map<string, WithdrawalRecord>();
const idempotencyByUser = new Map<string, Map<string, string>>();

const PENDING_TO_SUCCESS_MS = 2000;

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

export function hasIdempotencyConflict(
  userId: string,
  idempotencyKey: string,
): boolean {
  const userMap = idempotencyByUser.get(userId);
  if (!userMap) return false;
  const existingId = userMap.get(idempotencyKey);
  if (!existingId) return false;
  const existing = withdrawals.get(existingId);
  return Boolean(existing && existing.userId === userId);
}

export function createWithdrawal(
  amount: string,
  destination: string,
  currency: Currency,
  idempotencyKey: string,
  userId: string,
): CreateResult {
  let userMap = idempotencyByUser.get(userId);
  if (!userMap) {
    userMap = new Map();
    idempotencyByUser.set(userId, userMap);
  }
  const existingId = userMap.get(idempotencyKey);
  if (existingId) {
    const existing = withdrawals.get(existingId);
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
  withdrawals.set(id, withdrawal);
  userMap.set(idempotencyKey, id);
  const { userId: _u, ...data } = withdrawal;
  return { type: "ok", data };
}

export function getWithdrawal(id: string, userId: string): GetResult {
  const raw = withdrawals.get(id);
  if (!raw || raw.userId !== userId) return { type: "not_found" };
  const updated = maybePromoteStatus(raw);
  if (updated.status !== raw.status) withdrawals.set(id, updated);
  const { userId: _u, ...data } = updated;
  return { type: "ok", data };
}

export function listWithdrawalsByUser(userId: string): Withdrawal[] {
  const list: WithdrawalRecord[] = [];
  for (const w of withdrawals.values()) {
    if (w.userId === userId) list.push(maybePromoteStatus(w));
  }
  for (const w of list) {
    const current = withdrawals.get(w.id);
    if (current && current.status !== w.status) withdrawals.set(w.id, w);
  }
  list.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
  return list.map(({ userId: _u, ...data }) => data);
}
