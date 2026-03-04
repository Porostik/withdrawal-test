import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "@/shared/test/msw/server";
import { useWithdrawalStore } from "@/entities/withdrawal/model/store";
import { useSessionStore } from "@/entities/session/model/store";
import { useBalanceStore } from "@/entities/balance/model/store";
import WithdrawPage from "./page";

const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  prefetch: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
};
vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  usePathname: () => "",
  useSearchParams: () => new URLSearchParams(),
}));

function resetStores() {
  useWithdrawalStore.setState({
    status: "idle",
    errorMessage: undefined,
    errorCode: undefined,
    withdrawal: undefined,
    lastRequest: undefined,
  });
  useSessionStore.setState({ status: "authed", user: { login: "user" } });
  useBalanceStore.setState({ status: "idle", balances: undefined });
}

beforeEach(() => {
  resetStores();
  useSessionStore.setState({
    status: "authed",
    user: { login: "user" },
    loadMe: async () => {},
  });
});

async function waitForForm() {
  await waitFor(() => {
    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
  });
}

describe("Withdraw page", () => {
  it("renders withdraw form when session is authed", () => {
    render(<WithdrawPage />);
    expect(screen.getByRole("heading", { level: 1, name: "Withdraw" })).toBeInTheDocument();
    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
  });

  it("happy path: submit shows success with id and status", async () => {
    server.use(
      http.post("/api/v1/withdrawals", async ({ request }) => {
        await new Promise((r) => setTimeout(r, 50));
        const body = (await request.json()) as {
          amount?: string;
          destination?: string;
          currency?: string;
        };
        return HttpResponse.json({
          id: "w1",
          status: "pending",
          amount: body?.amount ?? "10",
          destination: body?.destination ?? "0xabc",
          currency: body?.currency ?? "ETH",
          created_at: new Date().toISOString(),
        });
      })
    );
    const user = userEvent.setup();
    render(<WithdrawPage />);

    await waitForForm();
    await user.type(screen.getByLabelText(/amount/i), "10");
    await user.type(screen.getByLabelText(/destination/i), "0xabc");
    await user.click(screen.getByRole("checkbox", { name: /confirm/i }));

    const submit = screen.getByRole("button", { name: /submit/i });
    expect(submit).not.toBeDisabled();
    await user.click(submit);

    await waitFor(() => expect(submit).toBeDisabled());
    await waitFor(() => {
      expect(screen.getByText("w1")).toBeInTheDocument();
    });
    expect(screen.getByText("pending")).toBeInTheDocument();
    expect(screen.getByText("0xabc")).toBeInTheDocument();
    expect(screen.getAllByText("10").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("ETH").length).toBeGreaterThanOrEqual(1);
  });

  it("API 409 shows friendly conflict message", async () => {
    server.use(
      http.post("/api/v1/withdrawals", () =>
        HttpResponse.json({ message: "Duplicate request" }, { status: 409 })
      )
    );
    const user = userEvent.setup();
    render(<WithdrawPage />);

    await waitForForm();
    await user.type(screen.getByLabelText(/amount/i), "10");
    await user.type(screen.getByLabelText(/destination/i), "0xabc");
    await user.click(screen.getByRole("checkbox", { name: /confirm/i }));
    await user.click(screen.getByRole("button", { name: /submit/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/duplicate request.*already submitted/i)
      ).toBeInTheDocument();
    });
  });

  it("double submit sends only one POST request", async () => {
    let postCallCount = 0;
    server.use(
      http.post("/api/v1/withdrawals", async ({ request }) => {
        postCallCount++;
        await new Promise((r) => setTimeout(r, 200));
        const body = (await request.json()) as { currency?: string };
        return HttpResponse.json({
          id: "w1",
          status: "pending",
          amount: "10",
          destination: "0xabc",
          currency: body?.currency ?? "ETH",
          created_at: new Date().toISOString(),
        });
      })
    );
    const user = userEvent.setup();
    render(<WithdrawPage />);

    await waitForForm();
    await user.type(screen.getByLabelText(/amount/i), "10");
    await user.type(screen.getByLabelText(/destination/i), "0xabc");
    await user.click(screen.getByRole("checkbox", { name: /confirm/i }));

    const submit = screen.getByRole("button", { name: /submit/i });
    await user.dblClick(submit);

    await waitFor(() => {
      expect(screen.getByText("w1")).toBeInTheDocument();
    });
    expect(postCallCount).toBe(1);
  });

  it("amount exceeding balance shows error and disables submit", async () => {
    const user = userEvent.setup();
    render(<WithdrawPage />);

    await waitForForm();
    await user.type(screen.getByLabelText(/amount/i), "999");
    await user.type(screen.getByLabelText(/destination/i), "0xabc");
    await user.click(screen.getByRole("checkbox", { name: /confirm/i }));

    expect(
      screen.getByText(/amount exceeds balance/i)
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /submit/i })).toBeDisabled();
  });
});
