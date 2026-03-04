"use client";

import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useWithdrawalStore } from "@/entities/withdrawal/model/store";
import { useBalanceStore } from "@/entities/balance/model/store";
import {
  withdrawFormSchema,
  type WithdrawFormValues,
} from "../model/validation";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Checkbox } from "@/shared/ui/checkbox";
import { Label } from "@/shared/ui/label";
import { Card, CardContent, CardHeader } from "@/shared/ui/card";
import { TokenSelect } from "@/shared/ui/token-select";
import { TokenIcon } from "@/shared/ui/token-icon";

const defaultValues: WithdrawFormValues = {
  amount: "",
  destination: "",
  currency: "ETH",
  confirm: false,
};

function parseNum(s: string): number {
  const n = parseFloat(String(s).trim());
  return Number.isNaN(n) ? 0 : n;
}

export function WithdrawForm() {
  const { status, errorMessage, errorCode, submit, retryLast } =
    useWithdrawalStore();
  const { balances, status: balanceStatus } = useBalanceStore();

  const {
    control,
    register,
    handleSubmit,
    formState: { isValid, errors },
    reset,
  } = useForm<WithdrawFormValues>({
    defaultValues,
    resolver: zodResolver(withdrawFormSchema),
    mode: "onChange",
  });

  const isLoading = status === "loading";
  const { amount: amountStr = "", currency = "ETH" } = useWatch({
    control,
  });
  const balanceStr = balances?.[currency] ?? "0";
  const balanceNum = parseNum(balanceStr);
  const amountNum = parseNum(amountStr);
  const exceedsBalance = amountNum > balanceNum && amountStr.trim() !== "";
  const balanceLoading = balanceStatus === "loading";
  const canSubmit = isValid && !isLoading && !exceedsBalance && !balanceLoading;
  const isError = status === "error";

  const onSubmit = async (data: WithdrawFormValues) => {
    if (exceedsBalance) return;
    await submit({
      amount: String(data.amount).trim(),
      destination: String(data.destination).trim(),
      currency: data.currency,
    });
    reset({
      confirm: false,
      amount: "",
      destination: "",
      currency,
    });
  };

  return (
    <Card className="rounded-r-none rounded-bl-none border-r-0">
      <CardHeader>
        <h2 className="text-lg font-semibold">New withdrawal</h2>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Controller
              name="currency"
              control={control}
              render={({ field }) => (
                <TokenSelect
                  id="currency"
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isLoading}
                  aria-label="Select currency"
                />
              )}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            {!balanceLoading && (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                Balance: {Number(balanceStr).toFixed(2)}{" "}
                <span className="inline-flex items-center gap-1">
                  <TokenIcon currency={currency} size={14} />
                  {currency}
                </span>
              </p>
            )}
            <Input
              id="amount"
              placeholder="0.00"
              disabled={isLoading}
              aria-invalid={Boolean(errors.amount) || exceedsBalance}
              {...register("amount")}
            />
            {errors.amount?.message && (
              <p className="text-sm text-destructive">
                {errors.amount.message}
              </p>
            )}
            {exceedsBalance && (
              <p className="text-sm text-destructive">Amount exceeds balance</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="destination">Destination</Label>
            <Input
              id="destination"
              placeholder="Address or account"
              disabled={isLoading}
              aria-invalid={Boolean(errors.destination)}
              {...register("destination")}
            />
            {errors.destination?.message && (
              <p className="text-sm text-destructive">
                {errors.destination.message}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="confirm"
              disabled={isLoading}
              aria-invalid={Boolean(errors.confirm)}
              {...register("confirm")}
            />
            <Label htmlFor="confirm" className="font-normal cursor-pointer">
              I confirm this withdrawal
            </Label>
            {errors.confirm?.message && (
              <p className="text-sm text-destructive">
                {errors.confirm.message}
              </p>
            )}
          </div>

          {isError && errorMessage && (
            <div
              className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
              role="alert"
            >
              <p>{errorMessage}</p>
              {errorCode === "network" && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2 border-destructive/50 text-destructive hover:bg-destructive/10"
                  onClick={() => retryLast()}
                >
                  Retry
                </Button>
              )}
            </div>
          )}

          <Button type="submit" disabled={!canSubmit}>
            {isLoading ? "Submitting…" : "Submit"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
