"use client";

import * as React from "react";
import { CURRENCIES, type Currency } from "@/shared/lib/currency";
import { TokenIcon } from "@/shared/ui/token-icon";
import { cn } from "@/shared/lib/utils";

const ICON_SIZE = 20;

export interface TokenSelectProps {
  value: Currency;
  onChange: (currency: Currency) => void;
  disabled?: boolean;
  id?: string;
  className?: string;
  "aria-label"?: string;
}

export function TokenSelect({
  value,
  onChange,
  disabled = false,
  id,
  className,
  "aria-label": ariaLabel = "Select currency",
}: TokenSelectProps) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        id={id}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
        role="combobox"
        className={cn(
          "flex h-9 w-full items-center gap-2 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "hover:bg-muted/50",
        )}
        onClick={() => setOpen((prev) => !prev)}
      >
        <TokenIcon currency={value} size={ICON_SIZE} />
        <span className="flex-1 text-left font-medium">{value}</span>
        <svg
          className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-md border border-border bg-popover py-1 shadow-md focus:outline-none"
        >
          {CURRENCIES.map((c) => (
            <li
              key={c}
              role="option"
              aria-selected={c === value}
              className={cn(
                "flex cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-muted",
                c === value && "bg-muted",
              )}
              onClick={() => {
                onChange(c);
                setOpen(false);
              }}
            >
              <TokenIcon currency={c} size={ICON_SIZE} />
              <span className="font-medium">{c}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
