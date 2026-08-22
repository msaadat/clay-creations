"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useState } from "react";
import { X } from "lucide-react";
import { saveCategory, type CategoryFormState } from "./actions";

export type CategoryFormData = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
};

export function CategoryForm({
  category,
  availableImages,
  nextSortOrder,
}: {
  category: CategoryFormData | null;
  availableImages: string[];
  /** Only used for new categories: parks them at the end of the existing order. */
  nextSortOrder?: number;
}) {
  const [state, formAction, pending] = useActionState<CategoryFormState | undefined, FormData>(
    saveCategory.bind(null, category?.id ?? null),
    undefined,
  );

  const [imageUrl, setImageUrl] = useState<string | null>(category?.imageUrl ?? null);

  return (
    <form action={formAction} className="mt-8 max-w-3xl space-y-6">
      <Field label="Name">
        <input name="name" defaultValue={category?.name} required className={inputClass} />
      </Field>

      <Field label="URL slug" hint="Leave blank to generate from the name">
        <input name="slug" defaultValue={category?.slug} className={inputClass} />
      </Field>

      <Field label="Description" hint="Shown at the top of the category page">
        <textarea
          name="description"
          defaultValue={category?.description ?? ""}
          className={`${inputClass} min-h-24 resize-y`}
        />
      </Field>

      <Field label="Sort order" hint="Lowest first, in the header and on the home page">
        <input
          name="sortOrder"
          type="number"
          min={0}
          max={999}
          defaultValue={category?.sortOrder ?? nextSortOrder ?? 0}
          className={`${inputClass} max-w-32`}
        />
      </Field>

      {/* Cover image */}
      <fieldset className="rounded-xl border border-border p-5">
        <legend className="px-2 text-sm font-medium">Cover image</legend>
        <p className="text-xs text-muted-foreground">
          Used on the home page category cards. The first category&apos;s image also fills the
          hero, so give that one a wide photo.
        </p>

        <input type="hidden" name="imageUrl" value={imageUrl ?? ""} />

        {imageUrl && (
          <div className="relative mt-4 w-fit">
            <div className="relative h-32 w-48 overflow-hidden rounded-lg border border-border">
              <Image src={imageUrl} alt="" fill sizes="192px" className="object-cover" />
            </div>
            <button
              type="button"
              aria-label="Remove image"
              onClick={() => setImageUrl(null)}
              className="absolute -right-2 -top-2 rounded-full bg-rose-600 p-1 text-white"
            >
              <X className="size-3" />
            </button>
          </div>
        )}

        <div className="mt-4">
          <span className="text-xs font-medium text-muted-foreground">
            Available photos — click to {imageUrl ? "replace" : "choose"}
          </span>
          <div className="mt-2 flex max-h-48 flex-wrap gap-2 overflow-y-auto">
            {availableImages
              .filter((url) => url !== imageUrl)
              .map((url) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => setImageUrl(url)}
                  className="relative size-16 overflow-hidden rounded-lg border border-border transition hover:border-accent"
                >
                  <Image src={url} alt="" fill sizes="64px" className="object-cover" />
                </button>
              ))}
          </div>
        </div>
      </fieldset>

      {state?.error && (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {state.error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-accent px-6 py-3 text-sm text-white hover:bg-accent-hover disabled:opacity-60"
        >
          {pending ? "Saving…" : category ? "Save changes" : "Create category"}
        </button>
        <Link
          href="/admin/categories"
          className="rounded-full border border-border px-6 py-3 text-sm hover:border-accent"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}

const inputClass =
  "mt-1 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-accent";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="mt-4 block">
      <span className="text-sm font-medium">{label}</span>
      {hint && <span className="ml-2 text-xs text-muted-foreground">{hint}</span>}
      {children}
    </label>
  );
}
