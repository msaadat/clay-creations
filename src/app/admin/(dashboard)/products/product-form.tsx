"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import { ImagePlus, Plus, Trash2 } from "lucide-react";
import { paisaToRupeeString } from "@/lib/money";
import { saveProduct, type ProductFormState } from "./actions";

type VariantRow = {
  key: string;
  id?: string;
  optionValue: string;
  price: string;
  stock: string;
};

export type ProductFormData = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  categoryId: string;
  isActive: boolean;
  isFeatured: boolean;
  images: { url: string }[];
  variants: {
    id: string;
    optionName: string | null;
    optionValue: string | null;
    pricePaisa: number;
    stock: number;
  }[];
};

export function ProductForm({
  product,
  categories,
  availableImages,
}: {
  product: ProductFormData | null;
  categories: { id: string; name: string }[];
  availableImages: string[];
}) {
  const [state, formAction, pending] = useActionState<ProductFormState | undefined, FormData>(
    saveProduct.bind(null, product?.id ?? null),
    undefined,
  );

  const [images, setImages] = useState<string[]>(product?.images.map((i) => i.url) ?? []);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const atImageLimit = images.length >= MAX_IMAGES;

  /**
   * Uploads go to a route handler rather than through the form action: server
   * actions cap bodies at 1 MB, which a phone photo blows past. Each file is
   * sent on its own so one rejected image does not lose the rest.
   */
  async function uploadFiles(files: File[]) {
    setUploadError(null);
    setUploading(true);

    try {
      let count = images.length;

      for (const file of files) {
        if (count >= MAX_IMAGES) {
          setUploadError(`A product can have at most ${MAX_IMAGES} images`);
          break;
        }

        const body = new FormData();
        body.append("file", file);

        const response = await fetch("/api/admin/media", { method: "POST", body });
        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
          setUploadError(result.error ?? `Could not upload ${file.name}`);
          break;
        }

        setImages((current) => [...current, result.url]);
        count += 1;
      }
    } catch {
      setUploadError("Upload failed — check your connection and try again");
    } finally {
      setUploading(false);
    }
  }

  const [variants, setVariants] = useState<VariantRow[]>(
    product?.variants.map((v, i) => ({
      key: `existing-${i}`,
      id: v.id,
      optionValue: v.optionValue ?? "",
      price: paisaToRupeeString(v.pricePaisa),
      stock: String(v.stock),
    })) ?? [{ key: "new-0", optionValue: "", price: "", stock: "1" }],
  );

  const optionName =
    product?.variants.find((v) => v.optionName)?.optionName ?? "Base";

  return (
    <form action={formAction} className="mt-8 max-w-3xl space-y-6">
      <Field label="Name">
        <input name="name" defaultValue={product?.name} required className={inputClass} />
      </Field>

      <Field label="URL slug" hint="Leave blank to generate from the name">
        <input name="slug" defaultValue={product?.slug} className={inputClass} />
      </Field>

      <Field label="Description">
        <textarea
          name="description"
          defaultValue={product?.description ?? ""}
          className={`${inputClass} min-h-28 resize-y`}
        />
      </Field>

      <Field label="Category">
        <select
          name="categoryId"
          defaultValue={product?.categoryId ?? categories[0]?.id}
          className={inputClass}
        >
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </Field>

      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={product?.isActive ?? true}
            className="size-4"
          />
          Visible in shop
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="isFeatured"
            defaultChecked={product?.isFeatured ?? false}
            className="size-4"
          />
          Feature on home page
        </label>
      </div>

      {/* Images */}
      <fieldset className="rounded-xl border border-border p-5">
        <legend className="px-2 text-sm font-medium">Images</legend>
        <p className="text-xs text-muted-foreground">
          Upload new photos or pick from ones already used. The first image is the thumbnail.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={uploading || atImageLimit}
            onClick={() => fileInput.current?.click()}
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm transition hover:border-accent disabled:opacity-40"
          >
            <ImagePlus className="size-4" />
            {uploading ? "Uploading…" : "Upload photos"}
          </button>
          <span className="text-xs text-muted-foreground">
            JPEG, PNG, WebP or AVIF, up to 8 MB each
          </span>
        </div>

        <input
          ref={fileInput}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          hidden
          onChange={(event) => {
            const files = Array.from(event.target.files ?? []);
            // Cleared so picking the same file twice in a row still fires onChange.
            event.target.value = "";
            if (files.length > 0) void uploadFiles(files);
          }}
        />

        {uploadError && (
          <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
            {uploadError}
          </p>
        )}

        {images.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-3">
            {images.map((url, index) => (
              <div key={`${url}-${index}`} className="relative">
                <div className="relative size-24 overflow-hidden rounded-lg border border-border">
                  <Image src={url} alt="" fill sizes="96px" className="object-cover" />
                </div>
                <input type="hidden" name="imageUrl" value={url} />
                <button
                  type="button"
                  aria-label="Remove image"
                  onClick={() => setImages(images.filter((_, i) => i !== index))}
                  className="absolute -right-2 -top-2 rounded-full bg-rose-600 p-1 text-white"
                >
                  <Trash2 className="size-3" />
                </button>
                {index === 0 && (
                  <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 text-[10px] text-white">
                    Main
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-4">
          <span className="text-xs font-medium text-muted-foreground">
            Available photos — click to add
          </span>
          <div className="mt-2 flex max-h-48 flex-wrap gap-2 overflow-y-auto">
            {availableImages
              .filter((url) => !images.includes(url))
              .map((url) => (
                <button
                  key={url}
                  type="button"
                  disabled={atImageLimit}
                  onClick={() => setImages([...images, url])}
                  className="relative size-16 overflow-hidden rounded-lg border border-border transition hover:border-accent disabled:opacity-40"
                >
                  <Image src={url} alt="" fill sizes="64px" className="object-cover" />
                </button>
              ))}
          </div>
        </div>
      </fieldset>

      {/* Variants */}
      <fieldset className="rounded-xl border border-border p-5">
        <legend className="px-2 text-sm font-medium">Variants &amp; stock</legend>
        <p className="text-xs text-muted-foreground">
          One row with an empty option = a simple product. Add rows to offer choices such as
          Golden base / Silver base.
        </p>

        <Field label="Option name" hint="Only used when there are 2+ rows">
          <input
            name="optionName"
            defaultValue={optionName}
            placeholder="Base"
            className={inputClass}
          />
        </Field>

        <div className="mt-4 space-y-3">
          {variants.map((variant, index) => (
            <div key={variant.key} className="flex flex-wrap items-end gap-3">
              {variant.id && <input type="hidden" name="variantId" value={variant.id} />}
              {!variant.id && <input type="hidden" name="variantId" value="" />}

              <label className="flex-1">
                <span className="text-xs text-muted-foreground">Option value</span>
                <input
                  name="variantOptionValue"
                  value={variant.optionValue}
                  placeholder="Golden base"
                  onChange={(e) =>
                    setVariants(
                      variants.map((v, i) =>
                        i === index ? { ...v, optionValue: e.target.value } : v,
                      ),
                    )
                  }
                  className={inputClass}
                />
              </label>

              <label className="w-32">
                <span className="text-xs text-muted-foreground">Price (Rs)</span>
                <input
                  name="variantPrice"
                  value={variant.price}
                  required
                  inputMode="decimal"
                  placeholder="1550"
                  onChange={(e) =>
                    setVariants(
                      variants.map((v, i) => (i === index ? { ...v, price: e.target.value } : v)),
                    )
                  }
                  className={inputClass}
                />
              </label>

              <label className="w-24">
                <span className="text-xs text-muted-foreground">Stock</span>
                <input
                  name="variantStock"
                  value={variant.stock}
                  required
                  inputMode="numeric"
                  onChange={(e) =>
                    setVariants(
                      variants.map((v, i) => (i === index ? { ...v, stock: e.target.value } : v)),
                    )
                  }
                  className={inputClass}
                />
              </label>

              <button
                type="button"
                aria-label="Remove variant"
                disabled={variants.length === 1}
                onClick={() => setVariants(variants.filter((_, i) => i !== index))}
                className="rounded-lg border border-border p-3 text-muted-foreground transition hover:border-rose-300 hover:text-rose-700 disabled:opacity-30"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() =>
            setVariants([
              ...variants,
              { key: `new-${Date.now()}`, optionValue: "", price: "", stock: "1" },
            ])
          }
          className="mt-4 inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:border-accent"
        >
          <Plus className="size-4" /> Add variant
        </button>
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
          {pending ? "Saving…" : product ? "Save changes" : "Create product"}
        </button>
        <Link
          href="/admin/products"
          className="rounded-full border border-border px-6 py-3 text-sm hover:border-accent"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}

/** Mirrors the imageUrls cap in the server action's schema. */
const MAX_IMAGES = 8;

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
