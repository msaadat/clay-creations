"use client";

import { useState } from "react";
import { formatPaisa } from "@/lib/money";
import { cn } from "@/lib/utils";
import { useCart } from "@/store/cart";

type VariantOption = {
  id: string;
  optionName: string | null;
  optionValue: string | null;
  pricePaisa: number;
  stock: number;
};

export function AddToCart({
  productSlug,
  productName,
  imageUrl,
  variants,
}: {
  productSlug: string;
  productName: string;
  imageUrl: string | null;
  variants: VariantOption[];
}) {
  const addLine = useCart((s) => s.addLine);

  // Default to the first variant that is actually in stock, so a sold-out first
  // option doesn't make the whole product look unavailable.
  const [selectedId, setSelectedId] = useState(
    () => (variants.find((v) => v.stock > 0) ?? variants[0])?.id,
  );

  const selected = variants.find((v) => v.id === selectedId) ?? variants[0];
  const hasOptions = variants.length > 1 || Boolean(variants[0]?.optionName);
  const optionName = variants.find((v) => v.optionName)?.optionName ?? "Option";

  if (!selected) {
    return <p className="mt-6 text-muted-foreground">This piece is not available.</p>;
  }

  const soldOut = selected.stock <= 0;

  return (
    <div className="mt-6">
      <p className="font-display text-3xl">{formatPaisa(selected.pricePaisa)}</p>

      {hasOptions && (
        <div className="mt-6">
          <span className="text-sm font-medium">{optionName}</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {variants.map((variant) => {
              const isSelected = variant.id === selected.id;
              const isSoldOut = variant.stock <= 0;
              return (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => setSelectedId(variant.id)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm transition",
                    isSelected
                      ? "border-accent bg-accent text-white"
                      : "border-border hover:border-accent",
                    isSoldOut && "opacity-40",
                  )}
                >
                  {variant.optionValue ?? "Standard"}
                  {isSoldOut && " — sold out"}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <p className="mt-4 text-sm text-muted-foreground">
        {soldOut
          ? "Currently sold out."
          : selected.stock <= 3
            ? `Only ${selected.stock} left`
            : "In stock"}
      </p>

      <button
        type="button"
        disabled={soldOut}
        onClick={() =>
          addLine({
            variantId: selected.id,
            productSlug,
            productName,
            variantLabel: selected.optionValue,
            unitPricePaisa: selected.pricePaisa,
            imageUrl,
            maxStock: selected.stock,
          })
        }
        className="mt-6 w-full rounded-full bg-accent px-6 py-4 text-sm text-white transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
      >
        {soldOut ? "Sold out" : "Add to cart"}
      </button>
    </div>
  );
}
