import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { listAvailableProductImages } from "@/lib/product-images";
import { ProductForm } from "../product-form";

export const metadata: Metadata = { title: "New product" };

export default async function NewProductPage() {
  const [categories, availableImages] = await Promise.all([
    db.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
    listAvailableProductImages(),
  ]);

  return (
    <div>
      <Link href="/admin/products" className="text-sm text-muted-foreground hover:text-accent">
        ← Back to products
      </Link>
      <h1 className="mt-4 font-display text-3xl">New product</h1>
      <ProductForm product={null} categories={categories} availableImages={availableImages} />
    </div>
  );
}
