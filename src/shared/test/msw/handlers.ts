import { http, HttpResponse } from "msw";

export const defaultBalances = {
  ETH: "10",
  USDT: "100",
  USDC: "100",
};

export const defaultWithdrawal = {
  id: "w1",
  status: "pending" as const,
  amount: "10",
  destination: "0xabc",
  currency: "ETH" as const,
  created_at: new Date().toISOString(),
};

export function createSuccessHandler(delayMs = 0) {
  let callCount = 0;
  const handler = http.post("/api/v1/withdrawals", async ({ request }) => {
    callCount++;
    if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));
    const body = (await request.json()) as {
      amount?: string;
      destination?: string;
      currency?: string;
    };
    return HttpResponse.json({
      ...defaultWithdrawal,
      amount: body?.amount ?? defaultWithdrawal.amount,
      destination: body?.destination ?? defaultWithdrawal.destination,
      currency: body?.currency ?? defaultWithdrawal.currency,
    });
  });
  (handler as { getCallCount?: () => number }).getCallCount = () => callCount;
  return handler;
}

export const successHandler = http.post(
  "/api/v1/withdrawals",
  async ({ request }) => {
    const body = (await request.json()) as {
      amount?: string;
      destination?: string;
      currency?: string;
    };
    return HttpResponse.json({
      ...defaultWithdrawal,
      amount: body?.amount ?? defaultWithdrawal.amount,
      destination: body?.destination ?? defaultWithdrawal.destination,
      currency: body?.currency ?? defaultWithdrawal.currency,
    });
  },
);

export const conflictHandler = http.post("/api/v1/withdrawals", () =>
  HttpResponse.json({ message: "Duplicate request" }, { status: 409 }),
);

export const getWithdrawalHandler = http.get(
  "/api/v1/withdrawals/:id",
  ({ params }) =>
    HttpResponse.json({
      ...defaultWithdrawal,
      id: params.id,
    }),
);

export const listWithdrawalsHandler = http.get("/api/v1/withdrawals", () =>
  HttpResponse.json([defaultWithdrawal]),
);

export const loginHandler = http.post(
  "/api/v1/auth/login",
  async ({ request }) => {
    const body = (await request.json()) as { login?: string };
    const login = body?.login ?? "user";
    return HttpResponse.json({ userId: "user_1", login }, { status: 200 });
  },
);

export const getMeHandler = http.get("/api/v1/auth/me", () =>
  HttpResponse.json({ userId: "user_1", login: "user" }, { status: 200 }),
);

export const getBalancesHandler = http.get("/api/v1/balances", () =>
  HttpResponse.json({ balances: defaultBalances }, { status: 200 }),
);
