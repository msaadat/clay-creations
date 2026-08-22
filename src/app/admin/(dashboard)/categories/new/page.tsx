import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { listAvailableProductImages } from "@/lib/product-images";
import { CategoryForm } from "../category-form";

export const metadata: Metadata = { title: "New category" };

export default async function NewCategoryPage() {
  const [availableImages, last] = await Promise.all([
    listAvailableProductImages(),
    db.category.findFirst({ orderBy: { sortOrder: "desc" }, select: { sortOrder: true } }),
  ]);

  return (
    <div>
      <Link href="/admin/categories" className="text-sm text-muted-foreground hover:text-accent">
        ← Back to categories
      </Link>
      <h1 className="mt-4 font-display text-3xl">New category</h1>
      <CategoryForm
        category={null}
        availableImages={availableImages}
        nextSortOrder={(last?.sortOrder ?? -1) + 1}
      />
    </div>
  );
}
