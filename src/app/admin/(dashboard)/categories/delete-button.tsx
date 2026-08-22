"use client";

import { useActionState } from "react";
import { deleteCategory, type CategoryFormState } from "./actions";

/**
 * Deletion can fail for a reason the admin can act on (the category still has
 * products), so it goes through useActionState to surface that message rather
 * than throwing. The button is also disabled up front when we already know the
 * category is non-empty; the server check covers the case where a product is
 * added from another tab in between.
 */
export function DeleteCategoryButton({
  categoryId,
  productCount,
}: {
  categoryId: string;
  productCount: number;
}) {
  const [state, formAction, pending] = useActionState<CategoryFormState | undefined, FormData>(
    deleteCategory.bind(null, categoryId),
    undefined,
  );

  const blocked = productCount > 0;

  return (
    <div className="flex flex-col items-end gap-2">
      <form action={formAction}>
        <button
          type="submit"
          disabled={blocked || pending}
          title={blocked ? "Move this category's products elsewhere first" : undefined}
          className="rounded-full border border-rose-200 px-4 py-2 text-sm text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
        >
          {pending ? "Deleting…" : "Delete"}
        </button>
      </form>

      {(state?.error || blocked) && (
        <p className="max-w-xs text-right text-xs text-muted-foreground">
          {state?.error ??
            `Still holds ${productCount} ${productCount === 1 ? "product" : "products"}.`}
        </p>
      )}
    </div>
  );
}
