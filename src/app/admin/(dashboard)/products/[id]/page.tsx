import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { listAvailableProductImages } from "@/lib/product-images";
import { ProductForm } from "../product-form";
import { deleteProduct } from "../actions";

export const metadata: Metadata = { title: "Edit product" };

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [product, categories, availableImages] = await Promise.all([
    db.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        variants: { orderBy: { sortOrder: "asc" } },
      },
    }),
    db.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
    listAvailableProductImages(),
  ]);

  if (!product) notFound();

  async function removeProduct() {
    "use server";
    await deleteProduct(id);
    redirect("/admin/products");
  }

  return (
    <div>
      <Link href="/admin/products" className="text-sm text-muted-foreground hover:text-accent">
        ← Back to products
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl">{product.name}</h1>
        <div className="flex items-center gap-3">
          <Link
            href={`/product/${product.slug}`}
            className="text-sm text-muted-foreground hover:text-accent"
          >
            View in shop →
          </Link>
          <form action={removeProduct}>
            <button
              type="submit"
              className="rounded-full border border-rose-200 px-4 py-2 text-sm text-rose-700 transition hover:bg-rose-50"
            >
              Delete
            </button>
          </form>
        </div>
      </div>

      <ProductForm
        product={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          description: product.description,
          categoryId: product.categoryId,
          isActive: product.isActive,
          isFeatured: product.isFeatured,
          images: product.images.map((image) => ({ url: image.url })),
          variants: product.variants.map((variant) => ({
            id: variant.id,
            optionName: variant.optionName,
            optionValue: variant.optionValue,
            pricePaisa: variant.pricePaisa,
            stock: variant.stock,
          })),
        }}
        categories={categories}
        availableImages={availableImages}
      />
    </div>
  );
}
