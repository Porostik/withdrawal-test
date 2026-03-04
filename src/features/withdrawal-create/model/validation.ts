import { z } from "zod";
import { CURRENCIES } from "@/shared/lib/currency";

export const withdrawFormSchema = z.object({
  amount: z
    .string()
    .refine(
      (s) => {
        const t = s.trim();
        if (t === "") return false;
        const n = parseFloat(t);
        return !Number.isNaN(n) && n > 0;
      },
      { message: "Amount must be a positive number" }
    ),
  destination: z
    .string()
    .transform((s) => s.trim())
    .refine((s) => s.length >= 3, {
      message: "Destination must be at least 3 characters",
    }),
  currency: z.enum(CURRENCIES),
  confirm: z.boolean().refine((v) => v === true, {
    message: "You must confirm to continue",
  }),
});

export type WithdrawFormValues = z.infer<typeof withdrawFormSchema>;
