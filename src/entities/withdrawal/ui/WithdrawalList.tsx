"use client";

import type { Withdrawal } from "../model/types";
import { Card, CardHeader, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { TokenIcon } from "@/shared/ui/token-icon";
import { cn } from "@/shared/lib/utils";

interface WithdrawalListProps {
  items: Withdrawal[];
  onRefreshItem: (id: string) => void;
  onRefreshAll: () => void;
  loading?: boolean;
  submitLoading?: boolean;
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max) + "…";
}

export function WithdrawalList({
  items,
  onRefreshItem,
  onRefreshAll,
  loading = false,
  submitLoading = false,
}: WithdrawalListProps) {
  return (
    <Card className="rounded-l-none rounded-br-none h-full overflow-hidden border-r-0">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <h2 className="text-lg font-semibold">Withdrawals</h2>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRefreshAll}
          disabled={loading}
        >
          Refresh
        </Button>
      </CardHeader>
      <CardContent className="space-y-3 h-full overflow-y-auto pb-[150px] scrollbar">
        {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {!loading && items.length === 0 && (
          <p className="text-sm text-muted-foreground">No withdrawals yet.</p>
        )}
        {!loading &&
          items.map((w) => (
            <div
              key={w.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-3 text-sm"
            >
              <div className="min-w-0 space-y-1">
                <p className="font-mono text-xs text-muted-foreground">
                  {w.id.slice(0, 8)}
                </p>
                <p className="flex items-center gap-1.5 font-medium">
                  {w.amount}{" "}
                  <span className="inline-flex items-center gap-1">
                    {w.currency}
                    <TokenIcon currency={w.currency} size={16} />
                  </span>
                </p>
                <p
                  className="truncate text-muted-foreground"
                  title={w.destination}
                >
                  {truncate(w.destination, 24)}
                </p>
                <span
                  className={cn(
                    "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
                    w.status === "success"
                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
                  )}
                >
                  {w.status}
                </span>
              </div>
              {w.status === "pending" && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onRefreshItem(w.id)}
                  disabled={submitLoading}
                >
                  Refresh
                </Button>
              )}
            </div>
          ))}
      </CardContent>
    </Card>
  );
}
