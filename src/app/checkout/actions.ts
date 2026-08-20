"use server";

import { db } from "@/lib/db";
import { createOrderSchema, normalisePhone, type CreateOrderInput } from "@/lib/checkout-schema";
import { generateOrderNumber } from "@/lib/orders";
import { SHOP } from "@/lib/shop-config";

export type CreateOrderResult =
  | { ok: true; orderNumber: string }
  | { ok: false; error: string; unavailable?: { variantId: string; reason: string }[] };

/**
 * Creates an order from a cart.
 *
 * Prices and stock are re-read from the database inside a transaction and the
 * client's numbers are ignored entirely — the cart in localStorage is display
 * state and can be stale or tampered with. Stock is decremented in the same
 * transaction so two simultaneous checkouts cannot oversell the last piece.
 */
export async function createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  const parsed = createOrderSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid order details" };
  }

  const { customer, lines } = parsed.data;

  // Collapse duplicate variant ids so a tampered payload can't bypass the stock check.
  const quantityByVariant = new Map<string, number>();
  for (const line of lines) {
    quantityByVariant.set(line.variantId, (quantityByVariant.get(line.variantId) ?? 0) + line.quantity);
  }

  try {
    const order = await db.$transaction(async (tx) => {
      const variants = await tx.variant.findMany({
        where: { id: { in: [...quantityByVariant.keys()] } },
        include: {
          product: {
            select: {
              name: true,
              slug: true,
              isActive: true,
              images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true } },
            },
          },
        },
      });

      const unavailable: { variantId: string; reason: string }[] = [];
      const orderItems: {
        variantId: string;
        productName: string;
        productSlug: string;
        variantLabel: string | null;
        imageUrl: string | null;
        unitPricePaisa: number;
        quantity: number;
        lineTotalPaisa: number;
      }[] = [];

      for (const [variantId, quantity] of quantityByVariant) {
        const variant = variants.find((v) => v.id === variantId);

        if (!variant || !variant.product.isActive) {
          unavailable.push({ variantId, reason: "no longer available" });
          continue;
        }
        if (variant.stock < quantity) {
          unavailable.push({
            variantId,
            reason: variant.stock === 0 ? "sold out" : `only ${variant.stock} left`,
          });
          continue;
        }

        orderItems.push({
          variantId,
          productName: variant.product.name,
          productSlug: variant.product.slug,
          variantLabel: variant.optionValue,
          imageUrl: variant.product.images[0]?.url ?? null,
          unitPricePaisa: variant.pricePaisa,
          quantity,
          lineTotalPaisa: variant.pricePaisa * quantity,
        });
      }

      if (unavailable.length > 0) {
        // Thrown so the transaction rolls back; caught and unwrapped below.
        throw Object.assign(new Error("UNAVAILABLE"), { unavailable });
      }

      const subtotalPaisa = orderItems.reduce((sum, item) => sum + item.lineTotalPaisa, 0);
      const qualifiesForFreeShipping =
        SHOP.freeShippingThresholdPaisa !== null &&
        subtotalPaisa >= SHOP.freeShippingThresholdPaisa;
      const shippingPaisa = qualifiesForFreeShipping ? 0 : SHOP.shippingPaisa;

      for (const item of orderItems) {
        await tx.variant.update({
          where: { id: item.variantId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      // Retry on the astronomically unlikely order-number collision.
      let orderNumber = generateOrderNumber();
      for (let attempt = 0; attempt < 5; attempt++) {
        const clash = await tx.order.findUnique({ where: { orderNumber } });
        if (!clash) break;
        orderNumber = generateOrderNumber();
      }

      return tx.order.create({
        data: {
          orderNumber,
          customerName: customer.customerName,
          customerPhone: normalisePhone(customer.customerPhone),
          customerEmail: customer.customerEmail || null,
          addressLine: customer.addressLine,
          city: customer.city,
          postalCode: customer.postalCode || null,
          notes: customer.notes || null,
          subtotalPaisa,
          shippingPaisa,
          totalPaisa: subtotalPaisa + shippingPaisa,
          status: "PENDING_PAYMENT",
          items: { create: orderItems },
        },
      });
    });

    return { ok: true, orderNumber: order.orderNumber };
  } catch (error) {
    if (error instanceof Error && error.message === "UNAVAILABLE") {
      const unavailable = (error as Error & { unavailable?: { variantId: string; reason: string }[] })
        .unavailable;
      return {
        ok: false,
        error: "Some items in your cart are no longer available.",
        unavailable,
      };
    }

    console.error("createOrder failed", error);
    return { ok: false, error: "Something went wrong placing your order. Please try again." };
  }
}
