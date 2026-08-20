"use server";

import { revalidatePath } from "next/cache";
import { getCurrentAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { orderStatusSchema } from "@/lib/orders";

/**
 * Every admin action re-checks the session. The layout guard protects rendering,
 * but server actions are individually addressable endpoints and must verify on
 * their own.
 */
async function requireAdmin() {
  const admin = await getCurrentAdmin();
  if (!admin) throw new Error("Not authorised");
  return admin;
}

export async function updateOrderStatus(orderId: string, status: string) {
  await requireAdmin();

  const parsed = orderStatusSchema.safeParse(status);
  if (!parsed.success) throw new Error(`Invalid status: ${status}`);

  const order = await db.order.findUnique({
    where: { id: orderId },
    select: { status: true, items: { select: { variantId: true, quantity: true } } },
  });
  if (!order) throw new Error("Order not found");

  // Cancelling returns the reserved stock to the shelf; un-cancelling takes it
  // back off. Any other transition leaves stock untouched.
  const wasCancelled = order.status === "CANCELLED";
  const willBeCancelled = parsed.data === "CANCELLED";

  await db.$transaction(async (tx) => {
    if (!wasCancelled && willBeCancelled) {
      for (const item of order.items) {
        if (item.variantId) {
          await tx.variant.update({
            where: { id: item.variantId },
            data: { stock: { increment: item.quantity } },
          });
        }
      }
    } else if (wasCancelled && !willBeCancelled) {
      for (const item of order.items) {
        if (item.variantId) {
          await tx.variant.update({
            where: { id: item.variantId },
            data: { stock: { decrement: item.quantity } },
          });
        }
      }
    }

    await tx.order.update({ where: { id: orderId }, data: { status: parsed.data } });
  });

  revalidatePath("/admin");
  revalidatePath(`/admin/orders/${orderId}`);
}
