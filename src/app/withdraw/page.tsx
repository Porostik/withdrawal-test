"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWithdrawalStore } from "@/entities/withdrawal/model/store";
import { useSessionStore } from "@/entities/session/model/store";
import { useBalanceStore } from "@/entities/balance/model/store";
import { WithdrawForm } from "@/features/withdrawal-create/ui/WithdrawForm";
import { WithdrawalList } from "@/entities/withdrawal/ui/WithdrawalList";
import { TokenIconCarousel } from "@/shared/ui/token-icon-carousel";

export default function WithdrawPage() {
  const router = useRouter();
  const {
    withdrawals,
    listStatus,
    status: submitStatus,
    fetchList,
    refreshOne,
  } = useWithdrawalStore();
  const { status: sessionStatus } = useSessionStore();

  useEffect(() => {
    useSessionStore.getState().loadMe();
  }, []);

  useEffect(() => {
    if (sessionStatus === "guest") {
      router.replace("/login");
      return;
    }
    if (sessionStatus === "authed") {
      useBalanceStore.getState().fetchBalances();
      useWithdrawalStore.getState().fetchList();
    }
  }, [sessionStatus, router]);

  const listLoading = listStatus === "loading";

  if (sessionStatus === "loading" || sessionStatus === "unknown") {
    return (
      <main className="mx-auto max-w-4xl space-y-6 p-6">
        <h1 className="text-xl font-semibold">Withdraw</h1>
        <p className="text-muted-foreground">Loading…</p>
      </main>
    );
  }

  if (sessionStatus === "guest") {
    return null;
  }

  return (
    <main className="mx-auto max-w-4xl gap-y-6 p-6 pb-0 h-full flex flex-col overflow-hidden">
      <header className="flex items-center gap-3 justify-between">
        <h1 className="text-xl font-semibold">Withdraw</h1>
        <TokenIconCarousel size={28} className="shrink-0" />
      </header>
      <div className="grid grid-cols-1 gap-0 md:grid-cols-2 h-full">
        <WithdrawForm />
        <WithdrawalList
          items={withdrawals}
          onRefreshItem={(id) => refreshOne(id)}
          onRefreshAll={() => fetchList()}
          loading={listLoading}
          submitLoading={submitStatus === "loading"}
        />
      </div>
    </main>
  );
}
