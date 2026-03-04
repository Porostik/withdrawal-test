import { NextResponse } from "next/server";
import {
  hasIdempotencyConflict,
  createWithdrawal,
  listWithdrawalsByUser,
} from "@/server/inmemory/withdrawalsRepo";
import { getUserFromRequest } from "@/server/auth/getUserFromRequest";
import { getBalance, debit } from "@/server/inmemory/usersRepo";
import { CURRENCIES, type Currency } from "@/shared/lib/currency";

export async function GET(_req: Request) {
  const userId = await getUserFromRequest();
  if (!userId) {
    return NextResponse.json(
      { message: "Unauthorized" },
      { status: 401 }
    );
  }
  const list = listWithdrawalsByUser(userId);
  return NextResponse.json(list, { status: 200 });
}

function getIdempotencyKey(request: Request): string | null {
  const key = request.headers.get("idempotency-key");
  return key ? key.trim() : null;
}

function parseAmount(s: unknown): number {
  if (typeof s === "number" && !Number.isNaN(s)) return s;
  const t = typeof s === "string" ? s.trim() : "";
  const n = parseFloat(t);
  return Number.isNaN(n) ? 0 : n;
}

export async function POST(request: Request) {
  const userId = await getUserFromRequest();
  if (!userId) {
    return NextResponse.json(
      { message: "Unauthorized" },
      { status: 401 }
    );
  }

  const idempotencyKey = getIdempotencyKey(request);
  if (!idempotencyKey) {
    return NextResponse.json(
      { message: "Idempotency-Key header is required" },
      { status: 400 }
    );
  }

  if (hasIdempotencyConflict(userId, idempotencyKey)) {
    return NextResponse.json(
      { message: "Duplicate request" },
      { status: 409 }
    );
  }

  let body: { amount?: unknown; destination?: unknown; currency?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const currencyRaw = body.currency;
  const currency =
    typeof currencyRaw === "string" && CURRENCIES.includes(currencyRaw as Currency)
      ? (currencyRaw as Currency)
      : null;
  if (!currency) {
    return NextResponse.json(
      { message: "currency must be one of ETH, USDT, USDC" },
      { status: 400 }
    );
  }

  const amountRaw = body.amount;
  const amountStr =
    typeof amountRaw === "string"
      ? amountRaw.trim()
      : typeof amountRaw === "number"
        ? String(amountRaw)
        : "";
  const amountNum = parseAmount(amountStr);
  if (amountStr === "" || amountNum <= 0) {
    return NextResponse.json(
      { message: "amount must be a positive number" },
      { status: 400 }
    );
  }

  const destinationRaw = body.destination;
  const destination =
    typeof destinationRaw === "string" ? destinationRaw.trim() : "";
  if (destination.length < 3) {
    return NextResponse.json(
      { message: "destination must be at least 3 characters" },
      { status: 400 }
    );
  }

  const balance = getBalance(userId, currency);
  if (amountNum > balance) {
    return NextResponse.json(
      { message: "Insufficient balance" },
      { status: 400 }
    );
  }

  const debitResult = debit(userId, currency, amountNum);
  if (!debitResult.ok) {
    return NextResponse.json(
      { message: "Insufficient balance" },
      { status: 400 }
    );
  }

  const result = createWithdrawal(
    amountStr,
    destination,
    currency,
    idempotencyKey,
    userId
  );

  if (result.type === "conflict") {
    return NextResponse.json(
      { message: "Duplicate request" },
      { status: 409 }
    );
  }
  if (result.type === "bad_request") {
    return NextResponse.json({ message: result.message }, { status: 400 });
  }

  return NextResponse.json(result.data, { status: 200 });
}
