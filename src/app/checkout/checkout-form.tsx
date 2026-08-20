"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { checkoutSchema, type CheckoutInput } from "@/lib/checkout-schema";
import { formatPaisa } from "@/lib/money";
import { SHOP } from "@/lib/shop-config";
import { selectSubtotalPaisa, useCart } from "@/store/cart";
import { createOrder } from "./actions";

export function CheckoutForm() {
  const router = useRouter();
  const lines = useCart((s) => s.lines);
  const subtotal = useCart(selectSubtotalPaisa);
  const clear = useCart((s) => s.clear);

  const [formError, setFormError] = useState<string | null>(null);

  // The cart lives in localStorage, so the first server render never has it.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutInput>({ resolver: zodResolver(checkoutSchema) });

  const qualifiesForFreeShipping =
    SHOP.freeShippingThresholdPaisa !== null && subtotal >= SHOP.freeShippingThresholdPaisa;
  const shipping = qualifiesForFreeShipping ? 0 : SHOP.shippingPaisa;
  const total = subtotal + shipping;

  async function onSubmit(values: CheckoutInput) {
    setFormError(null);

    const result = await createOrder({
      customer: values,
      lines: lines.map((line) => ({ variantId: line.variantId, quantity: line.quantity })),
    });

    if (!result.ok) {
      setFormError(result.error);
      return;
    }

    // Only clear once the order exists, so a failed submit never loses the cart.
    clear();
    router.push(`/order/${result.orderNumber}`);
  }

  if (!hydrated) {
    return <div className="mt-10 h-64 animate-pulse rounded-xl bg-muted" />;
  }

  if (lines.length === 0) {
    return (
      <div className="mt-16 rounded-xl border border-border p-10 text-center">
        <p className="text-muted-foreground">Your cart is empty.</p>
        <Link
          href="/shop"
          className="mt-4 inline-block rounded-full bg-accent px-6 py-3 text-sm text-white hover:bg-accent-hover"
        >
          Browse the collection
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_380px]">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <Field label="Full name" error={errors.customerName?.message}>
          <input {...register("customerName")} className={inputClass} autoComplete="name" />
        </Field>

        <Field
          label="WhatsApp number"
          hint="We'll confirm your order on this number"
          error={errors.customerPhone?.message}
        >
          <input
            {...register("customerPhone")}
            className={inputClass}
            inputMode="tel"
            autoComplete="tel"
            placeholder="0300 1234567"
          />
        </Field>

        <Field label="Email (optional)" error={errors.customerEmail?.message}>
          <input
            {...register("customerEmail")}
            className={inputClass}
            type="email"
            autoComplete="email"
          />
        </Field>

        <Field label="Delivery address" error={errors.addressLine?.message}>
          <textarea
            {...register("addressLine")}
            className={`${inputClass} min-h-24 resize-y`}
            autoComplete="street-address"
            placeholder="House / flat, street, area"
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="City" error={errors.city?.message}>
            <input {...register("city")} className={inputClass} autoComplete="address-level2" />
          </Field>
          <Field label="Postal code (optional)" error={errors.postalCode?.message}>
            <input
              {...register("postalCode")}
              className={inputClass}
              autoComplete="postal-code"
            />
          </Field>
        </div>

        <Field label="Order notes (optional)" error={errors.notes?.message}>
          <textarea
            {...register("notes")}
            className={`${inputClass} min-h-20 resize-y`}
            placeholder="Anything we should know — gift wrapping, delivery timing…"
          />
        </Field>

        {formError && (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {formError}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-full bg-accent px-6 py-4 text-sm text-white transition hover:bg-accent-hover disabled:opacity-60"
        >
          {isSubmitting ? "Placing order…" : `Place order — ${formatPaisa(total)}`}
        </button>

        <p className="text-center text-xs text-muted-foreground">
          No payment is taken now. You'll get bank details and a WhatsApp link on the next
          page.
        </p>
      </form>

      <aside className="h-fit rounded-xl border border-border bg-muted/40 p-6">
        <h2 className="font-display text-xl">Order summary</h2>

        <ul className="mt-4 space-y-4">
          {lines.map((line) => (
            <li key={line.variantId} className="flex gap-3">
              <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                {line.imageUrl && (
                  <Image
                    src={line.imageUrl}
                    alt={line.productName}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{line.productName}</p>
                {line.variantLabel && (
                  <p className="text-xs text-muted-foreground">{line.variantLabel}</p>
                )}
                <p className="text-xs text-muted-foreground">Qty {line.quantity}</p>
              </div>
              <span className="text-sm">{formatPaisa(line.unitPricePaisa * line.quantity)}</span>
            </li>
          ))}
        </ul>

        <dl className="mt-6 space-y-2 border-t border-border pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd>{formatPaisa(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Delivery</dt>
            <dd>{shipping === 0 ? "Free" : formatPaisa(shipping)}</dd>
          </div>
          <div className="flex justify-between border-t border-border pt-2 text-base font-medium">
            <dt>Total</dt>
            <dd>{formatPaisa(total)}</dd>
          </div>
        </dl>
      </aside>
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-accent";

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      {hint && <span className="ml-2 text-xs text-muted-foreground">{hint}</span>}
      <div className="mt-1.5">{children}</div>
      {error && <span className="mt-1 block text-xs text-rose-700">{error}</span>}
    </label>
  );
}
