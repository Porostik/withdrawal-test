"use client";

import { useState, useEffect } from "react";
import { CURRENCIES, type Currency } from "@/shared/lib/currency";
import { TokenIcon } from "@/shared/ui/token-icon";
import { cn } from "@/shared/lib/utils";

const INTERVAL_MS = 1500; // 1.5 sec per token

export interface TokenIconCarouselProps {
  size?: number;
  className?: string;
}

export function TokenIconCarousel({
  size = 28,
  className,
}: TokenIconCarouselProps) {
  const [index, setIndex] = useState(0);
  const currency: Currency = CURRENCIES[index];

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % CURRENCIES.length);
    }, INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <span
      className={cn("inline-flex shrink-0", className)}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <TokenIcon
        key={currency}
        currency={currency}
        size={size}
        className="animate-token-carousel"
      />
    </span>
  );
}
