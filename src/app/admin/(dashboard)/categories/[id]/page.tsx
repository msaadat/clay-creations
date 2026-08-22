import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { listAvailableProductImages } from "@/lib/product-images";
import { CategoryForm } from "../category-form";
import { DeleteCategoryButton } from "../delete-button";

export const metadata: Metadata = { title: "Edit category" };

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [category, availableImages] = await Promise.all([
    db.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    }),
    listAvailableProductImages(),
  ]);

  if (!category) notFound();

  return (
    <div>
      <Link href="/admin/categories" className="text-sm text-muted-foreground hover:text-accent">
        ← Back to categories
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <h1 className="font-display text-3xl">{category.name}</h1>
        <div className="flex items-start gap-3">
          <Link
            href={`/shop?category=${category.slug}`}
            className="py-2 text-sm text-muted-foreground hover:text-accent"
          >
            View in shop →
          </Link>
          <DeleteCategoryButton
            categoryId={category.id}
            productCount={category._count.products}
          />
        </div>
      </div>

      <CategoryForm
        category={{
          id: category.id,
          name: category.name,
          slug: category.slug,
          description: category.description,
          imageUrl: category.imageUrl,
          sortOrder: category.sortOrder,
        }}
        availableImages={availableImages}
      />
    </div>
  );
}
