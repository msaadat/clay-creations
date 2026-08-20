import { z } from "zod";

/**
 * SQLite has no enums, so the set of valid order states lives here and is
 * enforced by Zod wherever a status is written.
 */
export const ORDER_STATUSES = [
  "PENDING_PAYMENT",
  "PAID",
  "SHIPPED",
  "COMPLETED",
  "CANCELLED",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const orderStatusSchema = z.enum(ORDER_STATUSES);

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "Awaiting payment",
  PAID: "Payment received",
  SHIPPED: "Shipped",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export const ORDER_STATUS_STYLES: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "bg-amber-100 text-amber-800 border-amber-200",
  PAID: "bg-emerald-100 text-emerald-800 border-emerald-200",
  SHIPPED: "bg-sky-100 text-sky-800 border-sky-200",
  COMPLETED: "bg-stone-100 text-stone-700 border-stone-200",
  CANCELLED: "bg-rose-100 text-rose-800 border-rose-200",
};

/**
 * Human-readable, non-sequential-looking order reference. Customers type this
 * into a bank transfer memo and read it out over WhatsApp, so it avoids
 * characters that are ambiguous when handwritten (0/O, 1/I).
 */
export function generateOrderNumber(): string {
  const alphabet = "23456789ACDEFGHJKLMNPQRSTUVWXYZ";
  let suffix = "";
  for (let i = 0; i < 5; i++) {
    suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `CC-${suffix}`;
}
