"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, X } from "lucide-react";
import { useEffect } from "react";
import { formatPaisa } from "@/lib/money";
import { selectSubtotalPaisa, useCart } from "@/store/cart";

export function CartDrawer() {
  const { lines, isOpen, closeCart, setQuantity, removeLine } = useCart();
  const subtotal = useCart(selectSubtotalPaisa);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeCart();
    if (isOpen) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, closeCart]);

  // Prevent the page behind the drawer from scrolling while it is open.
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Shopping cart">
      <button
        type="button"
        aria-label="Close cart"
        className="absolute inset-0 bg-black/30"
        onClick={closeCart}
      />

      <div className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-background shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-display text-xl">Your cart</h2>
          <button type="button" onClick={closeCart} aria-label="Close cart">
            <X className="size-5 text-muted-foreground hover:text-foreground" />
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <p className="text-muted-foreground">Your cart is empty.</p>
            <Link
              href="/shop"
              onClick={closeCart}
              className="rounded-full bg-accent px-5 py-2 text-sm text-white hover:bg-accent-hover"
            >
              Browse the collection
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-border overflow-y-auto px-5">
              {lines.map((line) => (
                <li key={line.variantId} className="flex gap-4 py-4">
                  <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {line.imageUrl && (
                      <Image
                        src={line.imageUrl}
                        alt={line.productName}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    )}
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <Link
                      href={`/product/${line.productSlug}`}
                      onClick={closeCart}
                      className="truncate text-sm font-medium hover:text-accent"
                    >
                      {line.productName}
                    </Link>
                    {line.variantLabel && (
                      <span className="text-xs text-muted-foreground">{line.variantLabel}</span>
                    )}
                    <span className="mt-1 text-sm">{formatPaisa(line.unitPricePaisa)}</span>

                    <div className="mt-auto flex items-center gap-3 pt-2">
                      <div className="flex items-center rounded-full border border-border">
                        <button
                          type="button"
                          aria-label="Decrease quantity"
                          className="px-2 py-1 text-muted-foreground hover:text-foreground"
                          onClick={() => setQuantity(line.variantId, line.quantity - 1)}
                        >
                          <Minus className="size-3" />
                        </button>
                        <span className="min-w-6 text-center text-sm">{line.quantity}</span>
                        <button
                          type="button"
                          aria-label="Increase quantity"
                          disabled={line.quantity >= line.maxStock}
                          className="px-2 py-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                          onClick={() => setQuantity(line.variantId, line.quantity + 1)}
                        >
                          <Plus className="size-3" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeLine(line.variantId)}
                        className="text-xs text-muted-foreground underline hover:text-accent"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  <span className="text-sm font-medium">
                    {formatPaisa(line.unitPricePaisa * line.quantity)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="border-t border-border px-5 py-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatPaisa(subtotal)}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Delivery calculated at checkout.
              </p>
              <Link
                href="/checkout"
                onClick={closeCart}
                className="mt-4 block rounded-full bg-accent px-5 py-3 text-center text-sm text-white hover:bg-accent-hover"
              >
                Checkout
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
