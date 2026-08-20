import { z } from "zod";

/**
 * Shared by the checkout form (client) and the createOrder action (server), so
 * both sides reject exactly the same input.
 */

// Pakistani mobile numbers, tolerant of the ways people actually type them:
// 03001234567, 0300-1234567, +92 300 1234567, 923001234567.
const PHONE_PATTERN = /^(?:\+?92|0)?3\d{2}[\s-]?\d{7}$/;

export const checkoutSchema = z.object({
  customerName: z.string().trim().min(2, "Please enter your full name").max(100),
  customerPhone: z
    .string()
    .trim()
    .regex(PHONE_PATTERN, "Enter a valid Pakistani mobile number, e.g. 0300 1234567"),
  customerEmail: z
    .string()
    .trim()
    .email("Enter a valid email address")
    .optional()
    .or(z.literal("")),
  addressLine: z.string().trim().min(10, "Please enter your full delivery address").max(400),
  city: z.string().trim().min(2, "Please enter your city").max(80),
  postalCode: z.string().trim().max(20).optional().or(z.literal("")),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const cartLineSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.number().int().min(1).max(20),
});

export const createOrderSchema = z.object({
  customer: checkoutSchema,
  lines: z.array(cartLineSchema).min(1, "Your cart is empty"),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

/** Normalises the various accepted phone formats to 92XXXXXXXXXX. */
export function normalisePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("92")) return digits;
  if (digits.startsWith("0")) return `92${digits.slice(1)}`;
  return `92${digits}`;
}
