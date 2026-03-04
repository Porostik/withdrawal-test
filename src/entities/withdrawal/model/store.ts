import { create } from "zustand";
import * as api from "@/shared/api/withdrawals";
import { ApiError, type ApiErrorCode } from "@/shared/api/http";
import { generateIdempotencyKey } from "@/shared/lib/idempotency";
import type { Currency } from "@/shared/lib/currency";
import type { Withdrawal } from "./types";
import { useBalanceStore } from "@/entities/balance/model/store";

type FlowStatus = "idle" | "loading" | "success" | "error";
type ListStatus = "idle" | "loading" | "error";

interface WithdrawalState {
  status: FlowStatus;
  errorMessage?: string;
  errorCode?: ApiErrorCode;
  withdrawal?: Withdrawal;
  lastRequest?: {
    payload: { amount: string; destination: string; currency: Currency };
    idempotencyKey: string;
  };
  withdrawals: Withdrawal[];
  listStatus?: ListStatus;
}

interface WithdrawalActions {
  submit: (payload: { amount: string; destination: string; currency: Currency }) => Promise<void>;
  retryLast: () => Promise<void>;
  fetchStatus: (id: string) => Promise<void>;
  refreshOne: (id: string) => Promise<void>;
  fetchList: () => Promise<void>;
}

function mapError(err: unknown): { message: string; code?: ApiErrorCode } {
  let message = "Something went wrong. Please try again.";
  let code: ApiErrorCode | undefined;
  if (err instanceof ApiError) {
    code = err.code;
    if (err.code === "conflict") {
      message = "Duplicate request. This withdrawal was already submitted.";
    } else if (err.code === "network") {
      message = "Network error. Please retry.";
    } else if (err.code === "unauthorized") {
      message = "Please login to continue.";
    } else if (err.code === "bad_request" && err.message) {
      message = err.message;
    }
  }
  return { message, code };
}

export const useWithdrawalStore = create<WithdrawalState & WithdrawalActions>(
  (set, get) => ({
    status: "idle",
    errorMessage: undefined,
    errorCode: undefined,
    withdrawal: undefined,
    lastRequest: undefined,
    withdrawals: [],
    listStatus: "idle",

    submit: async (payload) => {
      if (get().status === "loading") return;
      set({ status: "loading", errorMessage: undefined, errorCode: undefined });
      const idempotencyKey = generateIdempotencyKey();
      set({
        lastRequest: { payload, idempotencyKey },
      });
      try {
        const withdrawal = await api.createWithdrawal(payload, idempotencyKey);
        set((s) => {
          const exists = s.withdrawals.some((w) => w.id === withdrawal.id);
          const nextList = exists
            ? s.withdrawals
            : [withdrawal, ...s.withdrawals];
          return {
            status: "success" as const,
            withdrawal,
            errorMessage: undefined,
            errorCode: undefined,
            withdrawals: nextList,
          };
        });
        useBalanceStore.getState().fetchBalances();
      } catch (err) {
        const { message, code } = mapError(err);
        set({
          status: "error",
          errorMessage: message,
          errorCode: code,
        });
      }
    },

    retryLast: async () => {
      const { lastRequest, status } = get();
      if (!lastRequest || status === "loading") return;
      set({ status: "loading", errorMessage: undefined, errorCode: undefined });
      try {
        const withdrawal = await api.createWithdrawal(
          lastRequest.payload,
          lastRequest.idempotencyKey
        );
        set((s) => {
          const exists = s.withdrawals.some((w) => w.id === withdrawal.id);
          const nextList = exists
            ? s.withdrawals
            : [withdrawal, ...s.withdrawals];
          return {
            status: "success" as const,
            withdrawal,
            errorMessage: undefined,
            errorCode: undefined,
            withdrawals: nextList,
          };
        });
        useBalanceStore.getState().fetchBalances();
      } catch (err) {
        const { message, code } = mapError(err);
        set({
          status: "error",
          errorMessage: message,
          errorCode: code,
        });
      }
    },

    fetchStatus: async (id: string) => {
      await get().refreshOne(id);
    },

    refreshOne: async (id: string) => {
      try {
        const withdrawal = await api.getWithdrawal(id);
        set((s) => ({
          withdrawal: s.withdrawal?.id === id ? withdrawal : s.withdrawal,
          status: s.status === "loading" ? "loading" : "success",
          withdrawals: s.withdrawals.map((w) => (w.id === id ? withdrawal : w)),
        }));
      } catch {
        // Keep current state on fetch error
      }
    },

    fetchList: async () => {
      set({ listStatus: "loading" });
      try {
        const list = await api.listWithdrawals();
        set({ withdrawals: list, listStatus: "idle" });
      } catch {
        set({ listStatus: "error" });
      }
    },
  })
);
