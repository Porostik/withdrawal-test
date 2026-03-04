"use client";

import Image from "next/image";
import type { Currency } from "@/shared/lib/currency";

import ethIcon from "@/shared/icons/ETH.svg";
import usdtIcon from "@/shared/icons/USDT.svg";
import usdcIcon from "@/shared/icons/USDC.svg";

const ICONS: Record<Currency, string> = {
  ETH: ethIcon,
  USDT: usdtIcon,
  USDC: usdcIcon,
};

export interface TokenIconProps {
  currency: Currency;
  size?: number;
  className?: string;
}

export function TokenIcon({
  currency,
  size = 24,
  className,
}: TokenIconProps) {
  return (
    <Image
      src={ICONS[currency]}
      alt={currency}
      width={size}
      height={size}
      className={className}
      unoptimized
    />
  );
}
