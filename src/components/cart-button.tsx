"use client";

import { ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import { selectItemCount, useCart } from "@/store/cart";

export function CartButton() {
  const count = useCart(selectItemCount);
  const openCart = useCart((s) => s.openCart);

  // The persisted cart only exists on the client, so rendering the count during
  // hydration would mismatch the server-rendered zero.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  return (
    <button
      type="button"
      onClick={openCart}
      className="relative flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm transition hover:border-accent hover:text-accent"
      aria-label={`Open cart${
        hydrated && count > 0 ? `, ${count} ${count === 1 ? "item" : "items"}` : ""
      }`}
    >
      <ShoppingBag className="size-4" />
      <span className="hidden sm:inline">Cart</span>
      {hydrated && count > 0 && (
        <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-accent text-xs font-medium text-white">
          {count}
        </span>
      )}
    </button>
  );
}
