import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { formatPaisa } from "@/lib/money";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Products" };

export default async function AdminProductsPage() {
  const products = await db.product.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      category: { select: { name: true } },
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
      variants: { orderBy: { sortOrder: "asc" } },
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl">Products</h1>
        <Link
          href="/admin/products/new"
          className="rounded-full bg-accent px-5 py-2.5 text-sm text-white hover:bg-accent-hover"
        >
          Add product
        </Link>
      </div>

      {products.length === 0 ? (
        <p className="mt-12 text-muted-foreground">No products yet.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-muted/60 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Stock</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {products.map((product) => {
                const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
                const prices = product.variants.map((v) => v.pricePaisa);
                const min = prices.length ? Math.min(...prices) : 0;
                const max = prices.length ? Math.max(...prices) : 0;

                return (
                  <tr key={product.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-muted">
                          {product.images[0] && (
                            <Image
                              src={product.images[0].url}
                              alt=""
                              fill
                              sizes="40px"
                              className="object-cover"
                            />
                          )}
                        </div>
                        <div>
                          <Link
                            href={`/admin/products/${product.id}`}
                            className="font-medium text-accent hover:underline"
                          >
                            {product.name}
                          </Link>
                          <div className="text-xs text-muted-foreground">
                            {product.variants.length}{" "}
                            {product.variants.length === 1 ? "variant" : "variants"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{product.category.name}</td>
                    <td className="px-4 py-3">
                      {min === max ? formatPaisa(min) : `${formatPaisa(min)}–${formatPaisa(max)}`}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(totalStock === 0 && "text-rose-700")}>
                        {totalStock}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        <span
                          className={cn(
                            "rounded-full border px-2 py-0.5 text-xs",
                            product.isActive
                              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                              : "border-stone-200 bg-stone-100 text-stone-600",
                          )}
                        >
                          {product.isActive ? "Live" : "Hidden"}
                        </span>
                        {product.isFeatured && (
                          <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs text-amber-800">
                            Featured
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
